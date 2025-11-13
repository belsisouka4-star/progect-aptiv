import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { useNotification, useConfirmation } from '../App';
import ImageZoomModal from '../components/ImageZoomModal';
import SkeletonLoader from '../components/SkeletonLoader';
import PieceImage from '../components/PieceImage';

// Services and Utils
import dataManager from '../services/DataManager';
import { renderValue } from '../utils/helpers';
import { getThumbnailUrl } from '../utils/cloudinaryHelper';

// Styles
import '../styles/corporate.css';
import '../styles/dashboard.css';

// Lazy-load heavy components
const ExcelManager = React.lazy(() => import('../components/ExcelManager'));
const FolderImageUpload = React.lazy(() => import('../components/FolderImageUpload'));

const styles = `
/* === Global Styles === */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: white;
  min-height: 100vh;
  background: #000000af;
  background-size: 300% 300%;
}

/* Accessibility: Visually hidden but screen-reader accessible */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
`;

// Helper: normalize keys from various sources into canonical keys used by UI
function normalizeKeys(raw) {
  const source = (raw && typeof raw.data === 'function') ? raw.data() : (raw && raw.data ? raw.data : raw || {});

  const canonicalMap = {
    apn: 'APN',
    'apn ': 'APN',
    article: 'APN',
    reference: 'APN',
    'part.number': 'APN',
    'part number': 'APN',
    id: 'APN',
    spn: 'SPN',
    'holder name': 'Holder Name',
    holdername: 'Holder Name',
    'connecteur dpn': 'Connecteur DPN',
    connectordpn: 'Connecteur DPN',
    connecteur: 'Connecteur DPN',
    'parts holder': 'Parts Holder',
    partsholder: 'Parts Holder',
    parts: 'Parts Holder',
    'serial number holder': 'Serial Number Holder',
    'serial number': 'Serial Number Holder',
    serial: 'Serial Number Holder',
    equipment: 'Equipment',
    section: 'Section',
    'project line': 'Project Line',
    projectline: 'Project Line',
    project: 'Project Line',
    description: 'Description',
    'storage location': 'Storage Location',
    storage: 'Storage Location',
    'mrp type': 'MRP Type',
    mrp: 'MRP Type',
    suppliers: 'Suppliers',
    'unit price': 'Unit Price',
    'unitprice': 'Unit Price',
    'unrestricted stock': 'Unrestricted Stock',
    stock: 'Unrestricted Stock',
    quantity: 'Unrestricted Stock',
    qty: 'Unrestricted Stock',
    min: 'Min',
    max: 'Max',
    'in transit': 'In Transit',
    'intransit': 'In Transit',
    'more information': 'More Information',
    more: 'More Information',
    imagepath: 'ImagePath',
    'image path': 'ImagePath',
    image: 'ImagePath'
  };

  const normalized = {};

  Object.keys(source).forEach((k) => {
    const cleaned = k.toString().trim().toLowerCase().replace(/[_\s]+/g, ' ');
    const mapped = canonicalMap[cleaned];
    if (mapped) {
      normalized[mapped] = source[k];
    } else {
      const relaxed = cleaned.replace(/[^a-z0-9]/g, '');
      if (canonicalMap[relaxed]) {
        normalized[canonicalMap[relaxed]] = source[k];
      } else {
        normalized[k] = source[k];
      }
    }
  });

  if (source.id) normalized.id = source.id;
  if (raw && raw.id) normalized.id = raw.id;

  return normalized;
}

// ===================================================================================
//  COMPONENT: ManagePieces
// ===================================================================================
export default function ManagePieces() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { showConfirmation } = useConfirmation();

  const searchInputRef = useRef(null);

  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [initialLoad, setInitialLoad] = useState(true);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImageSrc, setZoomImageSrc] = useState('');
  const [zoomImageAlt, setZoomImageAlt] = useState('');
  const [excelData, setExcelData] = useState([]);
  const [folderImages, setFolderImages] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'APN', direction: 'asc' });
  const [editingPiece, setEditingPiece] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addingPiece, setAddingPiece] = useState(false);
  const [addForm, setAddForm] = useState({
    APN: '',
    SPN: '',
    'Holder Name': '',
    'Connecteur DPN': '',
    'Parts Holder': '',
    'Serial Number Holder': '',
    Equipment: '',
    Section: '',
     'Project Line': '', // changed from ProjectLine
    Description: '',
    'Storage Location': '',
    'MRP Type': '',
    Suppliers: '',
    'Unit Price': '',
    'Unrestricted Stock': '',
    Min: '',
    Max: '',
    'In Transit': '',
    'More Information': '',
    ImagePath: ''
  });
  const [viewMode, setViewMode] = useState('card');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 576 : false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);

  // Firestore field size threshold reported by Firebase
  const MAX_FIRESTORE_FIELD_BYTES = 1048487;

  const refreshPieces = useCallback(async () => {
    try {
      await dataManager.clearCache();
      const list = await dataManager.getAllPieces();
      const normalizedList = (list || []).map(item => normalizeKeys(item));
      setPieces(normalizedList);
    } catch (error) {
      console.error("Failed to refresh pieces", error);
      showNotification('Could not refresh data.', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    const userItem = localStorage.getItem('user');
    let user = null;
    try {
      user = userItem ? JSON.parse(userItem) : null;
    } catch (err) {
      console.warn('Failed to parse user from localStorage', err);
      user = null;
    }
    if (!user || user.role !== 'admin') navigate('/');
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 576;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const key = e.key && e.key.toLowerCase();
      if (e.ctrlKey && key === 'f') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          try { searchInputRef.current.select(); } catch (_) {}
        } else {
          document.querySelector('input[placeholder^="Search"]')?.focus();
        }
      } else if (e.ctrlKey && key === 'v') {
        e.preventDefault();
        setViewMode(prev => (prev === 'card' ? 'list' : 'card'));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const rawList = await dataManager.getAllPieces();
        const list = (rawList || []).map(item => normalizeKeys(item));

        // Load images from IndexedDB via dataManager (replaces localStorage usage)
        let imagesData = {};
        try {
          imagesData = await dataManager.getUploadedImages() || {};
        } catch (imgErr) {
          console.warn('Failed to load uploaded images from cache:', imgErr);
        }

        // Link images to pieces
        const linkedList = linkImagesToParts(list, imagesData);
        setPieces(linkedList);
        setFolderImages(imagesData);
      } catch (error) {
        console.error("Failed to load pieces", error);
        showNotification(`Failed to load pieces: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showNotification]);

  useEffect(() => {
    const handlePiecesUpdated = () => {
      refreshPieces();
    };
    window.addEventListener('piecesUpdated', handlePiecesUpdated);
    return () => window.removeEventListener('piecesUpdated', handlePiecesUpdated);
  }, [refreshPieces]);

  // Save a data URL to IndexedDB via dataManager (no Storage upload due to restrictions).
  const saveDataUrlToLocalCache = async (dataUrl, filename) => {
    try {
      const existing = await dataManager.getUploadedImages().catch(() => ({}));
      existing[filename] = dataUrl;
      await dataManager.saveUploadedImages(existing);
      return null; // return null to indicate local storage used
    } catch (err) {
      console.error('Failed to save to local cache:', err);
      return null;
    }
  };

  // Extract large data-URL images (over Firestore limit), save to IndexedDB and remove ImagePath to avoid Firestore errors.
  const extractAndSaveLargeImage = async (piece) => {
    try {
      if (!piece || typeof piece.ImagePath !== 'string') return piece;
      const imageValue = piece.ImagePath;
      if (!imageValue.startsWith('data:')) return piece;

      if (imageValue.length > MAX_FIRESTORE_FIELD_BYTES) {
        const apnKey = piece.APN ? String(piece.APN).trim() : (piece.id ? String(piece.id) : `img_${Date.now()}`);
        const extMatch = imageValue.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);
        const ext = extMatch ? extMatch[1] : 'jpeg';
        // sanitize filename
        const safeName = `${apnKey}`.replace(/[^a-zA-Z0-9-_.]/g, '_');
        const filename = `${safeName}.${ext}`;

        // save to IndexedDB
        await saveDataUrlToLocalCache(imageValue, filename);
        // remove ImagePath before saving to Firestore
        const newPiece = { ...piece };
        delete newPiece.ImagePath;
        console.warn(`Stored large image for ${apnKey} in local cache as ${filename}; removed ImagePath from piece to avoid Firestore limit.`);
        return newPiece;
      }
      return piece;
    } catch (err) {
      console.warn('Failed to extract/save large image for piece:', err);
      return piece;
    }
  };

  const saveOrUpdatePiece = async (piece) => {
    try {
      // ensure we don't attempt to write huge data URLs to Firestore
      const pieceToSave = await extractAndSaveLargeImage(piece);

      if (pieceToSave.id) {
        await dataManager.updatePiece(pieceToSave.id, pieceToSave);
      } else {
        const existing = await dataManager.getAllPieces();
        const normalizedExisting = (existing || []).map(item => normalizeKeys(item));
        const match = normalizedExisting.find((p) => p.APN === pieceToSave.APN);
        if (match && match.id) await dataManager.updatePiece(match.id, pieceToSave);
        else await dataManager.addPiece(pieceToSave);
      }
      return true;
    } catch (err) {
      console.error("Failed to save piece", err);
      return false;
    }
  };

  const linkImagesToParts = (data, images) =>
    data.map((piece) => {
      const apn = piece.APN?.toString() || '';
      // Prefer thumbnail for grid display, fallback to full image
      let image = images[`${apn}_thumb`] || images[`${apn}.jpg`] || images[`${apn}.jpeg`] || images[`${apn}.png`] || '';

      if (!image) {
        const imageKeys = Object.keys(images || {});
        const matchingKey = imageKeys.find(key =>
          key.toLowerCase().includes(apn.toLowerCase()) &&
          (key.toLowerCase().endsWith('.jpg') || key.toLowerCase().endsWith('.jpeg') || key.toLowerCase().endsWith('.png'))
        );
        if (matchingKey) image = images[matchingKey];
      }

      return { ...piece, ImagePath: image || piece.ImagePath || '' };
    });

  const handleExcelDataSave = async (data) => {
    setExcelData(data);
    const finalData = Object.keys(folderImages || {}).length > 0 ? linkImagesToParts(data, folderImages) : data;

    try {
      // Before bulk add, extract/save any oversized images to local cache
      const processedData = [];
      for (let i = 0; i < finalData.length; i++) {
        const processed = await extractAndSaveLargeImage(finalData[i]);
        processedData.push(processed);
      }

      const result = await dataManager.bulkAddPieces(processedData);
      const totalProcessed = (result?.added || 0) + (result?.updated || 0);
      if (totalProcessed > 0) {
        showNotification(`Processed ${totalProcessed} pieces from Excel (${result.added} added, ${result.updated} updated).`, 'success');
      } else {
        showNotification('No pieces were processed from Excel.', 'warning');
      }
    } catch (error) {
      console.error('Error in bulkAddPieces:', error);
      showNotification('Error saving pieces from Excel: ' + (error?.message || String(error)), 'error');
    }

    await refreshPieces();
  };

  const handleFolderImagesUpload = async (imagesData) => {
    setFolderImages(imagesData);
    if (excelData.length > 0) {
      const linked = linkImagesToParts(excelData, imagesData);
      let count = 0;
      for (const piece of linked) {
        if (await saveOrUpdatePiece(piece)) count++;
      }
      if (count > 0) showNotification(`Updated ${count} pieces with images.`, 'success');
      await refreshPieces();
    }
  };

  const sortedPieces = useMemo(() => {
    let data = [...pieces];
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = (a[sortConfig.key] !== undefined && a[sortConfig.key] !== null) ? a[sortConfig.key].toString().toLowerCase() : '';
        const bVal = (b[sortConfig.key] !== undefined && b[sortConfig.key] !== null) ? b[sortConfig.key].toString().toLowerCase() : '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [pieces, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredPieces = sortedPieces.filter((piece) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const combined = Object.values(piece).map(v => {
      if (v === null || v === undefined) return '';
      if (Array.isArray(v)) return v.join(' ');
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    }).join(' ');
    return combined.toLowerCase().includes(term);
  });

  const saveEdit = async () => {
    if (await saveOrUpdatePiece(editForm)) {
      showNotification('Changes saved successfully.', 'success');
      setEditingPiece(null);
      await refreshPieces();
    } else {
      showNotification('Error saving changes.', 'error');
    }
  };

  const saveAdd = async () => {
    if (!addForm.APN || !addForm['Parts Holder']) {
      showNotification('APN and Parts Holder are required.', 'error');
      return;
    }
    const newPiece = { ...addForm };
    if (await dataManager.addPiece(newPiece)) {
      showNotification('Piece added successfully.', 'success');
      setAddingPiece(false);
      setAddForm({
        APN: '',
        SPN: '',
        'Holder Name': '',
        'Connecteur DPN': '',
        'Parts Holder': '',
        'Serial Number Holder': '',
        Equipment: '',
        Section: '',
        'Project Line': '', // changed from ProjectLine
        Description: '',
        'Storage Location': '',
        'MRP Type': '',
        Suppliers: '',
        'Unit Price': '',
        'Unrestricted Stock': '',
        Min: '',
        Max: '',
        'In Transit': '',
        'More Information': '',
        ImagePath: ''
      });
      await refreshPieces();
    } else {
      showNotification('Error adding piece.', 'error');
    }
  };

  const handleEdit = (piece) => {
    setEditingPiece(piece);
    setEditForm({
      id: piece.id,
      APN: String(piece.APN || ''),
      SPN: String(piece.SPN || ''),
      'Holder Name': Array.isArray(piece['Holder Name']) ? piece['Holder Name'].join(', ') : String(piece['Holder Name'] || ''),
      'Connecteur DPN': String(piece['Connecteur DPN'] || ''),
      'Parts Holder': String(piece['Parts Holder'] || ''),
      'Serial Number Holder': String(piece['Serial Number Holder'] || ''),
      Equipment: String(piece.Equipment || ''),
      Section: String(piece.Section || ''),
      'Project Line': String(piece['Project Line'] || piece.ProjectLine || ''), // unified
      Description: String(piece.Description || ''),
      'Storage Location': String(piece['Storage Location'] || ''),
      'MRP Type': String(piece['MRP Type'] || ''),
      Suppliers: String(piece.Suppliers || ''),
      'Unit Price': String(piece['Unit Price'] || ''),
      'Unrestricted Stock': String(piece['Unrestricted Stock'] || ''),
      Min: String(piece.Min || ''),
      Max: String(piece.Max || ''),
      'In Transit': String(piece['In Transit'] !== undefined ? piece['In Transit'] : (piece.InTransit !== undefined ? piece.InTransit : '')),
      'More Information': String(piece['More Information'] || '')
    });
  };

  const handleDelete = async (piece) => {
    const confirmed = await showConfirmation(`Are you sure you want to delete ${piece['Parts Holder'] || piece.APN}?`);
    if (!confirmed) return;
    try {
      await dataManager.deletePiece(piece.id);
      showNotification('Piece deleted successfully.', 'success');
      await refreshPieces();
    } catch (error) {
      console.error("Failed to delete piece", error);
      showNotification(`Failed to delete: ${error.message}`, 'error');
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = await showConfirmation('Are you sure you want to delete ALL pieces? This is irreversible.');
    if (!confirmed) return;
    try {
      const count = await dataManager.deleteAllPieces();
      showNotification(`Successfully deleted ${count} pieces.`, 'success');
      await refreshPieces();
    } catch (error) {
      console.error("Failed to delete all pieces", error);
      showNotification(`Failed to delete all pieces: ${error.message}`, 'error');
    }
  };

  const downloadUpdatedExcel = async () => {
    try {
      const allPiecesRaw = await dataManager.getAllPieces();
      const allPieces = (allPiecesRaw || []).map(item => normalizeKeys(item));

      // Import ExcelJS dynamically
      const ExcelJS = await import('exceljs');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Pieces');

      // Define columns with headers and widths
      const columns = [
        { header: 'APN', key: 'APN', width: 15 },
        { header: 'SPN', key: 'SPN', width: 15 },
        { header: 'Holder Name', key: 'Holder Name', width: 20 },
        { header: 'Connecteur DPN', key: 'Connecteur DPN', width: 15 },
        { header: 'Parts Holder', key: 'Parts Holder', width: 25 },
        { header: 'Serial Number Holder', key: 'Serial Number Holder', width: 20 },
        { header: 'Equipment', key: 'Equipment', width: 20 },
        { header: 'Section', key: 'Section', width: 15 },
        { header: 'Project Line', key: 'Project Line', width: 15 },
        { header: 'Description', key: 'Description', width: 30 },
        { header: 'Storage Location', key: 'Storage Location', width: 20 },
        { header: 'MRP Type', key: 'MRP Type', width: 15 },
        { header: 'Suppliers', key: 'Suppliers', width: 20 },
        { header: 'Unit Price', key: 'Unit Price', width: 12 },
        { header: 'Unrestricted Stock', key: 'Unrestricted Stock', width: 18 },
        { header: 'Min', key: 'Min', width: 10 },
        { header: 'Max', key: 'Max', width: 10 },
        { header: 'In Transit', key: 'In Transit', width: 12 },
        { header: 'More Information', key: 'More Information', width: 30 }
      ];

      worksheet.columns = columns;

      // Add export timestamp
      const timestampRow = worksheet.insertRow(1, [`Exported on: ${new Date().toLocaleString()}`]);
      timestampRow.font = { italic: true, color: { argb: 'FF666666' } };
      worksheet.mergeCells('A1:R1');

      // Add a title row at the top
      worksheet.insertRow(1, ['APTIV Parts Management System - Pieces Export']);
      worksheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF7B00' } // Orange corporate color
      };
      worksheet.getRow(1).border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } }
      };
      worksheet.mergeCells('A1:R1'); // Merge title across all columns

      // Add header row
      const headerRow = worksheet.addRow(columns.map(col => col.header));
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF333333' } // Dark gray header
      };
      headerRow.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };

      // Add data rows with alternating colors and conditional formatting
      allPieces.forEach((piece, index) => {
        const row = {};
        columns.forEach(col => {
          const value = piece[col.key];
          if (Array.isArray(value)) {
            row[col.key] = value.join('; ');
          } else if (value !== null && value !== undefined) {
            row[col.key] = value;
          } else {
            row[col.key] = '';
          }
        });
        const addedRow = worksheet.addRow(row);

        // Alternating row colors (zebra stripes)
        const isEvenRow = index % 2 === 0;
        addedRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEvenRow ? 'FFF9F9F9' : 'FFFFFFFF' } // Light gray for even rows
        };

        // Add borders to all cells
        addedRow.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };

        // Conditional formatting for stock levels
        const stockValue = parseFloat(piece['Unrestricted Stock']);
        const minValue = parseFloat(piece['Min']);
        const maxValue = parseFloat(piece['Max']);

        if (!isNaN(stockValue)) {
          const stockCell = addedRow.getCell('Unrestricted Stock');
          if (!isNaN(minValue) && stockValue <= minValue) {
            // Low stock - red background
            stockCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFCCCC' }
            };
            stockCell.font = { color: { argb: 'FFCC0000' }, bold: true };
          } else if (!isNaN(maxValue) && stockValue > maxValue) {
            // Over stock - orange background
            stockCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFE5CC' }
            };
            stockCell.font = { color: { argb: 'FFFF7B00' } };
          } else {
            // Normal stock - green background
            stockCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFCCFFCC' }
            };
            stockCell.font = { color: { argb: 'FF006600' } };
          }
        }

        // Highlight important columns
        const apnCell = addedRow.getCell('APN');
        apnCell.font = { bold: true, color: { argb: 'FF333333' } };

        const partsHolderCell = addedRow.getCell('Parts Holder');
        partsHolderCell.font = { bold: true };
      });

      // Auto-fit columns and add some padding
      worksheet.columns.forEach(column => {
        column.width = Math.max(column.width || 10, 12);
      });

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'updated_pieces.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      showNotification('Downloaded successfully as Excel file with enhanced colors', 'success');
    } catch (error) {
      console.error("Failed to download Excel", error);
      showNotification(`Failed to download Excel: ${error.message}`, 'error');
    }
  };

  if (loading) {
    return <SkeletonLoader count={6} viewMode={viewMode} />;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="corporate-layout">
        {isMobile && sidebarOpen && (
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: '10px',
              left: '10px',
              zIndex: 1001,
              background: '#333',
              border: '1px solid #ff7b00',
              color: 'white',
              padding: '10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            type="button"
          >
            × Close
          </button>
        )}
        <aside className={`sidebar ${isMobile ? (sidebarOpen ? 'sidebar-open' : 'sidebar-closed') : ''}`}>
          <div className="sidebar-header">
            <h2>Admin Panel</h2>
            {isMobile && (
              <button
                className="close-btn"
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  position: 'absolute',
                  top: '10px',
                  right: '10px'
                }}
                type="button"
              >
                ×
              </button>
            )}
          </div>

          <div className="tool-panel">
            <div className="tool-title">Tools</div>
            <div className="tool-card">
              <Suspense fallback={<div style={{padding: '12px', textAlign: 'center'}}>Loading Excel tool…</div>}>
                <ExcelManager onDataSave={handleExcelDataSave} returnDataOnly={true} />
              </Suspense>
            </div>
            <div className="tool-card">
              <Suspense fallback={<div style={{padding: '12px', textAlign: 'center'}}>Loading Image uploader…</div>}>
                <FolderImageUpload onImagesUploaded={handleFolderImagesUpload} useCloudStorage={true} />
              </Suspense>
            </div>
            <div style={{ marginBottom: '20px', backgroundColor: '#000000af', borderRadius: '8px', padding: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={() => setAddingPiece(true)}
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: 'white',
                    border: 'transparent',
                    background: '#333',
                    width: '100%'
                  }}
                  type="button"
                >
                  Add New Piece
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', width: '100%' }}>
                <h1 style={{ margin: 0 }}>Manage Pieces</h1>
                {isMobile && (
                  <button onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }} className="btn-danger logout-btn" style={{ position: 'static', margin: 0 }} type="button">Logout</button>
                )}
              </div>
              <div className="search-input" style={{ margin: 0, width: isMobile ? '100%' : '300px' }}>
                <label htmlFor="search-pieces-input" className="visually-hidden">Search pieces</label>
                <input
                  id="search-pieces-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search pieces..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', border: 'transparent', borderRadius: '0', backgroundColor: 'transparent', color: 'white' }}
                />
              </div>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="role-span" style={{ color: 'white', fontSize: '1rem' }}>Role: admin</span>
                  <button onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }} className="btn-danger logout-btn" type="button">Logout</button>
                </div>
                <div className="button-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn-secondary" onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')} type="button">
                    {viewMode === 'card' ? 'List View' : 'Card View'}
                  </button>
                  <button className="btn-secondary" onClick={() => { downloadUpdatedExcel(); }} type="button">
                    Download Excel
                  </button>
                  <button className="btn-danger" onClick={handleDeleteAll} type="button">
                    Delete All
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="item-count">
            Showing {filteredPieces.length} of {pieces.length} pieces
          </div>

          {viewMode === 'card' ? (
            <div className="pieces-grid">
              {filteredPieces.length > 0 ? filteredPieces.map((p, index) => {
                const CRITICAL_COUNT = 3; // first 3 images load eagerly
                const isCritical = index < CRITICAL_COUNT;

                // Use a thumbnail for grid items to improve performance.
                // If ImagePath is a data URL (local cached), use it directly.
                const thumbUrl = p.ImagePath
                  ? (typeof p.ImagePath === 'string' && p.ImagePath.startsWith('data:') ? p.ImagePath : getThumbnailUrl(p.ImagePath, isCritical ? 800 : 400, null, isCritical ? 75 : 60))
                  : '';

                return (
                  <div key={p.id || `piece-${index}`} className="piece-card">
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
                      {p.APN}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '120px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '10px',
                        cursor: (p.ImagePath) ? 'pointer' : 'default'
                      }}
                      onClick={() => { if (p.ImagePath) { setZoomImageSrc(p.ImagePath); setZoomImageAlt(p['Parts Holder']); setShowZoomModal(true); } }}
                    >
                      {(p.ImagePath) ? (
                        <PieceImage
                          thumbnailUrl={thumbUrl && thumbUrl.endsWith('.webp') ? thumbUrl : undefined}
                          originalUrl={p.ImagePath && !p.ImagePath.startsWith('data:') ? p.ImagePath : thumbUrl}
                          alt={p.APN || p['Parts Holder'] || ''}
                          critical={isCritical}
                          width={400}
                          height={240}
                          sizes="(max-width: 576px) 200px, (max-width: 768px) 400px, 800px"
                        />
                      ) : (
                        <span style={{ color: '#999' }}>No Image</span>
                      )}
                    </div>
                    <div className="piece-info">
                      <div className="piece-info-item">
                        <span>Parts Holder:</span>
                        <span>{renderValue(p['Parts Holder'])}</span>
                      </div>
                      <div className="piece-info-item">
                        <span>SPN:</span>
                        <span>{renderValue(p.SPN)}</span>
                      </div>
                      <div className="piece-info-item">
                        <span>Holder Name:</span>
                        <span>{Array.isArray(p['Holder Name']) ? p['Holder Name'].join(', ') : renderValue(p['Holder Name'])}</span>
                      </div>
                      <div className="piece-info-item">
                        <span>Unrestricted Stock:</span>
                        <span>{renderValue(p['Unrestricted Stock'])}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button className="btn-secondary btn-sm" onClick={() => handleEdit(p)} type="button">Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(p)} type="button">Delete</button>
                    </div>
                  </div>
                );
              }) : (
                <div className="no-results">
                  <h3>No Pieces Available</h3>
                  <p>Use the import tools above to add pieces to the system.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="pieces-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('APN')}>APN</th>
                    <th onClick={() => requestSort('Parts Holder')}>Parts Holder</th>
                    <th onClick={() => requestSort('Holder Name')}>Holder Name</th>
                    <th onClick={() => requestSort('Unrestricted Stock')}>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPieces.map((p, index) => (
                    <tr key={p.id || `table-piece-${index}`}>
                      <td style={{ fontWeight: 'bold' }}>{p.APN}</td>
                      <td>{p['Parts Holder']}</td>
                      <td>{Array.isArray(p['Holder Name']) ? p['Holder Name'].join(', ') : p['Holder Name'] || ''}</td>
                      <td>{p['Unrestricted Stock']}</td>
                      <td className="actions-cell">
                        <button className="btn-secondary btn-sm" onClick={() => handleEdit(p)} type="button">Edit</button>
                        <button className="btn-danger btn-sm" onClick={() => handleDelete(p)} type="button">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {editingPiece && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <header className="modal-header">
                <h2 className="modal-title">Edit Piece: <span className="modal-title-highlight">{editingPiece['Parts Holder'] || editingPiece.APN}</span></h2>
                <button onClick={() => setEditingPiece(null)} className="modal-close-btn" type="button">&times;</button>
              </header>
              <main className="modal-body">
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="edit-APN">APN</label>
                      <input
                        id="edit-APN"
                        name="APN"
                        value={editForm.APN || ''}
                        readOnly
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="edit-SPN">SPN</label>
                      <input
                        id="edit-SPN"
                        name="SPN"
                        value={editForm.SPN || ''}
                        onChange={(e) => setEditForm({ ...editForm, SPN: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="edit-HolderName">Holder Name</label>
                      <input
                        id="edit-HolderName"
                        name="Holder Name"
                        value={Array.isArray(editForm['Holder Name']) ? editForm['Holder Name'].join(', ') : editForm['Holder Name'] || ''}
                        onChange={(e) => setEditForm({ ...editForm, 'Holder Name': e.target.value.split(',').map(s => s.trim()) })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="edit-PartsHolder">Parts Holder</label>
                      <input
                        id="edit-PartsHolder"
                        name="Parts Holder"
                        value={editForm['Parts Holder'] || ''}
                        onChange={(e) => setEditForm({ ...editForm, 'Parts Holder': e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-Equipment">Equipment</label>
                      <input id="edit-Equipment" name="Equipment" value={editForm.Equipment || ''} onChange={(e) => setEditForm({ ...editForm, Equipment: e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-Section">Section</label>
                      <input id="edit-Section" name="Section" value={editForm.Section || ''} onChange={(e) => setEditForm({ ...editForm, Section: e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="edit-Description">Description</label>
                      <textarea id="edit-Description" name="Description" value={editForm.Description || ''} onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })} className="form-input" rows="3" style={{ width: '93%' }} />
                    </div>

                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="edit-MoreInfo">More Information</label>
                      <textarea id="edit-MoreInfo" name="More Information" value={editForm['More Information'] || ''} onChange={(e) => setEditForm({ ...editForm, 'More Information': e.target.value })} className="form-input" rows="3" style={{ width: '93%' }} />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-UnitPrice">Unit Price</label>
                      <input id="edit-UnitPrice" name="Unit Price" type="number" value={editForm['Unit Price'] || ''} onChange={(e) => setEditForm({ ...editForm, 'Unit Price': e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-Stock">Unrestricted Stock</label>
                      <input id="edit-Stock" name="Unrestricted Stock" type="number" value={editForm['Unrestricted Stock'] || ''} onChange={(e) => setEditForm({ ...editForm, 'Unrestricted Stock': e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-Min">Min</label>
                      <input id="edit-Min" name="Min" type="number" value={editForm.Min || ''} onChange={(e) => setEditForm({ ...editForm, Min: e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-Max">Max</label>
                      <input id="edit-Max" name="Max" type="number" value={editForm.Max || ''} onChange={(e) => setEditForm({ ...editForm, Max: e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-Connecteur">Connecteur DPN</label>
                      <input id="edit-Connecteur" name="Connecteur DPN" value={editForm['Connecteur DPN'] || ''} onChange={(e) => setEditForm({ ...editForm, 'Connecteur DPN': e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-Serial">Serial Number Holder</label>
                      <input id="edit-Serial" name="Serial Number Holder" value={editForm['Serial Number Holder'] || ''} onChange={(e) => setEditForm({ ...editForm, 'Serial Number Holder': e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-MRP">MRP Type</label>
                      <input id="edit-MRP" name="MRP Type" value={editForm['MRP Type'] || ''} onChange={(e) => setEditForm({ ...editForm, 'MRP Type': e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-Suppliers">Suppliers</label>
                      <input id="edit-Suppliers" name="Suppliers" value={editForm.Suppliers || ''} onChange={(e) => setEditForm({ ...editForm, Suppliers: e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="edit-InTransit">In Transit</label>
                      <input id="edit-InTransit" name="In Transit" value={editForm['In Transit'] !== undefined ? editForm['In Transit'] : ''} onChange={(e) => setEditForm({ ...editForm, 'In Transit': e.target.value })} className="form-input" />
                    </div>

                  </div>
                </div>
              </main>
              <footer className="modal-footer">
                <button className="btn-secondary" onClick={() => setEditingPiece(null)} type="button">Cancel</button>
                <button className="btn-primary" onClick={saveEdit} type="button">Save Changes</button>
              </footer>
            </div>
          </div>
        )}

        {addingPiece && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <header className="modal-header">
                <h2 className="modal-title">Add New Piece</h2>
                <button onClick={() => setAddingPiece(false)} className="modal-close-btn" type="button">&times;</button>
              </header>
              <main className="modal-body">
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="add-APN">APN *</label>
                      <input id="add-APN" name="APN" value={addForm.APN || ''} onChange={(e) => setAddForm({ ...addForm, APN: e.target.value })} className="form-input" />
                    </div>
                    <div className="form-field">
                      <label htmlFor="add-SPN">SPN</label>
                      <input id="add-SPN" name="SPN" value={addForm.SPN || ''} onChange={(e) => setAddForm({ ...addForm, SPN: e.target.value })} className="form-input" />
                    </div>
                    <div className="form-field">
                      <label htmlFor="add-HolderName">Holder Name</label>
                      <input id="add-HolderName" name="Holder Name" value={Array.isArray(addForm['Holder Name']) ? addForm['Holder Name'].join(', ') : addForm['Holder Name'] || ''} onChange={(e) => setAddForm({ ...addForm, 'Holder Name': e.target.value.split(',').map(s => s.trim()) })} className="form-input" />
                    </div>
                    <div className="form-field">
                      <label htmlFor="add-PartsHolder">Parts Holder *</label>
                      <input id="add-PartsHolder" name="Parts Holder" value={addForm['Parts Holder'] || ''} onChange={(e) => setAddForm({ ...addForm, 'Parts Holder': e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-Equipment">Equipment</label>
                      <input id="add-Equipment" name="Equipment" value={addForm.Equipment || ''} onChange={(e) => setAddForm({ ...addForm, Equipment: e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-Section">Section</label>
                      <input id="add-Section" name="Section" value={addForm.Section || ''} onChange={(e) => setAddForm({ ...addForm, Section: e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-ProjectLine">Project Line</label>
                      <input
                        id="add-ProjectLine"
                        name="Project Line"               // changed name
                        value={addForm['Project Line'] || ''}
                        onChange={(e) => setAddForm({ ...addForm, 'Project Line': e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-StorageLocation">Storage Location</label>
                      <input id="add-StorageLocation" name="Storage Location" value={addForm['Storage Location'] || ''} onChange={(e) => setAddForm({ ...addForm, 'Storage Location': e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-UnitPrice">Unit Price</label>
                      <input id="add-UnitPrice" name="Unit Price" type="number" value={addForm['Unit Price'] || ''} onChange={(e) => setAddForm({ ...addForm, 'Unit Price': e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-Stock">Unrestricted Stock</label>
                      <input id="add-Stock" name="Unrestricted Stock" type="number" value={addForm['Unrestricted Stock'] || ''} onChange={(e) => setAddForm({ ...addForm, 'Unrestricted Stock': e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-Min">Min</label>
                      <input id="add-Min" name="Min" type="number" value={addForm.Min || ''} onChange={(e) => setAddForm({ ...addForm, Min: e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-Max">Max</label>
                      <input id="add-Max" name="Max" type="number" value={addForm.Max || ''} onChange={(e) => setAddForm({ ...addForm, Max: e.target.value })} className="form-input" />
                    </div>

                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="add-Description">Description</label>
                      <textarea id="add-Description" name="Description" value={addForm.Description || ''} onChange={(e) => setAddForm({ ...addForm, Description: e.target.value })} className="form-input" rows="3" style={{ width: '93%' }} />
                    </div>

                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="add-MoreInfo">More Information</label>
                      <textarea id="add-MoreInfo" name="More Information" value={addForm['More Information'] || ''} onChange={(e) => setAddForm({ ...addForm, 'More Information': e.target.value })} className="form-input" rows="3" style={{ width: '93%' }} />
                    </div>

                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="add-ImagePath">Image Path</label>
                      <input id="add-ImagePath" name="ImagePath" value={addForm.ImagePath || ''} onChange={(e) => setAddForm({ ...addForm, ImagePath: e.target.value })} className="form-input" />
                    </div>

                  </div>
                </div>
              </main>
              <footer className="modal-footer">
                <button className="btn-secondary" onClick={() => setAddingPiece(false)} type="button">Cancel</button>
                <button className="btn-primary" onClick={saveAdd} type="button">Add Piece</button>
              </footer>
            </div>
          </div>
        )}

        {showZoomModal && (
          <ImageZoomModal isOpen={showZoomModal} imageSrc={zoomImageSrc} imageAlt={zoomImageAlt} onClose={() => setShowZoomModal(false)} />
        )}

        {isMobile && !editingPiece && !addingPiece && (
          <>
            <button
              className="fab-btn"
              onClick={() => setFabMenuOpen(!fabMenuOpen)}
              style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
                background: '#333',
                border: '1px solid #ff7b00',
                color: 'white',
                padding: '15px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.5rem',
                width: '70px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              type="button"
            >
              {fabMenuOpen ? '☰' : '☰'}
            </button>

            {fabMenuOpen && (
              <div
                className="fab-menu"
                style={{
                  position: 'fixed',
                  bottom: '110px',
                  right: '20px',
                  zIndex: 999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <button className="btn-secondary" onClick={() => { setSidebarOpen(true); setFabMenuOpen(false); }} style={{ padding: '15px 20px', fontSize: '1.1rem', minWidth: '150px' }} type="button">
                  Upload Excel
                </button>
                <button className="btn-secondary" onClick={() => { setSidebarOpen(true); setFabMenuOpen(false); }} style={{ padding: '15px 20px', fontSize: '1.1rem', minWidth: '150px' }} type="button">
                  Upload Images
                </button>
                <button className="btn-secondary" onClick={() => { setAddingPiece(true); setFabMenuOpen(false); }} style={{ padding: '15px 20px', fontSize: '1.1rem', minWidth: '150px' }} type="button">
                  Add New Piece
                </button>
                <button className="btn-secondary" onClick={() => { setViewMode(viewMode === 'card' ? 'list' : 'card'); setFabMenuOpen(false); }} style={{ padding: '15px 20px', fontSize: '1.1rem', minWidth: '150px' }} type="button">
                  {viewMode === 'card' ? 'List View' : 'Card View'}
                </button>
                <button className="btn-secondary" onClick={() => { downloadUpdatedExcel(); setFabMenuOpen(false); }} style={{ padding: '15px 20px', fontSize: '1.1rem', minWidth: '150px' }} type="button">
                  Download Excel
                </button>
                <button className="btn-danger" onClick={() => { handleDeleteAll(); setFabMenuOpen(false); }} style={{ padding: '15px 20px', fontSize: '1.1rem', minWidth: '150px' }} type="button">
                  Delete All
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}