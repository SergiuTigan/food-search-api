const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const { isAuthenticated } = require('../middleware/auth');

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

module.exports = router;
