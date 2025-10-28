const databaseService = require('../services/database.service');

/**
 * Meal Transfers Controller
 * Handles passing meals to colleagues and copying menus
 */
class MealTransfersController {
  /**
   * Create a meal transfer (pass meal to colleagues)
   * @route POST /api/meal-transfers
   */
  async createMealTransfer(req, res) {
    try {
      const { weekStartDate, dayOfWeek, mealDetails } = req.body;
      const userId = req.user.id;

      console.log('=== CREATE MEAL TRANSFER ===');
      console.log('User ID:', userId);
      console.log('Week Start Date:', weekStartDate);
      console.log('Day of Week:', dayOfWeek);
      console.log('Meal Details:', mealDetails);

      if (!weekStartDate || !dayOfWeek || !mealDetails) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
      }

      await databaseService.createMealTransfer(userId, weekStartDate, dayOfWeek, mealDetails);
      console.log('✅ Meal transfer created successfully');
      res.json({ success: true, message: 'Masa ta a fost pusă la dispoziție pentru colegi' });
    } catch (error) {
      console.error('❌ Create meal transfer error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  /**
   * Get available meal transfers for a week
   * @route GET /api/meal-transfers
   */
  async getAvailableMealTransfers(req, res) {
    try {
      const { weekStartDate } = req.query;

      if (!weekStartDate) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      const transfers = await databaseService.getAvailableMealTransfers(weekStartDate);
      res.json({ transfers });
    } catch (error) {
      console.error('Get meal transfers error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Claim a meal transfer
   * @route POST /api/meal-transfers/:transferId/claim
   */
  async claimMealTransfer(req, res) {
    try {
      const { transferId } = req.params;
      const userId = req.user.id;

      await databaseService.claimMealTransfer(transferId, userId);
      res.json({ success: true, message: 'Ai revendicat masa cu succes' });
    } catch (error) {
      console.error('Claim meal transfer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Cancel a meal transfer
   * @route DELETE /api/meal-transfers/:transferId
   */
  async cancelMealTransfer(req, res) {
    try {
      const { transferId } = req.params;
      const userId = req.user.id;

      await databaseService.cancelMealTransfer(transferId, userId);
      res.json({ success: true, message: 'Transfer anulat cu succes' });
    } catch (error) {
      console.error('Cancel meal transfer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Check if user has already transferred a meal for a specific day
   * @route GET /api/meal-transfers/check
   */
  async checkMealTransfer(req, res) {
    try {
      const { weekStartDate, dayOfWeek } = req.query;
      const userId = req.user.id;

      if (!weekStartDate || !dayOfWeek) {
        return res.status(400).json({ error: 'Week start date and day of week are required' });
      }

      const transfer = await databaseService.getUserMealTransfer(userId, weekStartDate, dayOfWeek);
      res.json({ hasTransfer: !!transfer, transfer });
    } catch (error) {
      console.error('Check meal transfer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // ===== MENU COPY METHODS =====

  /**
   * Get all user menus for a specific week
   * @route GET /api/menus/:weekStartDate
   */
  async getAllUserMenus(req, res) {
    try {
      const { weekStartDate } = req.params;

      const menus = await databaseService.getAllUserMenusForWeek(weekStartDate);
      res.json({ menus });
    } catch (error) {
      console.error('Get all user menus error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Copy a user's menu for a specific day
   * @route POST /api/menus/copy
   */
  async copyUserMenu(req, res) {
    try {
      const { copiedFromUserId, weekStartDate, dayOfWeek, menuDetails } = req.body;
      const userId = req.user.id;

      if (!copiedFromUserId || !weekStartDate || !dayOfWeek || !menuDetails) {
        return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
      }

      await databaseService.copyUserMenu(userId, copiedFromUserId, weekStartDate, dayOfWeek, menuDetails);
      res.json({ success: true, message: 'Meniul a fost copiat cu succes' });
    } catch (error) {
      console.error('Copy user menu error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get menu copies for a specific day
   * @route GET /api/menus/copies
   */
  async getMenuCopies(req, res) {
    try {
      const { weekStartDate, dayOfWeek } = req.query;

      if (!weekStartDate || !dayOfWeek) {
        return res.status(400).json({ error: 'Week start date and day of week are required' });
      }

      const copies = await databaseService.getMenuCopies(weekStartDate, dayOfWeek);
      res.json({ copies });
    } catch (error) {
      console.error('Get menu copies error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get users who copied from a specific user
   * @route GET /api/menus/copies/:userId
   */
  async getMenuCopiesForUser(req, res) {
    try {
      const { userId } = req.params;
      const { weekStartDate, dayOfWeek } = req.query;

      if (!weekStartDate || !dayOfWeek) {
        return res.status(400).json({ error: 'Week start date and day of week are required' });
      }

      const copies = await databaseService.getMenuCopiesForUser(userId, weekStartDate, dayOfWeek);
      res.json({ copies });
    } catch (error) {
      console.error('Get menu copies for user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new MealTransfersController();
