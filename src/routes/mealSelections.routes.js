const express = require('express');
const router = express.Router();
const mealSelectionsController = require('../controllers/mealSelections.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /api/meal-selections:
 *   post:
 *     summary: Save meal selection for current user
 *     tags: [Meal Selections]
 *     description: Save or update user's meal selections for a week
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - week_start_date
 *             properties:
 *               week_start_date:
 *                 type: string
 *                 format: date
 *               monday:
 *                 type: string
 *               tuesday:
 *                 type: string
 *               wednesday:
 *                 type: string
 *               thursday:
 *                 type: string
 *               friday:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meal selections saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/', isAuthenticated, mealSelectionsController.saveMealSelection.bind(mealSelectionsController));

/**
 * @swagger
 * /api/meal-selections/me:
 *   get:
 *     summary: Get current user's meal selection
 *     tags: [Meal Selections]
 *     description: Retrieve current user's meal selection for a week
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date (defaults to latest week)
 *     responses:
 *       200:
 *         description: Meal selection retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 selection:
 *                   $ref: '#/components/schemas/MealSelection'
 *                 week_start_date:
 *                   type: string
 *                   format: date
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/me', isAuthenticated, mealSelectionsController.getMyMealSelection.bind(mealSelectionsController));

/**
 * @swagger
 * /api/meal-selections/history:
 *   get:
 *     summary: Get user's meal selection history
 *     tags: [Meal Selections]
 *     description: Retrieve current user's meal selection history across all weeks
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Meal history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MealSelection'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/history', isAuthenticated, mealSelectionsController.getMealHistory.bind(mealSelectionsController));

/**
 * @swagger
 * /api/meal-selections/all:
 *   get:
 *     summary: Get all meal selections for a week (Admin only)
 *     tags: [Meal Selections]
 *     description: Retrieve all users' meal selections for a specific week
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date (defaults to latest week)
 *     responses:
 *       200:
 *         description: All meal selections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 selections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MealSelection'
 *                 week_start_date:
 *                   type: string
 *                   format: date
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/all', isAdmin, mealSelectionsController.getAllMealSelections.bind(mealSelectionsController));

/**
 * @swagger
 * /api/meal-selections/import:
 *   post:
 *     summary: Import meal selections from Excel (Admin only)
 *     tags: [Meal Selections]
 *     description: Import meal selections from an Excel file
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               week_start_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Import completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 imported:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 period:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/import', isAdmin, upload.single('file'), mealSelectionsController.importMealSelections.bind(mealSelectionsController));

/**
 * @swagger
 * /api/meal-selections/statistics:
 *   get:
 *     summary: Get meal selection statistics (Admin only)
 *     tags: [Meal Selections]
 *     description: Get aggregated statistics for meal selections
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date (defaults to latest week)
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   type: object
 *                 week_start_date:
 *                   type: string
 *                   format: date
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/statistics', isAdmin, mealSelectionsController.getStatistics.bind(mealSelectionsController));

/**
 * @swagger
 * /api/meal-selections/statistics/export:
 *   get:
 *     summary: Export statistics to Excel (Admin only)
 *     tags: [Meal Selections]
 *     description: Export meal selection statistics as Excel file
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date (defaults to latest week)
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/statistics/export', isAdmin, mealSelectionsController.exportStatistics.bind(mealSelectionsController));

/**
 * @swagger
 * /api/meal-selections/export:
 *   get:
 *     summary: Export meal selections to Excel (Admin only)
 *     tags: [Meal Selections]
 *     description: Export all meal selections as Excel file
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date (defaults to latest week)
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/export', isAdmin, mealSelectionsController.exportMealSelections.bind(mealSelectionsController));

/**
 * @route POST /api/meal-selections/lock
 * @desc Lock user's own meal selection
 * @access Private (Authenticated user)
 */
router.post('/lock', isAuthenticated, mealSelectionsController.lockMySelection.bind(mealSelectionsController));

/**
 * @route POST /api/meal-selections/unlock
 * @desc Unlock user's own meal selection (creates unlock request)
 * @access Private (Authenticated user)
 */
router.post('/unlock', isAuthenticated, mealSelectionsController.unlockMySelection.bind(mealSelectionsController));

/**
 * @route GET /api/meal-selections/unlock-requests
 * @desc Get all pending unlock requests
 * @access Private (Admin only)
 */
router.get('/unlock-requests', isAdmin, mealSelectionsController.getPendingUnlockRequests.bind(mealSelectionsController));

/**
 * @route POST /api/meal-selections/unlock-requests/:id/approve
 * @desc Approve an unlock request
 * @access Private (Admin only)
 */
router.post('/unlock-requests/:id/approve', isAdmin, mealSelectionsController.approveUnlockRequest.bind(mealSelectionsController));

/**
 * @route POST /api/meal-selections/unlock-requests/:id/reject
 * @desc Reject an unlock request
 * @access Private (Admin only)
 */
router.post('/unlock-requests/:id/reject', isAdmin, mealSelectionsController.rejectUnlockRequest.bind(mealSelectionsController));

module.exports = router;
