import React, { useState } from 'react';

// Services and Utils
import { useNotification } from '../App';

// Styles
import '../styles/corporate.css';

/**
 * ExcelManager
 * - Uploads an Excel file (.xlsx/.xls)
 * - Uses Web Worker to process Excel in background thread
 * - Detects headers and maps them to canonical fields
 * - Normalizes rows into pieces shaped for dataManager
 * - Calls onDataSave(pieces, headers) with normalized pieces
 */
function ExcelManager({ onDataSave, returnDataOnly = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();



  // Normalize a piece (object keyed by header -> canonical keys used by ManagePieces)
  function normalizePiece(piece) {
    const normalized = {};
    const mapKey = (k) => k.toString().trim().toLowerCase().replace(/[_\s]+/g, ' ');

    const canonicalMap = {
      apn: 'APN',
      spn: 'SPN',
      'holder name': 'Holder Name',
      'connecteur dpn': 'Connecteur DPN',
      'connecteur': 'Connecteur DPN',
      'parts holder': 'Parts Holder',
      'serial number holder': 'Serial Number Holder',
      'serial number': 'Serial Number Holder',
      equipment: 'Equipment',
      section: 'Section',
      'project line': 'Project Line',
      projectline: 'Project Line',
      description: 'Description',
      'storage location': 'Storage Location',
      'mrp type': 'MRP Type',
      mrp: 'MRP Type',
      suppliers: 'Suppliers',
      'unit price': 'Unit Price',
      'unrestricted stock': 'Unrestricted Stock',
      stock: 'Unrestricted Stock',
      qty: 'Unrestricted Stock',
      quantity: 'Unrestricted Stock',
      min: 'Min',
      max: 'Max',
      'in transit': 'In Transit',
      'more information': 'More Information',
      image: 'ImagePath',
      imagepath: 'ImagePath',
      'image path': 'ImagePath'
    };

    Object.keys(piece || {}).forEach((rawKey) => {
      const k = mapKey(rawKey);
      const mapped = canonicalMap[k];
      const value = piece[rawKey];

      if (mapped) {
        // coerce numbers for numeric fields where sensible
        if (['Unit Price'].includes(mapped)) {
          const n = parseFloat(value);
          normalized[mapped] = Number.isFinite(n) ? n : (value === '' ? null : value);
        } else if (['Unrestricted Stock', 'Min', 'Max', 'In Transit'].includes(mapped)) {
          const ni = parseInt(value, 10);
          normalized[mapped] = Number.isFinite(ni) ? ni : (value === '' ? null : value);
        } else if (mapped === 'Holder Name' && typeof value === 'string' && value.includes(',')) {
          normalized[mapped] = value.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          normalized[mapped] = (value === '') ? null : (typeof value === 'string' ? value.trim() : value);
        }
      } else {
        // keep unknown keys as-is but trimmed where string
        normalized[rawKey] = (value === '') ? null : (typeof value === 'string' ? value.trim() : value);
      }
    });

    return normalized;
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Reset input so the same file can be selected again if needed
    try { e.target.value = ''; } catch (_) {}

    setIsLoading(true);

    try {
      // Validate file size (50MB limit for Excel files)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`);
      }

      // Validate file type (best-effort - some browsers may not set exact MIME)
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];
      if (file.type && !allowedTypes.includes(file.type)) {
        // allow processing if extension matches but MIME is odd; warn user
        const nameLower = file.name.toLowerCase();
        if (!nameLower.endsWith('.xlsx') && !nameLower.endsWith('.xls')) {
          throw new Error('Invalid file type. Only Excel files (.xlsx, .xls) are supported.');
        }
      }

      // Create Web Worker for Excel processing
      const worker = new Worker(new URL('../workers/excelWorker.js', import.meta.url));

      return new Promise((resolve, reject) => {
        worker.onmessage = async (e) => {
          const { type, headers, rows, error } = e.data;

          if (type === 'complete') {
            worker.terminate();

            // Process the data from worker
            const piecesRaw = rows.map((row) => {
              const piece = {};
              headers.forEach((header, i) => {
                const columnName = header.toString().trim();
                const value = (row[header] !== undefined && row[header] !== null) ? String(row[header]).trim() : '';

                // Smart field detection (pattern matching to canonical fields)
                const name = (columnName || '').toLowerCase().trim();
                const exactMatches = {
                  'apn': 'APN',
                  'spn': 'SPN',
                  'holder name': 'Holder Name',
                  'connecteur dpn': 'Connecteur DPN',
                  'parts holder': 'Parts Holder',
                  'serial number holder': 'Serial Number Holder',
                  'equipment': 'Equipment',
                  'section': 'Section',
                  'project line': 'Project Line',
                  'description': 'Description',
                  'storage location': 'Storage Location',
                  'mrp type': 'MRP Type',
                  'suppliers': 'Suppliers',
                  'unit price': 'Unit Price',
                  'unrestricted stock': 'Unrestricted Stock',
                  'min': 'Min',
                  'max': 'Max',
                  'in transit': 'In Transit',
                  'more information': 'More Information'
                };

                let fieldType = exactMatches[name];
                if (!fieldType) {
                  const patterns = [
                    { regex: /(apn|article|reference|part\.number|id|code|part|item|product)/, field: 'APN' },
                    { regex: /(spn|supplier\.part|vendor\.part|supplier\.code|vendor\.code)/, field: 'SPN' },
                    { regex: /(holder\.name|holdername|holder|owner|responsible)/, field: 'Holder Name' },
                    { regex: /(connecteur|connector|connection|dpn)/, field: 'Connecteur DPN' },
                    { regex: /(parts\.holder|parts|holder|part\.name|partname|component)/, field: 'Parts Holder' },
                    { regex: /(serial\.number|serial|s\.n|serial\.no)/, field: 'Serial Number Holder' },
                    { regex: /(equipment|machine|device|tool)/, field: 'Equipment' },
                    { regex: /(section|department|area|division)/, field: 'Section' },
                    { regex: /(project\.line|projectline|line|project)/, field: 'Project Line' },
                    { regex: /(description|desc|details|info)/, field: 'Description' },
                    { regex: /(storage\.location|storage|location|warehouse)/, field: 'Storage Location' },
                    { regex: /(mrp\.type|mrp|type|material\.type)/, field: 'MRP Type' },
                    { regex: /(suppliers|supplier|vendor|provider)/, field: 'Suppliers' },
                    { regex: /(unit\.price|price|cost|unit\.cost)/, field: 'Unit Price' },
                    { regex: /(unrestricted\.stock|stock|quantity|qty|inventory|qté|quantité)/, field: 'Unrestricted Stock' },
                    { regex: /(min|minimum|min\.qty|min\.quantity)/, field: 'Min' },
                    { regex: /(max|maximum|max\.qty|max\.quantity)/, field: 'Max' },
                    { regex: /(in\.transit|transit|shipping|on\.the\.way)/, field: 'In Transit' },
                    { regex: /(more\.information|information|info|notes)/, field: 'More Information' }
                  ];

                  for (const pattern of patterns) {
                    if (pattern.regex.test(name)) {
                      fieldType = pattern.field;
                      break;
                    }
                  }
                }

                if (fieldType) {
                  let processedValue = value === '' ? null : value;
                  if (fieldType === 'Holder Name' && processedValue && processedValue.includes(',')) {
                    piece[fieldType] = processedValue.split(',').map(item => item.trim()).filter(Boolean);
                  } else {
                    piece[fieldType] = processedValue;
                  }
                } else {
                  const rawKey = columnName || `Column${i + 1}`;
                  piece[rawKey] = (value === '') ? null : value;
                }
              });

              if (!piece.APN || piece.APN === '') return null;
              return piece;
            }).filter(p => p !== null);

            const pieces = piecesRaw.map(p => normalizePiece(p));

            if (pieces.length === 0) {
              throw new Error('No valid data could be extracted from the Excel file');
            }

            await onDataSave?.(pieces, headers);
            window.dispatchEvent(new CustomEvent('piecesUpdated'));
            showNotification('Excel imported successfully', 'success');
            resolve();
          } else if (type === 'error') {
            worker.terminate();
            reject(new Error(error));
          }
        };

        worker.onerror = (error) => {
          worker.terminate();
          reject(error);
        };

        // Send file to worker
        worker.postMessage({ file });
      });

    } catch (error) {
      console.error('Error processing Excel file:', error);
      showNotification('Error processing Excel file: ' + (error.message || error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', backgroundColor: '#000000af', borderRadius: '8px', padding: '15px' }}>
      <div style={{ textAlign: 'center' }}>
        <label
          htmlFor="excel-upload"
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
          {isLoading ? '⏳ Processing...' : 'Upload Excel'}
        </label>
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

export default ExcelManager;