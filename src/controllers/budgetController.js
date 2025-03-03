import { Budget } from '../models/budgetModel.js';
import { convertCurrency } from '../utils/currencyConverter.js';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../middleware/logger.js';
import { createNotification } from '../middleware/notification.js';

/**
 * @desc    Add a new budget
 * @route   POST /api/v1/budgets
 * @access  Private
 */
export const addBudget = async (req, res, next) => {
    try {
        const { title, category, monthlyLimit, currency, startDate, endDate } =
            req.body;
        const userId = req.user.id;

        if (
            !title ||
            !category ||
            !monthlyLimit ||
            !currency ||
            !startDate ||
            !endDate
        )
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ message: 'All fields are required.' });

        if (new Date(startDate) >= new Date(endDate))
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ message: 'End date must be after start date.' });

        // Convert budget to base currency
        const baseAmount = await convertCurrency(monthlyLimit, currency);

        const budget = new Budget({
            title,
            userId,
            category,
            monthlyLimit,
            spent: 0,
            currency,
            baseAmount,
            startDate,
            endDate,
        });

        await budget.save();
        res.status(StatusCodes.CREATED).json({
            title: budget.title,
            id: budget._id,
            monthlyLimit: budget.monthlyLimit,
        });
    } catch (error) {
        logger.error(`Failed to add budget: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Update an existing budget
 * @route   PUT /api/v1/budgets/:id
 * @access  Private
 */
export const updateBudget = async (req, res, next) => {
    try {
        const { title, category, monthlyLimit, currency, startDate, endDate } =
            req.body;
        const budget = await Budget.findById(req.params.id);

        if (!budget)
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Budget not found.' });

        if (budget.userId.toString() !== req.user.id)
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });

        if (startDate && endDate && new Date(startDate) >= new Date(endDate))
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ message: 'End date must be after start date.' });

        if (title) budget.title = title;
        if (category) budget.category = category;
        if (monthlyLimit !== budget.monthlyLimit) {
            budget.monthlyLimit = monthlyLimit;
            budget.baseAmount = await convertCurrency(
                monthlyLimit,
                currency || budget.currency
            );
        }
        if (currency) budget.currency = currency;
        if (startDate) budget.startDate = startDate;
        if (endDate) budget.endDate = endDate;

        await budget.save();
        res.status(StatusCodes.OK).json({
            message: 'Budget Updated',
            id: budget._id,
        });
    } catch (error) {
        logger.error(`Failed to update budget: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Get a budget
 * @route   GET /api/v1/budgets/:id
 * @access  Private
 */
export const getBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget)
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Budget not found.' });

        res.status(StatusCodes.OK).json({
            title: budget.title,
            id: budget._id,
            monthlyLimit: budget.monthlyLimit,
            spent: budget.spent,
            currency: budget.currency,
            startDate: budget.startDate,
            endDate: budget.endDate,
        });
    } catch (error) {
        logger.error(`Failed to retrive budget details: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Delete a budget
 * @route   DELETE /api/v1/budgets/:id
 * @access  Private
 */
export const deleteBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget)
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Budget not found.' });

        if (budget.userId.toString() !== req.user.id)
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });

        await budget.deleteOne();
        res.status(StatusCodes.OK).json({
            message: 'Budget deleted successfully.',
        });
    } catch (error) {
        logger.error(`Failed to delete budget: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Get remaining budget percentage
 * @route   GET /api/v1/budgets/:id/remaining
 * @access  Private
 */
export const getRemainingBudgetPercentage = async (req, res, next) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget)
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Budget not found.' });

        if (budget.userId.toString() !== req.user.id)
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });

        const remaining =
            ((budget.monthlyLimit - budget.spent) / budget.monthlyLimit) * 100;
        res.status(StatusCodes.OK).json({
            id: budget._id,
            remainingPercentage: remaining.toFixed(2),
        });
    } catch (error) {
        logger.error(`Failed to get remaining budget: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Add spent amount to budget (linked with transactions)
 * @route   POST /api/v1/budgets/:id/spent
 * @access  Private
 */

export const addSpentToBudget = async (req, res, next) => {
    try {
        let { amount, currency } = req.body;
        const budget = await Budget.findById(req.params.id);

        if (!budget)
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Budget not found.' });

        if (budget.userId.toString() !== req.user.id)
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });

        const now = new Date();
        if (now > budget.endDate)
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Cannot add spent amount. Budget period has ended.',
            });

        // Convert spent amount to budget's currency
        if (budget.currency !== currency)
            amount = await convertCurrency(amount, currency, budget.currency);

        budget.spent += parseFloat(amount);

        await budget.save();

        await createNotification(
            budget.userId,
            'budget_alert',
            `Your budget for ${budget.category} has been exceeded!`
        );

        res.status(StatusCodes.OK).json({
            id: budget._id,
            spent: budget.spent,
            message:
                budget.spent > budget.monthlyLimit
                    ? 'Budget exceeded!'
                    : 'Spent amount added successfully.',
        });
    } catch (error) {
        logger.error(`Failed to update spent amount: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Automatically update budget when a transaction is added
 * @param   {Object} transaction - The newly created transaction
 */
export const updateBudgetOnTransaction = async (transaction) => {
    try {
        const budget = await Budget.findOne({
            userId: transaction.user,
            category: transaction.category,
        });

        if (!budget) return; // No matching budget, nothing to update

        const now = new Date();
        if (now > budget.endDate) {
            logger.info(
                `Budget period for ${budget.category} has ended. No update performed.`
            );
            return;
        }

        let convertedAmount = transaction.amount;

        // Convert transaction amount to budget's currency if needed
        if (budget.currency !== transaction.currency) {
            convertedAmount = await convertCurrency(
                transaction.amount,
                transaction.currency,
                budget.currency
            );
        }

        budget.spent += parseFloat(convertedAmount);
        await budget.save();

        logger.info(
            `Budget updated for category: ${budget.category}. New spent amount: ${budget.spent}`
        );

        // Notify user if budget is exceeded
        if (budget.spent > budget.monthlyLimit) {
            await createNotification(
                budget.userId,
                'budget_alert',
                `Your budget for ${budget.category} has been exceeded!`
            );
        }
    } catch (error) {
        logger.error(
            `Failed to update budget on transaction: ${error.message}`
        );
    }
};
