const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { generateInvoiceQRCode } = require('./qrcode.service');

/**
 * Generate detailed PDF invoice
 * @param {Object} invoiceData - Invoice data
 * @param {string} outputPath - Path to save PDF
 * @returns {Promise<string>} Path to generated PDF
 */
const generateDetailedInvoicePDF = async (invoiceData, outputPath) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('gray').text(`Invoice #${invoiceData.invoiceNumber}`, { align: 'center' });
      doc.moveDown(1);

      // Company Info (if available)
      if (invoiceData.platformInfo) {
        doc.fontSize(10).font('Helvetica').fillColor('black');
        doc.text(invoiceData.platformInfo.name || 'Stockship', { align: 'right' });
        if (invoiceData.platformInfo.address) {
          doc.text(invoiceData.platformInfo.address, { align: 'right' });
        }
        if (invoiceData.platformInfo.phone) {
          doc.text(`Phone: ${invoiceData.platformInfo.phone}`, { align: 'right' });
        }
        if (invoiceData.platformInfo.email) {
          doc.text(`Email: ${invoiceData.platformInfo.email}`, { align: 'right' });
        }
        doc.moveDown(1);
      }

      // Bill To / Ship To Section
      const startY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
      doc.text('Bill To:', 50, startY);
      doc.font('Helvetica');
      doc.text(invoiceData.client.name || 'N/A', 50, startY + 15);
      if (invoiceData.client.email) {
        doc.text(invoiceData.client.email, 50, startY + 28);
      }
      if (invoiceData.client.phone) {
        doc.text(invoiceData.client.phone, 50, startY + 40);
      }
      if (invoiceData.client.city || invoiceData.client.country) {
        const address = [invoiceData.client.city, invoiceData.client.country].filter(Boolean).join(', ');
        doc.text(address, 50, startY + 52);
      }

      // Trader Info
      doc.font('Helvetica-Bold').text('Sold By:', 300, startY);
      doc.font('Helvetica');
      doc.text(invoiceData.trader.companyName || invoiceData.trader.name || 'N/A', 300, startY + 15);
      if (invoiceData.trader.email) {
        doc.text(invoiceData.trader.email, 300, startY + 28);
      }
      if (invoiceData.trader.phone) {
        doc.text(invoiceData.trader.phone, 300, startY + 40);
      }
      if (invoiceData.trader.companyAddress) {
        doc.text(invoiceData.trader.companyAddress.substring(0, 40), 300, startY + 52);
      }

      doc.moveDown(2);

      // Invoice Details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Deal Number: ${invoiceData.dealNumber}`, 50);
      doc.text(`Invoice Date: ${invoiceData.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50);
      if (invoiceData.issuedAt) {
        doc.text(`Issued At: ${new Date(invoiceData.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50);
      }
      doc.moveDown(1);

      // Items Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.fillColor('black');
      doc.text('Item', 50, tableTop);
      doc.text('Description', 150, tableTop);
      doc.text('Qty', 350, tableTop);
      doc.text('Cartons', 400, tableTop);
      doc.text('CBM', 450, tableTop);
      doc.text('Amount', 500, tableTop);

      // Draw line under header
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Items
      let currentY = tableTop + 25;
      doc.font('Helvetica').fontSize(8).fillColor('black');
      
      if (invoiceData.items && invoiceData.items.length > 0) {
        invoiceData.items.forEach((item, index) => {
          const offerItem = item.offerItem || {};
          const itemName = offerItem.productName || `Item ${index + 1}`;
          const description = offerItem.description || offerItem.spec || '';
          const quantity = item.quantity || 0;
          const cartons = item.cartons || 0;
          const cbm = parseFloat(item.cbm || 0).toFixed(3);
          const amount = parseFloat(item.negotiatedPrice || 0) * quantity;

          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          doc.text(itemName.substring(0, 20), 50, currentY);
          doc.text(description.substring(0, 25), 150, currentY);
          doc.text(quantity.toString(), 350, currentY);
          doc.text(cartons.toString(), 400, currentY);
          doc.text(cbm, 450, currentY);
          doc.text(`$${amount.toFixed(2)}`, 500, currentY);
          
          currentY += 15;
        });
      } else {
        doc.text('No items', 50, currentY);
        currentY += 15;
      }

      // Summary Section
      const summaryY = Math.max(currentY + 20, 600);
      doc.font('Helvetica').fontSize(10);

      // Subtotal
      doc.text('Subtotal:', 400, summaryY);
      doc.text(`$${parseFloat(invoiceData.subtotal || 0).toFixed(2)}`, 500, summaryY);
      currentY = summaryY + 15;

      // Platform Commission
      if (invoiceData.platformCommission > 0) {
        doc.text('Platform Commission:', 400, currentY);
        doc.text(`$${parseFloat(invoiceData.platformCommission).toFixed(2)}`, 500, currentY);
        currentY += 15;
      }

      // Shipping Commission
      if (invoiceData.shippingCommission > 0) {
        doc.text('Shipping Commission:', 400, currentY);
        doc.text(`$${parseFloat(invoiceData.shippingCommission).toFixed(2)}`, 500, currentY);
        currentY += 15;
      }

      // Employee Commission
      if (invoiceData.employeeCommission > 0) {
        doc.text('Employee Commission:', 400, currentY);
        doc.text(`$${parseFloat(invoiceData.employeeCommission).toFixed(2)}`, 500, currentY);
        currentY += 15;
      }

      // Tax (if applicable)
      if (invoiceData.tax && invoiceData.tax > 0) {
        doc.text('Tax:', 400, currentY);
        doc.text(`$${parseFloat(invoiceData.tax).toFixed(2)}`, 500, currentY);
        currentY += 15;
      }

      // Total
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total:', 400, currentY + 5);
      doc.text(`$${parseFloat(invoiceData.total || 0).toFixed(2)}`, 500, currentY + 5);

      // Draw line above total
      doc.moveTo(400, currentY).lineTo(550, currentY).stroke();

      // QR Code (if available)
      if (invoiceData.qrCodeUrl) {
        try {
          // Convert base64 data URL to buffer
          const base64Data = invoiceData.qrCodeUrl.replace(/^data:image\/png;base64,/, '');
          const qrImageBuffer = Buffer.from(base64Data, 'base64');
          
          // Add QR code at bottom
          const qrSize = 80;
          const qrX = 50;
          const qrY = summaryY + 100;
          
          doc.image(qrImageBuffer, qrX, qrY, { width: qrSize, height: qrSize });
          doc.font('Helvetica').fontSize(8).fillColor('gray');
          doc.text('Scan to verify invoice', qrX, qrY + qrSize + 5);
        } catch (qrError) {
          console.error('Error adding QR code to PDF:', qrError);
        }
      }

      // Footer
      const footerY = 750;
      doc.font('Helvetica').fontSize(8).fillColor('gray');
      doc.text('Thank you for your business!', 50, footerY, { align: 'center', width: 500 });
      if (invoiceData.platformInfo?.email) {
        doc.text(`For inquiries, contact: ${invoiceData.platformInfo.email}`, 50, footerY + 10, { align: 'center', width: 500 });
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate invoice with QR code
 * @param {Object} invoice - Invoice object from database
 * @param {Object} deal - Deal object with relations
 * @param {Object} platformInfo - Platform information (optional)
 * @returns {Promise<Object>} Invoice with QR code URL and PDF path
 */
const generateInvoiceWithQRCode = async (invoice, deal, platformInfo = null) => {
  try {
    // Generate QR code for invoice
    const qrCodeUrl = await generateInvoiceQRCode(invoice, deal);

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      dealNumber: deal.dealNumber,
      date: invoice.issuedAt || invoice.createdAt,
      issuedAt: invoice.issuedAt,
      client: deal.client || {},
      trader: deal.trader || {},
      items: deal.items || [],
      subtotal: parseFloat(invoice.subtotal || 0),
      platformCommission: parseFloat(invoice.platformCommission || 0),
      shippingCommission: parseFloat(invoice.shippingCommission || 0),
      employeeCommission: parseFloat(invoice.employeeCommission || 0),
      traderAmount: parseFloat(invoice.traderAmount || 0),
      tax: invoice.tax ? parseFloat(invoice.tax) : 0,
      total: parseFloat(invoice.total || 0),
      qrCodeUrl,
      platformInfo
    };

    // Generate PDF
    const invoiceDir = path.join(__dirname, '../../uploads/invoices');
    const pdfFileName = `${invoice.invoiceNumber}.pdf`;
    const pdfPath = path.join(invoiceDir, pdfFileName);

    await generateDetailedInvoicePDF(invoiceData, pdfPath);

    return {
      qrCodeUrl,
      pdfPath,
      pdfUrl: `/uploads/invoices/${pdfFileName}`
    };
  } catch (error) {
    console.error('Error generating invoice with QR code:', error);
    throw error;
  }
};

module.exports = {
  generateDetailedInvoicePDF,
  generateInvoiceWithQRCode
};


