import Transaction from "../models/transactionModel.js";
import { logger } from "../middleware/logger.js";
import { StatusCodes } from "http-status-codes";
import { calculateEndDate } from "../utils/calcRecurrence.js";

// @desc    Add new Transaction
// @route   POST /api/v1/transaction
// @access  Private
export const addTransaction = async (req, res) => {
    try {
        const { type, amount, category, tags, comments, isRecurring, recurrence } = req.body;

        if (!type || !amount || !category) {
            logger.warn("Missing required fields: type, amount, or category");
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Type, amount, and category are required." });
        }

        let endDate = null;

        // Calculate endDate based on recurrence if the transaction is recurring
        if (isRecurring && recurrence) {
            endDate = calculateEndDate(recurrence);
        }

        const newTransaction = new Transaction({
            user: req.user.id,
            type,
            amount,
            category,
            tags,
            comments,
            isRecurring,
            recurrence,
            endDate,
        });

        try {
            const savedTransaction = await newTransaction.save();
            logger.info(`New transaction added. User ID: ${req.user.id}, Transaction ID: ${savedTransaction.transactionId}`);
            res.status(StatusCodes.CREATED).json({ transactionId: savedTransaction.transactionId });
        } catch (error) {
            logger.error(`error while saving transaction: ${error.message}`);
            res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
        }

    } catch (error) {
        logger.error(`Error adding transaction: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

// @desc    Get All transaction by user
// @route   GET /api/v1/transaction
// @access  Private
// TODO Pagination
export const getTransactions = async (req, res) => {
    try {
        const { tag, category, type, startDate, endDate } = req.query;
        let filter = { user: req.user.id };

        if (tag) filter.tags = tag;
        if (category) filter.category = category;
        if (type) filter.type = type;

        // Filter by date range
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(filter).sort({ date: -1 });
        logger.info(`Transactions fetched: ${transactions.length} found`);
        res.status(StatusCodes.OK).json(transactions);
    } catch (error) {
        logger.error(`Error fetching transactions: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

// @desc    Get Transaction by id
// @route   POST /api/v1/transaction/:id
// @access  Private
export const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ transactionId: req.params.id });
        if (!transaction) {
            logger.warn(`Transaction not found: ID ${req.params.id}`);
            return res.status(StatusCodes.NOT_FOUND).json({ error: "Transaction not found" });
        }

        logger.info(`Transaction retrieved: ${JSON.stringify(transaction)}`);
        res.status(StatusCodes.OK).json(transaction);
    } catch (error) {
        logger.error(`Error fetching transaction by ID: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

// @desc    Update Transaction
// @route   PUT /api/v1/transaction/:id
// @access  Private
export const updateTransaction = async (req, res) => {
    try {
        let updateData = { ...req.body };

        // If isRecurring is false, set recurrence & endDate to null
        if (updateData.isRecurring === false) {
            updateData.recurrence = null;
            updateData.endDate = null;
        }

        const updatedTransaction = await Transaction.findOneAndUpdate(
            { transactionId: req.params.id },
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedTransaction) {
            logger.warn(`Transaction not found for update: ID ${req.params.id}`);
            return res.status(StatusCodes.NOT_FOUND).json({ error: "Transaction not found" });
        }

        logger.info(`Transaction updated: ${updatedTransaction.transactionId}`);
        res.status(StatusCodes.OK).json({ message: "Transaction Updated" });
    } catch (error) {
        logger.error(`Error updating transaction: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

// @desc    Delete Transaction
// @route   DELETE /api/v1/transaction/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findOneAndDelete({ transactionId: req.params.id });
        if (!deletedTransaction) {
            logger.warn(`Transaction not found for deletion: ID ${req.params.id}`);
            return res.status(StatusCodes.NOT_FOUND).json({ error: "Transaction not found" });
        }

        logger.info(`Transaction deleted: ${deleteTransaction.transactionId}`);
        res.status(StatusCodes.OK).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        logger.error(`Error deleting transaction: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};