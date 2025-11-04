import React from 'react';
import '../styles/corporate.css';

const SkeletonCard = () => (
  <div className="piece-card skeleton">
    <div className="skeleton-title"></div>
    <div className="skeleton-image"></div>
    <div className="skeleton-info">
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
    </div>
    <div className="skeleton-buttons">
      <div className="skeleton-button"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

const SkeletonRow = () => (
  <div className="pieces-list skeleton-row">
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td className="skeleton-cell"></td>
          <td className="skeleton-cell"></td>
          <td className="skeleton-cell"></td>
          <td className="skeleton-cell"></td>
          <td className="skeleton-cell">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

const SkeletonLoader = ({
  count = 6,
  viewMode = 'card',
  className = ''
}) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div key={`skeleton-${index}`}>
      {viewMode === 'card' ? <SkeletonCard /> : <SkeletonRow />}
    </div>
  ));

  return (
    <div className={`skeleton-loader ${className}`}>
      {skeletons}
    </div>
  );
};

export default SkeletonLoader;
