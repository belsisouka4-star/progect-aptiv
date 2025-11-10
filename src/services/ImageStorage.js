import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { validateImageFile, sanitizeFilePath } from '../utils/sanitize';

class ImageStorageService {
  constructor() {
    this.storage = storage;
  }

  // Upload image to Firebase Storage with validation
  async uploadImage(file, path = 'images/') {
    try {
      // Validate file before upload
      const validation = validateImageFile(file, 10); // 10MB max for Firebase
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Sanitize path to prevent directory traversal
      const sanitizedPath = sanitizeFilePath(path);
      if (!sanitizedPath) {
        return {
          success: false,
          error: 'Invalid upload path'
        };
      }

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(this.storage, `${sanitizedPath}${fileName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        url: downloadURL,
        path: snapshot.ref.fullPath,
        fileName: fileName,
        size: file.size
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload multiple images
  async uploadImages(files, path = 'images/', onProgress = null) {
    const results = [];
    let uploaded = 0;

    for (const file of files) {
      try {
        const result = await this.uploadImage(file, path);
        results.push(result);

        uploaded++;
        if (onProgress) {
          onProgress(uploaded, files.length);
        }
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          fileName: file.name
        });
      }
    }

    return results;
  }

  // Delete image from Firebase Storage
  async deleteImage(path) {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get download URL for existing image
  async getImageUrl(path) {
    try {
      const storageRef = ref(this.storage, path);
      const url = await getDownloadURL(storageRef);
      return { success: true, url };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const imageStorage = new ImageStorageService();
export default imageStorage;
