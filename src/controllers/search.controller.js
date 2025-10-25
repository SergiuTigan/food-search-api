const databaseService = require('../services/database.service');

/**
 * Search Controller
 * Handles search functionality for colleague meal selections
 */
class SearchController {
  /**
   * Get available weeks
   * @route GET /api/search/weeks
   */
  async getWeeks(req, res) {
    try {
      const latestWeek = await databaseService.getLatestWeek();
      const weeks = latestWeek ? [latestWeek] : [];
      res.json({ weeks });
    } catch (error) {
      console.error('Get weeks error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get meals for a specific week
   * @route GET /api/search/meals
   */
  async getMeals(req, res) {
    try {
      const { week } = req.query;

      if (!week) {
        return res.status(400).json({ error: 'Week parameter required' });
      }

      const userSelections = await databaseService.getAllMealSelections(week);
      const mealSelections = await databaseService.getAllMeals(week);
      const allMeals = [...userSelections, ...mealSelections];

      res.json({ meals: allMeals, week_start_date: week });
    } catch (error) {
      console.error('Get meals error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Search for colleague's meals by name
   * @route GET /api/search
   */
  async searchByName(req, res) {
    try {
      const { name } = req.query;

      if (!name) {
        return res.status(400).json({ error: 'Name parameter required' });
      }

      const latestWeek = await databaseService.getLatestWeek();

      if (!latestWeek) {
        return res.json({ meals: [] });
      }

      const userSelections = await databaseService.getAllMealSelections(latestWeek);
      const mealSelections = await databaseService.getAllMeals(latestWeek);
      const allMeals = [...userSelections, ...mealSelections];

      const searchTerm = name.toLowerCase().trim();
      let results = allMeals.filter(meal => {
        const employeeName = meal.employee_name || '';
        return employeeName.toLowerCase().includes(searchTerm);
      });

      let isFromPreviousWeek = false;
      let foundWeek = latestWeek;

      if (results.length === 0) {
        const { rows: allWeeks } = await databaseService.db.sql`
          SELECT DISTINCT week_start_date
          FROM meals
          WHERE week_start_date < ${latestWeek}
          ORDER BY week_start_date DESC
        `;

        for (const weekRow of allWeeks) {
          const week = weekRow.week_start_date;

          const prevUserSelections = await databaseService.getAllMealSelections(week);
          const prevMealSelections = await databaseService.getAllMeals(week);
          const prevAllMeals = [...prevUserSelections, ...prevMealSelections];

          const prevResults = prevAllMeals.filter(meal => {
            const employeeName = meal.employee_name || '';
            return employeeName.toLowerCase().includes(searchTerm);
          });

          if (prevResults.length > 0) {
            results = prevResults;
            isFromPreviousWeek = true;
            foundWeek = week;
            break;
          }
        }
      }

      res.json({
        meals: results,
        isFromPreviousWeek,
        week: foundWeek,
        currentWeek: latestWeek
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new SearchController();
