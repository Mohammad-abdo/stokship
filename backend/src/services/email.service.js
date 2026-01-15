const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Stockship'} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const subject = 'Password Reset Request - Stockship';
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password. Click the link below to reset it:</p>
    <p><a href="${resetUrl}?token=${resetToken}">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return await sendEmail(email, subject, html);
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to Stockship!';
  const html = `
    <h2>Welcome to Stockship, ${name}!</h2>
    <p>Thank you for joining our B2B e-commerce platform.</p>
    <p>You can now start browsing products and making orders.</p>
  `;
  return await sendEmail(email, subject, html);
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, orderNumber, orderDetails) => {
  const subject = `Order Confirmation - ${orderNumber}`;
  const html = `
    <h2>Order Confirmation</h2>
    <p>Your order <strong>${orderNumber}</strong> has been confirmed.</p>
    <p>Total Amount: ${orderDetails.totalAmount}</p>
    <p>Thank you for your purchase!</p>
  `;
  return await sendEmail(email, subject, html);
};

// Send notification email
const sendNotificationEmail = async (email, title, message) => {
  const subject = title;
  const html = `
    <h2>${title}</h2>
    <p>${message}</p>
  `;
  return await sendEmail(email, subject, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendNotificationEmail
};



