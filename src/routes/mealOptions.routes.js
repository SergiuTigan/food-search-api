const express = require('express');
const router = express.Router();
const mealOptionsController = require('../controllers/mealOptions.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /api/meal-options/upload:
 *   post:
 *     summary: Upload meal options from Excel file (Admin only)
 *     tags: [Meal Options]
 *     description: Upload weekly meal options from an Excel file
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
 *                 description: Excel file (.xlsx, .xls) containing meal options
 *               week_start_date:
 *                 type: string
 *                 format: date
 *                 description: Optional week start date (auto-calculated from filename if not provided)
 *     responses:
 *       200:
 *         description: Meal options uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 week_start_date:
 *                   type: string
 *                   format: date
 *       400:
 *         description: Invalid file or duplicate upload
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/upload', isAdmin, upload.single('file'), mealOptionsController.uploadMealOptions.bind(mealOptionsController));

/**
 * @swagger
 * /api/meal-options:
 *   get:
 *     summary: Get meal options for a week
 *     tags: [Meal Options]
 *     description: Retrieve available meal options for a specific week
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
 *         description: Meal options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 options:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MealOption'
 *                 week_start_date:
 *                   type: string
 *                   format: date
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', isAuthenticated, mealOptionsController.getMealOptions.bind(mealOptionsController));

module.exports = router;
