import express from 'express';
import {
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalProgress,
    addSavingsToGoal,
    getAllGoals,
} from '../../controllers/goalController.js';
import { protect, regularOnly } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Protected Routes (Require Authentication)
router
    .route('')
    .post(protect, regularOnly, addGoal)
    .get(protect, regularOnly, getAllGoals);
router
    .route('/:id')
    .put(protect, regularOnly, updateGoal)
    .delete(protect, regularOnly, deleteGoal);
router.route('/:id/progress').get(protect, regularOnly, getGoalProgress);
router.route('/:id/savings').put(protect, regularOnly, addSavingsToGoal);

export default router;
