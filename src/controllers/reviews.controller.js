const databaseService = require('../services/database.service');

/**
 * Reviews Controller
 * Handles meal reviews and ratings
 */
class ReviewsController {
  /**
   * Save or update a meal review
   * @route POST /api/reviews
   */
  async saveMealReview(req, res) {
    try {
      const { mealName, reviewText, rating, weekStartDate, dayOfWeek } = req.body;

      // Validation
      if (!mealName || !weekStartDate || !dayOfWeek) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      if (reviewText && reviewText.trim().split(/\s+/).length > 500) {
        return res.status(400).json({ error: 'Review text must not exceed 500 words' });
      }

      const review = await databaseService.saveMealReview(
        req.session.user.id,
        mealName,
        reviewText || '',
        rating || null,
        weekStartDate,
        dayOfWeek
      );

      res.json({ success: true, review });
    } catch (error) {
      console.error('Save meal review error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get user's review for a specific meal
   * @route GET /api/reviews/my-review
   */
  async getMyReview(req, res) {
    try {
      const { mealName, weekStartDate, dayOfWeek } = req.query;

      if (!mealName || !weekStartDate || !dayOfWeek) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const review = await databaseService.getMealReview(
        req.session.user.id,
        mealName,
        weekStartDate,
        dayOfWeek
      );

      res.json({ review });
    } catch (error) {
      console.error('Get my review error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get all reviews for a specific meal
   * @route GET /api/reviews
   */
  async getMealReviews(req, res) {
    try {
      const { mealName, weekStartDate, dayOfWeek } = req.query;

      if (!mealName || !weekStartDate || !dayOfWeek) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const reviews = await databaseService.getMealReviews(
        mealName,
        weekStartDate,
        dayOfWeek
      );

      res.json({ reviews });
    } catch (error) {
      console.error('Get meal reviews error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get recent reviews for a meal (last 5 reviews)
   * @route GET /api/reviews/recent
   */
  async getRecentReviews(req, res) {
    try {
      const { mealName } = req.query;

      if (!mealName) {
        return res.status(400).json({ error: 'Missing meal name' });
      }

      const reviews = await databaseService.getRecentMealReviews(mealName);

      res.json({ reviews });
    } catch (error) {
      console.error('Get recent reviews error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get all reviews by current user
   * @route GET /api/reviews/my-reviews
   */
  async getMyReviews(req, res) {
    try {
      const reviews = await databaseService.getUserReviews(req.session.user.id);
      res.json({ reviews });
    } catch (error) {
      console.error('Get user reviews error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get prioritized reviews for a meal (user's reviews first, then others, up to 5 total)
   * @route GET /api/reviews/prioritized
   */
  async getPrioritizedReviews(req, res) {
    try {
      const { mealName } = req.query;

      if (!mealName) {
        return res.status(400).json({ error: 'Missing meal name' });
      }

      const reviews = await databaseService.getPrioritizedMealReviews(
        mealName,
        req.session.user.id
      );

      res.json({ reviews });
    } catch (error) {
      console.error('Get prioritized reviews error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new ReviewsController();
