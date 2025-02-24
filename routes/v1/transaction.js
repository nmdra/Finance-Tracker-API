import express from "express";
import {
    addTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
} from "../../controllers/transactionController.js";
import protect from "../../middleware/authMiddleware.js";

const router = express.Router();

// Protected Routes (Require Authentication)
router.route("").post(protect, addTransaction).get(protect, getTransactions);
router.route("/:id").get(protect, getTransactionById).put(protect, updateTransaction).delete(protect, deleteTransaction)

export default router;
