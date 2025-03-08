import { Transaction } from '../models/transactionModel.js';
import { logger } from '../middleware/logger.js';
import { StatusCodes } from 'http-status-codes';
import { calculateEndDate } from '../utils/calcRecurrence.js';
import { convertCurrency } from '../utils/currencyConverter.js';
import { autoAllocateToGoals } from '../controllers/goalController.js';
import { createNotification } from '../middleware/notification.js';
import { updateBudgetOnTransaction } from './budgetController.js';

const BASE_CURRENCY = process.env.BASE_CURRENCY;

// @desc    Add new Transaction
// @route   POST /api/v1/transaction
// @access  Private
export const addTransaction = async (req, res) => {
    try {
        const {
            type,
            amount,
            currency,
            category,
            tags,
            comments,
            isRecurring,
            recurrence,
        } = req.body;

        if (!type || !amount || !category || !currency) {
            logger.warn('Missing required fields');
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: 'Type, amount, currency and category are required.',
            });
        }

        let baseAmount;
        try {
            baseAmount = await convertCurrency(amount, currency, BASE_CURRENCY);
        } catch (error) {
            logger.error(`Currency conversion error: ${error.message}`);
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: `Currency conversion error: ${error.message}` });
        }

        let endDate = null;

        // Calculate endDate based on recurrence if the transaction is recurring
        if (isRecurring && recurrence) endDate = calculateEndDate(recurrence);

        const newTransaction = new Transaction({
            user: req.user.id,
            type,
            amount,
            baseAmount,
            currency,
            baseCurrency: BASE_CURRENCY,
            category,
            tags,
            comments,
            isRecurring,
            recurrence,
            endDate,
        });

        try {
            const savedTransaction = await newTransaction.save();
            logger.info(
                `New transaction added. User ID: ${req.user.id}, Transaction ID: ${savedTransaction.transactionId}`
            );

            if (savedTransaction.type === 'income')
                await autoAllocateToGoals(savedTransaction);

            if (savedTransaction.type === 'expense')
                await updateBudgetOnTransaction(savedTransaction);

            await createNotification(
                req.user.id,
                'transaction_alert',
                `Transaction Completed: ${savedTransaction.transactionId}`
            );

            res.status(StatusCodes.CREATED).json({
                transactionId: savedTransaction.transactionId,
                links: {
                    self: {
                        href: `/api/v1/transactions/${savedTransaction._id}`,
                        method: 'GET',
                        description: 'Retrieve details of this transaction',
                    },
                    allTransactions: {
                        href: `/api/v1/transactions`,
                        method: 'GET',
                        description: 'Retrieve all transactions',
                    },
                    updateTransaction: {
                        href: `/api/v1/transactions/${savedTransaction._id}`,
                        method: 'PUT',
                        description: 'Update this transaction',
                    },
                    deleteTransaction: {
                        href: `/api/v1/transactions/${savedTransaction._id}`,
                        method: 'DELETE',
                        description: 'Delete this transaction',
                    },
                    notifications: {
                        href: `/api/v1/notifications/`,
                        method: 'GET',
                        description: "Retrieve user's notifications",
                    },
                },
            });
        } catch (error) {
            logger.error(`Error while saving transaction: ${error.message}`);
            res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
        }
    } catch (error) {
        logger.error(`Error adding transaction: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: error.message,
        });
    }
};

// @desc    Get All transaction by user
// @route   GET /api/v1/transaction
// @access  Private
export const getTransactions = async (req, res) => {
    try {
        const {
            tag,
            category,
            type,
            startDate,
            endDate,
            page = 1,
            limit = 10,
        } = req.query;
        let filter = {};

        // If user is not an admin, filter by user ID
        if (req.user.memberType !== 'admin') {
            filter.user = req.user.id;
        }

        if (tag) filter.tags = tag;
        if (category) filter.category = category;
        if (type) filter.type = type;

        // Filter by date range
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const totalTransactions = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        logger.info(
            `Transactions fetched: ${transactions.length} found ${
                req.user.memberType === 'admin' ? '(Admin Access)' : ''
            }`
        );

        res.status(StatusCodes.OK).json({
            total: totalTransactions,
            page: parseInt(page),
            limit: parseInt(limit),
            transactions,
        });
    } catch (error) {
        logger.error(`Error fetching transactions: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: error.message,
        });
    }
};

// @desc    Get Transaction by id
// @route   POST /api/v1/transaction/:id
// @access  Private/User || Admin
export const getTransactionById = async (req, res) => {
    try {
        const currency = req.query.currency;

        const transaction = await Transaction.findOne({
            transactionId: req.params.id,
        });
        if (!transaction) {
            logger.warn(`Transaction not found: ID ${req.params.id}`);
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: 'Transaction not found' });
        }

        let responseTransaction = transaction.toObject();

        try {
            const convertedAmount = await convertCurrency(
                transaction.baseAmount,
                BASE_CURRENCY,
                currency
            );
            responseTransaction.amount = convertedAmount;
            responseTransaction.currency = currency;
        } catch (error) {
            logger.error(
                `Currency conversion failed for Transaction ID ${transaction._id}: ${error.message}`
            );
            throw new Error('Currency Conversion Failed');
        }

        // Remove Unnecessary values
        delete responseTransaction.baseAmount;
        delete responseTransaction.baseCurrency;
        delete responseTransaction._id;

        logger.info(
            `Transaction retrieved: ${responseTransaction.transactionId}`
        );
        res.status(StatusCodes.OK).json(responseTransaction);
    } catch (error) {
        logger.error(`Error fetching transaction by ID: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: error.message,
        });
    }
};

// @desc    Update Transaction
// @route   PUT /api/v1/transaction/:id
// @access  Private
export const updateTransaction = async (req, res) => {
    try {
        let updateData = { ...req.body };

        // Ensure isRecurring is a boolean before checking
        if (
            typeof updateData.isRecurring !== 'undefined' &&
            !updateData.isRecurring
        ) {
            updateData.recurrence = null;
            updateData.endDate = null;
        }

        const transaction = await Transaction.findOne({
            transactionId: req.params.id,
        });

        if (!transaction) {
            logger.warn(
                `Transaction not found or unauthorized: ID ${req.params.id}`
            );
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: 'Transaction not found or unauthorized' });
        }

        if (
            updateData.currency &&
            updateData.currency !== transaction.currency
        ) {
            try {
                if (!updateData.amount) {
                    logger.warn(
                        `Missing amount for currency conversion: Transaction ID ${req.params.id}`
                    );
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        error: 'Amount is required for currency conversion',
                    });
                }

                const convertedAmount = await convertCurrency(
                    updateData.amount,
                    updateData.currency,
                    BASE_CURRENCY
                );

                if (!convertedAmount) {
                    logger.error(
                        `Currency conversion failed for ${updateData.currency} to ${BASE_CURRENCY}`
                    );
                    return res
                        .status(StatusCodes.INTERNAL_SERVER_ERROR)
                        .json({ error: 'Currency conversion failed' });
                }

                updateData.baseAmount = convertedAmount;

                logger.info(
                    `Amount converted: ${updateData.amount} ${updateData.currency} -> ${updateData.baseAmount} ${BASE_CURRENCY}`
                );
            } catch (error) {
                logger.error(`Error converting currency: ${error.message}`);
                return res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ error: 'Currency conversion error' });
            }
        }

        // Prevent updating the user ID field for security
        delete updateData.user;

        const updatedTransaction = await Transaction.findOneAndUpdate(
            { transactionId: req.params.id },
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedTransaction) {
            logger.warn(
                `Transaction not found or unauthorized: ID ${req.params.id}`
            );
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: 'Transaction not found or unauthorized' });
        }

        logger.info(
            `Transaction updated successfully: ID ${updatedTransaction._id}`
        );
        res.status(StatusCodes.OK).json({
            message: 'Transaction Updated',
            transaction: updatedTransaction,
        });
    } catch (error) {
        logger.error(`Error updating transaction: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: 'Internal Server Error',
        });
    }
};

// @desc    Delete Transaction
// @route   DELETE /api/v1/transaction/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findOneAndDelete({
            transactionId: req.params.id,
        });
        if (!deletedTransaction) {
            logger.warn(
                `Transaction not found for deletion: ID ${req.params.id}`
            );
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: 'Transaction not found' });
        }

        logger.info(`Transaction deleted: ${deleteTransaction.transactionId}`);
        res.status(StatusCodes.OK).json({
            message: 'Transaction deleted successfully',
        });
    } catch (error) {
        logger.error(`Error deleting transaction: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: error.message,
        });
    }
};

// @desc    Convert currency
// @route   POST /api/v1/transaction/convertcurrency
// @access  Private
export const currencyConverter = async (req, res) => {
    try {
        const { tocurrency, amount, fromcurrency } = req.query;

        if (!tocurrency || !amount || !fromcurrency) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ error: 'amount, currency are required.' });
        }

        let convertedAmount;
        try {
            convertedAmount = await convertCurrency(
                amount,
                fromcurrency,
                tocurrency
            );
        } catch (error) {
            logger.error(`Currency conversion failed. ${error.message}`);
            throw new Error('Currency Conversion Failed');
        }

        res.status(StatusCodes.OK).json({
            amount: amount,
            fromcurrency: fromcurrency,
            tocurrency: tocurrency,
            convertedAmount: convertedAmount,
        });
    } catch (error) {
        logger.error(`Error fetching transaction by ID: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: error.message,
        });
    }
};
