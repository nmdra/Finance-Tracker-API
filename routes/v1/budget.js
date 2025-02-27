import express from "express";
import {
    addBudget,
    updateBudget,
    deleteBudget,
    getRemainingBudgetPercentage,
    addSpentToBudget,
} from "../../controllers/budgetController.js";
import protect from "../../middleware/authMiddleware.js";

const router = express.Router();

// Protected Routes (Require Authentication)
router.route("").post(protect, addBudget);
router.route("/:id")
    .put(protect, updateBudget)
    .delete(protect, deleteBudget);
router.route("/:id/remaining").get(protect, getRemainingBudgetPercentage);
router.route("/:id/spent").post(protect, addSpentToBudget);

export default router;
