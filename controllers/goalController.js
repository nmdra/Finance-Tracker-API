import { Goal } from "../models/goalModel.js";
import { convertCurrency } from "../utils/currencyConverter.js";
import { StatusCodes } from "http-status-codes";
import { logger } from "../middleware/logger.js";

/**
 * @desc    Add a new financial goal
 * @route   POST /api/v1/goals
 * @access  Private
 */
export const addGoal = async (req, res, next) => {
    try {
        const { title, targetAmount, currency, deadline } = req.body;
        const userId = req.user.id;

        if (!title || !targetAmount || !currency) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "All fields are required." });
        }

        // Convert goal target amount to base currency
        const baseAmount = await convertCurrency(targetAmount, currency);

        const goal = new Goal({
            userId,
            title,
            targetAmount,
            savedAmount: 0,
            currency,
            baseAmount,
            deadline,
        });

        await goal.save();
        res.status(StatusCodes.CREATED).json(goal);
    } catch (error) {
        logger.error(`Failed to add goal: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Update an existing goal
 * @route   PUT /api/v1/goals/:id
 * @access  Private
 */
export const updateGoal = async (req, res, next) => {
    try {
        const { title, targetAmount, currency, deadline } = req.body;
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Goal not found." });
        }

        if (goal.userId.toString() !== req.user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });
        }

        if (title) goal.title = title;
        if (currency) goal.currency = currency;
        if (targetAmount) {
            goal.targetAmount = targetAmount;
            goal.baseAmount = await convertCurrency(targetAmount, currency || goal.currency);
        }
        if (deadline) goal.deadline = deadline;

        await goal.save();
        res.status(StatusCodes.OK).json(goal);
    } catch (error) {
        logger.error(`Failed to update goal: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Delete a financial goal
 * @route   DELETE /api/v1/goals/:id
 * @access  Private
 */
export const deleteGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Goal not found." });
        }

        if (goal.userId.toString() !== req.user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });
        }

        await goal.deleteOne();
        res.status(StatusCodes.OK).json({ message: "Goal deleted successfully." });
    } catch (error) {
        logger.error(`Failed to delete goal: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Get goal progress in percentage
 * @route   GET /api/v1/goals/:id/progress
 * @access  Private
 */
export const getGoalProgress = async (req, res, next) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Goal not found." });
        }

        if (goal.userId.toString() !== req.user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });
        }

        const progress = (goal.savedAmount / goal.targetAmount) * 100;
        res.status(StatusCodes.OK).json({ progressPercentage: progress.toFixed(2) });
    } catch (error) {
        logger.error(`Failed to get goal progress: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Add savings to goal
 * @route   PUT /api/v1/goals/:id/savings
 * @access  Private
*/
export const addSavingsToGoal = async (req, res, next) => {
    try {
        let { amount, currency } = req.body;
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Goal not found." });
        }

        if (goal.userId.toString() !== req.user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });
        }

        const updatedGoal = await updateGoalSavings(goal, amount, currency);

        res.status(StatusCodes.OK).json(updatedGoal);
    } catch (error) {
        logger.error(`Failed to update savings amount: ${error.message}`);
        next(error);
    }
};

export const updateGoalSavings = async (goal, amount, currency) => {
    // Convert savings amount to goal's currency if different
    if (goal.currency !== currency) {
        const convertedAmount = await convertCurrency(amount, currency, goal.currency);
        amount = parseFloat(convertedAmount);
    }

    goal.savedAmount += amount;

    if (goal.savedAmount >= goal.targetAmount) {
        goal.isCompleted = true;
    }

    await goal.save();
    return goal;
};
