import express from 'express';
import {
    getIncomeVsExpenses,
    getGoalsProgress,
    sendMonthlyFinancialReport,
    sendCurrentMonthFinancialReport,
    // sendWeeklyFinancialReport
} from '../../controllers/reportController.js';
import { protect, regularOnly } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Get income vs expenses summary
router
    .route('/income-vs-expenses')
    .get(protect, regularOnly, getIncomeVsExpenses);

// Get financial goal progress
router.route('/goals-progress').get(protect, regularOnly, getGoalsProgress);

router
    .route('/last-month-report')
    .post(protect, regularOnly, sendMonthlyFinancialReport);
router
    .route('/current-month-report')
    .post(protect, regularOnly, sendCurrentMonthFinancialReport);

export default router;
