const databaseService = require('../services/database.service');
const emailService = require('../config/email');
const { parsePeriodFromFilename, parseMonthYearFromFilename, calculateFileHash } = require('../utils/validators');
const xlsx = require('xlsx');
const fs = require('fs');

/**
 * Meal Options Controller
 * Handles meal options management (admin uploads)
 */
class MealOptionsController {
  /**
   * Upload meal options from Excel file
   * @route POST /api/meal-options/upload
   */
  async uploadMealOptions(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const filename = req.file.originalname;
      const period = parsePeriodFromFilename(filename);

      console.log(`\n=== Meal Options Upload ===`);
      console.log(`Filename: ${filename}`);
      console.log(`Parsed period: ${period || 'N/A'}`);

      // Calculate file hash for duplicate detection
      const fileBuffer = fs.readFileSync(req.file.path);
      const fileHash = calculateFileHash(fileBuffer);

      // Check for duplicates
      const existingUpload = await databaseService.checkUploadExists(fileHash);
      if (existingUpload) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: 'Acest fișier a fost deja încărcat',
          details: {
            filename: existingUpload.filename,
            upload_date: existingUpload.upload_date,
            period: existingUpload.period
          }
        });
      }

      // Check if period already exists
      if (period) {
        const existingPeriod = await databaseService.checkPeriodExists(period, 'meal_options');
        if (existingPeriod) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            error: `Opțiunile de mâncare pentru perioada ${period} au fost deja încărcate`,
            details: {
              filename: existingPeriod.filename,
              upload_date: existingPeriod.upload_date,
              period: existingPeriod.period
            }
          });
        }
      }

      // Parse Excel file
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.Sheets['Sheet1'];

      if (!sheet) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Sheet1 not found in Excel file' });
      }

      const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (rawData.length <= 1) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Excel file is empty or has no data' });
      }

      // Calculate week start date from period
      let weekStartDate;
      if (period) {
        const startDay = parseInt(period.split('-')[0]);
        const monthYearInfo = parseMonthYearFromFilename(filename);

        let targetMonth, targetYear;
        if (monthYearInfo) {
          targetMonth = monthYearInfo.month;
          targetYear = monthYearInfo.year;
          console.log(`✓ Parsed month/year from filename: ${targetMonth + 1}/${targetYear}`);
        } else {
          // Fallback to current month/year logic
          const today = new Date();
          targetMonth = today.getMonth();
          targetYear = today.getFullYear();

          let candidateDate = new Date(targetYear, targetMonth, startDay);
          if (candidateDate < today) {
            targetMonth = targetMonth + 1;
            if (targetMonth > 11) {
              targetMonth = 0;
              targetYear++;
            }
          }
        }

        // Use string formatting to avoid timezone issues
        const month = String(targetMonth + 1).padStart(2, '0');
        const day = String(startDay).padStart(2, '0');
        weekStartDate = `${targetYear}-${month}-${day}`;
        console.log(`✓ Calculated week_start_date: ${weekStartDate}`);
      } else {
        weekStartDate = req.body.week_start_date || new Date().toISOString().split('T')[0];
        console.log(`✓ Using week_start_date: ${weekStartDate}`);
      }

      // Parse meal options
      const mealOptionsData = [];
      let currentCategory = null;
      const categoryItems = {};

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];

        if (i === 0 || !row[1]) continue;

        const isDifferentValues = row[1] !== row[2] || row[2] !== row[3] || row[3] !== row[4] || row[4] !== row[5];

        if (!isDifferentValues && row[1] && row[1].trim() !== '') {
          const categoryName = row[1].trim();
          if (categoryName.includes('Meniu') || categoryName.includes('Special') ||
              categoryName.includes('Salat') || categoryName.includes('Extra')) {
            currentCategory = categoryName;
            categoryItems[currentCategory] = {
              monday: [], tuesday: [], wednesday: [], thursday: [], friday: []
            };
          }
        } else if (currentCategory && row[1] && row[1].trim() !== '') {
          if (row[1] && row[1].trim()) categoryItems[currentCategory].monday.push(row[1].trim());
          if (row[2] && row[2].trim()) categoryItems[currentCategory].tuesday.push(row[2].trim());
          if (row[3] && row[3].trim()) categoryItems[currentCategory].wednesday.push(row[3].trim());
          if (row[4] && row[4].trim()) categoryItems[currentCategory].thursday.push(row[4].trim());
          if (row[5] && row[5].trim()) categoryItems[currentCategory].friday.push(row[5].trim());
        }
      }

      // Convert to database format
      for (const [category, items] of Object.entries(categoryItems)) {
        mealOptionsData.push({
          week_start_date: weekStartDate,
          category: category,
          monday: items.monday.join('\n'),
          tuesday: items.tuesday.join('\n'),
          wednesday: items.wednesday.join('\n'),
          thursday: items.thursday.join('\n'),
          friday: items.friday.join('\n')
        });
      }

      if (mealOptionsData.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'No valid meal options found in Excel file' });
      }

      // Save to database
      await databaseService.saveMealOptions(mealOptionsData, period, filename);
      await databaseService.saveUploadHistory(filename, fileHash, 'meal_options', period, weekStartDate, mealOptionsData.length);

      console.log(`✓ Saved ${mealOptionsData.length} meal option categories`);

      // Delete uploaded file
      fs.unlinkSync(req.file.path);

      // Send email notifications
      try {
        const allUsers = await databaseService.getAllUsers();
        const emailResult = await emailService.sendMealOptionsNotification(weekStartDate, allUsers);
        if (emailResult.success) {
          console.log(`✓ Email notifications sent: ${emailResult.sent} sent, ${emailResult.failed} failed`);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }

      res.json({
        success: true,
        message: `Successfully uploaded ${mealOptionsData.length} meal option categories`,
        week_start_date: weekStartDate
      });
    } catch (error) {
      console.error('Error processing meal options Excel file:', error);

      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ error: 'Error processing Excel file: ' + error.message });
    }
  }

  /**
   * Get meal options for a week
   * @route GET /api/meal-options
   */
  async getMealOptions(req, res) {
    try {
      const weekStartDate = req.query.week || await databaseService.getLatestMealOptionsWeek();

      if (!weekStartDate) {
        return res.json({ options: [], message: 'No meal options available' });
      }

      const options = await databaseService.getMealOptions(weekStartDate);
      res.json({ options, week_start_date: weekStartDate });
    } catch (error) {
      console.error('Get meal options error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new MealOptionsController();
