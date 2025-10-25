const nodemailer = require('nodemailer');

/**
 * Email Service Configuration
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    this.fromAddress = process.env.EMAIL_FROM || 'Food Search <noreply@devhub.tech>';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} True if email is configured correctly
   */
  async testConfig() {
    try {
      await this.transporter.verify();
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
      process.env.EMAIL_USER !== 'your-email@gmail.com'
    );
  }

  /**
   * Send a generic email
   * @param {Object} options - Email options (to, subject, html, text)
   * @returns {Promise<Object>} Result object
   */
  async sendEmail(options) {
    if (!this.isConfigured()) {
      console.log('⚠ Email not configured - skipping send');
      return { success: false, error: 'Email not configured' };
    }

    try {
      const mailOptions = {
        from: this.fromAddress,
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
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
