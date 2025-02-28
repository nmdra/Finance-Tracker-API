import express from "express";
import {
    getSpendingTrends,
    getIncomeVsExpenses,
    getGoalsProgress
} from "../../controllers/reportController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Get spending trends over time
router.route("/spending-trends").get(protect, getSpendingTrends)

// Get income vs expenses summary
router.route("/income-vs-expenses").get(protect, getIncomeVsExpenses)

// Get financial goal progress
router.route("/goals-progress").get(protect, getGoalsProgress)

export default router;
