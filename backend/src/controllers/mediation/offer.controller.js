const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const { notifyOfferAction } = require('../../utils/notificationHelper');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Create Offer (Trader only)
 * @route   POST /api/traders/offers
 * @access  Private (Trader)
 */
const createOffer = asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    items = [],
    metadata = {},
    images, // Add images to destructuring
    excelFileUrl,
    excelFileName,
    excelFileSize
  } = req.body;

  // Validate title - use description as fallback if title is empty
  const offerTitle = (title && title.trim()) || (description && description.trim().substring(0, 100)) || 'New Advertisement';
  
  if (!offerTitle || !offerTitle.trim()) {
    return errorResponse(res, 'Please provide offer title or description', 400);
  }

  const trader = await prisma.trader.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      employeeId: true
    }
  });

  if (!trader) {
    return errorResponse(res, 'Trader not found', 404);
  }

  // Validate category if provided
  let categoryId = null;
  if (metadata.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(metadata.categoryId) },
      select: { id: true, isActive: true }
    });

    if (!category) {
      return errorResponse(res, 'Category not found', 400);
    }

    if (!category.isActive) {
      return errorResponse(res, 'Category is not active', 400);
    }

    categoryId = category.id;
  } else if (metadata.category) {
    // Try to find category by slug or nameKey (backward compatibility)
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: metadata.category },
          { nameKey: metadata.category }
        ],
        isActive: true
      },
      select: { id: true }
    });

    if (category) {
      categoryId = category.id;
    }
  }

  // Calculate totals from items
  let totalCartons = 0;
  let totalCBM = 0;
  
  if (items && items.length > 0) {
    totalCartons = items.reduce((sum, item) => sum + (item.packageQuantity || 0), 0);
    totalCBM = items.reduce((sum, item) => sum + parseFloat(item.totalCBM || 0), 0);
  }

  // Create offer with Excel metadata
  const offer = await prisma.offer.create({
    data: {
      traderId: trader.id,
      title: offerTitle.trim(),
      description: (description && description.trim()) || null,
      status: 'DRAFT',
      totalCartons,
      totalCBM: totalCBM.toFixed(3), // Convert to string with 3 decimal places for Prisma Decimal
      // Ad/Offer metadata from create page
      category: metadata.category || null, // Legacy field for backward compatibility
      categoryId: categoryId, // New field with relation
      acceptsNegotiation: metadata.acceptsNegotiation || false,
      city: metadata.city || null,
      images: (images && Array.isArray(images) && images.length > 0)
        ? JSON.stringify(images)
        : (metadata.adImages && Array.isArray(metadata.adImages) && metadata.adImages.length > 0) 
          ? JSON.stringify(metadata.adImages) 
          : null,
      // Excel file info
      excelFileUrl: excelFileUrl || null,
      excelFileName: excelFileName || null,
      excelFileSize: excelFileSize || null,
      // Excel metadata
      companyName: metadata.companyName || null,
      proformaInvoiceNo: metadata.proformaInvoiceNo || null,
      excelDate: metadata.date ? new Date(metadata.date) : null,
      ...(items && items.length > 0 ? {
        items: {
          create: items.map((item, index) => ({
            // Excel-based fields
            itemNo: item.itemNo || null,
            productName: (item.productName && item.productName.trim()) || (item.description && item.description.trim()) || `Item ${index + 1}`, // Required field - use productName from frontend first, then description
            description: item.description || null,
            colour: item.colour || null,
            spec: item.spec || null,
            quantity: item.quantity || 0,
            unit: item.unit || 'SET',
            unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : null,
            currency: item.currency || 'USD',
            amount: item.amount ? parseFloat(item.amount) : null,
            packing: item.packing || null,
            packageQuantity: item.packageQuantity || 0,
            unitGW: item.unitGW ? parseFloat(item.unitGW) : null,
            totalGW: item.totalGW ? parseFloat(item.totalGW) : null,
            // Carton dimensions
            cartonLength: item.cartonLength || item.cartonSize?.length ? parseFloat(item.cartonLength || item.cartonSize.length) : null,
            cartonWidth: item.cartonWidth || item.cartonSize?.width ? parseFloat(item.cartonWidth || item.cartonSize.width) : null,
            cartonHeight: item.cartonHeight || item.cartonSize?.height ? parseFloat(item.cartonHeight || item.cartonSize.height) : null,
            totalCBM: (item.totalCBM && !isNaN(parseFloat(item.totalCBM))) ? parseFloat(item.totalCBM).toFixed(4) : '0.0000', // Convert to string with 4 decimal places for Prisma Decimal
            // Legacy fields (for backward compatibility)
            cartons: item.packageQuantity || 0,
            length: item.cartonLength || item.cartonSize?.length ? parseFloat(item.cartonLength || item.cartonSize.length) : null,
            width: item.cartonWidth || item.cartonSize?.width ? parseFloat(item.cartonWidth || item.cartonSize.width) : null,
            height: item.cartonHeight || item.cartonSize?.height ? parseFloat(item.cartonHeight || item.cartonSize.height) : null,
            cbm: (item.totalCBM && !isNaN(parseFloat(item.totalCBM))) ? parseFloat(item.totalCBM).toFixed(3) : '0.000', // Convert to string with 3 decimal places for Prisma Decimal
            weight: item.totalGW ? parseFloat(item.totalGW) : null,
            images: (item.images && Array.isArray(item.images) && item.images.length > 0) 
              ? JSON.stringify(item.images) 
              : (item.image ? JSON.stringify([item.image]) : null),
            displayOrder: item.no && !isNaN(parseInt(item.no)) ? parseInt(item.no) : (index + 1)
          }))
        }
      } : {}) // Don't include items if array is empty
    },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true
        }
      },
      items: true
    }
  });

  // Log activity (wrap in try-catch to prevent blocking if activity log fails)
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userType: 'TRADER',
        action: 'OFFER_CREATED',
        entityType: 'OFFER',
        entityId: offer.id,
        description: `Trader created offer: ${offerTitle} with ${items ? items.length : 0} items`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
  } catch (activityError) {
    // Log error but don't block the response
    console.error('Failed to create activity log:', activityError);
  }

  // Notify trader, employee, and admins about the new offer (wrap in try-catch to prevent blocking)
  try {
    await notifyOfferAction(offer, 'CREATED');
  } catch (notificationError) {
    // Log error but don't block the response
    console.error('Failed to create notifications:', notificationError);
  }

  successResponse(res, offer, 'Offer created successfully', 201);
});

/**
 * @desc    Upload Excel file to Offer
 * @route   POST /api/traders/offers/:id/upload-excel
 * @access  Private (Trader)
 */
const uploadOfferExcel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return errorResponse(res, 'Please upload an Excel file', 400);
  }

  const offer = await prisma.offer.findFirst({
    where: {
      id: parseInt(id),
      traderId: req.user.id
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.getWorksheet(1); // Get first sheet
    if (!worksheet) {
      return errorResponse(res, 'Excel file is empty', 400);
    }

    // Extract images from Excel file
    const imagesDir = path.join(__dirname, '../../uploads/images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Get all images from worksheet
    const excelImages = worksheet.getImages();
    const imageMap = new Map(); // Map: row number -> image path(s)

    // Process images from Excel
    for (const image of excelImages) {
      const imageId = image.imageId;
      const imageFile = workbook.model.media[imageId - 1]; // ExcelJS uses 1-based indexing for media
      
      if (imageFile && imageFile.buffer) {
        const rowNumber = image.range.tl.nativeRow + 1; // Get row number (1-based)
        const extension = imageFile.extension || 'png'; // Default to png if no extension
        const imageFilename = `offer-${offer.id}-item-${rowNumber}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
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
      }
    }

    const items = [];
    let totalCartons = 0;
    let totalCBM = 0;

    // Skip header row (row 1)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      // Get image URLs for this row (if any)
      const rowImages = imageMap.get(rowNumber) || [];
      
      // Try to get image from cell value (if image is a URL/path in cell)
      // Excel template: Column B (index 2, 1-based) = IMAGE
      const imageCellValue = row.getCell(2)?.value?.toString() || '';
      let cellImageUrls = [];
      
      // Check if cell contains image URL(s) - could be comma-separated or single URL
      if (imageCellValue && (imageCellValue.startsWith('http') || imageCellValue.startsWith('/uploads') || imageCellValue.startsWith('uploads'))) {
        cellImageUrls = imageCellValue.split(',').map(url => url.trim()).filter(url => url);
      }

      // Combine Excel embedded images with cell URL images
      const allImages = [...rowImages, ...cellImageUrls];

      // Excel template column mapping (ExcelJS uses 1-based indexing):
      // Column 1 (A): NO, Column 2 (B): IMAGE, Column 3 (C): ITEM NO., Column 4 (D): DESCRIPTION, 
      // Column 5 (E): Colour, Column 6 (F): SPEC., Column 7 (G): QUANTITY, Column 8 (H): Unit,
      // Column 9 (I): UNIT PRICE, Column 10 (J): CURRENCY, Column 11 (K): AMOUNT, Column 12 (L): PACKING,
      // Column 13 (M): PACKAGE QUANTITY (CTN), Column 14 (N): UNIT G.W. (KGS), Column 15 (O): TOTAL G.W. (KGS),
      // Column 16 (P): Length, Column 17 (Q): Width, Column 18 (R): Height, Column 19 (S): TOTAL CBM
      const itemNo = row.getCell(3)?.value?.toString() || ''; // Column C: ITEM NO.
      const productName = row.getCell(4)?.value?.toString() || itemNo || ''; // Column D: DESCRIPTION (use as productName)
      const description = row.getCell(4)?.value?.toString() || null; // Column D: DESCRIPTION
      const colour = row.getCell(5)?.value?.toString() || null; // Column E: Colour
      const spec = row.getCell(6)?.value?.toString() || null; // Column F: SPEC.
      const quantity = parseInt(row.getCell(7)?.value) || 0; // Column G: QUANTITY
      const unit = row.getCell(8)?.value?.toString() || 'SET'; // Column H: Unit
      const unitPrice = parseFloat(row.getCell(9)?.value) || 0; // Column I: UNIT PRICE
      const currency = row.getCell(10)?.value?.toString() || 'USD'; // Column J: CURRENCY
      const amount = parseFloat(row.getCell(11)?.value) || 0; // Column K: AMOUNT
      const packing = row.getCell(12)?.value?.toString() || null; // Column L: PACKING
      const packageQuantity = parseInt(row.getCell(13)?.value) || 0; // Column M: PACKAGE QUANTITY (CTN)
      const unitGW = parseFloat(row.getCell(14)?.value) || 0; // Column N: UNIT G.W. (KGS)
      const totalGW = parseFloat(row.getCell(15)?.value) || 0; // Column O: TOTAL G.W. (KGS)
      const length = parseFloat(row.getCell(16)?.value) || null; // Column P: Length
      const width = parseFloat(row.getCell(17)?.value) || null; // Column Q: Width
      const height = parseFloat(row.getCell(18)?.value) || null; // Column R: Height
      const excelTotalCBM = parseFloat(row.getCell(19)?.value) || null; // Column S: TOTAL CBM

      // Skip invalid rows (must have productName or itemNo, and quantity > 0)
      if ((!productName && !itemNo) || quantity === 0) return;

      // Calculate CBM: (L * W * H) / 1,000,000 (convert cm³ to m³) * packageQuantity
      let calculatedCBM = 0;
      if (length && width && height && packageQuantity) {
        const cbmPerUnit = (length * width * height) / 1000000; // Convert cm³ to m³
        calculatedCBM = cbmPerUnit * packageQuantity;
      }
      
      // Use totalCBM from Excel if available, otherwise use calculated CBM
      const finalCBM = excelTotalCBM || calculatedCBM;

      // Prepare notes as JSON string with extra metadata
      const notesData = {
        itemNo: itemNo || null,
        colour: colour || null,
        spec: spec || null,
        unit: unit || 'SET',
        unitPrice: unitPrice || 0,
        currency: currency || 'USD',
        amount: amount || (quantity * unitPrice) || 0,
        packing: typeof packing === 'string' ? packing : null,
        packageQuantity: packageQuantity || 0,
        unitGW: unitGW || null,
        totalGW: totalGW || null,
        cartonLength: length || null,
        cartonWidth: width || null,
        cartonHeight: height || null
      };
      
      items.push({
        offerId: offer.id,
        productName: productName || itemNo || `Item ${items.length + 1}`, // Use description or itemNo as productName
        description: description || null,
        quantity,
        cartons: packageQuantity || 0, // Use cartons field instead of packageQuantity
        length: length || null,
        width: width || null,
        height: height || null,
        cbm: finalCBM.toFixed(4), // Convert to string with 4 decimal places for Prisma Decimal
        weight: totalGW || null,
        displayOrder: items.length + 1,
        images: allImages.length > 0 ? JSON.stringify(allImages) : null, // Store images as JSON array
        notes: JSON.stringify(notesData) // Store extra metadata in notes
      });

      totalCartons += packageQuantity;
      totalCBM += finalCBM; // Add to total CBM
    });

    // Get existing items that are linked to deals (cannot be deleted)
    const existingItemsWithDeals = await prisma.offerItem.findMany({
      where: {
        offerId: offer.id,
        dealItems: {
          some: {}
        }
      },
      select: { id: true }
    });

    const itemIdsWithDeals = existingItemsWithDeals.map(item => item.id);

    // Delete only items that are NOT linked to any deals
    await prisma.offerItem.deleteMany({
      where: {
        offerId: offer.id,
        id: {
          notIn: itemIdsWithDeals
        }
      }
    });

    // Create new items
    await prisma.offerItem.createMany({
      data: items
    });

    // Update offer totals
    const updatedOffer = await prisma.offer.update({
      where: { id: offer.id },
      data: {
        totalCartons,
        totalCBM,
        excelFileUrl: req.file.path, // Store file path
        status: 'PENDING_VALIDATION' // Require employee validation
      },
      include: {
        items: true,
        _count: {
          select: {
            items: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userType: 'TRADER',
        action: 'OFFER_EXCEL_UPLOADED',
        entityType: 'OFFER',
        entityId: offer.id,
        description: `Trader uploaded Excel file with ${items.length} items`,
        metadata: JSON.stringify({
          itemCount: items.length,
          totalCartons,
          totalCBM
        }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Notify trader and employee about Excel upload
    try {
      await notifyOfferAction(updatedOffer, 'EXCEL_UPLOADED', 'TRADER');
    } catch (notificationError) {
      console.error('Failed to create notifications:', notificationError);
    }

    successResponse(res, updatedOffer, 'Excel file uploaded and processed successfully');
  } catch (error) {
    console.error('Excel processing error:', error);
    return errorResponse(res, `Error processing Excel file: ${error.message}`, 500);
  }
});

/**
 * @desc    Validate Offer (Employee only)
 * @route   PUT /api/employees/offers/:id/validate
 * @access  Private (Employee)
 */
const validateOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approved, validationNotes } = req.body;

  const offer = await prisma.offer.findUnique({
    where: { id: parseInt(id) },
    include: {
      trader: true
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  // Verify employee is linked to this trader
  if (offer.trader.employeeId !== req.user.id) {
    return errorResponse(res, 'Not authorized to validate this offer', 403);
  }

  // Allow validation for both PENDING_VALIDATION and DRAFT offers
  if (offer.status !== 'PENDING_VALIDATION' && offer.status !== 'DRAFT') {
    return errorResponse(res, 'Offer is not pending validation', 400);
  }

  const updatedOffer = await prisma.offer.update({
    where: { id },
    data: {
      status: approved ? 'ACTIVE' : 'REJECTED',
      validatedBy: req.user.id,
      validatedAt: new Date(),
      validationNotes: validationNotes || null
    },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true
        }
      },
      items: {
        take: 10 // Show first 10 items
      },
      _count: {
        select: {
          items: true
        }
      }
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: 'EMPLOYEE',
      action: approved ? 'OFFER_APPROVED' : 'OFFER_REJECTED',
      entityType: 'OFFER',
      entityId: offer.id,
      description: `Employee ${approved ? 'approved' : 'rejected'} offer: ${offer.title}`,
      metadata: JSON.stringify({
        validationNotes,
        itemCount: updatedOffer._count.items
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Notify trader about validation result (wrap in try-catch to prevent blocking)
  try {
    await notifyOfferAction(updatedOffer, approved ? 'APPROVED' : 'REJECTED');
  } catch (notificationError) {
    // Log error but don't block the response
    console.error('Failed to create notifications:', notificationError);
  }

  successResponse(res, updatedOffer, `Offer ${approved ? 'approved' : 'rejected'} successfully`);
});

/**
 * @desc    Update Offer (Employee only)
 * @route   PUT /api/employees/offers/:id
 * @access  Private (Employee)
 */
const updateOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    images,
    country,
    city,
    categoryId,
    acceptsNegotiation
  } = req.body;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { trader: true }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  // Verify employee is linked to this trader
  if (offer.trader.employeeId !== req.user.id) {
    return errorResponse(res, 'Not authorized to update this offer', 403);
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (images !== undefined) {
    updateData.images = Array.isArray(images) ? JSON.stringify(images) : images;
  }
  if (country) updateData.country = country;
  if (city) updateData.city = city;
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }
    updateData.categoryId = parseInt(categoryId);
  }
  if (acceptsNegotiation !== undefined) {
    updateData.acceptsNegotiation = acceptsNegotiation === true || acceptsNegotiation === 'true';
  }

  // If status is REJECTED and we're updating, change to PENDING_VALIDATION
  if (offer.status === 'REJECTED') {
    updateData.status = 'PENDING_VALIDATION';
  }

  const updatedOffer = await prisma.offer.update({
    where: { id },
    data: updateData,
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true
        }
      },
      items: {
        take: 10
      },
      _count: {
        select: {
          items: true
        }
      }
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: 'EMPLOYEE',
      action: 'OFFER_UPDATED',
      entityType: 'OFFER',
      entityId: offer.id,
      description: `Employee updated offer: ${offer.title}`,
      metadata: JSON.stringify(updateData),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Notify trader about the update
  try {
    await notifyOfferAction(updatedOffer, 'UPDATED', 'EMPLOYEE');
  } catch (notificationError) {
    console.error('Failed to create notifications:', notificationError);
  }

  successResponse(res, updatedOffer, 'Offer updated successfully');
});

/**
 * @desc    Upload Excel file to Offer (Employee)
 * @route   POST /api/employees/offers/:id/upload-excel
 * @access  Private (Employee)
 */
const uploadOfferExcelEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return errorResponse(res, 'Please upload an Excel file', 400);
  }

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { trader: true }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  // Verify employee is linked to this trader
  if (offer.trader.employeeId !== req.user.id) {
    return errorResponse(res, 'Not authorized to upload Excel for this offer', 403);
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return errorResponse(res, 'Excel file is empty', 400);
    }

    // Extract images from Excel file
    const imagesDir = path.join(__dirname, '../../uploads/images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const excelImages = worksheet.getImages();
    const imageMap = new Map();

    for (const image of excelImages) {
      const imageId = image.imageId;
      const imageFile = workbook.model.media[imageId - 1];
      
      if (imageFile && imageFile.buffer) {
        const rowNumber = image.range.tl.nativeRow + 1;
        const extension = imageFile.extension || 'png';
        const imageFilename = `offer-${offer.id}-item-${rowNumber}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const imagePath = path.join(imagesDir, imageFilename);
        
        fs.writeFileSync(imagePath, imageFile.buffer);
        const imageUrl = `/uploads/images/${imageFilename}`;
        
        if (!imageMap.has(rowNumber)) {
          imageMap.set(rowNumber, []);
        }
        imageMap.get(rowNumber).push(imageUrl);
      }
    }

    const items = [];
    let totalCartons = 0;
    let totalCBM = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowImages = imageMap.get(rowNumber) || [];
      const imageCellValue = row.getCell(2)?.value?.toString() || '';
      let cellImageUrls = [];
      
      if (imageCellValue && (imageCellValue.startsWith('http') || imageCellValue.startsWith('/uploads') || imageCellValue.startsWith('uploads'))) {
        cellImageUrls = imageCellValue.split(',').map(url => url.trim()).filter(url => url);
      }

      const allImages = [...rowImages, ...cellImageUrls];

      const itemNo = row.getCell(3)?.value?.toString() || '';
      const productName = row.getCell(4)?.value?.toString() || itemNo || '';
      const description = row.getCell(4)?.value?.toString() || null;
      const colour = row.getCell(5)?.value?.toString() || null;
      const spec = row.getCell(6)?.value?.toString() || null;
      const quantity = parseInt(row.getCell(7)?.value) || 0;
      const unit = row.getCell(8)?.value?.toString() || 'SET';
      const unitPrice = parseFloat(row.getCell(9)?.value) || 0;
      const currency = row.getCell(10)?.value?.toString() || 'USD';
      const amount = parseFloat(row.getCell(11)?.value) || 0;
      const packing = row.getCell(12)?.value?.toString() || null;
      const packageQuantity = parseInt(row.getCell(13)?.value) || 0;
      const unitGW = parseFloat(row.getCell(14)?.value) || 0;
      const totalGW = parseFloat(row.getCell(15)?.value) || 0;
      const length = parseFloat(row.getCell(16)?.value) || null;
      const width = parseFloat(row.getCell(17)?.value) || null;
      const height = parseFloat(row.getCell(18)?.value) || null;
      const excelTotalCBM = parseFloat(row.getCell(19)?.value) || null;

      if ((!productName && !itemNo) || quantity === 0) return;

      let calculatedCBM = 0;
      if (length && width && height && packageQuantity) {
        const cbmPerUnit = (length * width * height) / 1000000;
        calculatedCBM = cbmPerUnit * packageQuantity;
      }
      
      const finalCBM = excelTotalCBM || calculatedCBM;

      // Prepare notes as JSON string with extra metadata
      const notesData = {
        itemNo: itemNo || null,
        colour: colour || null,
        spec: spec || null,
        unit: unit || 'SET',
        unitPrice: unitPrice || 0,
        currency: currency || 'USD',
        amount: amount || (quantity * unitPrice) || 0,
        packing: typeof packing === 'string' ? packing : null,
        packageQuantity: packageQuantity || 0,
        unitGW: unitGW || null,
        totalGW: totalGW || null,
        cartonLength: length || null,
        cartonWidth: width || null,
        cartonHeight: height || null
      };
      
      items.push({
        offerId: offer.id,
        productName: productName || itemNo || `Item ${items.length + 1}`,
        description: description || null,
        quantity,
        cartons: packageQuantity || 0, // Use cartons field instead of packageQuantity
        length: length || null,
        width: width || null,
        height: height || null,
        cbm: finalCBM.toFixed(4),
        weight: totalGW || null,
        displayOrder: items.length + 1,
        images: allImages.length > 0 ? JSON.stringify(allImages) : null,
        notes: JSON.stringify(notesData) // Store extra metadata in notes
      });

      totalCartons += packageQuantity;
      totalCBM += finalCBM;
    });

    // Get existing items that are linked to deals (cannot be deleted)
    const existingItemsWithDeals = await prisma.offerItem.findMany({
      where: {
        offerId: offer.id,
        dealItems: {
          some: {}
        }
      },
      select: { id: true }
    });

    const itemIdsWithDeals = existingItemsWithDeals.map(item => item.id);

    // Delete only items that are NOT linked to any deals
    await prisma.offerItem.deleteMany({
      where: {
        offerId: offer.id,
        id: {
          notIn: itemIdsWithDeals
        }
      }
    });

    // Create new items
    await prisma.offerItem.createMany({
      data: items
    });

    // Update offer totals
    const updatedOffer = await prisma.offer.update({
      where: { id: offer.id },
      data: {
        totalCartons,
        totalCBM,
        excelFileUrl: req.file.path,
        status: 'PENDING_VALIDATION'
      },
      include: {
        items: true,
        _count: {
          select: {
            items: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        userType: 'EMPLOYEE',
        action: 'OFFER_EXCEL_UPLOADED',
        entityType: 'OFFER',
        entityId: offer.id,
        description: `Employee uploaded Excel file with ${items.length} items`,
        metadata: JSON.stringify({
          itemCount: items.length,
          totalCartons,
          totalCBM
        }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Notify trader about Excel upload by employee
    try {
      await notifyOfferAction(updatedOffer, 'EXCEL_UPLOADED', 'EMPLOYEE');
    } catch (notificationError) {
      console.error('Failed to create notifications:', notificationError);
    }

    successResponse(res, updatedOffer, 'Excel file uploaded and processed successfully');
  } catch (error) {
    console.error('Excel processing error:', error);
    return errorResponse(res, `Error processing Excel file: ${error.message}`, 500);
  }
});

/**
 * @desc    Get Offer details
 * @route   GET /api/offers/:id
 * @access  Public/Private
 */
const getOfferById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true,
          country: true,
          city: true
        }
      },
      categoryRelation: {
        select: {
          id: true,
          nameKey: true,
          slug: true,
          isFeatured: true,
          descriptionKey: true
        }
      },
      items: {
        orderBy: { displayOrder: 'asc' }
      },
      _count: {
        select: {
          items: true,
          deals: true
        }
      }
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  // Authorization checks - optional authentication (public route with optional user context)
  // Check if req.user exists (set by protect middleware if token provided)
  // If no token, treat as public access
  if (!req.user) {
    // Public: Only show active offers
    if (offer.status !== 'ACTIVE') {
      return errorResponse(res, 'Offer not found', 404);
    }
  } else if (req.userType === 'TRADER') {
    // Trader: Only show their own offers (regardless of status)
    if (offer.traderId !== req.user.id) {
      return errorResponse(res, 'Not authorized to view this offer', 403);
    }
  } else if (req.userType === 'EMPLOYEE') {
    // Employee: Only show offers from their linked traders
    const trader = await prisma.trader.findUnique({
      where: { id: offer.traderId },
      select: { employeeId: true }
    });
    if (!trader || trader.employeeId !== req.user.id) {
      return errorResponse(res, 'Not authorized to view this offer', 403);
    }
  } else if (req.userType === 'ADMIN') {
    // Admin can view all offers
  } else if (req.userType === 'CLIENT') {
    // Client can view active offers
    if (offer.status !== 'ACTIVE') {
      return errorResponse(res, 'Offer not found', 404);
    }
  }

  // Parse JSON fields
  if (offer.images) {
    try {
      offer.images = typeof offer.images === 'string' ? JSON.parse(offer.images) : offer.images;
    } catch (e) {
      offer.images = [];
    }
  }
  
  // Parse images for each item
  if (offer.items && Array.isArray(offer.items)) {
    offer.items = offer.items.map(item => {
      if (item.images) {
        try {
          item.images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
        } catch (e) {
          item.images = [];
        }
      }
      return item;
    });
  }

  // Fetch platform settings for commission display
  const platformSettings = await prisma.platformSettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  successResponse(res, { offer, platformSettings }, 'Offer retrieved successfully');
});

/**
 * @desc    Get all active Offers (Public)
 * @route   GET /api/offers
 * @access  Public
 */
const getActiveOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, traderId, country, city, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: 'ACTIVE'
  };

  if (traderId) where.traderId = parseInt(traderId);
  if (country) where.trader = { country };
  if (city) where.trader = { ...where.trader, city };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            companyName: true,
            traderCode: true,
            country: true,
            city: true
          }
        },
        // Note: categoryRelation may not exist in schema-mediation.prisma
        // categoryRelation: {
        //   select: {
        //     id: true,
        //     nameKey: true,
        //     slug: true,
        //     isFeatured: true
        //   }
        // },
        _count: {
          select: {
            items: true,
            deals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.offer.count({ where })
  ]);

  paginatedResponse(res, offers, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Offers retrieved successfully');
});

/**
 * @desc    Get All Offers (Admin only)
 * @route   GET /api/admin/offers
 * @access  Private (Admin)
 */
const getAllOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, traderId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (status) where.status = status;
  if (traderId) where.traderId = parseInt(traderId);

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            companyName: true,
            traderCode: true
          }
        },
        _count: {
          select: {
            items: true,
            deals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.offer.count({ where })
  ]);

  paginatedResponse(res, offers, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Offers retrieved successfully');
});

/**
 * @desc    Get Employee's Offers (from their traders)
 * @route   GET /api/employees/offers
 * @access  Private (Employee)
 */
const getEmployeeOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, categoryId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get all traders linked to this employee
  const traders = await prisma.trader.findMany({
    where: { employeeId: req.user.id },
    select: { id: true }
  });

  const traderIds = traders.map(t => t.id);

  if (traderIds.length === 0) {
    return paginatedResponse(res, [], {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
      pages: 0
    }, 'No traders assigned to this employee');
  }

  const where = {
    traderId: { in: traderIds }
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (status) where.status = status;
  if (categoryId) where.categoryId = parseInt(categoryId);

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            companyName: true,
            traderCode: true
          }
        },
        // Note: categoryRelation may not exist in schema-mediation.prisma
        // categoryRelation: {
        //   select: {
        //     id: true,
        //     nameKey: true,
        //     slug: true,
        //     isFeatured: true
        //   }
        // },
        _count: {
          select: {
            items: true,
            deals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.offer.count({ where })
  ]);

  paginatedResponse(res, offers, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Employee offers retrieved successfully');
});

/**
 * @desc    Delete Offer (Employee/Admin)
 * @route   DELETE /api/employees/offers/:id
 * @access  Private (Employee/Admin)
 */
const deleteOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      trader: true,
      _count: {
        select: {
          deals: true,
          items: true
        }
      }
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  // Check authorization
  // Admin can delete any offer
  // Employee can only delete offers from their traders
  if (req.userType === 'EMPLOYEE' && offer.trader.employeeId !== req.user.id) {
    return errorResponse(res, 'Not authorized to delete this offer', 403);
  }

  // Check if offer has deals
  if (offer._count.deals > 0) {
    return errorResponse(res, 'Cannot delete offer with existing deals', 400);
  }

  // Notify trader before deleting (we need to do this before deletion)
  try {
    await notifyOfferAction(offer, 'DELETED', req.userType === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN');
  } catch (notificationError) {
    console.error('Failed to create notifications:', notificationError);
  }

  // Delete offer (items will be cascade deleted)
  await prisma.offer.delete({
    where: { id }
  });

  successResponse(res, null, 'Offer deleted successfully');
});

/**
 * @desc    Get recommended offers
 * @route   GET /api/offers/recommended
 * @access  Public
 */
const getRecommendedOffers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get active offers ordered by:
  // 1. Most deals (popular)
  // 2. Most items (comprehensive)
  // 3. Recently created
  const offers = await prisma.offer.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          companyName: true,
          traderCode: true,
          country: true,
          city: true
        }
      },
      _count: {
        select: {
          items: true,
          deals: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: parseInt(limit)
  });

  // Sort by popularity (deals count, then items count) after fetching
  offers.sort((a, b) => {
    // First sort by deals count (descending)
    const dealsDiff = (b._count?.deals || 0) - (a._count?.deals || 0);
    if (dealsDiff !== 0) return dealsDiff;
    
    // Then sort by items count (descending)
    const itemsDiff = (b._count?.items || 0) - (a._count?.items || 0);
    if (itemsDiff !== 0) return itemsDiff;
    
    // Finally sort by creation date (descending)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Parse JSON fields
  const parsedOffers = offers.map(offer => {
    if (offer.images) {
      try {
        offer.images = typeof offer.images === 'string' ? JSON.parse(offer.images) : offer.images;
      } catch (e) {
        offer.images = [];
      }
    }
    return offer;
  });

  successResponse(res, parsedOffers, 'Recommended offers retrieved successfully');
});

/**
 * @desc    Get offers by category
 * @route   GET /api/offers/by-category/:categoryId
 * @access  Public
 */
const getOffersByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const category = await prisma.category.findUnique({
    where: { id: parseInt(categoryId) }
  });

  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  const where = {
    categoryId: parseInt(categoryId),
    status: 'ACTIVE'
  };

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            companyName: true,
            traderCode: true,
            country: true,
            city: true
          }
        },
        categoryRelation: {
          select: {
            id: true,
            nameKey: true,
            slug: true
          }
        },
        _count: {
          select: {
            items: true,
            deals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.offer.count({ where })
  ]);

  // Parse JSON fields
  const parsedOffers = offers.map(offer => {
    if (offer.images) {
      try {
        offer.images = typeof offer.images === 'string' ? JSON.parse(offer.images) : offer.images;
      } catch (e) {
        offer.images = [];
      }
    }
    return offer;
  });

  paginatedResponse(res, parsedOffers, { 
    page: parseInt(page), 
    limit: parseInt(limit), 
    total, 
    pages: Math.ceil(total / parseInt(limit)) 
  }, `Offers for category ${category.nameKey} retrieved successfully`);
});

module.exports = {
  createOffer,
  uploadOfferExcel,
  uploadOfferExcelEmployee,
  validateOffer,
  updateOffer,
  getOfferById,
  getActiveOffers,
  getAllOffers,
  getEmployeeOffers,
  deleteOffer,
  getRecommendedOffers,
  getOffersByCategory
};

