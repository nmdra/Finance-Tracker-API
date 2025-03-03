import express from 'express';
import {
    addTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    currencyConverter,
} from '../../controllers/transactionController.js';
import { protect, regularOnly } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Protected Routes (Require Authentication)
router
    .route('')
    .post(protect, regularOnly, addTransaction)
    .get(protect, regularOnly, getTransactions);
router.route('/currency').get(protect, regularOnly, currencyConverter);
router
    .route('/:id')
    .get(protect, regularOnly, getTransactionById)
    .put(protect, regularOnly, updateTransaction)
    .delete(protect, regularOnly, deleteTransaction);

export default router;
