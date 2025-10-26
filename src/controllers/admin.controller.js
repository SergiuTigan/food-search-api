const databaseService = require('../services/database.service');
const emailService = require('../config/email');

/**
 * Admin Controller
 * Handles administrative functions and data management
 */
class AdminController {
  /**
   * Get all available weeks
   * @route GET /api/admin/weeks
   */
  async getAllWeeks(req, res) {
    try {
      const weeks = await databaseService.getAllWeeks();
      res.json({ weeks });
    } catch (error) {
      console.error('Get all weeks error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Delete all data for a specific week
   * @route DELETE /api/admin/weeks/:weekStartDate
   */
  async deleteWeekData(req, res) {
    try {
      const { weekStartDate } = req.params;

      if (!weekStartDate) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      await databaseService.deleteWeekData(weekStartDate);
      res.json({ success: true, message: 'Datele pentru săptămâna au fost șterse cu succes' });
    } catch (error) {
      console.error('Delete week data error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get week settings (lock status)
   * @route GET /api/admin/weeks/:weekStartDate/settings
   */
  async getWeekSettings(req, res) {
    try {
      const { weekStartDate } = req.params;

      if (!weekStartDate) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      const settings = await databaseService.getWeekSettings(weekStartDate);
      res.json({ settings: settings || { week_start_date: weekStartDate, is_locked: 0, unlocked_users: '[]' } });
    } catch (error) {
      console.error('Get week settings error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Lock a week
   * @route POST /api/admin/weeks/:weekStartDate/lock
   */
  async lockWeek(req, res) {
    try {
      const { weekStartDate } = req.params;

      if (!weekStartDate) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      await databaseService.lockWeek(weekStartDate);
      res.json({ success: true, message: 'Săptămâna a fost blocată cu succes' });
    } catch (error) {
      console.error('Lock week error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Unlock a week
   * @route POST /api/admin/weeks/:weekStartDate/unlock
   */
  async unlockWeek(req, res) {
    try {
      const { weekStartDate } = req.params;

      if (!weekStartDate) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      await databaseService.unlockWeek(weekStartDate);
      res.json({ success: true, message: 'Săptămâna a fost deblocată cu succes' });
    } catch (error) {
      console.error('Unlock week error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Grant unlock permission to a specific user
   * @route POST /api/admin/weeks/:weekStartDate/grant-unlock/:userId
   */
  async grantUserUnlock(req, res) {
    try {
      const { weekStartDate, userId } = req.params;

      if (!weekStartDate || !userId) {
        return res.status(400).json({ error: 'Week start date and user ID are required' });
      }

      await databaseService.grantUserUnlock(weekStartDate, parseInt(userId));
      res.json({ success: true, message: 'Permisiunea de deblocare a fost acordată utilizatorului' });
    } catch (error) {
      console.error('Grant user unlock error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Revoke unlock permission from a specific user
   * @route POST /api/admin/weeks/:weekStartDate/revoke-unlock/:userId
   */
  async revokeUserUnlock(req, res) {
    try {
      const { weekStartDate, userId } = req.params;

      if (!weekStartDate || !userId) {
        return res.status(400).json({ error: 'Week start date and user ID are required' });
      }

      await databaseService.revokeUserUnlock(weekStartDate, parseInt(userId));
      res.json({ success: true, message: 'Permisiunea de deblocare a fost revocată de la utilizator' });
    } catch (error) {
      console.error('Revoke user unlock error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Test email configuration
   * @route POST /api/admin/test-email
   */
  async testEmail(req, res) {
    try {
      const { to } = req.body;

      if (!to) {
        return res.status(400).json({ error: 'Recipient email address is required' });
      }

      // Check if email is configured
      if (!emailService.isConfigured()) {
        return res.status(400).json({
          error: 'Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your .env file.'
        });
      }

      // Verify connection first
      const isReady = await emailService.testConfig();
      if (!isReady) {
        return res.status(500).json({
          error: 'Failed to connect to email server. Please check your EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD settings.'
        });
      }

      // Send test email
      const result = await emailService.sendEmail({
        to,
        subject: '✅ Test Email from Dobby Food Search',
        html: `
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
              .success-badge {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: bold;
                margin: 20px 0;
              }
              .info-box {
                background: white;
                padding: 20px;
                border-left: 4px solid #667eea;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Email Configuration Test</h1>
              <p style="margin: 0; opacity: 0.9;">Dobby Food Search System</p>
            </div>
            <div class="content">
              <h2>Congratulations!</h2>
              <div class="success-badge">✓ Email Service is Working!</div>

              <p>Your email configuration is working correctly. The SMTP server successfully sent this test email.</p>

              <div class="info-box">
                <p style="margin: 0;"><strong>📧 Recipient:</strong> ${to}</p>
                <p style="margin: 10px 0 0 0;"><strong>🖥️ Server:</strong> ${process.env.EMAIL_HOST || 'dobby.devhub.tech'}</p>
                <p style="margin: 10px 0 0 0;"><strong>🔌 Port:</strong> ${process.env.EMAIL_PORT || '465'} (${parseInt(process.env.EMAIL_PORT || '465') === 465 ? 'SSL/TLS' : 'STARTTLS'})</p>
              </div>

              <p>You can now use the following features:</p>
              <ul>
                <li>📨 Send user invitations</li>
                <li>🍽️ Notify users of new meal options</li>
                <li>🔔 Send automated notifications</li>
              </ul>

              <p style="margin-top: 30px;">
                This is an automated test email.<br>
                <strong>The Dobby Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>Test email sent on ${new Date().toLocaleString()}</p>
            </div>
          </body>
          </html>
        `
      });

      if (result.success) {
        res.json({
          success: true,
          message: `Test email sent successfully to ${to}!`
        });
      } else {
        res.status(500).json({
          error: `Failed to send test email: ${result.error}`
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({
        error: 'Server error while sending test email',
        details: error.message
      });
    }
  }

  /**
   * Notify all users about new meal options
   * @route POST /api/admin/notify-users
   */
  async notifyUsers(req, res) {
    try {
      const { weekStartDate, message } = req.body;

      if (!weekStartDate) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      // Check if email is configured
      if (!emailService.isConfigured()) {
        return res.status(400).json({
          error: 'Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your .env file.'
        });
      }

      // Get all users
      const users = await databaseService.getAllUsers();

      if (!users || users.length === 0) {
        return res.status(400).json({ error: 'No users to notify' });
      }

      // Send notifications
      const result = await emailService.sendMealOptionsNotification(weekStartDate, users);

      if (result.success) {
        res.json({
          success: true,
          message: `Notifications sent successfully to ${result.sent} users`,
          sent: result.sent,
          failed: result.failed,
          errors: result.errors
        });
      } else {
        res.status(500).json({
          error: `Failed to send notifications: ${result.error}`,
          sent: result.sent || 0,
          failed: result.failed || users.length
        });
      }
    } catch (error) {
      console.error('Notify users error:', error);
      res.status(500).json({
        error: 'Server error while sending notifications',
        details: error.message
      });
    }
  }
}

module.exports = new AdminController();
