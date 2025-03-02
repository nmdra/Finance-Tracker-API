import express from 'express';
import {
    getAllUsers,
    deleteUser,
    deleteTransaction,
    getAllGoals,
    deleteGoal,
    getSettings,
    updateSettings,
} from '../../controllers/adminController.js';
import { protect, adminOnly } from '../../middleware/authMiddleware.js';
import { getTransactions } from '../../controllers/transactionController.js';

const router = express.Router();

// User management
router.route('/users').get(protect, adminOnly, getAllUsers);
router.route('/users/:id').delete(protect, adminOnly, deleteUser);

// Transaction management
router.route('/transactions').get(protect, adminOnly, getTransactions);
router.route('/transactions/:id').delete(protect, adminOnly, deleteTransaction);

// Goal management
router.route('/goals').get(protect, adminOnly, getAllGoals);
router.route('/goals/:id').delete(protect, adminOnly, deleteGoal);

router
    .route('/settings')
    .get(protect, adminOnly, getSettings)
    .put(protect, adminOnly, updateSettings);

export default router;
