// Application Constants
export const APP_CONFIG = {
  NAME: 'APTIVM2',
  VERSION: '0.1.0',
  DESCRIPTION: 'Professional Inventory Management System'
};

// Firebase Collection Names
export const COLLECTIONS = {
  PIECES: 'pieces'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  PIECES: 'pieces',
  USER: 'user',
  ADMIN_PASSWORD: 'adminPassword',
  SUPERVISOR_PASSWORD: 'supervisorPassword',
  UPLOADED_IMAGES: 'uploaded_images',
  CACHE: 'pieces_cache'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  TECHNICIAN: 'technician'
};

// Field Mappings for Excel Import
export const FIELD_MAPPINGS = {
  'APN': ['apn', 'article', 'reference', 'id', 'code', 'part', 'item', 'product'],
  'SPN': ['spn', 'supplier.part', 'vendor.part', 'supplier.code', 'vendor.code'],
  'Holder Name': ['holderName', 'holder name', 'holder', 'owner', 'responsible'],
  'Connecteur DPN': ['connecteurDPN', 'connecteur', 'connector', 'connection', 'dpn'],
  'Parts Holder': ['partName', 'Partname', 'part name', 'parts holder', 'component'],
  'Serial Number Holder': ['serialNumberHolder', 'serial.number.holder', 'serial.number', 'serial'],
  'Equipment': ['equipment', 'machine', 'device', 'tool', 'instrument', 'apparatus', 'system'],
  'Section': ['section', 'department', 'area', 'division', 'group', 'team', 'category'],
  'Project Line': ['projectLine', 'project.line', 'projectline', 'line', 'project', 'production.line'],
  'Description': ['description', 'desc', 'details', 'comment', 'remark', 'note'],
  'Storage Location': ['storageLocation', 'storage.location', 'storage', 'location', 'warehouse'],
  'MRP Type': ['mrpType', 'mrp.type', 'mrp', 'type', 'material.type', 'planning.type'],
  'Suppliers': ['suppliers', 'supplier', 'vendor', 'provider', 'manufacturer', 'maker', 'producer'],
  'Unit Price': ['unitPrice', 'unit.price', 'price', 'cost', 'unit.cost', 'price.per.unit'],
  'Unrestricted Stock': ['unrestrictedStock', 'unrestricted.stock', 'stock', 'quantity', 'inventory', 'available', 'qté', 'qty', 'quantité'],
  'Min': ['min', 'minimum', 'min.qty', 'min.quantity', 'minimum.stock', 'min.stock'],
  'Max': ['max', 'maximum', 'max.qty', 'max.quantity', 'maximum.stock', 'max.stock'],
  'In Transit': ['inTransit', 'in.transit', 'transit', 'shipping', 'on.the.way', 'en.route'],
  'More Information': ['notes', 'moreInformation', 'more.information', 'information', 'info', 'more info']
};

// Default Form Values
export const DEFAULT_PIECE_DATA = {
  APN: '',
  SPN: '',
  'Holder Name': [],
  'Connecteur DPN': '',
  'Parts Holder': '',
  'Serial Number Holder': '',
  Equipment: '',
  Section: '',
  ProjectLine: '',
  Description: '',
  'Storage Location': '',
  'MRP Type': '',
  Suppliers: '',
  'Unit Price': '',
  'Unrestricted Stock': '',
  Min: '',
  Max: '',
  'In Transit': '',
  'More Information': ''
};

// Validation Rules
export const VALIDATION_RULES = {
  REQUIRED_FIELDS: ['APN', 'Parts Holder'],
  NUMERIC_FIELDS: ['Unit Price', 'Unrestricted Stock', 'Min', 'Max', 'In Transit'],
  ARRAY_FIELDS: ['Holder Name']
};

// Cache Configuration
export const CACHE_CONFIG = {
  EXPIRY_TIME: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 50 * 1024 * 1024 // 50MB
};

// UI Constants
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 20,
  DEBOUNCE_DELAY: 300,
  NOTIFICATION_DURATION: 3000,
  MODAL_ANIMATION_DURATION: 300
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  CHUNK_SIZE: 50
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a valid file.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PIECE_ADDED: 'Piece added successfully.',
  PIECE_UPDATED: 'Piece updated successfully.',
  PIECE_DELETED: 'Piece deleted successfully.',
  DATA_IMPORTED: 'Data imported successfully.',
  IMAGES_UPLOADED: 'Images uploaded successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.'
};
