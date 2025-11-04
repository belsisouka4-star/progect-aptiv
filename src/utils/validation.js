import { VALIDATION_RULES, ERROR_MESSAGES } from '../constants';

/**
 * Validates piece data before saving
 * @param {Object} piece - The piece data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validatePiece = (piece) => {
  const errors = [];

  // Check required fields
  VALIDATION_RULES.REQUIRED_FIELDS.forEach(field => {
    if (!piece[field] || piece[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });

  // Validate numeric fields
  VALIDATION_RULES.NUMERIC_FIELDS.forEach(field => {
    const value = piece[field];

    // Allow "N/A", empty string, or null as valid
    if (value === 'N/A' || value === '' || value === null || value === undefined) {
      // Keep as is (or set to null for consistency)
      if (value === '') {
        piece[field] = null;
      }
      return;
    }

    // For actual values, check if they are valid numbers
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      errors.push(`${field} must be a valid number or "N/A"`);
    } else {
      // Convert to Number type for consistency
      piece[field] = numValue;
    }
  });

  // Validate array fields
  VALIDATION_RULES.ARRAY_FIELDS.forEach(field => {
    if (piece[field] && !Array.isArray(piece[field])) {
      if (typeof piece[field] === 'string') {
        piece[field] = piece[field].split(',').map(s => s.trim()).filter(s => s);
      } else {
        piece[field] = [];
      }
    }
  });

  // Validate APN format (should not be empty and should be reasonable length)
  if (piece.APN && piece.APN.length > 100) {
    errors.push('APN is too long (maximum 100 characters)');
  }

  // Validate stock levels
  if (piece['Unrestricted Stock'] !== undefined && piece.Min !== undefined) {
    const stock = parseFloat(piece['Unrestricted Stock']);
    const min = parseFloat(piece.Min);
    if (!isNaN(stock) && !isNaN(min) && stock < 0) {
      errors.push('Unrestricted Stock cannot be negative');
    }
    if (!isNaN(min) && min < 0) {
      errors.push('Minimum stock cannot be negative');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizes input data to prevent XSS and other attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
};

/**
 * Validates file upload
 * @param {File} file - The file to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateFile = (file) => {
  if (!file) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
  }

  // Check file size
  if (file.size > 5 * 1024 * 1024) { // 5MB
    return { isValid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
  }

  // Check file type for images
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
  }

  return { isValid: true };
};

/**
 * Validates Excel file
 * @param {File} file - The Excel file to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateExcelFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  // Check file size (max 10MB for Excel files)
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file extension
  const allowedExtensions = ['.xlsx', '.xls'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return { isValid: false, error: 'Invalid file type. Please select an Excel file (.xlsx or .xls)' };
  }

  return { isValid: true };
};

/**
 * Validates user role permissions
 * @param {string} userRole - The user's role
 * @param {string} requiredRole - The required role for the action
 * @returns {boolean} - Whether the user has permission
 */
export const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    'warehouse': 1,
    'technician': 2,
    'supervisor': 3,
    'admin': 4
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Formats validation errors for display
 * @param {string[]} errors - Array of error messages
 * @returns {string} - Formatted error message
 */
export const formatValidationErrors = (errors) => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return `${errors.length} validation errors: ${errors.join(', ')}`;
};
