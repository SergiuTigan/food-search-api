const express = require('express');
const router = express.Router();
const mealTransfersController = require('../controllers/mealTransfers.controller');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @route POST /api/menus/copy
 * @desc Copy a user's menu for a specific day
 * @access Private
 */
router.post('/copy', isAuthenticated, mealTransfersController.copyUserMenu.bind(mealTransfersController));

/**
 * @route GET /api/menus/copies
 * @desc Get menu copies for a specific day
 * @access Private
 */
router.get('/copies', isAuthenticated, mealTransfersController.getMenuCopies.bind(mealTransfersController));

/**
 * @route GET /api/menus/copies/:userId
 * @desc Get users who copied from a specific user
 * @access Private
 */
router.get('/copies/:userId', isAuthenticated, mealTransfersController.getMenuCopiesForUser.bind(mealTransfersController));

/**
 * @route GET /api/menus/:weekStartDate
 * @desc Get all user menus for a specific week
 * @access Private
 */
router.get('/:weekStartDate', isAuthenticated, mealTransfersController.getAllUserMenus.bind(mealTransfersController));

module.exports = router;
