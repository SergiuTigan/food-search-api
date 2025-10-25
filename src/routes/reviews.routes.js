const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @route POST /api/reviews
 * @desc Save or update a meal review
 * @access Private
 */
router.post('/', isAuthenticated, reviewsController.saveMealReview.bind(reviewsController));

/**
 * @route GET /api/reviews/my-review
 * @desc Get user's review for a specific meal
 * @access Private
 */
router.get('/my-review', isAuthenticated, reviewsController.getMyReview.bind(reviewsController));

/**
 * @route GET /api/reviews/my-reviews
 * @desc Get all reviews by current user
 * @access Private
 */
router.get('/my-reviews', isAuthenticated, reviewsController.getMyReviews.bind(reviewsController));

/**
 * @route GET /api/reviews/recent
 * @desc Get recent reviews for a meal
 * @access Private
 */
router.get('/recent', isAuthenticated, reviewsController.getRecentReviews.bind(reviewsController));

/**
 * @route GET /api/reviews/prioritized
 * @desc Get prioritized reviews for a meal (user's reviews first, then others, up to 5 total)
 * @access Private
 */
router.get('/prioritized', isAuthenticated, reviewsController.getPrioritizedReviews.bind(reviewsController));

/**
 * @route GET /api/reviews
 * @desc Get all reviews for a specific meal
 * @access Private
 */
router.get('/', isAuthenticated, reviewsController.getMealReviews.bind(reviewsController));

module.exports = router;
