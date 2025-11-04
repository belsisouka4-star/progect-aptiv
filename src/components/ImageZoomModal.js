import React, { useState, useEffect, useRef } from 'react';
import '../styles/corporate.css';
import './ImageZoomModal.css';

function ImageZoomModal({ isOpen, imageSrc, imageAlt = '', onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const savedScrollY = useRef(0);
  const pointerIdRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset zoom when modal opens
  useEffect(() => {
    if (isOpen && mountedRef.current) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle Escape key & prevent background scroll
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose?.(); };

    if (isOpen) {
      savedScrollY.current = window.scrollY || 0;
      document.addEventListener('keydown', handleEscape);
      // prevent background scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.left = '0';
      document.body.style.width = '100%';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // restore scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      document.body.style.overflow = '';
      try { window.scrollTo(0, savedScrollY.current); } catch (_) {}
    };
  }, [isOpen, onClose]);

  // Wheel zoom with passive: false
  useEffect(() => {
    const container = containerRef.current;
    if (container && isOpen) {
      const handleWheelEvent = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setScale(prev => {
          const next = Math.min(Math.max(prev + delta, 0.5), 5);
          if (next <= 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      };
      container.addEventListener('wheel', handleWheelEvent, { passive: false });
      return () => container.removeEventListener('wheel', handleWheelEvent);
    }
  }, [isOpen]);

  // Pointer (mouse/touch unified) handlers
  const handlePointerDown = (e) => {
    if (!imageRef.current) return;
    // Only start drag when scale > 1 and left mouse button or touch
    if (scale > 1 && (e.pointerType === 'mouse' ? e.button === 0 : true)) {
      setIsDragging(true);
      pointerIdRef.current = e.pointerId;
      try { imageRef.current.setPointerCapture(e.pointerId); } catch (_) {}
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try { imageRef.current?.releasePointerCapture?.(pointerIdRef.current); } catch (_) {}
      pointerIdRef.current = null;
    }
  };

  // Touch pinch handling (separate because pointer events combine touches)
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 2) {
      const [t1, t2] = e.touches;
      setLastTouchDistance(Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY));
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = e.touches;
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (lastTouchDistance > 0) {
        const ratio = distance / lastTouchDistance;
        setScale(prev => {
          const next = Math.min(Math.max(prev * ratio, 0.5), 5);
          if (next <= 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      }
      setLastTouchDistance(distance);
    }
  };
  const handleTouchEnd = () => {
    setLastTouchDistance(0);
  };

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const zoomOut = () => setScale(prev => {
    const next = Math.max(prev - 0.5, 0.5);
    if (next <= 1) setPosition({ x: 0, y: 0 });
    return next;
  });
  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="corporate-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: scale > 1 ? 'none' : 'auto' }}
    >
      <button
        className="corporate-modal-close"
        onClick={() => onClose?.()}
        aria-label="Close image"
      >
        ×
      </button>

      {/* Controls */}
      <div className="corporate-zoom-controls">
        <button className="btn" onClick={zoomIn} disabled={scale >= 5}>+</button>
        <button className="btn" onClick={zoomOut} disabled={scale <= 0.5}>−</button>
        <button className="btn" onClick={resetZoom}>Reset</button>
      </div>

      {/* Zoom Indicator */}
      <div className="corporate-zoom-indicator">{Math.round(scale * 100)}%</div>

      {/* Instructions */}
      <div className="corporate-zoom-instructions">
        {isMobile
          ? 'Pinch to zoom • Drag to pan • Tap outside or press × to close'
          : 'Scroll to zoom • Drag to pan • ESC to close'}
      </div>

      <div
        className="corporate-modal-image-wrapper"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onTouchStart={(e) => { handleTouchStart(e); }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt={imageAlt}
          draggable={false}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center center',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'auto',
            transition: isDragging ? 'none' : 'transform 120ms ease-out',
            maxWidth: 'none',
            maxHeight: 'none',
            display: 'block',
            margin: '0 auto'
          }}
          onTouchStart={(e) => { /* handled above */ }}
        />
      </div>


    </div>
  );
}

export default ImageZoomModal;
