const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/search/weeks:
 *   get:
 *     summary: Get available weeks
 *     tags: [Search]
 *     description: Get list of available weeks with meal data
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Available weeks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 weeks:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/weeks', isAuthenticated, searchController.getWeeks.bind(searchController));

/**
 * @swagger
 * /api/search/meals:
 *   get:
 *     summary: Get meals for a specific week
 *     tags: [Search]
 *     description: Retrieve all meal selections for a specific week
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date
 *     responses:
 *       200:
 *         description: Meals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MealSelection'
 *                 week_start_date:
 *                   type: string
 *                   format: date
 *       400:
 *         description: Week parameter required
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/meals', isAuthenticated, searchController.getMeals.bind(searchController));

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search for colleague's meals by name
 *     tags: [Search]
 *     description: Search for a colleague's meal selections by name (searches current week, then previous weeks if not found)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee name to search for (partial match supported)
 *         example: John
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MealSelection'
 *                 isFromPreviousWeek:
 *                   type: boolean
 *                   description: Indicates if results are from a previous week
 *                 week:
 *                   type: string
 *                   format: date
 *                   description: Week of the found results
 *                 currentWeek:
 *                   type: string
 *                   format: date
 *                   description: Current week
 *       400:
 *         description: Name parameter required
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', isAuthenticated, searchController.searchByName.bind(searchController));

module.exports = router;
