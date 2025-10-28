const express = require('express');
const router = express.Router();
const mealTransfersController = require('../controllers/mealTransfers.controller');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @route POST /api/meal-transfers
 * @desc Create a meal transfer (pass meal to colleagues)
 * @access Private
 */
router.post('/', isAuthenticated, mealTransfersController.createMealTransfer.bind(mealTransfersController));

/**
 * @route GET /api/meal-transfers/check
 * @desc Check if user has transferred a meal for a specific day
 * @access Private
 */
router.get('/check', isAuthenticated, mealTransfersController.checkMealTransfer.bind(mealTransfersController));

/**
 * @route GET /api/meal-transfers
 * @desc Get available meal transfers for a week
 * @access Private
 */
router.get('/', isAuthenticated, mealTransfersController.getAvailableMealTransfers.bind(mealTransfersController));

/**
 * @route POST /api/meal-transfers/:transferId/claim
 * @desc Claim a meal transfer
 * @access Private
 */
router.post('/:transferId/claim', isAuthenticated, mealTransfersController.claimMealTransfer.bind(mealTransfersController));

/**
 * @route DELETE /api/meal-transfers/:transferId
 * @desc Cancel a meal transfer
 * @access Private
 */
router.delete('/:transferId', isAuthenticated, mealTransfersController.cancelMealTransfer.bind(mealTransfersController));

module.exports = router;
