const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Generate QR Code as Data URL (base64)
 * @param {Object} data - Data to encode in QR code
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Base64 data URL
 */
const generateQRCodeDataURL = async (data, options = {}) => {
  try {
    const qrCodeData = typeof data === 'string' ? data : JSON.stringify(data);
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const qrOptions = { ...defaultOptions, ...options };
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData, qrOptions);
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate QR Code and save as file
 * @param {Object} data - Data to encode in QR code
 * @param {string} filePath - Path to save QR code image
 * @param {Object} options - QR code options
 * @returns {Promise<string>} File path
 */
const generateQRCodeFile = async (data, filePath, options = {}) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const qrCodeData = typeof data === 'string' ? data : JSON.stringify(data);
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const qrOptions = { ...defaultOptions, ...options };
    await QRCode.toFile(filePath, qrCodeData, qrOptions);
    return filePath;
  } catch (error) {
    console.error('Error generating QR code file:', error);
    throw error;
  }
};

/**
 * Generate QR Code for Trader
 * @param {Object} trader - Trader object
 * @returns {Promise<string>} QR code data URL
 */
const generateTraderQRCode = async (trader) => {
  const qrData = {
    type: 'TRADER',
    traderId: trader.id,
    traderCode: trader.traderCode,
    barcode: trader.barcode,
    companyName: trader.companyName
  };
  return await generateQRCodeDataURL(qrData);
};

/**
 * Generate QR Code for Deal
 * @param {Object} deal - Deal object
 * @returns {Promise<string>} QR code data URL
 */
const generateDealQRCode = async (deal) => {
  const qrData = {
    type: 'DEAL',
    dealId: deal.id,
    dealNumber: deal.dealNumber,
    invoiceNumber: deal.invoiceNumber || null,
    barcode: deal.barcode || null,
    status: deal.status
  };
  return await generateQRCodeDataURL(qrData);
};

/**
 * Generate QR Code for Invoice
 * @param {Object} invoice - Invoice object
 * @param {Object} deal - Deal object (optional, for additional info)
 * @returns {Promise<string>} QR code data URL
 */
const generateInvoiceQRCode = async (invoice, deal = null) => {
  const qrData = {
    type: 'INVOICE',
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    dealId: invoice.dealId,
    dealNumber: deal?.dealNumber || null,
    total: parseFloat(invoice.total),
    status: invoice.status,
    issuedAt: invoice.issuedAt?.toISOString() || null
  };
  return await generateQRCodeDataURL(qrData);
};

/**
 * Generate QR Code URL for invoice verification
 * @param {string} invoiceNumber - Invoice number
 * @param {string} baseUrl - Base URL for verification (optional)
 * @returns {Promise<string>} QR code data URL
 */
const generateInvoiceVerificationQRCode = async (invoiceNumber, baseUrl = null) => {
  const verificationUrl = baseUrl 
    ? `${baseUrl}/verify-invoice/${invoiceNumber}`
    : `INVOICE:${invoiceNumber}`;
  
  const qrData = {
    type: 'INVOICE_VERIFICATION',
    invoiceNumber,
    verificationUrl
  };
  return await generateQRCodeDataURL(qrData);
};

module.exports = {
  generateQRCodeDataURL,
  generateQRCodeFile,
  generateTraderQRCode,
  generateDealQRCode,
  generateInvoiceQRCode,
  generateInvoiceVerificationQRCode
};


