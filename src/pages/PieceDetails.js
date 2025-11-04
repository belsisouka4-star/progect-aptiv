import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import ImageZoomModal from '../components/ImageZoomModal';

// Services and Utils
import dataManager from '../services/DataManager';

// Styles
import '../styles/corporate.css';

function PieceDetails() {
  const { id } = useParams();
  const [piece, setPiece] = useState(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImageSrc, setZoomImageSrc] = useState('');
  const [zoomImageAlt, setZoomImageAlt] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role) {
      navigate('/');
      return;
    }

    // Redirect warehouse users back to search
    if (user.role === 'warehouse') {
      navigate('/search');
      return;
    }

    const loadPiece = async () => {
      let foundPiece = null;
      try {
        if (typeof dataManager.init === 'function') await dataManager.init();

        if (typeof dataManager.getAllPieces === 'function') {
          const allPieces = await dataManager.getAllPieces();
          foundPiece = allPieces.find(p => p.APN?.toString() === id?.toString());
        }

        if (!foundPiece) {
          const savedPieces = JSON.parse(localStorage.getItem('pieces') || '[]');
          foundPiece = savedPieces.find(p => p.APN?.toString() === id?.toString());
        }

        setPiece(foundPiece || null);

        // Removed unused pieceImages logic
      } catch (err) {
        console.error('Error loading piece:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPiece();
  }, [id, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate('/search');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  if (!piece) return (
    <div className="not-found-container">
      <h2>Piece Not Found</h2>
      <p>A piece with APN "{id}" could not be found.</p>
      <button onClick={() => navigate('/search')} className="back-button">Back to Search</button>
    </div>
  );

  return (
    <div className="piece-details-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Piece Details</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'white', fontSize: '1.2rem' }}>Role: {userRole}</span>
          <button onClick={handleLogout} className="btn-secondary">Logout</button>
        </div>
      </div>

      <button onClick={handleBack} className="back-button">← Back to Search</button>

      <div className="piece-details-card">
        <header className="piece-details-header">
          <div>
            <h1 className="header-title">{piece['Parts Holder'] || "No Name"}</h1>
            <p className="header-subtitle">Piece Details & Specifications</p>
          </div>
          <div className="header-apn-badge">
            <span>APN</span>
            {piece.APN}
          </div>
        </header>

        <main className="main-content-grid">
          <div className="primary-content">
            <section className="details-section">
              <h2 className="section-title">Piece Information</h2>
              <div className="key-info-grid">
                {(() => {
                  let pieceInfoFields = [];
                  if (userRole === 'supervisor') {
                    pieceInfoFields = [
                      { label: 'SPN', value: piece.SPN },
                      { label: 'Holder Name', value: piece['Holder Name'] },
                      { label: 'Connecteur DPN', value: piece['Connecteur DPN'] },
                      { label: 'Parts Holder', value: piece.PartsHolder },
                      { label: 'Serial Number Holder', value: piece['Serial Number Holder'] },
                      { label: 'Equipment', value: piece.Equipment },
                      { label: 'Section', value: piece.Section },
                      { label: 'Project Line', value: piece.ProjectLine },
                      { label: 'Description', value: piece.Description }
                    ];
                  } else if (userRole === 'technician') {
                    pieceInfoFields = [
                      { label: 'SPN', value: piece.SPN },
                      { label: 'Holder Name', value: piece['Holder Name'] },
                      { label: 'Parts Holder', value: piece.PartsHolder },
                      { label: 'Serial Number Holder', value: piece['Serial Number Holder'] },
                      { label: 'Equipment', value: piece.Equipment },
                      { label: 'Section', value: piece.Section },
                      { label: 'Project Line', value: piece.ProjectLine },
                      { label: 'Description', value: piece.Description }
                    ];
                  } else {
                    pieceInfoFields = [
                      { label: 'SPN', value: piece.SPN },
                      { label: 'Holder Name', value: piece['Holder Name'] },
                      { label: 'Parts Holder', value: piece.PartsHolder },
                      { label: 'Serial Number Holder', value: piece['Serial Number Holder'] },
                      { label: 'Equipment', value: piece.Equipment },
                      { label: 'Section', value: piece.Section },
                      { label: 'Project Line', value: piece.ProjectLine },
                      { label: 'Description', value: piece.Description }
                    ];
                  }
                  return pieceInfoFields.filter(info => {
                    // Check if value exists and is not empty
                    if (info.value === null || info.value === undefined || info.value === '') return false;
                    // For arrays, check if it has elements
                    if (Array.isArray(info.value)) return info.value.length > 0;
                    // For objects, check if it's not an error object
                    if (typeof info.value === 'object') return false;
                    // For strings and numbers, check if they exist
                    return true;
                  }).map((info, idx) => (
                    <div key={idx} className="info-card">
                      <span className="info-card-label">{info.label}</span>
                      <p className="info-card-value">
                        {(() => {
                          if (Array.isArray(info.value)) {
                            return info.value.map((val, subIdx) => (
                              <span key={subIdx} style={{ color: '#ff7b00', cursor: 'pointer' }} onClick={() => navigate(`/search?partInfo=${encodeURIComponent(val)}`)}>
                                {val}{subIdx < info.value.length - 1 ? ', ' : ''}
                              </span>
                            ));
                          }
                          if (typeof info.value === 'object') {
                            if (info.value && 'error' in info.value) return 'Error';
                            return JSON.stringify(info.value);
                          }
                          return info.value === '#N/A' ? 'information not available' : info.value;
                        })()}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </section>

            {userRole === 'supervisor' && (
              <section className="details-section">
                <h2 className="section-title">Storage Information</h2>
                <div className="key-info-grid">
                  {(() => {
                    const storageFields = [
                      { label: 'Storage Location', value: piece['Storage Location'] },
                      { label: 'MRP Type', value: piece['MRP Type'] },
                      { label: 'Suppliers', value: piece.Suppliers },
                      { label: 'Unit Price', value: piece['Unit Price'] },
                      { label: 'Unrestricted Stock', value: piece['Unrestricted Stock'] },
                      { label: 'Min', value: piece.Min },
                      { label: 'Max', value: piece.Max },
                      { label: 'In Transit', value: piece['In Transit'] || piece.InTransit }
                    ];
                      return storageFields.filter(info => {
                        if (info.value === null || info.value === undefined || info.value === '') return false;
                        if (Array.isArray(info.value)) return info.value.length > 0;
                        if (typeof info.value === 'object') {
                          // Handle objects - try to extract meaningful string value
                          const objStr = JSON.stringify(info.value);
                          return objStr !== '{}' && objStr !== 'null' && objStr !== 'undefined';
                        }
                        return true;
                      }).map((info, idx) => (
                        <div key={idx} className="info-card">
                          <span className="info-card-label">{info.label}</span>
                          <p className="info-card-value">
                            {(() => {
                              if (Array.isArray(info.value)) return info.value.join(', ');
                              if (typeof info.value === 'object' && info.value !== null) {
                                // Try to extract meaningful string from object
                                if ('error' in info.value) return 'Error';
                                if (typeof info.value === 'string') return info.value;
                                return info.value.name || info.value.value || info.value.text || info.value.toString() || JSON.stringify(info.value);
                              }
                              return info.value === '#N/A' ? 'information not available' : info.value;
                            })()}
                          </p>
                        </div>
                      ));
                  })()}
                </div>
              </section>
            )}
          </div>

          {userRole !== 'warehouse' && (
            <div className="secondary-content">
              <section className="details-section">
                <h2 className="section-title">More Information</h2>
                <div className="more-info-box">
                  {piece['More Information'] || piece.MoreInformation || 'No additional information available.'}
                </div>
              </section>

              {piece.ImagePath && (
                <section className="details-section">
                  <h2 className="section-title">Visual</h2>
                  <div className="image-grid">
                    <div className="image-wrapper" onClick={() => { setZoomImageSrc(piece.ImagePath); setZoomImageAlt(piece['Parts Holder'] || piece.APN); setShowZoomModal(true); }}>
                      <img src={piece.ImagePath} alt={piece['Parts Holder'] || piece.APN} className="image-thumbnail" />
                      <div className="image-overlay">Click to zoom</div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      <ImageZoomModal isOpen={showZoomModal} imageSrc={zoomImageSrc} imageAlt={zoomImageAlt} onClose={() => setShowZoomModal(false)} />

      <style>{`
        :root {
          --theme-orange: #ff7b00;
          --theme-orange-dark: #e65100;
          --background-primary: #1a202c;
          --background-secondary: #2d3748;
          --border-color: #4a5568;
          --text-primary: #f7fafc;
          --text-secondary: #a0aec0;
          --text-placeholder: #718096;
        }

        .piece-details-container { 
          background-color: var(--background-primary);
          color: var(--text-primary);
          padding: 2rem; 
          min-height: 100vh;
          max-width: 1600px; 
          margin: auto; 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .back-button { 
          display: inline-block; 
          margin-bottom: 1.5rem; 
          padding: 10px 20px; 
          background: var(--background-secondary); 
          color: var(--text-primary); 
          border-radius: 50px; 
          text-decoration: none; 
          font-weight: 600; 
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
        }
        .back-button:hover { 
          background: var(--theme-orange);
          color: white;
          border-color: var(--theme-orange-dark);
        }

        .piece-details-card { 
          background: var(--background-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px; 
          box-shadow: 0 8px 32px rgba(0,0,0,0.3); 
          overflow: hidden; 
        }
        
        .piece-details-header { 
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0,0,0,0.2);
          padding: 2.5rem 3rem; 
          border-bottom: 1px solid var(--border-color);
        }
        .header-title { 
          margin: 0; 
          font-size: 2.5rem; 
          font-weight: 700; 
        }
        .header-subtitle { 
          margin: 0.25rem 0 0; 
          font-size: 1.5rem; 
          color: var(--text-secondary);
        }
        .header-apn-badge {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          padding: 0.75rem 1.25rem;
          text-align: center;
          font-weight: 700;
          font-size: 1.5rem;
          line-height: 1.2;
        }
        .header-apn-badge span {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        .main-content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 3rem;
          padding: 3rem;
        }

        .details-section {
          margin-bottom: 2.5rem;
        }
        .section-title { 
          font-size: 1.5rem; 
          font-weight: 600; 
          margin: 0 0 1.5rem 0; 
          padding-bottom: 0.5rem;
          border-bottom: 3px solid var(--theme-orange); 
          color: var(--text-primary);
          display: inline-block;
        }

        .key-info-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
          gap: 1.5rem; 
        }
        .info-card { 
          background: var(--background-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .info-card-label { 
          font-size: 0.85rem; 
          font-weight: 600; 
          color: var(--theme-orange);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }
        .info-card-value { 
          margin: 0; 
          font-size: 1.1rem; 
          font-weight: 500;
          color: var(--text-primary);
          word-wrap: break-word;
        }
        .info-card-link-list a {
            display: block;
            color: var(--text-secondary);
            text-decoration: none;
            font-weight: 600;
            margin-bottom: 4px;
            transition: color 0.2s ease;
        }
        .info-card-link-list a:hover {
            color: var(--theme-orange);
            text-decoration: underline;
        }

        .more-info-box { 
          background: var(--background-primary); 
          padding: 1.25rem; 
          border-radius: 12px; 
          border: 1px solid var(--border-color);
          font-size: 1rem; 
          line-height: 1.6; 
          color: var(--text-secondary);
        }

        .image-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
          gap: 1rem;
        }
        .image-wrapper { 
          cursor: pointer; 
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
        }
        .image-thumbnail { 
          width: 100%; 
          height: 120px; 
          object-fit: cover; 
          display: block;
          transition: transform 0.3s ease;
        }
        .image-overlay {
          position: absolute; inset: 0; background: rgba(0, 0, 0, 0.6);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.3s ease; color: white;
        }
        .image-wrapper:hover {
          transform: translateY(-5px);
          box-shadow: 0 0 15px var(--theme-orange);
          border-color: var(--theme-orange);
        }
        .image-wrapper:hover .image-overlay { opacity: 1; }
        
        .not-found-container {
            text-align: center;
            padding: 4rem;
            color: var(--text-secondary);
        }

        /* Responsive Adjustments */
        @media(max-width: 992px) { 
          .main-content-grid { grid-template-columns: 1fr; padding: 1.5rem; gap: 1.5rem; }
          .piece-details-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; padding: 1.5rem; }
          .header-title { font-size: 2rem; }
        }
        @media(max-width: 480px) {
           .piece-details-container { padding: 1rem; }
           .key-info-grid { grid-template-columns: 1fr; }
           .main-content-grid { padding: 1rem; }
           .piece-details-header { padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
}

export default PieceDetails;
