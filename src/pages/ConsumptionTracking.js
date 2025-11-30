import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Services and Components
import dataManager from '../services/DataManager';
import { useNotification } from '../App';

// Styles
import '../styles/App.css';
import '../styles/corporate.css';

const styles = `
/* === Global Styles === */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
  background-color: #f5f7fa;
  color: #333;
  line-height: 1.6;
  padding: 20px;
}

/* === Shift Selection Bar === */
.shift-selection-container {
  margin-bottom: 12px;
}

.shift-selection-label {
  font-weight: 600;
  color: #ecf0f1;
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
}

.shift-selection-bar {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.shift-option {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.shift-option:hover:not(.active) {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.shift-option.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.4);
}

.shift-option:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.shift-option.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  pointer-events: none;
}

/* === Container === */
.consumption-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* === Header === */
.consumption-header {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 25px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-left h1 {
  font-size: 26px;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.header-left p {
  font-size: 15px;
  opacity: 0.9;
  color: #ecf0f1;
}

.header-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.warehouse-name {
  font-size: 20px;
  font-weight: 600;
  color: #3498db;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.header-info-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 15px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 280px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #ecf0f1;
  min-width: 90px;
  font-size: 14px;
}

.editable-field {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: all 0.3s ease;
}

.editable-field:focus {
  background: rgba(255, 255, 255, 0.2);
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.editable-field::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.info-text {
  color: #ecf0f1;
  font-size: 14px;
  font-weight: 500;
}

.btn-back {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border: none;
  color: white;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
  background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
}

.btn-back:active {
  transform: translateY(0);
}

/* === Table Container === */
.table-container {
  overflow-x: auto;
  padding: 20px;
}

/* === Form Table === */
.form-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.form-table th,
.form-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e1e1e1;
}

.form-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  position: sticky;
  top: 0;
}

.form-table tbody tr:hover {
  background-color: #f8f9fa;
}

.row-number {
  width: 50px;
  text-align: center;
  font-weight: bold;
  color: #7f8c8d;
}

/* === Inputs and Selects === */
.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  outline: none;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

/* === Dropdown === */
.apn-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item strong {
  color: #2c3e50;
}

.dropdown-item div {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

/* === Buttons === */
.btn {
  background: linear-gradient(90deg, #3498db, #2980b9);
  border: none;
  color: white;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(90deg, #27ae60, #229954);
}

.btn-danger {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
}

/* === Log Table === */
.log-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 20px;
  border: 1px solid #e1e1e1;
}

.log-table table {
  width: 100%;
  border-collapse: collapse;
}

.log-table th,
.log-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e1e1e1;
}

.log-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.log-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* === No Data === */
.no-data {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  border: 1px solid #e1e1e1;
  color: #7f8c8d;
}

/* === Footer === */
.consumption-footer {
  padding: 15px 20px;
  background-color: #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.ss-principles {
  display: flex;
  gap: 15px;
}

.ss-principles span {
  font-weight: 600;
  color: #2c3e50;
}

.confidential {
  color: #e74c3c;
  font-weight: 600;
}

/* === Form Section === */
.form-section {
  padding: 25px;
  background: #f8f9fa;
  border-bottom: 2px solid #e1e4e8;
}

.form-section h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

/* === Mobile Responsiveness === */
@media (max-width: 768px) {
  .consumption-header {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .header-left {
    margin-bottom: 15px;
  }

  .header-right {
    align-items: center;
    width: 100%;
  }

  .header-info-card {
    min-width: auto;
    width: 100%;
  }

  .consumption-footer {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .table-container {
    padding: 10px;
  }

  .form-table th,
  .form-table td {
    padding: 8px 10px;
    font-size: 14px;
  }

  .form-section {
    padding: 15px;
  }
}
`;

const ConsumptionTracking = () => {
  const [loading, setLoading] = useState(true);
  const [consumptionLog, setConsumptionLog] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [apnSearch, setApnSearch] = useState('');
  const [showApnDropdown, setShowApnDropdown] = useState(false);
  const [storekeeperName, setStorekeeperName] = useState('');
  const [selectedShift, setSelectedShift] = useState('Morning'); // Default to Morning
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [shiftEndTime, setShiftEndTime] = useState(null);
  const [formData, setFormData] = useState({
    QX: '',
    apn: '',
    pieceId: '',
    quantity: '',
    AC: '',
    operatorName: '',
    id: '',
    job: '',
    section: '',
    mat: ''
  });
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;

  // Initialize storekeeper name, shift type, and shift times from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('storekeeperName');
    setStorekeeperName(savedName || user.name || user.username || '');
    
    // Load shift type from localStorage
    const savedShiftType = localStorage.getItem('selectedShiftType');
    if (savedShiftType) {
      setSelectedShift(savedShiftType);
    }
    
    // Load shift times from localStorage
    const savedShiftStart = localStorage.getItem('shiftStartTime');
    const savedShiftEnd = localStorage.getItem('shiftEndTime');
    const savedShiftActive = localStorage.getItem('isShiftActive');
    
    if (savedShiftStart) {
      setShiftStartTime(new Date(savedShiftStart));
    }
    if (savedShiftEnd) {
      setShiftEndTime(new Date(savedShiftEnd));
    }
    if (savedShiftActive === 'true') {
      setIsShiftActive(true);
    }
  }, [user.name, user.username]);

  // Debug logs
  console.log('ConsumptionTracking component mounted');
  console.log('User role:', userRole);
  console.log('User data:', user);

  // Redirect if not supervisor using useEffect
  useEffect(() => {
    if (userRole !== 'supervisor') {
      console.log('User is not supervisor, redirecting to /search');
      navigate('/search');
    }
  }, [userRole, navigate]);

  // Load pieces and consumption entries with debouncing
  useEffect(() => {
    if (userRole !== 'supervisor') {
      return; // Don't load data if not supervisor
    }

    console.log('useEffect for loading data triggered');
    let isMounted = true;
    
    const loadData = async () => {
      try {
        console.log('Starting to load pieces...');
        const allPieces = await dataManager.getAllPieces();
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        console.log('Loaded pieces:', allPieces.slice(0, 5)); // Debug first 5 pieces
        console.log('Total pieces loaded:', allPieces.length);
        if (allPieces.length > 0) {
          console.log('Sample piece structure:', allPieces[0]); // Debug piece structure
        }
        setPieces(allPieces);

        // Load consumption entries from localStorage (per day)
        const today = new Date().toISOString().split('T')[0];
        const logKey = `consumption_log_${today}`;
        const log = JSON.parse(localStorage.getItem(logKey) || '[]');
        console.log('Loaded consumption log entries:', log.length);
        setConsumptionLog(log);

        console.log('Data loading completed successfully');
      } catch (error) {
        console.error('Failed to load data:', error);
        if (isMounted) {
          showNotification('Failed to load data', 'error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('Loading state set to false');
        }
      }
    };

    loadData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [userRole, showNotification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'apn') {
      setApnSearch(value);
      setShowApnDropdown(value.length > 0);
    }
  };

  const handleStorekeeperChange = (e) => {
    const newName = e.target.value;
    setStorekeeperName(newName);
    localStorage.setItem('storekeeperName', newName);
  };

  const handleShiftSelection = (shiftType) => {
    if (!isShiftActive) {
      setSelectedShift(shiftType);
      localStorage.setItem('selectedShiftType', shiftType);
      showNotification(`${shiftType} shift selected`, 'success');
    }
  };

  const handleStartShift = () => {
    const now = new Date();
    setShiftStartTime(now);
    setIsShiftActive(true);
    localStorage.setItem('shiftStartTime', now.toISOString());
    localStorage.setItem('isShiftActive', 'true');
    localStorage.setItem('activeShiftType', selectedShift);
    showNotification(`${selectedShift} shift started successfully`, 'success');
  };

  const handleEndShift = () => {
    const now = new Date();
    setShiftEndTime(now);
    setIsShiftActive(false);
    localStorage.setItem('shiftEndTime', now.toISOString());
    localStorage.setItem('isShiftActive', 'false');
    localStorage.removeItem('activeShiftType');
    showNotification(`${selectedShift} shift ended successfully`, 'success');
  };

  const handleDownloadReport = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logKey = `consumption_log_${today}`;
      const log = JSON.parse(localStorage.getItem(logKey) || '[]');

      if (log.length === 0) {
        showNotification('No consumption data to download', 'warning');
        return;
      }

      // Create HTML content for Word document
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Consumption Report</title>
          <style>
            body {
              font-family: 'Calibri', 'Arial', sans-serif;
              margin: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #2C3E50;
              margin-bottom: 10px;
            }
            .info {
              font-size: 12px;
              color: #555;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #34495E;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #000;
            }
            td {
              padding: 10px;
              border: 1px solid #ddd;
              text-align: left;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .summary {
              margin-top: 20px;
              font-weight: bold;
              text-align: right;
              padding: 10px;
              background-color: #E8F4F8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Warehouse Consumption Report</div>
            <div class="info">
              Date: ${new Date().toLocaleDateString()} | 
              Storekeeper: ${storekeeperName || 'N/A'} | 
              Shift: ${selectedShift}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Shift</th>
                <th>APN</th>
                <th>Quantity</th>
                <th>AC</th>
                <th>Recipient</th>
                <th>Job</th>
                <th>Section</th>
                <th>Material</th>
              </tr>
            </thead>
            <tbody>
              ${log.map(entry => `
                <tr>
                  <td>${new Date(entry.timestamp).toLocaleString()}</td>
                  <td>${entry.shiftType || 'N/A'}</td>
                  <td>${entry.apn}</td>
                  <td>${entry.quantity}</td>
                  <td>${entry.AC || '-'}</td>
                  <td>${entry.operatorName}</td>
                  <td>${entry.job || '-'}</td>
                  <td>${entry.section || '-'}</td>
                  <td>${entry.mat || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            Total Entries: ${log.length}
          </div>
        </body>
        </html>
      `;

      // Create blob with Word MIME type
      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
      });

      // Create and download file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Consumption_Report_${today}.doc`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('Consumption report downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading report:', error);
      showNotification('Error downloading report: ' + error.message, 'error');
    }
  };

  const handleApnSelect = (selectedApn) => {
    setFormData(prev => ({ ...prev, apn: selectedApn }));
    setApnSearch(selectedApn);
    setShowApnDropdown(false);
  };

  const handleApnClickOutside = (e) => {
    if (!e.target.closest('.apn-search-container')) {
      setShowApnDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleApnClickOutside);
    return () => document.removeEventListener('click', handleApnClickOutside);
  }, []);

  const filteredPieces = apnSearch.length > 0 ? pieces.filter(piece => {
    const apn = piece.APN || piece.name || '';
    const searchTerm = apnSearch.toLowerCase();
    const apnLower = apn.toLowerCase();

    // Smart matching: prioritize exact matches, then starts with, then contains
    const exactMatch = apnLower === searchTerm;
    const startsWith = apnLower.startsWith(searchTerm);
    const contains = apnLower.includes(searchTerm);

    console.log('Checking piece:', apn, 'Search term:', searchTerm, 'Matches:', exactMatch || startsWith || contains);

    return exactMatch || startsWith || contains;
  }).sort((a, b) => {
    const aApn = (a.APN || a.name || '').toLowerCase();
    const bApn = (b.APN || b.name || '').toLowerCase();
    const searchTerm = apnSearch.toLowerCase();

    // Sort by relevance: exact match first, then starts with, then contains
    const aExact = aApn === searchTerm;
    const bExact = bApn === searchTerm;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStarts = aApn.startsWith(searchTerm);
    const bStarts = bApn.startsWith(searchTerm);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return aApn.localeCompare(bApn);
  }).slice(0, 4) : [];



  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if required fields are filled
    const apn = formData.apn;
    const quantity = formData.quantity;
    const operatorName = formData.operatorName;

    if (!apn || !quantity || !operatorName) {
      showNotification('Please fill in at least one complete entry (APN, Quantity, and Recipient)', 'error');
      return;
    }

    try {
      // Find the piece by APN to update stock
      const pieceToUpdate = pieces.find(piece => piece.APN === apn);
      if (!pieceToUpdate) {
        showNotification('Piece not found in database', 'error');
        return;
      }

      // Check if there's enough stock
      const currentStock = parseFloat(pieceToUpdate['Unrestricted Stock'] || 0);
      const consumedQuantity = parseInt(quantity);

      if (currentStock < consumedQuantity) {
        showNotification(`Insufficient stock. Available: ${currentStock}, Requested: ${consumedQuantity}`, 'error');
        return;
      }

      // Calculate new stock level
      const newStock = currentStock - consumedQuantity;

      // Update the piece stock in database
      const updatedPiece = {
        ...pieceToUpdate,
        'Unrestricted Stock': newStock
      };

      const updateSuccess = await dataManager.updatePiece(pieceToUpdate.id, updatedPiece);
      if (!updateSuccess) {
        showNotification('Failed to update stock in database', 'error');
        return;
      }

      // Update local pieces state immediately to avoid refetching
      setPieces(prevPieces => 
        prevPieces.map(p => 
          p.id === pieceToUpdate.id 
            ? { ...p, 'Unrestricted Stock': newStock }
            : p
        )
      );

      // Check if stock is now below minimum
      const minStock = parseFloat(pieceToUpdate.Min || 0);
      if (newStock <= minStock) {
        showNotification(`Warning: Stock for ${apn} is now below minimum level (${newStock} ≤ ${minStock})`, 'warning');
      }

      // Create the new entry
      const newEntry = {
        id: `${Date.now()}`,
        QX: formData.QX || '',
        apn: apn,
        quantity: consumedQuantity,
        AC: formData.AC || '',
        operatorName: operatorName,
        recipientId: operatorName, // Using operatorName as recipient ID
        job: formData.job || '',
        section: formData.section || '',
        mat: formData.mat || '',
        shiftType: selectedShift,
        timestamp: new Date().toISOString(),
        recordedBy: user.name || user.username
      };

      const today = new Date().toISOString().split('T')[0];
      const logKey = `consumption_log_${today}`;
      const updatedLog = [...consumptionLog, newEntry];

      localStorage.setItem(logKey, JSON.stringify(updatedLog));
      setConsumptionLog(updatedLog);

      // Reset form fields
      setFormData({
        QX: '',
        apn: '',
        pieceId: '',
        quantity: '',
        AC: '',
        operatorName: '',
        id: '',
        job: '',
        section: '',
        mat: ''
      });
      setApnSearch('');
      setShowApnDropdown(false);
      showNotification(`Consumption recorded successfully. Stock updated: ${currentStock} → ${newStock}`, 'success');

      // Note: No need to refetch all pieces - we updated the state directly above

    } catch (error) {
      console.error('Error processing consumption:', error);
      showNotification('Error processing consumption: ' + (error.message || error), 'error');
    }
  };

  const handleDelete = (entryId) => {
    const updatedLog = consumptionLog.filter(entry => entry.id !== entryId);
    const today = new Date().toISOString().split('T')[0];
    const logKey = `consumption_log_${today}`;
    
    localStorage.setItem(logKey, JSON.stringify(updatedLog));
    setConsumptionLog(updatedLog);
    showNotification('Entry deleted', 'success');
  };

  console.log('Rendering ConsumptionTracking, loading:', loading);

  // Show loading or redirecting message for non-supervisors
  if (userRole !== 'supervisor') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="consumption-container">
          <div className="consumption-header">
            <div className="header-left">
              <h1>Redirecting...</h1>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="consumption-container">
          <div className="consumption-header">
            <div className="header-left">
              <h1>Loading Consumption Tracking...</h1>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="consumption-container">
        <div className="consumption-header">
          <div className="header-left">
            <h1>Warehouse Inventory Management</h1>
            <p>Inventory tracking and management system</p>
          </div>
          <div className="header-right">
            <p className="warehouse-name">Magasin Pièces De Rechange</p>
            
            <div className="header-info-card">
              <div className="info-row">
                <span className="info-label">Storekeeper:</span>
                <input
                  type="text"
                  className="editable-field"
                  value={storekeeperName}
                  onChange={handleStorekeeperChange}
                  placeholder="Enter name..."
                />
              </div>
              
              <div className="shift-selection-container">
                <span className="shift-selection-label">Select Shift:</span>
                <div className="shift-selection-bar">
                  <button
                    className={`shift-option ${selectedShift === 'Night' ? 'active' : ''}`}
                    onClick={() => handleShiftSelection('Night')}
                    disabled={isShiftActive}
                  >
                    Night
                  </button>
                  <button
                    className={`shift-option ${selectedShift === 'Morning' ? 'active' : ''}`}
                    onClick={() => handleShiftSelection('Morning')}
                    disabled={isShiftActive}
                  >
                    Morning
                  </button>
                  <button
                    className={`shift-option ${selectedShift === 'Evening' ? 'active' : ''}`}
                    onClick={() => handleShiftSelection('Evening')}
                    disabled={isShiftActive}
                  >
                    Evening
                  </button>
                </div>
              </div>

              <div className="info-row">
                <span className="info-label">Shift Status:</span>
                <span className="info-text" style={{ color: isShiftActive ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                  {isShiftActive ? `Active (${selectedShift})` : 'Inactive'}
                </span>
              </div>
              {shiftStartTime && (
                <div className="info-row">
                  <span className="info-label">Shift Start:</span>
                  <span className="info-text">
                    {shiftStartTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {shiftEndTime && (
                <div className="info-row">
                  <span className="info-label">Shift End:</span>
                  <span className="info-text">
                    {shiftEndTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Date:</span>
                <span className="info-text">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/search')} 
              className="btn-back"
            >
              ← Back to Search
            </button>
          </div>
        </div>

        <div className="form-section">
          <h3>Record Consumption</h3>
          <form onSubmit={handleSubmit}>
            <table className="form-table">
              <thead>
                <tr>
                  <th>APN</th>
                  <th>qté</th>
                  <th>AC</th>
                  <th>Recipient</th>
                  <th>ID Job</th>
                  <th>Section</th>
                  <th>Material</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ position: 'relative' }} className="apn-search-container">
                    <input
                      type="text"
                      name="apn"
                      value={formData.apn}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Search APN..."
                      required
                    />
                    {showApnDropdown && filteredPieces.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                      }}>
                        {filteredPieces.map(piece => (
                          <div
                            key={piece.id}
                            onClick={() => handleApnSelect(piece.APN || piece.name)}
                            style={{
                              padding: '10px',
                              cursor: 'pointer',
                              color: 'white',
                              borderBottom: '1px solid rgba(255,255,255,0.1)',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            <div style={{ fontWeight: 'bold' }}>{piece.APN || piece.name}</div>
                            <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.7)' }}>
                              {piece['Parts Holder'] || piece.description || 'No description'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="form-input"
                      min="1"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="AC"
                      value={formData.AC}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="operatorName"
                      value={formData.operatorName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Recipient name"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="job"
                      value={formData.job}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="mat"
                      value={formData.mat}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </td>
                  <td>
                    <button type="submit" className="btn btn-primary">
                      Record
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </form>
        </div>

        <div className="log-table">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e1e1e1' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>Today's Consumption Log</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {!isShiftActive ? (
                <button
                  className="btn btn-primary"
                  onClick={handleStartShift}
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  Start Shift
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={handleEndShift}
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  End Shift
                </button>
              )}
              <button
                className="btn"
                onClick={handleDownloadReport}
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                Download Report
              </button>
            </div>
          </div>
          {consumptionLog.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Shift</th>
                  <th>APN</th>
                  <th>qté</th>
                  <th>AC</th>
                  <th>Recipient</th>
                  <th>ID Job</th>
                  <th>Section</th>
                  <th>Material</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consumptionLog.map(entry => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        fontWeight: '600',
                        background: entry.shiftType === 'Night' ? '#34495e' : 
                                   entry.shiftType === 'Morning' ? '#f39c12' : 
                                   entry.shiftType === 'Evening' ? '#e67e22' : '#95a5a6',
                        color: 'white'
                      }}>
                        {entry.shiftType || 'N/A'}
                      </span>
                    </td>
                    <td>{entry.apn}</td>
                    <td>{entry.quantity}</td>
                    <td>{entry.AC || '-'}</td>
                    <td>{entry.operatorName}</td>
                    <td>{entry.job || '-'}</td>
                    <td>{entry.section || '-'}</td>
                    <td>{entry.mat || '-'}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(entry.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">
              <p>No consumption entries recorded today</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ConsumptionTracking;
