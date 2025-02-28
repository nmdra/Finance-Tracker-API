import { Budget } from "../models/budgetModel.js";
import { convertCurrency } from "../utils/currencyConverter.js";
import { StatusCodes } from "http-status-codes";
import { logger } from "../middleware/logger.js";

/**
 * @desc    Add a new budget
 * @route   POST /api/v1/budgets
 * @access  Private
 */
export const addBudget = async (req, res, next) => {
    try {
        const { category, monthlyLimit, currency, startDate, endDate } = req.body;
        const userId = req.user.id;

        if (!category || !monthlyLimit || !currency || !startDate || !endDate) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "All fields are required." });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "End date must be after start date." });
        }

        // Convert budget to base currency
        const baseAmount = await convertCurrency(monthlyLimit, currency);

        const budget = new Budget({
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
            id: budget._id,
            monthlyLimit: budget.monthlyLimit
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
        const { category, monthlyLimit, currency, startDate, endDate } = req.body;
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Budget not found." });
        }

        if (budget.userId.toString() !== req.user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });
        }

        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "End date must be after start date." });
        }

        if (category) budget.category = category;
        if (monthlyLimit !== budget.monthlyLimit) {
            budget.monthlyLimit = monthlyLimit;
            budget.baseAmount = await convertCurrency(monthlyLimit, currency || budget.currency);
        }
        if (currency) budget.currency = currency;
        if (startDate) budget.startDate = startDate;
        if (endDate) budget.endDate = endDate;

        await budget.save();
        res.status(StatusCodes.OK).json({
            message: "Budget Updated",
            id: budget._id,
        });
    } catch (error) {
        logger.error(`Failed to update budget: ${error.message}`);
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

        if (!budget) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Budget not found." });
        }

        if (budget.userId.toString() !== req.user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });
        }

        await budget.deleteOne();
        res.status(StatusCodes.OK).json({ message: "Budget deleted successfully." });
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

        if (!budget) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Budget not found." });
        }

        if (budget.userId.toString() !== req.user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });
        }

        const remaining = ((budget.monthlyLimit - budget.spent) / budget.monthlyLimit) * 100;
        res.status(StatusCodes.OK).json({
            id: budget._id,
            remainingPercentage: remaining.toFixed(2)
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

// TODO add notification by checking budget is exceeded.
// TODO Check budget time exceeded before add spent
export const addSpentToBudget = async (req, res, next) => {
    try {
        let { amount, currency } = req.body;
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Budget not found." });
        }

        if (budget.userId.toString() !== req.user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });
        }

        // Convert spent amount to budget's currency
        if (budget.currency !== currency) {
            amount = await convertCurrency(amount, currency, budget.currency);
        }
        budget.spent += parseFloat(amount);

        await budget.save();
        res.status(StatusCodes.OK).json({
            id: budget._id,
        });
    } catch (error) {
        logger.error(`Failed to update spent amount: ${error.message}`);
        next(error);
    }
};
