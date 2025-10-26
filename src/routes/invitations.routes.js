const express = require('express');
const router = express.Router();
const invitationsController = require('../controllers/invitations.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Invitations
 *   description: User invitation management
 */

/**
 * @swagger
 * /api/invitations/send:
 *   post:
 *     summary: Send user invitation (Admin only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@devhub.tech
 *               is_admin:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 *       400:
 *         description: Invalid input or user already exists
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
router.post('/send', authenticate, requireAdmin, invitationsController.sendInvitation);

/**
 * @swagger
 * /api/invitations/validate/{token}:
 *   get:
 *     summary: Validate invitation token
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token validation result
 *       400:
 *         description: Invalid or expired token
 */
router.get('/validate/:token', invitationsController.validateInvitation);

/**
 * @swagger
 * /api/invitations/accept:
 *   post:
 *     summary: Accept invitation and create account
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Account created successfully
 *       400:
 *         description: Invalid token or weak password
 */
router.post('/accept', invitationsController.acceptInvitation);

/**
 * @swagger
 * /api/invitations/pending:
 *   get:
 *     summary: Get pending invitations (Admin only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
router.get('/pending', authenticate, requireAdmin, invitationsController.getPendingInvitations);

/**
 * @swagger
 * /api/invitations/{id}:
 *   delete:
 *     summary: Cancel invitation (Admin only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, invitationsController.cancelInvitation);

module.exports = router;
