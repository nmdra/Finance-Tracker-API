import { Transaction } from '../models/transactionModel.js';
import { Goal } from '../models/goalModel.js';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../middleware/logger.js';

/**
 * @desc    Get spending trends over time
 * @route   GET /api/v1/reports/spending-trends
 * @access  Private
 */
export const getSpendingTrends = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ message: 'Start date and end date are required.' });
        }

        const matchCriteria = {
            user: req.user.id,
            type: 'expense',
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
        };

        const spendingTrends = await Transaction.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' },
                    },
                    total: { $sum: '$amount' },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        if (!spendingTrends.length) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({
                    message: 'No spending data found for the given period.',
                });
        }

        logger.info(
            `Spending trends fetched successfully. Entries: ${spendingTrends.length}`
        );
        res.status(StatusCodes.OK).json(spendingTrends);
    } catch (error) {
        logger.error(`Error fetching spending trends: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Get income vs expenses report
 * @route   GET /api/v1/reports/income-vs-expenses
 * @access  Private
 */
export const getIncomeVsExpenses = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ message: 'Start date and end date are required.' });
        }

        const matchCriteria = {
            user: req.user.id,
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
        };

        const incomeVsExpenses = await Transaction.aggregate([
            { $match: matchCriteria },
            { $group: { _id: '$type', total: { $sum: '$amount' } } },
        ]);

        const result = {
            income: 0,
            expenses: 0,
        };

        incomeVsExpenses.forEach((item) => {
            if (item._id === 'income') result.income = item.total;
            if (item._id === 'expense') result.expenses = item.total;
        });

        logger.info('Income vs Expenses report generated.');
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        logger.error(`Error fetching income vs expenses: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Get financial goals progress summary
 * @route   GET /api/v1/reports/goals-progress
 * @access  Private
 */
export const getGoalsProgress = async (req, res, next) => {
    try {
        const goals = await Goal.find({ userId: req.user.id });

        if (!goals.length) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'No financial goals found.' });
        }

        const goalsProgress = goals.map((goal) => ({
            goalId: goal._id,
            title: goal.title,
            targetAmount: goal.targetAmount,
            savedAmount: goal.savedAmount,
            progressPercentage: (
                (goal.savedAmount / goal.targetAmount) *
                100
            ).toFixed(2),
            isCompleted: goal.isCompleted,
        }));

        logger.info(
            `Goals progress report generated. Total goals: ${goals.length}`
        );
        res.status(StatusCodes.OK).json(goalsProgress);
    } catch (error) {
        logger.error(`Error fetching goals progress: ${error.message}`);
        next(error);
    }
};
