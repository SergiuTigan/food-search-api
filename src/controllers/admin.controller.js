const databaseService = require('../services/database.service');

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
}

module.exports = new AdminController();
