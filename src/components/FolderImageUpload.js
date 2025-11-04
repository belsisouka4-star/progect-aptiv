import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../App';
import dataManager from '../services/DataManager';
import { uploadMultipleToCloudinary } from '../utils/cloudinaryHelper';
import '../styles/App.css';

// FolderImageUpload: uploads images (optionally to cloud) and persists image map into IndexedDB via dataManager.
function FolderImageUpload({ onImagesUploaded, returnDataOnly = false, useCloudStorage = false }) {
  const [uploadedImagesList, setUploadedImagesList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    return () => {
      // revoke object URLs to free memory
      uploadedImagesList.forEach((img) => {
        if (img.objectUrl) {
          try { URL.revokeObjectURL(img.objectUrl); } catch (_) {}
        }
      });
    };
  }, [uploadedImagesList]);

  const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const validateFile = async (file) => {
    try {
      const { validateImageFile } = await import('../utils/sanitize');
      return validateImageFile(file, 5); // 5MB safe limit
    } catch (err) {
      // fallback: basic client-side checks
      if (!file.type || !file.type.startsWith('image/')) return { isValid: false, error: 'Not an image' };
      if (file.size > 5 * 1024 * 1024) return { isValid: false, error: 'File too large' };
      return { isValid: true };
    }
  };

  const processChunk = async (filesChunk) => {
    const results = [];
    const errors = [];

    for (const file of filesChunk) {
      try {
        const validation = await validateFile(file);
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error || 'validation failed'}`);
          continue;
        }

        // create an object URL for fast local preview
        const objectUrl = URL.createObjectURL(file);
        // convert to data URL for persistent storage (stored in IndexedDB)
        const dataUrl = await fileToDataURL(file);

        // Generate thumbnail for grid display
        const { createThumbnail } = await import('../utils/imageCompression');
        const thumbnailBlob = await createThumbnail(file, 150); // 150px thumbnail
        const thumbnailDataUrl = await fileToDataURL(thumbnailBlob);

        results.push({
          filename: file.name,
          dataUrl,
          thumbnailDataUrl,
          objectUrl,
          size: file.size
        });
      } catch (err) {
        errors.push(`${file.name}: ${err.message || 'processing error'}`);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new Error(errors.join('; '));
    }

    if (errors.length > 0 && results.length > 0) {
      console.warn('Some images failed validation/processing:', errors);
    }

    return results;
  };

  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      showNotification('No files selected.', 'error');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const imageFiles = files.filter(f => f.type && f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      showNotification('No image files found in selection.', 'error');
      setIsUploading(false);
      return;
    }

    try {
      const imagesMap = {}; // filename -> dataUrl or cloud url
      const imageList = [];
      const chunkSize = 50;
      let processed = 0;
      let successful = 0;

      if (useCloudStorage) {
        showNotification('Uploading images to Cloudinary...', 'info');

        // uploadMultipleToCloudinary should accept (files, options, progressCallback)
        const uploadResults = await uploadMultipleToCloudinary(imageFiles, { folder: 'project_aptiv', concurrency: 4 }, (uploaded, total) => {
          if (!mountedRef.current) return;
          setProgress((uploaded / total) * 100);
        });

        for (let idx = 0; idx < uploadResults.length; idx++) {
          const res = uploadResults[idx];
          const filename = imageFiles[idx].name;
          if (res && res.success) {
            imagesMap[filename] = res.url;
            imageList.push({ filename, url: res.url, size: res.size });
            successful++;
          } else {
            console.error(`Cloudinary upload failed for ${filename}:`, res && res.error);
            // Fallback: save to IndexedDB if Cloudinary fails
            try {
              const dataUrl = await fileToDataURL(imageFiles[idx]);
              imagesMap[filename] = dataUrl;
              const objectUrl = URL.createObjectURL(imageFiles[idx]);
              imageList.push({ filename, url: objectUrl, size: imageFiles[idx].size, objectUrl });
              successful++;
              console.warn(`Saved ${filename} to local cache as Cloudinary upload failed.`);
            } catch (fallbackErr) {
              console.error(`Fallback failed for ${filename}:`, fallbackErr);
            }
          }
        }
      } else {
        // Process locally (generate dataURLs + object URLs), chunked to avoid blocking
        for (let i = 0; i < imageFiles.length; i += chunkSize) {
          if (!mountedRef.current) break;
          const chunk = imageFiles.slice(i, i + chunkSize);
          try {
            const chunkResults = await processChunk(chunk);
            for (const r of chunkResults) {
              imagesMap[r.filename] = r.dataUrl;
              // Store thumbnail separately for grid display
              const thumbnailKey = `${r.filename}_thumb`;
              imagesMap[thumbnailKey] = r.thumbnailDataUrl;
              imageList.push({ filename: r.filename, url: r.objectUrl, size: r.size, objectUrl: r.objectUrl });
              successful++;
            }
          } catch (chunkErr) {
            console.error('Chunk processing error:', chunkErr);
            showNotification(`Error processing some images: ${chunkErr.message}`, 'warning');
          }
          processed += chunk.length;
          if (mountedRef.current) setProgress((processed / imageFiles.length) * 100);
        }
      }

      if (successful === 0) {
        showNotification('No images were successfully processed.', 'error');
      } else {
        // Persist images map in IndexedDB via dataManager
        try {
          await dataManager.saveUploadedImages(imagesMap);
        } catch (persistErr) {
          console.warn('Failed to persist images to IndexedDB:', persistErr);
        }

        if (mountedRef.current) {
          setUploadedImagesList(imageList);
          if (typeof onImagesUploaded === 'function') {
            onImagesUploaded(imagesMap);
          }
          showNotification(`${successful} images processed successfully.`, 'success');
        }
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      showNotification(err.message || 'Failed to process images', 'error');
    } finally {
      if (mountedRef.current) {
        setIsUploading(false);
        setProgress(0);
        try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (_) {}
      }
    }
  };

  return (
    <div style={{ marginBottom: '20px', backgroundColor: '#000000af', borderRadius: '8px', padding: '15px' }}>
      <div style={{ textAlign: 'center' }}>
        <label
          htmlFor="folder-upload"
          className="btn-primary"
          style={{
            cursor: 'pointer',
            fontSize: '0.9rem',
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'white',
            border: 'transparent',
            background: '#333'
          }}
        >
          {isUploading ? '⏳ Uploading...' : 'Upload Images'}
        </label>
        <input
          id="folder-upload"
          ref={fileInputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          accept="image/*"
          onChange={handleFolderSelect}
          style={{ display: 'none' }}
        />
        {isUploading && (
          <div style={{ marginTop: '10px' }}>
            <progress value={progress} max="100" style={{ width: '100%' }} />
            <p style={{ color: 'black' }}>{Math.round(progress)}% processed</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FolderImageUpload;