const emailService = require('../config/email');
const databaseService = require('../services/database.service');

/**
 * Feedback Controller
 * Handles user feedback submissions
 */
class FeedbackController {
  /**
   * Submit feedback
   * @route POST /api/feedback
   */
  async submitFeedback(req, res) {
    try {
      const { subject, message } = req.body;
      const user = req.user;

      if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
      }

      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log('\n=== Feedback Submission ===');
      console.log(`From: ${user.email}`);
      console.log(`Subject: ${subject}`);

      // Save feedback to database
      const savedFeedback = await databaseService.saveFeedback(user.id, subject, message);
      console.log('✓ Feedback saved to database');

      // Try to send email (but don't fail if email is not configured)
      if (emailService.isConfigured()) {
        const feedbackEmail = {
          to: 'sergiu.tigan@devhub.tech',
          from: 'dobby@devhub.tech',
          subject: `Feedback from ${user.employee_name || user.email} - ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">New Feedback from Dobby App</h2>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>From:</strong> ${user.employee_name || 'Unknown'} (${user.email})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString('ro-RO')}</p>
              </div>

              <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="color: #374151;">Message:</h3>
                <p style="white-space: pre-wrap; color: #1f2937;">${message}</p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>💡 Tip:</strong> This feedback was submitted through the Dobby meal selection app.
                </p>
              </div>
            </div>
          `
        };

        const emailResult = await emailService.sendEmail(feedbackEmail);
        if (emailResult.success) {
          console.log('✓ Feedback email sent successfully');
        } else {
          console.log('⚠ Email not sent, but feedback saved to database');
        }
      } else {
        console.log('⚠ Email not configured, feedback saved to database only');
      }

      res.json({
        success: true,
        message: 'Feedback sent successfully',
        id: savedFeedback.id
      });
    } catch (error) {
      console.error('Feedback submission error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get all feedback (admin only)
   * @route GET /api/feedback
   */
  async getAllFeedback(req, res) {
    try {
      const feedback = await databaseService.getAllFeedback();
      res.json({ feedback });
    } catch (error) {
      console.error('Get feedback error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Update feedback status (admin only)
   * @route PATCH /api/feedback/:id
   */
  async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      await databaseService.updateFeedbackStatus(id, status);
      res.json({ success: true, message: 'Feedback status updated' });
    } catch (error) {
      console.error('Update feedback status error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new FeedbackController();
