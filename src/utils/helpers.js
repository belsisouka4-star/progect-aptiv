import { CACHE_CONFIG, STORAGE_KEYS } from '../constants';
import { sanitizeInput } from './sanitize';

/**
 * Safely renders values, handling null/undefined cases with XSS protection
 * @param {*} value - The value to render
 * @param {string} defaultValue - Default value if null/undefined
 * @returns {string} - Safe string representation
 */
export const renderValue = (value, defaultValue = 'N/A') => {
  if (value === null || value === undefined || value === '' || value === '#N/A') return defaultValue;
  if (Array.isArray(value)) {
    // Sanitize each array element to prevent XSS
    const sanitizedArray = value.map(item => sanitizeInput(String(item)));
    return sanitizedArray.join(', ');
  }
  if (typeof value === 'object') {
    // Check if it's an error object
    if (value && typeof value === 'object' && 'error' in value) return 'Error';
    return JSON.stringify(value);
  }
  // Sanitize string values to prevent XSS
  return sanitizeInput(String(value));
};

/**
 * Formats numbers with proper decimal places
 * @param {number|string} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted number
 */
export const formatNumber = (value, decimals = 2) => {
  const num = parseFloat(value);
  if (isNaN(num)) return renderValue(value);
  return num.toFixed(decimals);
};

/**
 * Capitalizes first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Generates a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export const generateId = (prefix = 'id') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttles a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Gets cached data from localStorage
 * @param {string} key - Cache key
 * @returns {*} - Cached data or null
 */
export const getCache = (key = STORAGE_KEYS.CACHE) => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_CONFIG.EXPIRY_TIME) {
        return data;
      }
    }
  } catch (err) {
    console.error("Failed to get cache:", err);
  }
  return null;
};

/**
 * Sets data in cache
 * @param {*} data - Data to cache
 * @param {string} key - Cache key
 */
export const setCache = (data, key = STORAGE_KEYS.CACHE) => {
  try {
    const dataSize = JSON.stringify(data).length;
    if (dataSize > CACHE_CONFIG.MAX_SIZE) {
      console.warn("Data too large for caching, skipping cache");
      return;
    }
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.error("Failed to set cache:", err);
  }
};

/**
 * Clears cache
 * @param {string} key - Cache key to clear
 */
export const clearCache = (key = STORAGE_KEYS.CACHE) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Failed to clear cache:", err);
  }
};

/**
 * Downloads data as JSON file
 * @param {Object} data - Data to download
 * @param {string} filename - Filename for download
 */
export const downloadAsJSON = (data, filename = 'data.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Converts file to base64
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

/**
 * Gets file extension from filename
 * @param {string} filename - Filename
 * @returns {string} - File extension
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

/**
 * Checks if device is mobile
 * @returns {boolean} - Whether device is mobile
 */
export const isMobile = () => {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Gets user role from localStorage
 * @returns {string|null} - User role or null
 */
export const getUserRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    return user.role || null;
  } catch {
    return null;
  }
};

/**
 * Checks if user is logged in
 * @returns {boolean} - Whether user is logged in
 */
export const isLoggedIn = () => {
  return !!getUserRole();
};

/**
 * Logs out user
 */
export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  window.location.href = '/';
};

/**
 * Gets stock status color based on stock levels
 * @param {number} stock - Current stock
 * @param {number} min - Minimum stock level
 * @returns {string} - Color name
 */
export const getStockStatusColor = (stock, min) => {
  if (isNaN(stock) || isNaN(min)) return 'gray';
  if (stock > min) return 'green';
  if (stock === min) return 'orange';
  return 'red';
};

/**
 * Sorts array of objects by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {boolean} ascending - Sort direction
 * @returns {Array} - Sorted array
 */
export const sortByKey = (array, key, ascending = true) => {
  return [...array].sort((a, b) => {
    const aVal = a[key]?.toString().toLowerCase() || '';
    const bVal = b[key]?.toString().toLowerCase() || '';

    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });
};

/**
 * Filters array by search term
 * @param {Array} array - Array to filter
 * @param {string} searchTerm - Search term
 * @param {string[]} searchFields - Fields to search in
 * @returns {Array} - Filtered array
 */
export const filterBySearchTerm = (array, searchTerm, searchFields = []) => {
  if (!searchTerm) return array;

  const term = searchTerm.toLowerCase();
  return array.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (!value) return false;
      return value.toString().toLowerCase().includes(term);
    });
  });
};
