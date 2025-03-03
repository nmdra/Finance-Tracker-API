import express from 'express';
import {
    getAllUsers,
    deleteUser,
    deleteTransaction,
    getAllGoals,
    deleteGoal,
    getSettings,
    updateSettings,
    authAdmin,
} from '../../controllers/adminController.js';
import { protect, adminOnly } from '../../middleware/authMiddleware.js';
import {
    getTransactionById,
    getTransactions,
} from '../../controllers/transactionController.js';
import {
    getUserById,
    getUserProfile,
    updateUser,
} from '../../controllers/userController.js';
import { getNotifications } from '../../controllers/notificationController.js';

const router = express.Router();

router
    .route('')
    .post(authAdmin)
    .put(protect, adminOnly, updateUser)
    .get(protect, adminOnly, getUserProfile);

// User management
router.route('/users').get(protect, adminOnly, getAllUsers);
router
    .route('/users/:id')
    .delete(protect, adminOnly, deleteUser)
    .get(protect, adminOnly, getUserById);

// Transaction management
router.route('/transactions').get(protect, adminOnly, getTransactions);
router
    .route('/transactions/:id')
    .delete(protect, adminOnly, deleteTransaction)
    .get(protect, adminOnly, getTransactionById);

// Goal management
router.route('/goals').get(protect, adminOnly, getAllGoals);
router.route('/goals/:id').delete(protect, adminOnly, deleteGoal);

router.route('/notification').get(protect, adminOnly, getNotifications);

router
    .route('/settings')
    .get(protect, adminOnly, getSettings)
    .put(protect, adminOnly, updateSettings);

export default router;
