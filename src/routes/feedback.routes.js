const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Submit feedback
 *     tags: [Feedback]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', isAuthenticated, feedbackController.submitFeedback);

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Get all feedback (admin only)
 *     tags: [Feedback]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of feedback
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', isAuthenticated, isAdmin, feedbackController.getAllFeedback);

/**
 * @swagger
 * /api/feedback/{id}:
 *   patch:
 *     summary: Update feedback status (admin only)
 *     tags: [Feedback]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback status updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch('/:id', isAuthenticated, isAdmin, feedbackController.updateFeedbackStatus);

module.exports = router;
