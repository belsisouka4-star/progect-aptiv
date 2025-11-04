import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string safe for rendering
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []  // No attributes allowed
  });
};

/**
 * Sanitizes HTML content that may contain safe tags (for rich text)
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

/**
 * Validates and sanitizes file paths to prevent directory traversal
 * @param {string} path - The file path to validate
 * @returns {string} - Sanitized path or empty string if invalid
 */
export const sanitizeFilePath = (path) => {
  if (typeof path !== 'string') return '';

  // Remove any path traversal attempts
  const sanitized = path.replace(/\.\./g, '').replace(/[/\\]/g, '');

  // Only allow alphanumeric, dots, hyphens, and underscores
  if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
    return '';
  }

  return sanitized;
};

/**
 * Validates file size
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum size in MB (default 10MB)
 * @returns {boolean} - True if file size is valid
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  if (!file || !file.size) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validates file type
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if file type is allowed
 */
export const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) => {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validates image file
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum size in MB (default 5MB)
 * @returns {Object} - {isValid: boolean, error: string}
 */
export const validateImageFile = (file, maxSizeMB = 5) => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'])) {
    return { isValid: false, error: 'Invalid file type. Only image files are allowed.' };
  }

  if (!validateFileSize(file, maxSizeMB)) {
    return { isValid: false, error: `File too large. Maximum size is ${maxSizeMB}MB.` };
  }

  return { isValid: true, error: null };
};
