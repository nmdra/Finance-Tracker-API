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
        const { title, targetAmount, currency, deadline, allocationCategories, allocationPercentage } = req.body;
        const userId = req.user.id;

        if (!title || !targetAmount || !currency) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Title, targetAmount, and currency are required." });
        }

        if (allocationPercentage < 0 || allocationPercentage > 100) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Allocation percentage must be between 0 and 100." });
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
            allocationCategories: allocationCategories || [],
            allocationPercentage: allocationPercentage || 0,
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
        const { title, targetAmount, currency, deadline, allocationCategories, allocationPercentage } = req.body;
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
        if (allocationCategories) goal.allocationCategories = allocationCategories;
        if (allocationPercentage !== undefined) {
            if (allocationPercentage < 0 || allocationPercentage > 100) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: "Allocation percentage must be between 0 and 100." });
            }
            goal.allocationPercentage = allocationPercentage;
        }

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

//TODO Auto Allocation with transaction
/**
 * @desc    Automatically allocate funds to goals from an income transaction
 * @param   {Object} transaction - The income transaction
 */
export const autoAllocateToGoals = async (transaction, userId) => {
    try {
        if (transaction.type !== "income") return;

        const goals = await Goal.find({ userId });

        for (const goal of goals) {
            if (
                goal.allocationCategories.includes(transaction.category) &&
                goal.allocationPercentage > 0 &&
                !goal.isCompleted
            ) {
                let allocatedAmount = (transaction.amount * goal.allocationPercentage) / 100;

                if (goal.currency !== transaction.currency) allocatedAmount = await convertCurrency(allocatedAmount, transaction.currency, goal.currency);

                await updateGoalSavings(goal, allocatedAmount, goal.currency);
            }
        }
    } catch (error) {
        logger.error(`Failed to auto-allocate funds: ${error.message}`);
    }
};

/**
 * @desc    Update goal savings and mark as completed if needed
 * @param   {Object} goal - The goal object
 * @param   {Number} amount - Amount to add
 * @param   {String} currency - Currency of the amount
 * @returns {Object} Updated goal
 */
export const updateGoalSavings = async (goal, amount, currency) => {
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
