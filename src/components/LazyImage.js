import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({
  src,
  alt = '',
  className = '',
  placeholder = '/placeholder-image.png',
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imgSrc, setImgSrc] = useState(placeholder);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // If IntersectionObserver isn't available, load immediately (fallback)
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      setImgSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!mountedRef.current) return;
          setIsInView(true);
          setImgSrc(src);
          if (observerRef.current) {
            try { observerRef.current.disconnect(); } catch (_) {}
          }
        }
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      try {
        observer.observe(imgRef.current);
        observerRef.current = observer;
      } catch (err) {
        // If observe fails, fallback to immediate load
        setIsInView(true);
        setImgSrc(src);
      }
    }

    return () => {
      if (observerRef.current) {
        try { observerRef.current.disconnect(); } catch (_) {}
      }
    };
  }, [src, threshold, rootMargin]);

  const handleLoad = (e) => {
    if (!mountedRef.current) return;
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    if (!mountedRef.current) return;
    setHasError(true);
    onError?.(e);
  };

  return (
    <div
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      aria-busy={!isLoaded}
    >
      {/* show placeholder skeleton while not in view or loading */}
      {!isInView && (
        <div className="lazy-image-placeholder" aria-hidden="true">
          <div className="loading-spinner" />
        </div>
      )}

      {/* always render img for accessibility; swap src via state */}
      <img
        src={hasError ? placeholder : imgSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
        {...props}
      />

      <style jsx>{`
        .lazy-image-container {
          position: relative;
          overflow: hidden;
          display: block;
        }

        .lazy-image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.06);
          min-height: 100px;
          width: 100%;
        }

        .loading-spinner {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid rgba(0,0,0,0.08);
          border-top-color: rgba(0,0,0,0.25);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .lazy-image {
          display: block;
          width: 100%;
          height: auto;
          opacity: 0;
          transition: opacity 0.3s ease, filter 0.3s ease;
          filter: blur(2px);
        }

        .lazy-image.loaded {
          opacity: 1;
          filter: none;
        }

        .lazy-image.loading {
          /* keep blur while loading */
        }
      `}</style>
    </div>
  );
};

export default LazyImage;