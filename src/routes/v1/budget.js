import express from 'express';
import {
    addBudget,
    updateBudget,
    deleteBudget,
    getRemainingBudgetPercentage,
    addSpentToBudget,
    getBudget,
} from '../../controllers/budgetController.js';
import { protect, regularOnly } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Protected Routes (Require Authentication)
router.route('').post(protect, regularOnly, addBudget);
router
    .route('/:id')
    .get(protect, regularOnly, getBudget)
    .put(protect, regularOnly, updateBudget)
    .delete(protect, regularOnly, deleteBudget);
router
    .route('/:id/remaining')
    .get(protect, regularOnly, getRemainingBudgetPercentage);
router.route('/:id/spent').post(protect, regularOnly, addSpentToBudget);

export default router;
