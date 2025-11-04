import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Styles
import '../styles/corporate.css';

const PieceCard = ({ piece, style, onEdit, onDelete, onImageClick }) => {
  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>N/A</span>;
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      if (value && typeof value === 'object' && 'error' in value) return 'Error';
      return JSON.stringify(value);
    }

    return String(value);
  };

  return (
    <div style={style} className="piece-card">
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
        {piece.APN}
      </div>
      <div
        style={{
          width: '100%',
          height: '120px',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px',
          cursor: piece.ImagePath ? 'pointer' : 'default'
        }}
        onClick={() => piece.ImagePath && onImageClick(piece.ImagePath, piece['Parts Holder'])}
      >
        {piece.ImagePath ? (
          <img
            src={piece.ImagePath}
            alt={piece.APN}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span style={{ color: '#999' }}>No Image</span>
        )}
      </div>
      <div className="piece-info">
        <div className="piece-info-item">
          <span>Parts Holder:</span>
          <span>{renderValue(piece['Parts Holder'])}</span>
        </div>
        <div className="piece-info-item">
          <span>SPN:</span>
          <span>{renderValue(piece.SPN)}</span>
        </div>
        <div className="piece-info-item">
          <span>Holder Name:</span>
          <span>{Array.isArray(piece['Holder Name']) ? piece['Holder Name'].join(', ') : renderValue(piece['Holder Name'])}</span>
        </div>
        <div className="piece-info-item">
          <span>Unrestricted Stock:</span>
          <span>{renderValue(piece['Unrestricted Stock'])}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button className="btn-secondary btn-sm" onClick={() => onEdit(piece)}>Edit</button>
        <button className="btn-danger btn-sm" onClick={() => onDelete(piece)}>Delete</button>
      </div>
    </div>
  );
};

const PieceRow = ({ piece, style, onEdit, onDelete, onImageClick }) => {
  return (
    <div style={style} className="pieces-list">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: 'bold', width: '15%' }}>{piece.APN}</td>
            <td style={{ width: '25%' }}>{piece['Parts Holder']}</td>
            <td style={{ width: '25%' }}>{Array.isArray(piece['Holder Name']) ? piece['Holder Name'].join(', ') : piece['Holder Name'] || ''}</td>
            <td style={{ width: '20%' }}>{piece['Unrestricted Stock']}</td>
            <td style={{ width: '15%' }} className="actions-cell">
              <button className="btn-secondary btn-sm" onClick={() => onEdit(piece)}>Edit</button>
              <button className="btn-danger btn-sm" onClick={() => onDelete(piece)}>Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const VirtualizedPieceList = ({
  pieces,
  viewMode = 'card',
  onEdit,
  onDelete,
  onImageClick,
  itemHeight = 280,
  rowHeight = 60
}) => {
  const rowRenderer = ({ index, style }) => {
    const piece = pieces[index];
    if (!piece) return null;

    return (
      <PieceRow
        key={piece.id || `row-${index}`}
        piece={piece}
        style={style}
        onEdit={onEdit}
        onDelete={onDelete}
        onImageClick={onImageClick}
      />
    );
  };

  if (viewMode === 'card') {
    return (
      <AutoSizer>
        {({ height, width }) => {
          const itemsPerRow = Math.floor(width / 280); // Approximate card width
          const rowCount = Math.ceil(pieces.length / itemsPerRow);

          return (
            <Grid
              columnCount={itemsPerRow}
              columnWidth={280}
              height={height}
              rowCount={rowCount}
              rowHeight={itemHeight}
              width={width}
              style={{ padding: '10px' }}
            >
              {({ columnIndex, rowIndex, style }) => {
                const index = rowIndex * itemsPerRow + columnIndex;
                const piece = pieces[index];

                if (!piece) return null;

                return (
                  <div style={{ ...style, padding: '5px' }}>
                    <PieceCard
                      key={piece.id || `grid-${index}`}
                      piece={piece}
                      style={{ width: '100%', height: '100%' }}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onImageClick={onImageClick}
                    />
                  </div>
                );
              }}
            </Grid>
          );
        }}
      </AutoSizer>
    );
  }

  // List view
  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          itemCount={pieces.length}
          itemSize={rowHeight}
          width={width}
          style={{ padding: '10px' }}
        >
          {rowRenderer}
        </List>
      )}
    </AutoSizer>
  );
};

export default VirtualizedPieceList;
