const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_DIR || './uploads';
    const subfolder = file.fieldname === 'images' ? 'images' : file.fieldname === 'excel' ? 'excel' : 'files';
    const fullPath = path.join(uploadPath, subfolder);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
  } else if (file.fieldname === 'excel') {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  }
});

// @desc    Upload images
// @route   POST /api/upload/images
// @access  Private
const uploadImages = asyncHandler(async (req, res) => {
  const uploadMiddleware = upload.array('images', 10);

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return errorResponse(res, err.message, 400);
    }

    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'No files uploaded', 400);
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/images/${file.filename}`
    }));

    successResponse(res, { files: uploadedFiles }, 'Images uploaded successfully', 201);
  });
});

// @desc    Upload Excel file and extract images
// @route   POST /api/upload/excel
// @access  Private (Vendor/Admin/Trader)
const uploadExcel = asyncHandler(async (req, res) => {
  const uploadMiddleware = upload.single('excel');

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return errorResponse(res, err.message, 400);
    }

    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const file = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/excel/${req.file.filename}`
    };

    // Extract images from Excel file
    let extractedImages = [];
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);

      const worksheet = workbook.getWorksheet(1); // Get first sheet
      if (worksheet) {
        // Create images directory if it doesn't exist
        const imagesDir = path.join(__dirname, '../../uploads/images');
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }

        // Get all images from worksheet
        const excelImages = worksheet.getImages();
        const imageMap = new Map(); // Map: row number -> image URLs

        // Process images from Excel
        // ExcelJS stores images in workbook.model.media (object with imageId as key) or array
        // Try both methods for compatibility
        const media = workbook.model?.media || {};
        
        for (const image of excelImages) {
          try {
            const imageId = image.imageId;
            let imageFile = null;
            
            // Method 1: Try as object with imageId as key
            if (typeof media === 'object' && !Array.isArray(media)) {
              imageFile = media[imageId];
            }
            // Method 2: Try as array (0-based indexing, imageId starts from 1)
            else if (Array.isArray(media) && imageId > 0) {
              const mediaIndex = imageId - 1;
              if (mediaIndex >= 0 && mediaIndex < media.length) {
                imageFile = media[mediaIndex];
              }
            }
            
            if (imageFile && imageFile.buffer) {
              const rowNumber = image.range.tl.nativeRow + 1; // Get row number (1-based, including header)
              // Note: rowNumber includes header row, so row 1 = header, row 2 = first data row
              // We'll keep the actual Excel row number for mapping (frontend will adjust)
              
              // Get extension from image type or default to png
              let extension = 'png';
              if (imageFile.extension) {
                extension = imageFile.extension;
              } else if (imageFile.type) {
                const typeParts = imageFile.type.split('/');
                if (typeParts.length > 1) {
                  extension = typeParts[1].split(';')[0]; // Remove base64 encoding info if present
                }
              }
              
              const imageFilename = `excel-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
              const imagePath = path.join(imagesDir, imageFilename);
              
              // Save image to disk
              fs.writeFileSync(imagePath, imageFile.buffer);
              
              // Build image URL
              const imageUrl = `/uploads/images/${imageFilename}`;
              
              // Map image to row number (support multiple images per row)
              if (!imageMap.has(rowNumber)) {
                imageMap.set(rowNumber, []);
              }
              imageMap.get(rowNumber).push(imageUrl);
              
              // Also add to extractedImages array for response
              extractedImages.push({
                rowNumber: rowNumber, // Excel row number (1-based, includes header)
                url: imageUrl,
                filename: imageFilename
              });
            }
          } catch (imageError) {
            console.error('Error processing individual image from Excel:', imageError);
            // Continue processing other images
          }
        }
      }
    } catch (imageExtractionError) {
      // Log error but don't fail the upload
      console.error('Error extracting images from Excel:', imageExtractionError);
      // Continue with file upload even if image extraction fails
    }

    successResponse(res, { 
      file,
      images: extractedImages, // Include extracted images in response
      imageCount: extractedImages.length
    }, 'Excel file uploaded successfully', 201);
  });
});

// @desc    Get uploaded file
// @route   GET /api/files/:id
// @access  Private
const getFile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // This would typically fetch file info from database
  // For now, return file info
  successResponse(res, {
    id,
    message: 'File retrieval endpoint',
    note: 'File information would be fetched from database'
  }, 'File information');
});

module.exports = {
  uploadImages,
  uploadExcel,
  getFile,
  upload // Export for use in routes
};



