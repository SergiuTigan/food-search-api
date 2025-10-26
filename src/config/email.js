const nodemailer = require('nodemailer');

/**
 * Email Service Configuration
 */
class EmailService {
  constructor() {
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'dobby.devhub.tech',
      port: emailPort,
      secure: emailPort === 465, // true for 465 (SSL/TLS), false for 587 (will use STARTTLS)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    this.fromAddress = process.env.EMAIL_FROM || 'Dobby Food Search <noreply@dobby.devhub.tech>';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} True if email is configured correctly
   */
  async testConfig() {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      // Add a 5-second timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );

      await Promise.race([
        this.transporter.verify(),
        timeoutPromise
      ]);

      console.log('✓ Email server is ready to send messages');
      return true;
    } catch (error) {
      console.error('⚠ Email configuration error:', error.message);
      return false;
    }
  }

  /**
   * Check if email is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD &&
      process.env.EMAIL_USER !== 'your-email@gmail.com' &&
      process.env.EMAIL_PASSWORD !== 'your-app-password' &&
      process.env.EMAIL_PASSWORD !== 'your-cpanel-password-here'
    );
  }

  /**
   * Send a generic email
   * @param {Object} options - Email options (to, from, subject, html, text)
   * @returns {Promise<Object>} Result object
   */
  async sendEmail(options) {
    if (!this.isConfigured()) {
      console.log('⚠ Email not configured - skipping send');
      return { success: false, error: 'Email not configured' };
    }

    try {
      const mailOptions = {
        from: options.from || this.fromAddress, // Allow custom FROM address
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML if no text provided
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✓ Email sent to:', options.to);
      return { success: true };
    } catch (error) {
      console.error('✗ Failed to send email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send meal options notification to users
   * @param {string} weekStartDate - Week start date
   * @param {Array} users - Array of user objects
   * @returns {Promise<Object>} Result object with sent/failed counts
   */
  async sendMealOptionsNotification(weekStartDate, users) {
    if (!this.isConfigured()) {
      console.log('⚠ Email not configured - skipping notification');
      return { success: false, error: 'Email not configured' };
    }

    if (!users || users.length === 0) {
      console.log('⚠ No users to notify');
      return { success: false, error: 'No users to notify' };
    }

    const selectMealsUrl = `${this.appUrl}/select-meals.html`;
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const user of users) {
      try {
        const mailOptions = {
          from: this.fromAddress,
          to: user.email,
          subject: `🍽️ Opțiuni Mâncare Disponibile - Săptămâna ${weekStartDate}`,
          html: this._buildEmailTemplate(weekStartDate, selectMealsUrl),
          text: this._buildTextTemplate(weekStartDate, selectMealsUrl)
        };

        await this.transporter.sendMail(mailOptions);
        console.log('✓ Email sent to:', user.email);
        results.sent++;
      } catch (error) {
        console.error('✗ Failed to send email to:', user.email, '-', error.message);
        results.failed++;
        results.errors.push({ email: user.email, error: error.message });
      }
    }

    console.log(`\n✓ Email notification summary: ${results.sent} sent, ${results.failed} failed`);
    return {
      success: results.sent > 0,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    };
  }

  /**
   * Build HTML email template
   * @private
   */
  _buildEmailTemplate(weekStartDate, selectMealsUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #0a0a0a;
            color: #39FF14;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f5f5f5;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #39FF14;
            color: #0a0a0a;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .info-box {
            background: #fff;
            padding: 15px;
            border-left: 4px solid #39FF14;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍽️ Food Search</h1>
        </div>
        <div class="content">
          <h2>Bună!</h2>
          <p>Opțiunile de mâncare pentru următoarea săptămână au fost publicate!</p>
          <div class="info-box">
            <strong>📅 Săptămâna:</strong> ${weekStartDate}<br>
            <strong>⏰ Termen limită:</strong> Selectează-ți opțiunile cât mai curând!
          </div>
          <p>Te rugăm să îți selectezi opțiunile de mâncare pentru săptămâna viitoare:</p>
          <center>
            <a href="${selectMealsUrl}" class="button">Selectează Mâncarea</a>
          </center>
          <p style="margin-top: 30px;">
            Cu respect,<br>
            <strong>Echipa Food Search</strong>
          </p>
        </div>
        <div class="footer">
          <p>Acest email a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Build plain text email template
   * @private
   */
  _buildTextTemplate(weekStartDate, selectMealsUrl) {
    return `
Bună!

Opțiunile de mâncare pentru următoarea săptămână au fost publicate!

Săptămâna: ${weekStartDate}

Te rugăm să îți selectezi opțiunile de mâncare accesând:
${selectMealsUrl}

Cu respect,
Echipa Food Search
    `.trim();
  }

  /**
   * Send user invitation email
   * @param {string} email - User email
   * @param {string} invitationToken - Invitation token
   * @param {boolean} isAdmin - Whether user will be admin
   * @param {string} invitedByEmail - Email of person who sent invitation
   * @returns {Promise<Object>} Result object
   */
  async sendInvitationEmail(email, invitationToken, isAdmin, invitedByEmail) {
    if (!this.isConfigured()) {
      console.log('⚠ Email not configured - skipping invitation email');
      return { success: false, error: 'Email not configured' };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const invitationUrl = `${frontendUrl}/accept-invitation?token=${invitationToken}`;
    const roleText = isAdmin ? 'Administrator' : 'User';

    try {
      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: `🎉 You've been invited to Dobby - Food Ordering System`,
        html: this._buildInvitationTemplate(email, invitationUrl, roleText, invitedByEmail),
        text: this._buildInvitationTextTemplate(email, invitationUrl, roleText, invitedByEmail)
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✓ Invitation email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('✗ Failed to send invitation email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build invitation HTML email template
   * @private
   */
  _buildInvitationTemplate(email, invitationUrl, roleText, invitedByEmail) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .info-box {
            background: white;
            padding: 20px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
            border-radius: 4px;
          }
          .role-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
          .warning {
            background: #fef3c7;
            padding: 15px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to Dobby!</h1>
          <p style="margin: 0; opacity: 0.9;">Food Ordering Made Simple</p>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p><strong>${invitedByEmail}</strong> has invited you to join the Dobby food ordering system.</p>

          <div class="info-box">
            <p style="margin: 0;"><strong>📧 Your Email:</strong> ${email}</p>
            <p style="margin: 10px 0 0 0;"><strong>🔑 Account Type:</strong> <span class="role-badge">${roleText}</span></p>
          </div>

          <p>Click the button below to accept your invitation and set up your account password:</p>

          <center>
            <a href="${invitationUrl}" class="button">Accept Invitation & Set Password</a>
          </center>

          <div class="warning">
            <p style="margin: 0;"><strong>⏰ Important:</strong> This invitation link will expire in 48 hours. Make sure to complete your registration soon!</p>
          </div>

          <p>Once you've set your password, you'll be able to:</p>
          <ul>
            <li>🍽️ Browse and select meals for the week</li>
            <li>⭐ Rate and review meals</li>
            <li>📊 View your meal history</li>
            <li>🔍 Search for colleague selections</li>
            ${isAdmin ? '<li>👑 Manage meal options and users (Admin)</li>' : ''}
          </ul>

          <p style="margin-top: 30px;">
            If you have any questions, feel free to reply to this email.<br><br>
            Looking forward to having you on board!<br>
            <strong>The Dobby Team</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated invitation email. If you didn't expect this invitation, you can safely ignore it.</p>
          <p>The invitation link will expire automatically.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Build invitation plain text email template
   * @private
   */
  _buildInvitationTextTemplate(email, invitationUrl, roleText, invitedByEmail) {
    return `
Hello!

${invitedByEmail} has invited you to join the Dobby food ordering system.

Your Email: ${email}
Account Type: ${roleText}

Accept your invitation and set up your password by visiting:
${invitationUrl}

IMPORTANT: This invitation link will expire in 48 hours.

Once you've set your password, you'll be able to:
- Browse and select meals for the week
- Rate and review meals
- View your meal history
- Search for colleague selections
${isAdmin ? '- Manage meal options and users (Admin privileges)' : ''}

If you have any questions, feel free to reply to this email.

Looking forward to having you on board!
The Dobby Team

---
This is an automated invitation email. If you didn't expect this invitation, you can safely ignore it.
    `.trim();
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
