const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

// Ensure upload directory exists
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = process.env.UPLOAD_DIR || './uploads';
    
    // Determine subdirectory based on file type
    if (file.fieldname === 'productImages' || file.fieldname === 'images') {
      uploadPath = path.join(uploadPath, 'products');
    } else if (file.fieldname === 'receipt' || file.fieldname === 'receipts') {
      uploadPath = path.join(uploadPath, 'receipts');
    }
    
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
  
  if (file.mimetype.startsWith('image/')) {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Allowed types: ' + allowedTypes.join(', ')), false);
    }
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
             file.mimetype === 'application/vnd.ms-excel' ||
             file.mimetype === 'text/csv' ||
             file.mimetype === 'text/plain') {
    // Allow Excel/CSV files
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Upload single file
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Upload multiple files
const uploadMultiple = (fieldName, maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Upload fields
const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Delete file
const deleteFile = (filePath) => {
  try {
    const fullPath = path.join(process.env.UPLOAD_DIR || './uploads', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('File delete error:', error);
    return false;
  }
};

// Get file URL
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  // Remove upload directory from path if present
  const cleanPath = filePath.replace(/^.*uploads[\\/]/, '');
  return `/uploads/${cleanPath.replace(/\\/g, '/')}`;
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  getFileUrl
};


