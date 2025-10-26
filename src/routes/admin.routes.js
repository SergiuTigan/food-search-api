const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/admin/weeks:
 *   get:
 *     summary: Get all available weeks (Admin only)
 *     tags: [Admin]
 *     description: Get list of all weeks with data across all tables
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Weeks retrieved successfully
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
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/weeks', isAdmin, adminController.getAllWeeks.bind(adminController));

/**
 * @swagger
 * /api/admin/weeks/{weekStartDate}:
 *   delete:
 *     summary: Delete all data for a specific week (Admin only)
 *     tags: [Admin]
 *     description: Delete all meal options, selections, reviews, and related data for a specific week
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: weekStartDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date to delete
 *         example: 2024-11-20
 *     responses:
 *       200:
 *         description: Week data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Week start date required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.delete('/weeks/:weekStartDate', isAdmin, adminController.deleteWeekData.bind(adminController));

/**
 * @route GET /api/admin/weeks/:weekStartDate/settings
 * @desc Get week settings (lock status)
 * @access Private (Admin only)
 */
router.get('/weeks/:weekStartDate/settings', isAdmin, adminController.getWeekSettings.bind(adminController));

/**
 * @route POST /api/admin/weeks/:weekStartDate/lock
 * @desc Lock a week (prevent user modifications)
 * @access Private (Admin only)
 */
router.post('/weeks/:weekStartDate/lock', isAdmin, adminController.lockWeek.bind(adminController));

/**
 * @route POST /api/admin/weeks/:weekStartDate/unlock
 * @desc Unlock a week (allow user modifications)
 * @access Private (Admin only)
 */
router.post('/weeks/:weekStartDate/unlock', isAdmin, adminController.unlockWeek.bind(adminController));

/**
 * @route POST /api/admin/weeks/:weekStartDate/grant-unlock/:userId
 * @desc Grant unlock permission to a specific user
 * @access Private (Admin only)
 */
router.post('/weeks/:weekStartDate/grant-unlock/:userId', isAdmin, adminController.grantUserUnlock.bind(adminController));

/**
 * @route POST /api/admin/weeks/:weekStartDate/revoke-unlock/:userId
 * @desc Revoke unlock permission from a specific user
 * @access Private (Admin only)
 */
router.post('/weeks/:weekStartDate/revoke-unlock/:userId', isAdmin, adminController.revokeUserUnlock.bind(adminController));

/**
 * @swagger
 * /api/admin/test-email:
 *   post:
 *     summary: Test email configuration (Admin only)
 *     tags: [Admin]
 *     description: Send a test email to verify SMTP configuration
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address
 *                 example: test@devhub.tech
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Email not configured or invalid request
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to send email
 */
router.post('/test-email', isAdmin, adminController.testEmail.bind(adminController));

/**
 * @swagger
 * /api/admin/notify-users:
 *   post:
 *     summary: Notify all users about new meal options (Admin only)
 *     tags: [Admin]
 *     description: Send email notifications to all users about new meal options
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weekStartDate
 *             properties:
 *               weekStartDate:
 *                 type: string
 *                 format: date
 *                 description: Week start date for meal options
 *                 example: 2024-11-25
 *               message:
 *                 type: string
 *                 description: Optional custom message
 *     responses:
 *       200:
 *         description: Notifications sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 sent:
 *                   type: number
 *                 failed:
 *                   type: number
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Email not configured or invalid request
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to send notifications
 */
router.post('/notify-users', isAdmin, adminController.notifyUsers.bind(adminController));

module.exports = router;
