import React, { useMemo } from 'react';

// Utils and Constants
import { renderValue } from '../utils/helpers';

function DynamicDataDisplay({ piece, navigate }) {
  const dynamicFields = useMemo(() => {
    if (!piece || !piece._dynamicFields) return [];

    return Object.entries(piece._dynamicFields).filter(([key, value]) => value && value !== '#N/A');
  }, [piece]);

  if (dynamicFields.length === 0) return null;

  const renderHolderName = (value) => {
    if (!Array.isArray(value)) return renderValue(value);
    return value.map((name, idx) => (
      <span key={idx} style={{ cursor: 'pointer', color: '#007bff' }} onClick={(e) => { e.stopPropagation(); navigate(`/search?partInfo=${encodeURIComponent(name)}`); }}>
        {name}{idx < value.length - 1 ? ', ' : ''}
      </span>
    ));
  };

  return (
    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '8px' }}>Additional Fields</h4>
      {dynamicFields.map(([key, value]) => (
        <div key={key} className="piece-info-item">
          <span>{key}:</span>
          <span>{key === 'Holder Name' ? renderHolderName(value) : renderValue(value)}</span>
        </div>
      ))}
    </div>
  );
}

export default DynamicDataDisplay;
