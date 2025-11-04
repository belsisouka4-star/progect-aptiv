import React from 'react';

/**
 * PieceImage
 * Props:
 *  - thumbnailUrl (optional) : string (prefer this)
 *  - originalUrl : string
 *  - alt : string
 *  - critical : boolean (default false)
 *  - width : number (default 400)
 *  - height : number (default 240)
 *  - sizes : string (default "(max-width: 576px) 200px, (max-width: 768px) 400px, 800px")
 */
const PieceImage = ({
  thumbnailUrl,
  originalUrl,
  alt,
  critical = false,
  width = 400,
  height = 240,
  sizes = "(max-width: 576px) 200px, (max-width: 768px) 400px, 800px"
}) => {
  return (
    <img
      src={thumbnailUrl || originalUrl}
      alt={alt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        imageRendering: '-webkit-optimize-contrast',
        imageRendering: 'crisp-edges'
      }}
      loading={critical ? 'eager' : 'lazy'}
      decoding="async"
      width={width}
      height={height}
      sizes={sizes}
      onError={(e) => {
        // Fallback to original if thumbnail fails
        if (thumbnailUrl && originalUrl && e.currentTarget.src !== originalUrl) {
          e.currentTarget.src = originalUrl;
        } else {
          // Hide on final failure
          e.currentTarget.style.display = 'none';
        }
      }}
    />
  );
};

export default PieceImage;
