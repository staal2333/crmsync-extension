const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Email Service for CRMSYNC
 * Handles sending transactional emails (welcome, verification, password reset, etc.)
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = config.email?.from || 'CRMSYNC <noreply@crm-sync.net>';
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  initialize() {
    // Use environment variables for email configuration
    const emailConfig = config.email;

    if (!emailConfig || !emailConfig.host) {
      console.warn('⚠️ Email service not configured. Emails will not be sent.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port || 587,
        secure: emailConfig.secure || false, // true for 465, false for other ports
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      console.warn('⚠️ Email not sent (service not configured):', { to, subject });
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text: text || this.stripHtml(html), // Fallback to stripped HTML
      });

      console.log('✅ Email sent:', { to, subject, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #718096; font-size: 14px; }
          .feature { margin: 15px 0; padding-left: 30px; position: relative; }
          .feature:before { content: '✓'; position: absolute; left: 0; color: #667eea; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">Welcome to CRMSYNC! 🎉</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Hi <strong>${user.displayName || user.email}</strong>,</p>
            
            <p>Thank you for signing up for CRMSYNC! We're excited to have you on board.</p>
            
            <p><strong>Your account is ready to go!</strong> Here's what you can do now:</p>
            
            <div class="feature">Extract contacts from Gmail automatically</div>
            <div class="feature">Manage up to 50 contacts (Free tier)</div>
            <div class="feature">Export your contacts to CSV</div>
            <div class="feature">Sync across all your devices</div>
            
            <center>
              <a href="https://www.crm-sync.net/#/login" class="button">Get Started</a>
            </center>
            
            <p style="margin-top: 30px;">Need help getting started? Check out our <a href="https://www.crm-sync.net/#/docs" style="color: #667eea;">documentation</a> or reply to this email.</p>
            
            <p style="margin-top: 30px;">Happy networking!<br>
            <strong>The CRMSYNC Team</strong></p>
          </div>
          <div class="footer">
            <p>You received this email because you signed up for CRMSYNC.</p>
            <p>CRMSYNC · <a href="https://www.crm-sync.net" style="color: #667eea;">www.crm-sync.net</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🎉 Welcome to CRMSYNC - Your Account is Ready!',
      html,
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${config.frontend.url}/#/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #718096; font-size: 14px; }
          .code-box { background: #f7fafc; border: 2px dashed #cbd5e0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">Verify Your Email 📧</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Hi <strong>${user.displayName || user.email}</strong>,</p>
            
            <p>Thanks for signing up for CRMSYNC! To complete your registration, please verify your email address.</p>
            
            <center>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </center>
            
            <p style="text-align: center; margin-top: 20px; color: #718096;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all; font-size: 13px;">${verificationUrl}</a>
            </p>
            
            <p style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
              If you didn't create an account with CRMSYNC, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>This verification link will expire in 24 hours.</p>
            <p>CRMSYNC · <a href="https://www.crm-sync.net" style="color: #667eea;">www.crm-sync.net</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '✅ Verify Your CRMSYNC Email Address',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${config.frontend.url}/#/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #718096; font-size: 14px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">Reset Your Password 🔐</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Hi <strong>${user.displayName || user.email}</strong>,</p>
            
            <p>We received a request to reset your CRMSYNC password. Click the button below to create a new password:</p>
            
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            
            <p style="text-align: center; margin-top: 20px; color: #718096;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all; font-size: 13px;">${resetUrl}</a>
            </p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </div>
            
            <p style="margin-top: 30px; color: #718096; font-size: 14px;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at support@crm-sync.net</p>
            <p>CRMSYNC · <a href="https://www.crm-sync.net" style="color: #667eea;">www.crm-sync.net</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🔐 Reset Your CRMSYNC Password',
      html,
    });
  }

  /**
   * Strip HTML tags for plain text version
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    if (!this.transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
