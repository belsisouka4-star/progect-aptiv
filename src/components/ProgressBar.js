import React from 'react';
import '../styles/corporate.css';

const ProgressBar = ({
  progress,
  label = '',
  showPercentage = true,
  color = '#007bff',
  height = '8px',
  animated = true
}) => {
  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="progress-container" style={{ margin: '10px 0' }}>
      {label && <div className="progress-label">{label}</div>}
      <div
        className="progress-bar"
        style={{
          width: '100%',
          height: height,
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        <div
          className={`progress-fill ${animated ? 'animated' : ''}`}
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: color,
            transition: animated ? 'width 0.3s ease' : 'none'
          }}
        />
      </div>
      {showPercentage && (
        <div className="progress-percentage">{Math.round(percentage)}%</div>
      )}
    </div>
  );
};

export default ProgressBar;
