const databaseService = require('../services/database.service');
const { parsePeriodFromFilename, parseMonthYearFromFilename, calculateFileHash, extractNameFromEmail, reverseNameOrder } = require('../utils/validators');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');

/**
 * Meal Selections Controller
 * Handles user meal selection and ordering
 */
class MealSelectionsController {
  /**
   * Save meal selection for current user
   * @route POST /api/meal-selections
   */
  async saveMealSelection(req, res) {
    try {
      const { week_start_date, monday, tuesday, wednesday, thursday, friday } = req.body;

      if (!week_start_date) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      // Check if week is locked for this user (admin lock)
      const isWeekLocked = await databaseService.isWeekLockedForUser(week_start_date, req.session.user.id);
      if (isWeekLocked) {
        return res.status(403).json({
          error: 'Săptămâna este blocată și nu mai pot fi făcute modificări',
          locked: true
        });
      }

      // Check if user has self-locked their selection
      const isUserLocked = await databaseService.isUserSelectionLocked(req.session.user.id, week_start_date);
      if (isUserLocked) {
        return res.status(403).json({
          error: 'Selecția ta este blocată. Deblochează-o mai întâi pentru a face modificări',
          locked: true,
          userLocked: true
        });
      }

      await databaseService.saveMealSelection(req.session.user.id, week_start_date, {
        monday, tuesday, wednesday, thursday, friday
      });

      res.json({ success: true, message: 'Meal selections saved successfully' });
    } catch (error) {
      console.error('Save meal selection error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get current user's meal selection
   * @route GET /api/meal-selections/me
   */
  async getMyMealSelection(req, res) {
    try {
      const weekStartDate = req.query.week || await databaseService.getLatestMealOptionsWeek();

      if (!weekStartDate) {
        return res.json({ selection: null, message: 'No meal options available' });
      }

      const selection = await databaseService.getMealSelection(req.session.user.id, weekStartDate);
      const isWeekLocked = await databaseService.isWeekLockedForUser(weekStartDate, req.session.user.id);
      const isUserLocked = await databaseService.isUserSelectionLocked(req.session.user.id, weekStartDate);
      const hasPendingRequest = await databaseService.hasPendingUnlockRequest(req.session.user.id, weekStartDate);

      res.json({
        selection,
        week_start_date: weekStartDate,
        is_locked: isWeekLocked,
        is_user_locked: isUserLocked,
        has_pending_unlock_request: hasPendingRequest
      });
    } catch (error) {
      console.error('Get meal selection error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get user's meal selection history
   * @route GET /api/meal-selections/history
   */
  async getMealHistory(req, res) {
    try {
      const history = await databaseService.getUserMealHistory(req.session.user.id);
      res.json({ history });
    } catch (error) {
      console.error('Get meal history error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get all meal selections for a week (admin only)
   * @route GET /api/meal-selections/all
   */
  async getAllMealSelections(req, res) {
    try {
      const weekStartDate = req.query.week || await databaseService.getLatestMealOptionsWeek();

      if (!weekStartDate) {
        return res.json({ selections: [], message: 'No meal options available' });
      }

      const userSelections = await databaseService.getAllMealSelections(weekStartDate);
      const mealSelections = await databaseService.getAllMeals(weekStartDate);

      const allSelections = [...userSelections, ...mealSelections];

      res.json({ selections: allSelections, week_start_date: weekStartDate });
    } catch (error) {
      console.error('Get all meal selections error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Import meal selections from Excel (admin only)
   * @route POST /api/meal-selections/import
   */
  async importMealSelections(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const filename = req.file.originalname;
      const period = parsePeriodFromFilename(filename);

      console.log(`\n=== Meal Selections Import ===`);
      console.log(`Filename: ${filename}`);
      console.log(`Parsed period: ${period || 'N/A'}`);

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

      if (period) {
        const existingPeriod = await databaseService.checkPeriodExists(period, 'meal_selections');
        if (existingPeriod) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            error: `Selecțiile de mâncare pentru perioada ${period} au fost deja încărcate`,
            details: {
              filename: existingPeriod.filename,
              upload_date: existingPeriod.upload_date,
              period: existingPeriod.period
            }
          });
        }
      }

      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      if (!sheet) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'No sheet found in Excel file' });
      }

      const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (rawData.length <= 1) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Excel file is empty or has no data' });
      }

      // Calculate week start date
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

      const allUsers = await databaseService.getAllUsers();
      let imported = 0;
      let failed = 0;
      const failureDetails = [];

      // Process each row
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row[0] || row[0].toString().trim() === '') continue;

        const employeeName = row[0].toString().trim();
        const monday = row[2] ? row[2].toString().trim() : '';
        const tuesday = row[3] ? row[3].toString().trim() : '';
        const wednesday = row[4] ? row[4].toString().trim() : '';
        const thursday = row[5] ? row[5].toString().trim() : '';
        const friday = row[6] ? row[6].toString().trim() : '';

        // Try to match user
        let matchedUser = allUsers.find(u =>
          u.employee_name && u.employee_name.toLowerCase() === employeeName.toLowerCase()
        );

        if (!matchedUser) {
          for (const user of allUsers) {
            const extractedName = extractNameFromEmail(user.email);
            if (extractedName && extractedName.toLowerCase() === employeeName.toLowerCase()) {
              matchedUser = user;
              break;
            }
          }
        }

        if (!matchedUser) {
          const reversedName = reverseNameOrder(employeeName);
          matchedUser = allUsers.find(u =>
            u.employee_name && u.employee_name.toLowerCase() === reversedName.toLowerCase()
          );
        }

        if (matchedUser) {
          try {
            await databaseService.saveMealSelection(matchedUser.id, weekStartDate, {
              monday, tuesday, wednesday, thursday, friday
            });
            imported++;
          } catch (err) {
            failed++;
            failureDetails.push(`${employeeName}: Eroare la salvare - ${err.message}`);
          }
        } else {
          try {
            await databaseService.createInactiveUser(employeeName);
            await databaseService.saveMeals([{
              employee_name: employeeName,
              division: row[1] ? row[1].toString().trim() : '',
              week_start_date: weekStartDate,
              monday, tuesday, wednesday, thursday, friday
            }], false, period, filename);
            imported++;
          } catch (err) {
            failed++;
            failureDetails.push(`${employeeName}: Eroare la salvare - ${err.message}`);
          }
        }
      }

      await databaseService.saveUploadHistory(filename, fileHash, 'meal_selections', period, weekStartDate, imported);

      console.log(`\n✓ Import complete: ${imported} imported, ${failed} failed`);

      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: 'Import finalizat cu succes!',
        imported,
        failed,
        period,
        details: failureDetails
      });
    } catch (error) {
      console.error('Error importing selections:', error);

      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ error: 'Error processing Excel file: ' + error.message });
    }
  }

  /**
   * Get meal selection statistics (admin only)
   * @route GET /api/meal-selections/statistics
   */
  async getStatistics(req, res) {
    try {
      const weekStartDate = req.query.week || await databaseService.getLatestMealOptionsWeek();

      if (!weekStartDate) {
        return res.json({ statistics: null, message: 'No meal options available' });
      }

      const userSelections = await databaseService.getAllMealSelections(weekStartDate);
      const mealSelections = await databaseService.getAllMeals(weekStartDate);

      // Combine all selections
      const allSelections = [...userSelections, ...mealSelections];

      // Count unique employees
      const uniqueEmployees = new Set();
      allSelections.forEach(selection => {
        if (selection.employee_name) {
          uniqueEmployees.add(selection.employee_name);
        }
      });

      // Count employees with selections
      const employeesWithSelections = uniqueEmployees.size;

      // Get total number of employees from database
      const totalEmployees = await databaseService.getTotalEmployeesCount();

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const dailyStats = {};
      const mealCounts = {};
      let totalMeals = 0;

      days.forEach(day => {
        let totalForDay = 0;

        allSelections.forEach(selection => {
          if (selection[day]) {
            const parts = selection[day].split(' | ').map(p => p.trim()).filter(p => p);

            // Count as 1 meal per day (the selection itself), not per component
            if (parts.length > 0) {
              totalForDay++;
              totalMeals++;
            }

            // Still count each meal type separately for meal type statistics
            parts.forEach(part => {
              if (!mealCounts[part]) mealCounts[part] = 0;
              mealCounts[part]++;
            });
          }
        });

        dailyStats[day] = totalForDay;
      });

      // Convert meal counts to array format
      const mealStats = Object.entries(mealCounts).map(([meal, count]) => ({
        meal,
        count
      })).sort((a, b) => b.count - a.count);

      const statistics = {
        totalEmployees,
        employeesWithSelections,
        totalMeals,
        dailyStats,
        mealStats
      };

      res.json({ statistics, week_start_date: weekStartDate });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Export statistics to Excel (admin only)
   * @route GET /api/meal-selections/statistics/export
   */
  async exportStatistics(req, res) {
    try {
      const weekStartDate = req.query.week || await databaseService.getLatestMealOptionsWeek();

      if (!weekStartDate) {
        return res.status(400).json({ error: 'No meal options available' });
      }

      const userSelections = await databaseService.getAllMealSelections(weekStartDate);
      const mealSelections = await databaseService.getAllMeals(weekStartDate);

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const dayNames = ['LUNI/MONDAY', 'MARTI/TUESDAY', 'MIERCURI/WEDNESDAY', 'JOI/THURSDAY', 'VINERI/FRIDAY'];
      const statistics = {};

      // Calculate statistics per day
      days.forEach(day => {
        statistics[day] = {};

        userSelections.forEach(selection => {
          if (selection[day]) {
            const parts = selection[day].split(' | ').map(p => p.trim()).filter(p => p);
            parts.forEach(part => {
              if (!statistics[day][part]) statistics[day][part] = 0;
              statistics[day][part]++;
            });
          }
        });

        mealSelections.forEach(selection => {
          if (selection[day]) {
            const parts = selection[day].split(' | ').map(p => p.trim()).filter(p => p);
            parts.forEach(part => {
              if (!statistics[day][part]) statistics[day][part] = 0;
              statistics[day][part]++;
            });
          }
        });
      });

      // Get all unique meals across all days
      const allMeals = new Set();
      days.forEach(day => {
        Object.keys(statistics[day]).forEach(meal => allMeals.add(meal));
      });
      const sortedMeals = Array.from(allMeals).sort();

      // Create ExcelJS workbook
      const workbook = new ExcelJS.Workbook();

      // SHEET 1: Daily Statistics (Days as rows, Meals as columns)
      const dailySheet = workbook.addWorksheet('Daily Statistics');

      // Create header row with meal names
      const headerRow = ['Zi/Day', ...sortedMeals, 'TOTAL'];
      dailySheet.addRow(headerRow);

      // Style header row
      dailySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      dailySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      dailySheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Add data rows for each day
      days.forEach((day, dayIndex) => {
        const rowData = [dayNames[dayIndex]];
        let dayTotal = 0;

        sortedMeals.forEach(meal => {
          const count = statistics[day][meal] || 0;
          rowData.push(count);
          dayTotal += count;
        });

        rowData.push(dayTotal);

        const row = dailySheet.addRow(rowData);
        row.eachCell((cell, colNumber) => {
          if (colNumber > 1) { // Skip day name column
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      // Add total row
      const totalRow = ['TOTAL'];
      let grandTotal = 0;
      sortedMeals.forEach(meal => {
        let mealTotal = 0;
        days.forEach(day => {
          mealTotal += statistics[day][meal] || 0;
        });
        totalRow.push(mealTotal);
        grandTotal += mealTotal;
      });
      totalRow.push(grandTotal);

      const addedTotalRow = dailySheet.addRow(totalRow);
      addedTotalRow.font = { bold: true };
      addedTotalRow.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Set column widths
      dailySheet.getColumn(1).width = 25; // Day column
      for (let i = 2; i <= sortedMeals.length + 1; i++) {
        dailySheet.getColumn(i).width = 20;
      }
      dailySheet.getColumn(sortedMeals.length + 2).width = 15; // Total column

      // SHEET 2: Overall Statistics with Pie Chart
      const overallSheet = workbook.addWorksheet('Overall Statistics');

      // Calculate overall meal counts
      const overallStats = {};
      days.forEach(day => {
        Object.entries(statistics[day]).forEach(([meal, count]) => {
          if (!overallStats[meal]) overallStats[meal] = 0;
          overallStats[meal] += count;
        });
      });

      // Sort by count descending
      const sortedOverallStats = Object.entries(overallStats).sort((a, b) => b[1] - a[1]);

      // Add header
      overallSheet.addRow(['Fel de Mâncare / Meal', 'Număr Comenzi / Count']);
      overallSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      overallSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      overallSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Add data
      sortedOverallStats.forEach(([meal, count]) => {
        const row = overallSheet.addRow([meal, count]);
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Add total
      const overallTotal = sortedOverallStats.reduce((sum, [_, count]) => sum + count, 0);
      const overallTotalRow = overallSheet.addRow(['TOTAL', overallTotal]);
      overallTotalRow.font = { bold: true };
      overallTotalRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

      // Set column widths
      overallSheet.getColumn(1).width = 50;
      overallSheet.getColumn(2).width = 20;

      // Add a note for creating pie chart
      overallSheet.getCell('D2').value = 'Pentru a crea un grafic Pie Chart:';
      overallSheet.getCell('D3').value = '1. Selectați datele din coloanele A și B';
      overallSheet.getCell('D4').value = '2. Click Insert → Charts → Pie Chart';
      overallSheet.getCell('D5').value = '3. Graficul va fi creat automat';

      overallSheet.getCell('D2').font = { bold: true, size: 12 };
      overallSheet.getCell('D2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD966' }
      };

      for (let i = 3; i <= 5; i++) {
        overallSheet.getCell(`D${i}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' }
        };
      }

      overallSheet.getColumn(4).width = 40;

      // Generate filename in format: FOOD 13-17.10.2025.xlsx
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 4); // Friday

      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const year = endDate.getFullYear();

      const filename = `Statistics_${startDay}-${endDay}.${month}.${year}.xlsx`;

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error('Export statistics error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Export meal selections to Excel (admin only)
   * @route GET /api/meal-selections/export
   */
  async exportMealSelections(req, res) {
    try {
      const weekStartDate = req.query.week || await databaseService.getLatestMealOptionsWeek();

      if (!weekStartDate) {
        return res.status(400).json({ error: 'No meal options available' });
      }

      const userSelections = await databaseService.getAllMealSelections(weekStartDate);
      const mealSelections = await databaseService.getAllMeals(weekStartDate);
      const selections = [...userSelections, ...mealSelections];
      const mealOptions = await databaseService.getMealOptions(weekStartDate);

      // Create mappings
      const itemToCategoryMap = {};
      const categoryContentMap = {};
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const dayLabels = ['LUNI/MONDAY', 'MARTI/TUESDAY', 'MIERCURI/WEDNESDAY', 'JOI/THURSDAY', 'VINERI/FRIDAY'];

      mealOptions.forEach(option => {
        const category = option.category;
        days.forEach(day => {
          if (option[day]) {
            const items = option[day].split('\n').filter(item => item.trim());
            const categoryKey = `${day}:${category}`;
            categoryContentMap[categoryKey] = items.join('; ');

            items.forEach(item => {
              const itemKey = `${day}:${item.trim()}`;
              itemToCategoryMap[itemKey] = category;
            });
          }
        });
      });

      function formatMealSelection(day, selection) {
        if (!selection || !selection.trim()) return '';

        const parts = selection.split(' | ').map(p => p.trim()).filter(p => p);
        const formattedParts = parts.map(part => {
          const categoryKey = `${day}:${part}`;
          if (categoryContentMap[categoryKey]) {
            return categoryContentMap[categoryKey];
          }

          const itemKey = `${day}:${part}`;
          const category = itemToCategoryMap[itemKey];

          if (category && category.toLowerCase().includes('meniu')) {
            const categoryItemKey = `${day}:${category}`;
            return categoryContentMap[categoryItemKey] || part;
          }

          return part;
        });

        return formattedParts.join('; ');
      }

      // Create ExcelJS workbook
      const workbook = new ExcelJS.Workbook();

      // SHEET 1: Meal Orders (Employees as rows, Days as columns)
      const ordersSheet = workbook.addWorksheet('Meal Orders');

      // Create header row with day names
      const headerRow = ['Angajat/Employee', ...dayLabels];
      ordersSheet.addRow(headerRow);

      // Style header row
      ordersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ordersSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      ordersSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Add data rows for each employee
      selections.forEach(selection => {
        let displayName = selection.employee_name;
        if (!displayName) {
          displayName = extractNameFromEmail(selection.email) || selection.email;
        }

        const rowData = [displayName];

        days.forEach(day => {
          const formattedMeal = formatMealSelection(day, selection[day]);
          rowData.push(formattedMeal || '-');
        });

        const row = ordersSheet.addRow(rowData);

        // Enable text wrapping for all cells in the row
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'top', wrapText: true };
        });
      });

      // Set column widths to accommodate content
      ordersSheet.getColumn(1).width = 25; // Employee name column

      // Day columns - make them wider to fit meal descriptions
      for (let i = 2; i <= dayLabels.length + 1; i++) {
        ordersSheet.getColumn(i).width = 50;
      }

      // Set row heights to auto-fit wrapped text
      ordersSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          row.height = undefined; // Auto height based on content
        } else {
          row.height = 30; // Header row height
        }
      });

      // SHEET 2: Statistics with Pie Chart
      const statsSheet = workbook.addWorksheet('Statistics');

      // Calculate statistics
      const mealStats = {};
      days.forEach(day => {
        selections.forEach(selection => {
          if (selection[day]) {
            const parts = selection[day].split(' | ').map(p => p.trim()).filter(p => p);
            parts.forEach(part => {
              if (!mealStats[part]) mealStats[part] = 0;
              mealStats[part]++;
            });
          }
        });
      });

      // Sort by count descending
      const sortedStats = Object.entries(mealStats).sort((a, b) => b[1] - a[1]);

      // Add statistics table
      statsSheet.addRow(['Fel de Mâncare', 'Număr Selecții']);
      statsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      statsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      sortedStats.forEach(([meal, count]) => {
        statsSheet.addRow([meal, count]);
      });

      // Add total row
      const totalCount = Object.values(mealStats).reduce((sum, count) => sum + count, 0);
      const totalRow = statsSheet.addRow(['TOTAL', totalCount]);
      totalRow.font = { bold: true };

      // Auto-size columns
      statsSheet.getColumn(1).width = 50;
      statsSheet.getColumn(2).width = 20;
      statsSheet.getColumn(2).alignment = { horizontal: 'center' };

      // Generate filename in format: FOOD 13-17.10.2025.xlsx
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 4); // Friday

      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const year = endDate.getFullYear();

      const filename = `FOOD ${startDay}-${endDay}.${month}.${year}.xlsx`;

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error('Export meal selections error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Lock user's own meal selection
   * @route POST /api/meal-selections/lock
   */
  async lockMySelection(req, res) {
    try {
      const { week_start_date } = req.body;

      if (!week_start_date) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      // Check if user has a selection for this week
      const selection = await databaseService.getMealSelection(req.session.user.id, week_start_date);
      if (!selection) {
        return res.status(400).json({ error: 'Nu există selecție pentru această săptămână' });
      }

      await databaseService.lockUserSelection(req.session.user.id, week_start_date);

      res.json({ success: true, message: 'Selecția ta a fost blocată cu succes!' });
    } catch (error) {
      console.error('Lock user selection error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Request unlock for user's own meal selection
   * @route POST /api/meal-selections/unlock
   */
  async unlockMySelection(req, res) {
    try {
      const { week_start_date } = req.body;

      if (!week_start_date) {
        return res.status(400).json({ error: 'Week start date is required' });
      }

      // Check if week is admin-locked - user cannot request unlock if week is admin-locked
      const isWeekLocked = await databaseService.isWeekLockedForUser(week_start_date, req.session.user.id);
      if (isWeekLocked) {
        return res.status(403).json({
          error: 'Săptămâna este blocată de administrator. Nu poți solicita deblocarea.',
          locked: true
        });
      }

      // Create unlock request instead of unlocking directly
      const request = await databaseService.createUnlockRequest(req.session.user.id, week_start_date);

      res.json({
        success: true,
        message: 'Cererea de deblocare a fost trimisă către administrator!',
        request
      });
    } catch (error) {
      console.error('Unlock request error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Get all pending unlock requests (admin only)
   * @route GET /api/meal-selections/unlock-requests
   */
  async getPendingUnlockRequests(req, res) {
    try {
      const requests = await databaseService.getPendingUnlockRequests();
      res.json({ requests });
    } catch (error) {
      console.error('Get pending unlock requests error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * Approve an unlock request (admin only)
   * @route POST /api/meal-selections/unlock-requests/:id/approve
   */
  async approveUnlockRequest(req, res) {
    try {
      const requestId = parseInt(req.params.id);

      if (!requestId) {
        return res.status(400).json({ error: 'Invalid request ID' });
      }

      await databaseService.approveUnlockRequest(requestId, req.session.user.id);

      res.json({
        success: true,
        message: 'Cererea de deblocare a fost aprobată!'
      });
    } catch (error) {
      console.error('Approve unlock request error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  /**
   * Reject an unlock request (admin only)
   * @route POST /api/meal-selections/unlock-requests/:id/reject
   */
  async rejectUnlockRequest(req, res) {
    try {
      const requestId = parseInt(req.params.id);

      if (!requestId) {
        return res.status(400).json({ error: 'Invalid request ID' });
      }

      await databaseService.rejectUnlockRequest(requestId, req.session.user.id);

      res.json({
        success: true,
        message: 'Cererea de deblocare a fost respinsă.'
      });
    } catch (error) {
      console.error('Reject unlock request error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
}

module.exports = new MealSelectionsController();
