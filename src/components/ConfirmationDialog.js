import React from 'react';
import '../styles/corporate.css';

const ConfirmationDialog = ({ message, onConfirm, onCancel }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="confirmation-backdrop" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="confirmation-content">
        <div className="confirmation-message">{message}</div>
        <div className="confirmation-buttons">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
