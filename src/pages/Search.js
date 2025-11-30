import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Services and Components
import dataManager from '../services/DataManager';
import ImageZoomModal from '../components/ImageZoomModal';
import Notification from '../components/Notification';

// Utils
import { isZeroStock, formatStockDisplay } from '../utils/helpers';

// Styles
import '../styles/App.css';
import '../styles/corporate.css';

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

/* === Page Layout === */
.search-container {
  padding: 10px 0;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeIn 1s ease;
}

/* === Pieces Grid === */
.pieces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

/* === Pieces List === */
.pieces-list {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: hidden;
  margin-top: 15px;
}

.pieces-list table {
  width: 100%;
  border-collapse: collapse;
}

.pieces-list th,
.pieces-list td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.pieces-list th {
  background: rgba(0, 0, 0, 0.5);
  font-weight: 600;
  color: white;
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.8);
}

.pieces-list td {
  color: white;
}

.pieces-list img {
  border-radius: 4px;
  object-fit: cover;
}

.pieces-list .no-image {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

/* === Title === */
.page-title {
  background: linear-gradient(90deg, #007bff, #00aaff);
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  font-weight: 900;
  letter-spacing: 1px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(88, 22, 22, 0.69);
  font-size: 2.5rem;
}

/* === Page Header === */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* === Header Buttons === */
.header-buttons .btn {
  background: linear-gradient(90deg, #cc6600, #005588);
  border: none;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
  padding: 20px 30px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 102, 153, 0.6), 0 0 15px rgba(204, 102, 0, 0.5);
}

.header-buttons .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(255, 94, 0, 1), 0 0 25px rgba(204, 102, 0, 0.7);
}

/* === Filter Groups === */
.filter-group {
  margin-bottom: 10px;
}

.filter-group label {
  display: block;
  margin-bottom: 5px;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
}

/* === Inputs and Selects === */
.search-input,
.search-select {
  width: 95%;
  padding: 8px;
  border: 2px solid rgba(255,255,255,0.5);
  border-radius: 8px;
  background: rgba(255,255,255,0.2);
  color: black;
  outline: none;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  height: 35px;
  box-sizing: border-box;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* === Clear Buttons === */
.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background-color: #6c757d;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background-color: #868e96;
  transform: translateY(-50%) translateY(-1px);
}

.search-input:focus,
.search-select:focus {
  border-color: #ff6a07ff;
  box-shadow: 0 0 10px rgba(255, 82, 2, 0.71);
}

/* === Checkboxes === */
.filter-group input[type="checkbox"] + span {
  font-size: 0.9rem;
}

/* === Select Placeholder and Options === */
.search-select option[value=""] {
  color: black;
}

.search-select option {
  color: black;
}

/* === Input Placeholders === */
.search-input::placeholder {
  color: black;
}

/* === Buttons === */
.btn {
  background: linear-gradient(90deg, #cc6600, #005588);
  border: none;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  padding: 20px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(243, 97, 0, 0.6), 0 0 15px rgba(204, 102, 0, 0.5);
  margin: 3px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 102, 153, 0.8), 0 0 25px rgba(204, 102, 0, 0.7);
}

.btn-sm {
  font-size: 0.9rem;
  padding: 12px 16px;
}

/* === Piece Cards === */
.piece-card {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  color: white;
  position: relative;
  display: flex; /* Added for footer alignment */
  flex-direction: column; /* Added for footer alignment */
}

.piece-info {
  margin-top: 10px;
  flex-grow: 1; /* Added for footer alignment */
}

.piece-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.7);
}

.piece-card-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: white;
  text-shadow: 0 0 1px rgba(255,255,255,0.8);
}

.piece-info-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.piece-info-item:last-child {
  border-bottom: none;
}

.piece-info-item span {
  font-weight: 600;
  color: white;
  font-size: 1rem;
  text-shadow: 0 0 1px rgba(255,255,255,0.8);
}

/* === No Data === */
.no-data {
  background: rgba(173, 216, 230, 0.2);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
}

/* === Loading and Error === */
.corporate-loading,
.corporate-error {
  color: white;
  text-align: center;
  padding: 20px;
}

/* === Fade In Animation === */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === Combobox Dropdown === */
.combobox-container {
  position: relative;
}

.combobox-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.8);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.combobox-item {
  padding: 8px;
  cursor: pointer;
  color: white;
}

.combobox-item:hover {
  background: rgba(255,255,255,0.1);
}

/* === Mobile Responsiveness === */
@media (max-width: 480px) {
  .search-container {
    padding: 10px;
    width: 95%;
  }
  .page-title {
    font-size: 2rem;
  }
  .search-input,
  .search-select,
  .btn {
    font-size: 1rem;
    padding: 10px;
  }
  .piece-card {
    padding: 12px;
  }
  .filter-controls {
    grid-template-columns: 1fr;
  }
}
`;

function Search() {
  const [pieces, setPieces] = useState([]);
  const [filteredPieces, setFilteredPieces] = useState([]);
  const [pieceImages, setPieceImages] = useState({});
  const [partInfo, setPartInfo] = useState('');
  const [machineName, setMachineName] = useState('');
  const [location, setLocation] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPieces, setTotalPieces] = useState(0);
  const pageSize = 20;

  const [machineSuggestions, setMachineSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [partInfoSuggestions, setPartInfoSuggestions] = useState([]);
  const [machineFilteredSuggestions, setMachineFilteredSuggestions] = useState([]);
  const [locationFilteredSuggestions, setLocationFilteredSuggestions] = useState([]);
  const [partInfoFilteredSuggestions, setPartInfoFilteredSuggestions] = useState([]);
  const [machineShowDropdown, setMachineShowDropdown] = useState(false);
  const [locationShowDropdown, setLocationShowDropdown] = useState(false);
  const [partInfoShowDropdown, setPartInfoShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showWarningDropdown, setShowWarningDropdown] = useState(false);
  const [selectedUnderStockAPN, setSelectedUnderStockAPN] = useState('');
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const locationHook = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;

  // Helper function to safely render values
  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      // Check if it's an error object
      if (value && typeof value === 'object' && 'error' in value) return 'Error';
      return JSON.stringify(value);
    }
    return value;
  };

  const loadPieceImages = useCallback(async (piecesArray) => {
    const imageMap = {};
    const uploadedImagesJSON = localStorage.getItem('uploaded_images');
    let uploadedImages = {};
    if (uploadedImagesJSON) {
      try {
        uploadedImages = JSON.parse(uploadedImagesJSON);
      } catch (e) {
        console.error('Failed to parse uploaded images from localStorage', e);
      }
    }

    for (const piece of piecesArray) {
      if (piece.ImagePath) {
        imageMap[piece.id] = piece.ImagePath;
      } else if (piece.APN) {
        const matchingKey = Object.keys(uploadedImages).find(filename => {
          const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
          return nameWithoutExt === piece.APN;
        });
        if (matchingKey) {
          imageMap[piece.id] = uploadedImages[matchingKey];
        }
      }
    }
    setPieceImages(imageMap);
  }, []);

  const loadPieces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Skip Firebase init if already done in App.js
      const allPieces = typeof dataManager.getAllPieces === 'function'
        ? await dataManager.getAllPieces()
        : JSON.parse(localStorage.getItem('pieces') || '[]');

      setPieces(allPieces);
      setTotalPieces(allPieces.length);
      loadPieceImages(allPieces);

      // Optimize suggestions generation - limit to first 1000 pieces for performance
      const samplePieces = allPieces.slice(0, 1000);
      const uniqueMachines = [...new Set(samplePieces.map(p => p.Equipment).filter(Boolean))];
      setMachineSuggestions(uniqueMachines);
      const uniqueLocations = [...new Set(samplePieces.map(p => p.ProjectLine).filter(Boolean))];
      setLocationSuggestions(uniqueLocations);

      // Optimize searchable suggestions - limit and deduplicate more efficiently
      const allSearchable = new Set();
      samplePieces.forEach(p => {
        if (p.APN) allSearchable.add(p.APN.toString());
        if (p.SPN) allSearchable.add(p.SPN.toString());
        if (p['Parts Holder']) allSearchable.add(p['Parts Holder'].toString());
        if (p['Holder Name'] && Array.isArray(p['Holder Name'])) p['Holder Name'].forEach(name => allSearchable.add(name));
        if (p['Connecteur DPN']) allSearchable.add(p['Connecteur DPN'].toString());
        if (p['Serial Number Holder']) allSearchable.add(p['Serial Number Holder'].toString());
        if (p.Equipment) allSearchable.add(p.Equipment.toString());
        if (p.Section) allSearchable.add(p.Section.toString());
        if (p.ProjectLine) allSearchable.add(p.ProjectLine.toString());
        if (p.Description) allSearchable.add(p.Description.toString());
        if (p['Storage Location']) allSearchable.add(p['Storage Location'].toString());
        if (p['MRP Type']) allSearchable.add(p['MRP Type'].toString());
        if (p.Suppliers) allSearchable.add(p.Suppliers.toString());
        if (p['Unit Price']) allSearchable.add(p['Unit Price'].toString());
        if (p['Unrestricted Stock']) allSearchable.add(p['Unrestricted Stock'].toString());
        if (p.Min) allSearchable.add(p.Min.toString());
        if (p.Max) allSearchable.add(p.Max.toString());
        if (p['In Transit']) allSearchable.add(p['In Transit'].toString());
        if (p['More Information']) allSearchable.add(p['More Information'].toString());
      });
      setPartInfoSuggestions([...allSearchable]);

      // Check for zero stock items and show notification for supervisors
      if (userRole === 'supervisor') {
        const zeroStockItems = allPieces.filter(p => {
          const stock = parseFloat(p['Unrestricted Stock']);
          return isZeroStock(stock);
        });

        if (zeroStockItems.length > 0) {
          setNotification({
            message: `⚠️ CRITICAL: ${zeroStockItems.length} item(s) have ZERO stock!`,
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Failed to load pieces:', error);
      setError('Failed to load pieces: ' + error.message);
      const savedPieces = JSON.parse(localStorage.getItem('pieces') || '[]');
      setPieces(savedPieces);
      setTotalPieces(savedPieces.length);
      loadPieceImages(savedPieces);
    } finally {
      setLoading(false);
    }
  }, [loadPieceImages, userRole]);



  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role) navigate('/');
    else {
      loadPieces();
      const urlParams = new URLSearchParams(locationHook.search);
      const partInfoParam = urlParams.get('partInfo');
      if (partInfoParam) {
        setPartInfo(partInfoParam);
      }
    }
  }, [navigate, loadPieces, locationHook.search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const partInfoInput = document.querySelector('input[placeholder*="part info"]') || 
                             document.querySelector('input[placeholder*="APN"]');
        if (partInfoInput) partInfoInput.focus();
      } 
      else if (!isTyping) {
        if (e.key === 'ArrowLeft' && currentPage > 1) {
          e.preventDefault();
          setCurrentPage(currentPage - 1);
        } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
          e.preventDefault();
          setCurrentPage(currentPage + 1);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  const [allFilteredPieces, setAllFilteredPieces] = useState([]);

  useEffect(() => {
    let filtered = pieces;
    if (partInfo.trim()) {
      const terms = partInfo.toLowerCase().split(',').map(t => t.trim()).filter(t => t);
      // Define searchable fields for all roles
      const searchableFields = ['APN', 'SPN', 'Holder Name', 'Parts Holder', 'Equipment', 'ProjectLine', 'Section', 'Description', 'Storage Location', 'Suppliers', 'Unit Price', 'Unrestricted Stock', 'Min', 'Max', 'In Transit', 'More Information'];
      filtered = filtered.filter(p =>
        terms.every(term =>
          searchableFields.some(field => {
            const val = p[field];
            if (!val) return false;
            if (Array.isArray(val)) {
              return val.some(item => item && item.toString().toLowerCase().includes(term));
            }
            return val.toString().toLowerCase().includes(term);
          })
        )
      );
    }
    if (machineName.trim()) {
      const term = machineName.toLowerCase();
      filtered = filtered.filter(p => p.Equipment?.toLowerCase().includes(term));
    }
    if (location.trim()) {
      const term = location.toLowerCase();
      filtered = filtered.filter(p => p.ProjectLine?.toLowerCase().includes(term));
    }
    if (maintenanceType.trim()) {
      const term = maintenanceType.toLowerCase();
      filtered = filtered.filter(p => p.Section?.toLowerCase().includes(term));
    }

    // Apply selected under-stock APN filter for supervisor role
    if (userRole === 'supervisor' && selectedUnderStockAPN) {
      filtered = filtered.filter(p => p.APN === selectedUnderStockAPN);
    }

    // Sort filtered pieces by APN alphabetically
    filtered.sort((a, b) => {
      const aApn = a.APN?.toString().toLowerCase() || '';
      const bApn = b.APN?.toString().toLowerCase() || '';
      if (aApn < bApn) return -1;
      if (aApn > bApn) return 1;
      return 0;
    });

    setAllFilteredPieces(filtered);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    setTotalPieces(filtered.length);
    setCurrentPage(1);
  }, [partInfo, machineName, location, maintenanceType, pieces, pageSize, userRole, selectedUnderStockAPN]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFiltered = allFilteredPieces.slice(startIndex, endIndex);
    setFilteredPieces(paginatedFiltered);
  }, [allFilteredPieces, currentPage, pageSize]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="search-container">
          <div className="page-header">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h1 className="page-title">Search Pieces</h1>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleBack} className="btn-secondary">←</button>
                <button className="btn-secondary" onClick={() => {
                  setPartInfo('');
                  setMachineName('');
                  setLocation('');
                  setMaintenanceType('');
                  setPartInfoFilteredSuggestions([]);
                  setMachineFilteredSuggestions([]);
                  setLocationFilteredSuggestions([]);
                  setPartInfoShowDropdown(false);
                  setMachineShowDropdown(false);
                  setLocationShowDropdown(false);
                }}>⟳</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'white', fontSize: '1.2rem' }}>Role: {userRole}</span>
                <button onClick={handleLogout} className="btn-secondary">Logout</button>
              </div>
              {userRole === 'supervisor' && (
                <div style={{ position: 'relative', marginLeft: '-80px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/consumption-tracking')}
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: 'transparent',
                      border: '2px solid #fff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                    title="Consumption Tracking"
                  >
                    📄
                  </button>
                  <button
                    onClick={() => setShowWarningDropdown(!showWarningDropdown)}
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: '#ff4444',
                      border: '2px solid #fff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                    title="Stock Warnings"
                  >
                    ⚠️
                  </button>
                  {showWarningDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '35px',
                      right: '0',
                      background: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      minWidth: '200px',
                      zIndex: 1000,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}>
                      <h4 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1rem' }}>
                        Stock Warnings: ({pieces.filter(p => {
                          const stock = parseFloat(p['Unrestricted Stock']);
                          const min = parseFloat(p.Min);
                          return !isNaN(stock) && !isNaN(min) && stock < min;
                        }).length})
                      </h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {/* Zero Stock Items - Priority */}
                        {pieces.filter(p => isZeroStock(parseFloat(p['Unrestricted Stock']))).length > 0 && (
                          <>
                            <div style={{ 
                              color: '#FF0000', 
                              fontWeight: 'bold', 
                              fontSize: '0.85rem', 
                              marginBottom: '5px',
                              padding: '5px',
                              background: 'rgba(255, 0, 0, 0.1)',
                              borderRadius: '4px'
                            }}>
                              🚨 ZERO STOCK ({pieces.filter(p => isZeroStock(parseFloat(p['Unrestricted Stock']))).length})
                            </div>
                            {pieces.filter(p => isZeroStock(parseFloat(p['Unrestricted Stock']))).map(piece => (
                              <button
                                key={piece.id || piece.APN}
                                onClick={() => {
                                  setSelectedUnderStockAPN(piece.APN);
                                  setPartInfo(piece.APN);
                                  setShowWarningDropdown(false);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '8px',
                                  marginBottom: '5px',
                                  background: 'linear-gradient(90deg, #FF0000, #CC0000)',
                                  color: 'white',
                                  border: '2px solid #FF0000',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  textAlign: 'left',
                                  fontWeight: 'bold',
                                  animation: 'pulse 2s infinite'
                                }}
                              >
                                {piece.APN} !!!
                              </button>
                            ))}
                          </>
                        )}
                        
                        {/* Under Stock Items */}
                        {pieces.filter(p => {
                          const stock = parseFloat(p['Unrestricted Stock']);
                          const min = parseFloat(p.Min);
                          return !isNaN(stock) && !isNaN(min) && stock < min && !isZeroStock(stock);
                        }).length > 0 && (
                          <>
                            <div style={{ 
                              color: '#ff4444', 
                              fontWeight: 'bold', 
                              fontSize: '0.85rem', 
                              marginTop: '10px',
                              marginBottom: '5px',
                              padding: '5px'
                            }}>
                              ⚠️ UNDER STOCK ({pieces.filter(p => {
                                const stock = parseFloat(p['Unrestricted Stock']);
                                const min = parseFloat(p.Min);
                                return !isNaN(stock) && !isNaN(min) && stock < min && !isZeroStock(stock);
                              }).length})
                            </div>
                            {pieces.filter(p => {
                              const stock = parseFloat(p['Unrestricted Stock']);
                              const min = parseFloat(p.Min);
                              return !isNaN(stock) && !isNaN(min) && stock < min && !isZeroStock(stock);
                            }).map(piece => (
                              <button
                                key={piece.id || piece.APN}
                                onClick={() => {
                                  setSelectedUnderStockAPN(piece.APN);
                                  setPartInfo(piece.APN);
                                  setShowWarningDropdown(false);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '8px',
                                  marginBottom: '5px',
                                  background: 'linear-gradient(90deg, #ff4444, #cc0000)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  textAlign: 'left'
                                }}
                              >
                                {piece.APN}
                              </button>
                            ))}
                          </>
                        )}
                        
                        {pieces.filter(p => {
                          const stock = parseFloat(p['Unrestricted Stock']);
                          const min = parseFloat(p.Min);
                          return !isNaN(stock) && !isNaN(min) && stock < min;
                        }).length === 0 && (
                          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0', fontSize: '0.9rem' }}>No stock warnings</p>
                        )}
                      </div>
                      <style>{`
                        @keyframes pulse {
                          0%, 100% { opacity: 1; }
                          50% { opacity: 0.7; }
                        }
                      `}</style>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="filter-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px', marginBottom: '15px' }}>
            <div className="filter-group">
              <label>Part Information</label>
              <div className="combobox-container">
                <input
                  type="text"
                  placeholder="Enter part info..."
                  value={partInfo}
                  onChange={(e) => {
                    setPartInfo(e.target.value);
                    const filtered = partInfoSuggestions.filter(s =>
                      typeof s === 'string' && s.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    setPartInfoFilteredSuggestions(filtered);
                    setPartInfoShowDropdown(filtered.length > 0);
                  }}
                  onFocus={() => setPartInfoShowDropdown(true)}
                  onBlur={() => setTimeout(() => setPartInfoShowDropdown(false), 200)}
                  className="search-input"
                />
                {partInfoShowDropdown && partInfoFilteredSuggestions.length > 0 && (
                  <div className="combobox-dropdown">
                    {partInfoFilteredSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="combobox-item"
                        onClick={() => {
                          setPartInfo(suggestion);
                          setPartInfoShowDropdown(false);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="filter-group">
              <label>Equipment</label>
              <div className="combobox-container">
                <input
                  type="text"
                  placeholder="Enter machine name..."
                  value={machineName}
                  onChange={(e) => {
                    setMachineName(e.target.value);
                    const filtered = machineSuggestions.filter(s => s.toLowerCase().includes(e.target.value.toLowerCase()));
                    setMachineFilteredSuggestions(filtered);
                    setMachineShowDropdown(filtered.length > 0);
                  }}
                  onFocus={() => setMachineShowDropdown(true)}
                  onBlur={() => setTimeout(() => setMachineShowDropdown(false), 200)}
                  className="search-input"
                />
                {machineShowDropdown && machineFilteredSuggestions.length > 0 && (
                  <div className="combobox-dropdown">
                    {machineFilteredSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="combobox-item"
                        onClick={() => {
                          setMachineName(suggestion);
                          setMachineShowDropdown(false);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="filter-group">
              <label>Project Line</label>
              <div className="combobox-container">
                <input
                  type="text"
                  placeholder="Enter location..."
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    const filtered = locationSuggestions.filter(s => s.toLowerCase().includes(e.target.value.toLowerCase()));
                    setLocationFilteredSuggestions(filtered);
                    setLocationShowDropdown(filtered.length > 0);
                  }}
                  onFocus={() => setLocationShowDropdown(true)}
                  onBlur={() => setTimeout(() => setLocationShowDropdown(false), 200)}
                  className="search-input"
                />
                {locationShowDropdown && locationFilteredSuggestions.length > 0 && (
                  <div className="combobox-dropdown">
                    {locationFilteredSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="combobox-item"
                        onClick={() => {
                          setLocation(suggestion);
                          setLocationShowDropdown(false);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="filter-group">
              <label htmlFor="maintenance-type-select">Section</label>
            <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="search-select"
                title="Select maintenance type"
                aria-label="Select maintenance type"
                id="maintenance-type-select"
                name="maintenanceType"
              >
                <option value="">All</option>
                <option value="final assembly">Final assembly</option>
                <option value="die center">Die Center</option>
                <option value="cutting">Cutting</option>
              </select>
            </div>
          </div>

          {loading && <div className="corporate-loading">Loading pieces...</div>}
          {error && <div className="corporate-error">{error}</div>}

          {!loading && !error && (
            <>

              {filteredPieces.length === 0 ? (
                <div className="no-data">
                  {pieces.length === 0 ? (
                    <div>
                      <h3>No Pieces Available</h3>
                      <p>The admin hasn't added any pieces yet.</p>
                    </div>
                  ) : (
                    <div>
                      <h3>No Pieces Found</h3>
                      <p>Try adjusting your search terms or filters.</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '15px', color: 'white' }}>
                    Showing {filteredPieces.length} of {totalPieces} pieces (Page {currentPage} of {totalPages})
                  </div>

                  <div className="pieces-grid">
                    {filteredPieces.map((piece) => {
                      if (userRole === 'technician') {
                        const pieceInfoItems = [
                          { label: 'Parts Holder', value: piece['Parts Holder'] },
                          { label: 'SPN', value: piece.SPN },
                          { label: 'Equipment', value: piece.Equipment },
                          { label: 'Project Line', value: piece.ProjectLine }, // Your Excel has this
                          { label: 'Section', value: piece.Section } // Your Excel has this
                        ].filter(item => item.value && item.value !== '');
                        return (
                          <div key={piece.id || piece.APN} className="piece-card" onClick={() => navigate(`/piece/${piece.APN}`)}>
                            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white', textShadow: '0 0 5px rgba(255,255,255,0.5)', marginBottom: '15px' }}>
                              {piece.APN}
                            </div>
                            <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '15px' }}>
                              {(pieceImages[piece.id] || piece.ImagePath) ? (
                                <img src={pieceImages[piece.id] || piece.ImagePath} alt={piece.APN} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                              ) : (
                                <span style={{color: 'rgba(255,255,255,0.5)'}}>No Img</span>
                              )}
                            </div>
                            <div className="piece-info">
                              {pieceInfoItems.map((item, idx) => (
                                <div key={idx} className="piece-info-item">
                                  <span>{item.label}:</span>
                                  <span style={{
                                    color: item.label === 'Unrestricted Stock' && isZeroStock(parseFloat(item.value)) ? '#FF0000' : 'inherit',
                                    fontWeight: item.label === 'Unrestricted Stock' && isZeroStock(parseFloat(item.value)) ? 'bold' : 'inherit'
                                  }}>
                                    {item.label === 'Holder Name' ? (
                                      Array.isArray(item.value) ? 
                                        item.value.map((val, idx2) => (
                                          <span key={idx2}>
                                            <span style={{ cursor: 'pointer', color: '#007bff' }} onClick={(e) => { e.stopPropagation(); navigate(`/search?partInfo=${encodeURIComponent(val)}`); }}>
                                              {val}
                                            </span>
                                            {idx2 < item.value.length - 1 ? ', ' : ''}
                                          </span>
                                        )) : 
                                        <span style={{ cursor: 'pointer', color: '#007bff' }} onClick={(e) => { e.stopPropagation(); navigate(`/search?partInfo=${encodeURIComponent(item.value)}`); }}>
                                          {renderValue(item.value)}
                                        </span>
                                    ) : item.label === 'Unrestricted Stock' ? (
                                      formatStockDisplay(item.value)
                                    ) : (
                                      renderValue(item.value)
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      else if (userRole === 'supervisor') {
                        const allowedFields = ['APN', 'SPN', 'Holder Name', 'Connecteur DPN', 'Parts Holder', 'Serial Number Holder', 'Equipment', 'Section', 'Project Line', 'Description', 'Storage Location', 'MRP TYPE', 'Suppliers', 'Unit Price', 'Unrestricted Stock', 'Min', 'Max', 'In Transit', 'More Information', 'Picture'];
                        const stock = parseFloat(piece['Unrestricted Stock']);
                        const min = parseFloat(piece.Min);
                        let stockColor = 'gray'; // Default for invalid data
                        if (!isNaN(stock) && !isNaN(min)) {
                          if (isZeroStock(stock)) stockColor = '#FF0000'; // Bright red for zero stock
                          else if (stock > min) stockColor = 'green';
                          else if (stock === min) stockColor = 'orange';
                          else if (stock < min) stockColor = 'red';
                        }
                        const pieceInfoItems = [
                          { label: 'SPN', value: piece.SPN },
                          { label: 'Parts Holder', value: piece['Parts Holder'] },
                          { label: 'Description', value: piece.Description }
                        ].filter(item => allowedFields.includes(item.label) && item.value);
                        return (
                          <div key={piece.id || piece.APN} className="piece-card" onClick={() => navigate(`/piece/${piece.APN}`)} style={{ position: 'relative' }}>
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              width: '12px',
                              height: '12px',
                              backgroundColor: stockColor,
                              borderRadius: '50%',
                              border: '1px solid rgba(255,255,255,0.5)',
                              zIndex: 10,
                              animation: isZeroStock(stock) ? 'pulse 2s infinite' : 'none',
                              boxShadow: isZeroStock(stock) ? '0 0 10px #FF0000' : 'none'
                            }}></div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white', textShadow: '0 0 5px rgba(255,255,255,0.5)', marginBottom: '15px' }}>
                              {renderValue(piece.APN)}
                            </div>
                            <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '15px' }}>
                              {(pieceImages[piece.id] || piece.ImagePath) ? (
                                <img src={pieceImages[piece.id] || piece.ImagePath} alt={piece.APN} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                              ) : (
                                <span style={{color: 'rgba(255,255,255,0.5)'}}>No Img</span>
                              )}
                            </div>
                            <div className="piece-info">
                              {pieceInfoItems.map((item, idx) => (
                                <div key={idx} className="piece-info-item">
                                  <span>{item.label}:</span>
                                  <span>{item.label === 'Holder Name' ? (Array.isArray(item.value) ? item.value.map((val, idx2) => <span key={idx2}><span style={{ cursor: 'pointer', color: '#007bff' }} onClick={(e) => { e.stopPropagation(); navigate(`/search?partInfo=${encodeURIComponent(val)}`); }}>{val}</span>{idx2 < item.value.length - 1 ? ', ' : ''}</span>) : <span style={{ cursor: 'pointer', color: '#007bff' }} onClick={(e) => { e.stopPropagation(); navigate(`/search?partInfo=${encodeURIComponent(item.value)}`); }}>{renderValue(item.value)}</span>) : renderValue(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      else {
                        const allowedFields = ['APN', 'SPN', 'Holder Name', 'Connecteur DPN', 'Parts Holder', 'Serial Number Holder', 'Equipment', 'Section', 'Project Line', 'Description', 'Storage Location', 'MRP TYPE', 'Suppliers', 'Unit Price', 'Unrestricted Stock', 'Min', 'Max', 'In Transit', 'More Information', 'Picture'];
                        const pieceInfoItems = [
                          { label: 'Parts Holder', value: piece['Parts Holder'] },
                          { label: 'SPN', value: piece.SPN },
                          { label: 'Equipment', value: piece.Equipment },
                          { label: 'Project Line', value: piece.ProjectLine },
                          { label: 'Unrestricted Stock', value: piece['Unrestricted Stock'] }
                        ].filter(item => allowedFields.includes(item.label) && item.value);
                        return (
                            <div key={piece.id || piece.APN} className="piece-card" onClick={() => navigate(`/piece/${piece.APN}`)}>
                                <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white', textShadow: '0 0 5px rgba(255,255,255,0.5)', marginBottom: '15px' }}>
                                    {piece.APN}
                                </div>
                                <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '15px' }}>
                                    {(pieceImages[piece.id] || piece.ImagePath) ? (
                                    <img src={pieceImages[piece.id] || piece.ImagePath} alt={piece.APN} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                    ) : (
                                    <span style={{color: 'rgba(255,255,255,0.5)'}}>No Img</span>
                                    )}
                                </div>
                                <div className="piece-info">
                                    {pieceInfoItems.map((item, idx) => (
                                      <div key={idx} className="piece-info-item">
                                        <span>{item.label}:</span>
                                        <span>{item.label === 'Holder Name' ? (Array.isArray(item.value) ? item.value.map((val, idx2) => <span key={idx2}><span style={{ cursor: 'pointer', color: '#007bff' }} onClick={(e) => { e.stopPropagation(); navigate(`/search?partInfo=${encodeURIComponent(val)}`); }}>{val}</span>{idx2 < item.value.length - 1 ? ', ' : ''}</span>) : <span style={{ cursor: 'pointer', color: '#007bff' }} onClick={(e) => { e.stopPropagation(); navigate(`/search?partInfo=${encodeURIComponent(item.value)}`); }}>{renderValue(item.value)}</span>) : renderValue(item.value)}</span>
                                      </div>
                                    ))}
                                </div>
                            </div>
                        );
                      }
                    })}
                  </div>

                  {/* FIX: Added missing pagination controls */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '10px' }}>
                      <button 
                        className="btn btn-sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {currentPage} of {totalPages}</span>
                      <button 
                        className="btn btn-sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {showZoomModal && (
            <ImageZoomModal isOpen={showZoomModal} imageSrc="" imageAlt="" onClose={() => setShowZoomModal(false)} />
          )}

          {/* Notification for zero stock items */}
          {notification && (
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(null)}
                duration={10000}
              />
            </div>
          )}
      </div>
    </>
  );
}

export default Search;
