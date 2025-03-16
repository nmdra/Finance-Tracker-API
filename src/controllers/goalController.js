import { Goal } from '../models/goalModel.js';
import { convertCurrency } from '../utils/currencyConverter.js';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../middleware/logger.js';
import { createNotification } from '../middleware/notification.js';

/**
 * @desc    Add a new financial goal
 * @route   POST /api/v1/goals
 * @access  Private
 */
export const addGoal = async (req, res, next) => {
    try {
        const {
            title,
            targetAmount,
            currency,
            deadline,
            allocationCategories,
            allocationPercentage,
        } = req.body;
        const userId = req.user.id;

        if (!title || !targetAmount || !currency) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Title, targetAmount, and currency are required.',
            });
        }

        if (allocationPercentage < 0 || allocationPercentage > 100) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Allocation percentage must be between 0 and 100.',
            });
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

        res.status(StatusCodes.CREATED).json({
            goal: {
                id: goal._id,
                title: goal.title,
                targetAmount: goal.targetAmount,
                currency: goal.currency,
                savedAmount: goal.savedAmount,
                progress: (goal.savedAmount / goal.targetAmount) * 100,
                links: [
                    { rel: 'self', href: `/api/v1/goal/${goal._id}` },
                    { rel: 'update', href: `/api/v1/goal/${goal._id}` },
                    { rel: 'delete', href: `/api/v1/goal/${goal._id}` },
                    {
                        rel: 'addSavings',
                        href: `/api/v1/goal/${goal._id}/savings`,
                    },
                    {
                        rel: 'progress',
                        href: `/api/v1/goal/${goal._id}/progress`,
                    },
                ],
            },
            links: [{ rel: 'getAllGoals', href: '/api/v1/goals' }],
        });
    } catch (error) {
        logger.error(`Failed to add goal: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Get all goals for a user
 * @route   GET /api/v1/goals
 * @access  Private
 */
export const getAllGoals = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const goals = await Goal.find({ userId });

        if (!goals.length) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'No goals found for this user.',
            });
        }

        // Generate hypermedia links for each goal
        const goalsWithLinks = goals.map((goal) => ({
            id: goal._id,
            title: goal.title,
            targetAmount: goal.targetAmount,
            currency: goal.currency,
            savedAmount: goal.savedAmount,
            progress: (goal.savedAmount / goal.targetAmount) * 100,
            links: [
                { rel: 'self', href: `/api/v1/goal/${goal._id}` },
                { rel: 'update', href: `/api/v1/goal/${goal._id}` },
                { rel: 'delete', href: `/api/v1/goal/${goal._id}` },
                { rel: 'addSavings', href: `/api/v1/goal/${goal._id}/savings` },
                { rel: 'progress', href: `/api/v1/goal/${goal._id}/progress` },
            ],
        }));

        res.status(StatusCodes.OK).json({
            goals: goalsWithLinks,
            links: [
                { rel: 'createGoal', href: '/api/v1/goals' },
                { rel: 'getAllGoals', href: '/api/v1/goals' },
            ],
        });
    } catch (error) {
        logger.error(`Failed to get all goals: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Update an existing goal
 * @route   PUT /api/v1/goal/:id
 * @access  Private
 */
export const updateGoal = async (req, res, next) => {
    try {
        const {
            title,
            targetAmount,
            currency,
            deadline,
            allocationCategories,
            allocationPercentage,
        } = req.body;
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Goal not found.' });
        }

        if (goal.userId.toString() !== req.user.id) {
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });
        }

        if (title) goal.title = title;
        if (currency) goal.currency = currency;
        if (targetAmount) {
            goal.targetAmount = targetAmount;
            goal.baseAmount = await convertCurrency(
                targetAmount,
                currency || goal.currency
            );
        }
        if (deadline) goal.deadline = deadline;
        if (allocationCategories)
            goal.allocationCategories = allocationCategories;
        if (allocationPercentage !== undefined) {
            if (allocationPercentage < 0 || allocationPercentage > 100) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Allocation percentage must be between 0 and 100.',
                });
            }
            goal.allocationPercentage = allocationPercentage;
        }

        await goal.save();

        res.status(StatusCodes.OK).json({
            goal: {
                id: goal._id,
                title: goal.title,
                targetAmount: goal.targetAmount,
                currency: goal.currency,
                savedAmount: goal.savedAmount,
                progress: (goal.savedAmount / goal.targetAmount) * 100,
                links: [
                    { rel: 'self', href: `/api/v1/goal/${goal._id}` },
                    { rel: 'update', href: `/api/v1/goal/${goal._id}` },
                    { rel: 'delete', href: `/api/v1/goal/${goal._id}` },
                    {
                        rel: 'addSavings',
                        href: `/api/v1/goal/${goal._id}/savings`,
                    },
                    {
                        rel: 'progress',
                        href: `/api/v1/goal/${goal._id}/progress`,
                    },
                ],
            },
        });
    } catch (error) {
        logger.error(`Failed to update goal: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Delete a financial goal
 * @route   DELETE /api/v1/goal/:id
 * @access  Private
 */
export const deleteGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Goal not found.' });
        }

        if (goal.userId.toString() !== req.user.id) {
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });
        }

        await goal.deleteOne();
        res.status(StatusCodes.OK).json({
            message: 'Goal deleted successfully.',
        });
    } catch (error) {
        logger.error(`Failed to delete goal: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Get goal progress in percentage
 * @route   GET /api/v1/goal/:id/progress
 * @access  Private
 */
export const getGoalProgress = async (req, res, next) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Goal not found.' });
        }

        if (goal.userId.toString() !== req.user.id) {
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });
        }

        const progress = (goal.savedAmount / goal.targetAmount) * 100;
        res.status(StatusCodes.OK).json({
            progressPercentage: progress.toFixed(2),
        });
    } catch (error) {
        logger.error(`Failed to get goal progress: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Add savings to goal
 * @route   PUT /api/v1/goal/:id/savings
 * @access  Private
 */
export const addSavingsToGoal = async (req, res, next) => {
    try {
        let { amount, currency } = req.body;
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Goal not found.' });
        }

        if (goal.userId.toString() !== req.user.id) {
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });
        }

        const updatedGoal = await updateGoalSavings(goal, amount, currency);

        res.status(StatusCodes.OK).json(updatedGoal);
    } catch (error) {
        logger.error(`Failed to update savings amount: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Update goal savings and mark as completed if needed
 * @param   {Object} goal - The goal object
 * @param   {Number} amount - Amount to add
 * @param   {String} currency - Currency of the amount
 * @returns {Object} Updated goal
 */
const updateGoalSavings = async (goal, amount, currency) => {
    if (currency !== goal.currency) {
        amount = await convertCurrency(amount, currency, goal.currency);
    }

    goal.savedAmount += amount;
    if (goal.savedAmount >= goal.targetAmount) {
        goal.completed = true;
    }

    await goal.save();

    return {
        goal: {
            id: goal._id,
            title: goal.title,
            targetAmount: goal.targetAmount,
            savedAmount: goal.savedAmount,
            progress: (goal.savedAmount / goal.targetAmount) * 100,
            currency: goal.currency,
            links: [
                { rel: 'self', href: `/api/v1/goal/${goal._id}` },
                { rel: 'update', href: `/api/v1/goal/${goal._id}` },
                { rel: 'delete', href: `/api/v1/goal/${goal._id}` },
                { rel: 'addSavings', href: `/api/v1/goal/${goal._id}/savings` },
                { rel: 'progress', href: `/api/v1/goal/${goal._id}/progress` },
            ],
        },
    };
};

/**
 * @desc    Automatically allocate funds to goals from an income transaction
 * @param   {Object} transaction - The income transaction
 */
export const autoAllocateToGoals = async (transaction) => {
    try {
        if (transaction.type !== 'income') return;

        const userId = transaction.user;
        if (!userId) {
            logger.warn('Transaction is missing user information.');
            return;
        }

        // Fetch all goals belonging to the user
        const goals = await Goal.find({ userId });

        if (!goals.length) {
            logger.info(`No goals found for user ${userId}.`);
            return;
        }

        for (const goal of goals) {
            if (
                goal.allocationCategories.includes(transaction.category) &&
                goal.allocationPercentage > 0 &&
                !goal.isCompleted
            ) {
                let allocatedAmount =
                    (transaction.amount * goal.allocationPercentage) / 100;

                if (goal.currency !== transaction.currency)
                    allocatedAmount = await convertCurrency(
                        allocatedAmount,
                        transaction.currency,
                        goal.currency
                    );

                await updateGoalSavings(goal, allocatedAmount, goal.currency);

                await createNotification(
                    userId,
                    'goal_reminder',
                    `Allocate ${allocatedAmount} ${goal.currency} to  ${goal.title}`
                );

                logger.info(`allocate to Goal: ${goal._id}`);
            }
        }
    } catch (error) {
        logger.error(`Failed to auto-allocate funds: ${error.message}`);
    }
};
