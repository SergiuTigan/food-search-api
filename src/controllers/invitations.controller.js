const databaseService = require('../services/database.service');
const emailService = require('../config/email');
const { validateEmail } = require('../utils/validators');
const { generateToken, validatePasswordStrength } = require('../utils/password');

/**
 * Invitations Controller
 * Handles user invitation management
 */
class InvitationsController {
  /**
   * Send user invitation
   * @route POST /api/invitations/send
   */
  async sendInvitation(req, res) {
    try {
      const { email, is_admin = false } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          error: 'Email must be from allowed domains (@devhub.tech, @titans.net, @solidstake.com)'
        });
      }

      // Check if user already exists
      const existingUser = await databaseService.getUserByEmail(email);
      if (existingUser && existingUser.is_active === 1) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Check for existing pending invitation
      const pendingInvitations = await databaseService.getPendingInvitations();
      const existingInvitation = pendingInvitations.find(inv =>
        inv.email.toLowerCase() === email.toLowerCase()
      );

      if (existingInvitation) {
        return res.status(400).json({
          error: 'An invitation has already been sent to this email'
        });
      }

      // Generate secure invitation token
      const invitationToken = generateToken(32);

      // Create invitation
      const invitation = await databaseService.createInvitation(
        email,
        is_admin,
        req.user.id,
        invitationToken
      );

      // Send invitation email
      const emailResult = await emailService.sendInvitationEmail(
        email,
        invitationToken,
        is_admin,
        req.user.email
      );

      if (!emailResult.success) {
        console.warn('Failed to send invitation email, but invitation was created');
      }

      console.log(`✓ Invitation sent to ${email} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          is_admin: invitation.is_admin,
          expires_at: invitation.expires_at
        }
      });
    } catch (error) {
      console.error('Send invitation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Validate invitation token
   * @route GET /api/invitations/validate/:token
   */
  async validateInvitation(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const validation = await databaseService.validateInvitation(token);

      if (!validation.valid) {
        return res.status(400).json({
          valid: false,
          error: validation.error
        });
      }

      res.json({
        valid: true,
        email: validation.invitation.email,
        is_admin: validation.invitation.is_admin
      });
    } catch (error) {
      console.error('Validate invitation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Accept invitation and create account
   * @route POST /api/invitations/accept
   */
  async acceptInvitation(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }

      // Validate invitation
      const validation = await databaseService.validateInvitation(token);

      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const invitation = validation.invitation;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Password does not meet security requirements',
          details: passwordValidation.feedback.join('. ')
        });
      }

      // Check if user already exists (inactive user activation)
      const existingUser = await databaseService.getUserByEmail(invitation.email);

      if (existingUser) {
        // Activate existing inactive user
        await databaseService.activateUser(invitation.email, password);

        // Update admin status if needed
        if (invitation.is_admin && !existingUser.is_admin) {
          await databaseService.db.run(
            'UPDATE users SET is_admin = 1 WHERE email = ?',
            [invitation.email]
          );
        }
      } else {
        // Create new user
        await databaseService.createUser(
          invitation.email,
          password,
          invitation.is_admin
        );
      }

      // Mark invitation as used
      await databaseService.markInvitationAsUsed(token);

      console.log(`✓ User account created for ${invitation.email}`);

      res.json({
        success: true,
        message: 'Account created successfully. You can now log in.',
        email: invitation.email
      });
    } catch (error) {
      console.error('Accept invitation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get pending invitations (Admin only)
   * @route GET /api/invitations/pending
   */
  async getPendingInvitations(req, res) {
    try {
      const invitations = await databaseService.getPendingInvitations();

      res.json({
        invitations: invitations.map(inv => ({
          id: inv.id,
          email: inv.email,
          is_admin: inv.is_admin,
          invited_by: inv.invited_by_email,
          created_at: inv.created_at,
          expires_at: inv.expires_at
        }))
      });
    } catch (error) {
      console.error('Get pending invitations error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Cancel invitation (Admin only)
   * @route DELETE /api/invitations/:id
   */
  async cancelInvitation(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Invitation ID is required' });
      }

      await databaseService.cancelInvitation(parseInt(id));

      console.log(`✓ Invitation ${id} cancelled by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Invitation cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel invitation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new InvitationsController();
