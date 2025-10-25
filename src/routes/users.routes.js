const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/users/employees:
 *   get:
 *     summary: Get employee names from current menu
 *     tags: [Users]
 *     description: Get list of employee names from the current week's menu
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of employee names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employees:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/employees', isAuthenticated, usersController.getEmployees.bind(usersController));

/**
 * @swagger
 * /api/users/me/employee-name:
 *   post:
 *     summary: Set employee name for current user
 *     tags: [Users]
 *     description: Associate current user with an employee name from the menu
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_name
 *             properties:
 *               employee_name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: Employee name set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid employee name or not in menu
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/me/employee-name', isAuthenticated, usersController.setEmployeeName.bind(usersController));

/**
 * @swagger
 * /api/users/employees/names:
 *   get:
 *     summary: Get all employee names for autocomplete
 *     tags: [Users]
 *     description: Get sorted list of all employee names (for autocomplete functionality)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of employee names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 names:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/employees/names', isAuthenticated, usersController.getEmployeeNames.bind(usersController));

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Users]
 *     description: Create a new user account (admin functionality)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               is_admin:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     description: Get list of all users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', isAdmin, usersController.createUser.bind(usersController));
router.get('/', isAdmin, usersController.getAllUsers.bind(usersController));

module.exports = router;
