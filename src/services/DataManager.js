// src/services/DataManager.js
// DataManager with IndexedDB (localforage) cache for pieces and uploaded_images
import localforage from 'localforage';
import {
  collection, addDoc, getDocs, doc, getDoc, writeBatch,
  updateDoc, deleteDoc, query, limit
} from "firebase/firestore";
import { db } from "./firebase";
import { validatePiece as externalValidatePiece } from '../utils/validation';

const PIECES_COLLECTION = "pieces";
const LOCAL_STORAGE_KEY = "pieces"; // small fallback
const CACHE_KEY = "pieces_cache";
const UPLOADED_IMAGES_KEY = "uploaded_images";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache

// Configure localforage instance (IndexedDB)
const cacheStore = localforage.createInstance({
  name: 'app-cache',
  storeName: 'app_cache_store'
});

// -------------------- IndexedDB Operation Queue & Retry Logic --------------------
class IndexedDBOperationQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
    this.baseDelay = 100; // ms
  }

  async enqueue(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject, retries: 0 });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue[0];
      
      try {
        const result = await this.executeWithRetry(item);
        this.queue.shift();
        item.resolve(result);
      } catch (error) {
        this.queue.shift();
        item.reject(error);
      }
    }
    
    this.processing = false;
  }

  async executeWithRetry(item) {
    const { operation } = item;
    
    try {
      // Add timeout to prevent hanging operations
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('IndexedDB operation timeout')), 10000)
      );
      
      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error) {
      if (item.retries < this.maxRetries) {
        item.retries++;
        const delay = this.baseDelay * Math.pow(2, item.retries);
        
        console.warn(`IndexedDB operation failed, retry ${item.retries}/${this.maxRetries} after ${delay}ms:`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(item);
      }
      
      throw error;
    }
  }
}

const dbQueue = new IndexedDBOperationQueue();

// -------------------- Safe IndexedDB Operations with Error Handling --------------------
async function safeIndexedDBOperation(operation, fallbackValue = null) {
  try {
    return await dbQueue.enqueue(operation);
  } catch (error) {
    console.error('IndexedDB operation failed after retries:', error);
    return fallbackValue;
  }
}

// -------------------- Helpers: field migration & normalization --------------------
const migratePieceFields = (piece) => {
  const fieldMappings = {
    apn: 'APN', APN: 'APN', article: 'APN', reference: 'APN', id: 'APN', code: 'APN', part: 'APN', item: 'APN', product: 'APN',
    spn: 'SPN', SPN: 'SPN', 'supplier.part': 'SPN', 'vendor.part': 'SPN', 'supplier.code': 'SPN', 'vendor.code': 'SPN',
    holderName: 'Holder Name', 'holder name': 'Holder Name', holder: 'Holder Name', owner: 'Holder Name', responsible: 'Holder Name',
    connecteurDPN: 'Connecteur DPN', ConnecteurDPN: 'Connecteur DPN', connecteur: 'Connecteur DPN', connector: 'Connecteur DPN', dpn: 'Connecteur DPN',
    partName: 'Parts Holder', 'part name': 'Parts Holder', 'parts holder': 'Parts Holder', partname: 'Parts Holder', component: 'Parts Holder',
    serialNumberHolder: 'Serial Number Holder', 'serial.number': 'Serial Number Holder', serial: 'Serial Number Holder',
    equipment: 'Equipment', section: 'Section', projectLine: 'Project Line', 'project.line': 'Project Line', projectline: 'Project Line',
    description: 'Description', desc: 'Description', details: 'Description',
    storageLocation: 'Storage Location', storage: 'Storage Location', location: 'Storage Location', warehouse: 'Storage Location',
    mrpType: 'MRP Type', mrp: 'MRP Type', type: 'MRP Type',
    suppliers: 'Suppliers', supplier: 'Suppliers', vendor: 'Suppliers',
    unitPrice: 'Unit Price', price: 'Unit Price', cost: 'Unit Price',
    unrestrictedStock: 'Unrestricted Stock', stock: 'Unrestricted Stock', qty: 'Unrestricted Stock', quantity: 'Unrestricted Stock',
    min: 'Min', minimum: 'Min',
    max: 'Max', maximum: 'Max',
    inTransit: 'In Transit', 'in.transit': 'In Transit', transit: 'In Transit',
    notes: 'More Information', 'moreInformation': 'More Information', information: 'More Information', info: 'More Information',
    imagePath: 'ImagePath', ImagePath: 'ImagePath', Picture: 'ImagePath', image: 'ImagePath', path: 'ImagePath'
  };

  if (!piece || typeof piece !== 'object') return piece;
  const migrated = { ...piece };

  for (const [oldKey, newKey] of Object.entries(fieldMappings)) {
    if (Object.prototype.hasOwnProperty.call(piece, oldKey) && oldKey !== newKey) {
      if (!migrated[newKey]) migrated[newKey] = piece[oldKey];
      delete migrated[oldKey];
    }
  }

  return migrated;
};

const normalizeHolderName = (piece) => {
  if (!piece || typeof piece !== 'object') return piece;
  if (piece['Holder Name']) {
    if (typeof piece['Holder Name'] === 'string') {
      piece['Holder Name'] = piece['Holder Name'].split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(piece['Holder Name'])) {
      piece['Holder Name'] = [];
    }
  } else {
    piece['Holder Name'] = [];
  }
  return piece;
};

const validatePieceResult = (piece) => {
  try {
    return externalValidatePiece(piece);
  } catch (err) {
    return { isValid: false, errors: [err.message || 'Validation error'] };
  }
};

// -------------------- IndexedDB-backed cache helpers with retry logic --------------------
async function getCache() {
  return await safeIndexedDBOperation(async () => {
    const cached = await cacheStore.getItem(CACHE_KEY);
    if (!cached) return null;
    
    if (cached.timestamp && Array.isArray(cached.data)) {
      if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
        return cached.data;
      } else {
        // stale cache - schedule removal without blocking
        safeIndexedDBOperation(() => cacheStore.removeItem(CACHE_KEY), null).catch(() => {});
        return null;
      }
    }
    
    // support legacy shape where data may have been stored directly
    return Array.isArray(cached) ? cached : null;
  }, null);
}

async function setCache(data) {
  if (!Array.isArray(data)) return;
  
  return await safeIndexedDBOperation(async () => {
    const payload = { data, timestamp: Date.now() };
    await cacheStore.setItem(CACHE_KEY, payload);
    return true;
  }, false);
}

async function saveUploadedImagesMap(mapObj) {
  return await safeIndexedDBOperation(async () => {
    await cacheStore.setItem(UPLOADED_IMAGES_KEY, mapObj || {});
    return true;
  }, false);
}

async function getUploadedImagesMap() {
  return await safeIndexedDBOperation(async () => {
    const mapObj = await cacheStore.getItem(UPLOADED_IMAGES_KEY);
    return mapObj || {};
  }, {});
}

// -------------------- DataManager --------------------
const dataManager = {
  sanitizePieceData(piece) {
    if (!piece || typeof piece !== 'object') return {};
    const sanitized = {};
    for (const [key, value] of Object.entries(piece)) {
      if (value === undefined) continue;
      sanitized[key] = (value === '') ? null : value;
    }
    return sanitized;
  },

  async clearCache() {
    return await safeIndexedDBOperation(async () => {
      await cacheStore.removeItem(CACHE_KEY);
      return true;
    }, false);
  },

  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  getLocalPieces() {
    try {
      const pieces = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      return (pieces || []).map(p => normalizeHolderName(migratePieceFields(p)));
    } catch (err) {
      return [];
    }
  },

  saveLocalPieces(pieces) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pieces));
    } catch (err) {
    }
  },

  async saveUploadedImages(imagesMap) {
    return await saveUploadedImagesMap(imagesMap || {});
  },

  async getUploadedImages() {
    return await getUploadedImagesMap();
  },

  // Initialize Firestore and perform a lightweight migration for legacy uploaded_images
  async init() {
    try {
      const testQuery = query(collection(db, PIECES_COLLECTION), limit(1));
      await getDocs(testQuery);
    } catch (err) {
      if (!this.isOnline()) {
      } else {
        throw err;
      }
    }

    // Migration: move legacy uploaded_images from localStorage into IndexedDB (one-time)
    try {
      const legacy = localStorage.getItem(UPLOADED_IMAGES_KEY);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (parsed && typeof parsed === 'object') {
            const migrated = await saveUploadedImagesMap(parsed);
            if (migrated) {
              localStorage.removeItem(UPLOADED_IMAGES_KEY);
            }
          }
        } catch (parseErr) {
          console.error('Failed to parse legacy uploaded images:', parseErr);
        }
      }
    } catch (migrationErr) {
      console.error('Migration error:', migrationErr);
    }
  },

  async getAllPieces() {
    // Try IndexedDB cache first
    const cached = await getCache();
    if (cached) return cached;

    if (!this.isOnline()) {
      return this.getLocalPieces();
    }

    try {
      const snapshot = await getDocs(collection(db, PIECES_COLLECTION));
      const pieces = [];
      snapshot.docs.forEach(docSnap => {
        try {
          const data = docSnap.data();
          const migrated = migratePieceFields(data);
          const piece = normalizeHolderName({ id: docSnap.id, ...migrated });

          const validation = validatePieceResult(piece);
          if (validation && validation.isValid === false) {
            return;
          }

          pieces.push(piece);
        } catch (err) {
        }
      });

      // Save small fallback and IndexedDB cache (non-blocking)
      this.saveLocalPieces(pieces);
      
      // Cache in background without blocking the response
      setCache(pieces).catch(err => {
        console.error('Failed to cache pieces:', err);
      });
      
      return pieces;
    } catch (err) {
      return this.getLocalPieces();
    }
  },

  async getPiecesPaginated(page = 1, pageSize = 20) {
    const startIndex = (page - 1) * pageSize;
    if (!this.isOnline()) {
      const localPieces = this.getLocalPieces();
      return {
        pieces: localPieces.slice(startIndex, startIndex + pageSize),
        total: localPieces.length,
        page, pageSize,
        totalPages: Math.ceil(localPieces.length / pageSize)
      };
    }

    try {
      const cached = await getCache();
      if (cached) {
        return {
          pieces: cached.slice(startIndex, startIndex + pageSize),
          total: cached.length,
          page, pageSize,
          totalPages: Math.ceil(cached.length / pageSize)
        };
      }

      const allPieces = await this.getAllPieces();
      return {
        pieces: allPieces.slice(startIndex, startIndex + pageSize),
        total: allPieces.length,
        page, pageSize,
        totalPages: Math.ceil(allPieces.length / pageSize)
      };
    } catch (err) {
      const localPieces = this.getLocalPieces();
      return {
        pieces: localPieces.slice(startIndex, startIndex + pageSize),
        total: localPieces.length,
        page, pageSize,
        totalPages: Math.ceil(localPieces.length / pageSize)
      };
    }
  },

  async getPiece(id) {
    if (!id) return null;
    if (!this.isOnline()) {
      const localPieces = this.getLocalPieces();
      return localPieces.find(p => p.id === id) || null;
    }

    try {
      const docRef = doc(db, PIECES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const migrated = migratePieceFields(data);
        const piece = normalizeHolderName({ id: docSnap.id, ...migrated });

        const validation = validatePieceResult(piece);
        if (validation && validation.isValid === false) {
        }
        return piece;
      }
      return null;
    } catch (err) {
      const localPieces = this.getLocalPieces();
      return localPieces.find(p => p.id === id) || null;
    }
  },

  async addPiece(piece) {
    const sanitized = this.sanitizePieceData(migratePieceFields(piece));
    normalizeHolderName(sanitized);

    const validation = validatePieceResult(sanitized);
    if (validation && validation.isValid === false) {
      throw new Error(`Validation failed: ${Array.isArray(validation.errors) ? validation.errors.join('; ') : validation.errors}`);
    }

    if (!this.isOnline()) throw new Error("Cannot add piece while offline");

    try {
      const docRef = await addDoc(collection(db, PIECES_COLLECTION), sanitized);
      
      // Clear cache in background
      this.clearCache().catch(err => {
        console.error('Failed to clear cache after add:', err);
      });

      const localPieces = this.getLocalPieces();
      localPieces.push({ id: docRef.id, ...sanitized });
      this.saveLocalPieces(localPieces);

      return { id: docRef.id, ...sanitized };
    } catch (err) {
      throw err;
    }
  },

  async bulkAddPieces(piecesArray) {
    if (!Array.isArray(piecesArray)) throw new Error("piecesArray must be an array");
    if (!this.isOnline()) throw new Error("Cannot bulk add pieces while offline");

    const batch = writeBatch(db);
    const existingPieces = await this.getAllPieces();
    const existingAPNs = new Map(
      (existingPieces || []).map(p => [p.APN ? p.APN.toString().trim() : '', p.id]).filter(([apn]) => apn)
    );

    let operations = 0;
    const results = { added: 0, updated: 0, errors: 0 };

    for (const pieceRaw of piecesArray) {
      try {
        const migrated = migratePieceFields(pieceRaw);
        const sanitizedPiece = this.sanitizePieceData(migrated);

        const apn = sanitizedPiece.APN ? sanitizedPiece.APN.toString().trim() : '';
        if (!apn) {
          results.errors++;
          continue;
        }

        const validation = validatePieceResult(sanitizedPiece);
        if (validation && validation.isValid === false) {
        }

        normalizeHolderName(sanitizedPiece);

        if (existingAPNs.has(apn)) {
          const existingId = existingAPNs.get(apn);
          const docRef = doc(db, PIECES_COLLECTION, existingId);
          batch.update(docRef, sanitizedPiece);
          results.updated++;
        } else {
          const docRef = doc(collection(db, PIECES_COLLECTION));
          batch.set(docRef, sanitizedPiece);
          results.added++;
        }

        operations++;
        if (operations >= 500) {
          await batch.commit();
          operations = 0;
        }
      } catch (err) {
        results.errors++;
      }
    }

    if (operations > 0) await batch.commit();
    
    // Clear cache in background
    this.clearCache().catch(err => {
      console.error('Failed to clear cache after bulk add:', err);
    });
    
    return results;
  },

  async updatePiece(id, updatedPiece) {
    if (!id) throw new Error("Invalid piece ID");
    const migrated = migratePieceFields(updatedPiece);
    const sanitized = this.sanitizePieceData(migrated);
    normalizeHolderName(sanitized);

    const validation = validatePieceResult(sanitized);
    if (validation && validation.isValid === false) {
      throw new Error(`Validation failed: ${Array.isArray(validation.errors) ? validation.errors.join('; ') : validation.errors}`);
    }

    if (!this.isOnline()) throw new Error("Cannot update piece while offline");

    try {
      const docRef = doc(db, PIECES_COLLECTION, id);
      await updateDoc(docRef, sanitized);
      
      // Update local storage first (synchronous)
      const localPieces = this.getLocalPieces();
      const index = localPieces.findIndex(p => p.id === id);
      if (index !== -1) {
        localPieces[index] = { ...localPieces[index], ...sanitized };
        this.saveLocalPieces(localPieces);
      }
      
      // Clear cache in background to avoid blocking
      this.clearCache().catch(err => {
        console.error('Failed to clear cache after update:', err);
      });

      return { id, ...sanitized };
    } catch (err) {
      throw err;
    }
  },

  async deletePiece(id) {
    if (!id) throw new Error("Invalid piece ID");
    if (!this.isOnline()) throw new Error("Cannot delete piece while offline");

    try {
      const docRef = doc(db, PIECES_COLLECTION, id);
      await deleteDoc(docRef);
      
      // Update local storage first
      const localPieces = this.getLocalPieces();
      const filtered = localPieces.filter(p => p.id !== id);
      this.saveLocalPieces(filtered);
      
      // Clear cache in background
      this.clearCache().catch(err => {
        console.error('Failed to clear cache after delete:', err);
      });

      return true;
    } catch (err) {
      throw err;
    }
  },

  async deleteAllPieces() {
    if (!this.isOnline()) throw new Error("Cannot delete pieces while offline");

    try {
      const batch = writeBatch(db);
      const snapshot = await getDocs(collection(db, PIECES_COLLECTION));
      if (snapshot.size === 0) return 0;
      snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
      await batch.commit();
      
      // Update local storage first
      this.saveLocalPieces([]);
      
      // Clear cache in background
      this.clearCache().catch(err => {
        console.error('Failed to clear cache after delete all:', err);
      });
      
      return snapshot.size;
    } catch (err) {
      throw err;
    }
  },

  async exportToJSON() {
    const pieces = await this.getAllPieces();
    return { pieces, exportedAt: new Date().toISOString() };
  },

  async importFromJSON(data) {
    if (!data || !Array.isArray(data.pieces)) throw new Error("Invalid import data format");
    const result = await this.bulkAddPieces(data.pieces);
    return result.added + result.updated;
  },

  async searchPieces(queryStr, limit = 50) {
    if (!queryStr || typeof queryStr !== 'string') return [];
    const allPieces = await this.getAllPieces();
    const lowerQuery = queryStr.toLowerCase();
    return (allPieces || []).filter(piece => {
      return Object.values(piece).some(value => {
        if (value === null || value === undefined) return false;
        if (Array.isArray(value)) return value.some(item => item && item.toString().toLowerCase().includes(lowerQuery));
        return value.toString().toLowerCase().includes(lowerQuery);
      });
    }).slice(0, limit);
  }
};

export default dataManager;