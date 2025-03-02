import { Config } from '../models/configModel.js';
import User from '../models/userModel.js';
import { Transaction } from '../models/transactionModel.js';
import { Goal } from '../models/goalModel.js';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../middleware/logger.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Authenticate admin & get token
// @route   POST /api/v1/admin/auth
// @access  Public
export const authAdmin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            res.status(StatusCodes.BAD_REQUEST);
            throw new Error('Email and password are required.');
        }

        const admin = await User.findOne({ email });

        if (!admin || admin.memberType !== 'admin') {
            res.status(StatusCodes.UNAUTHORIZED);
            throw new Error('Invalid credentials or not an admin.');
        }

        if (await admin.matchPassword(password)) {
            generateToken(res, admin._id);

            res.status(StatusCodes.OK).json({
                _id: admin._id,
            });
        } else {
            res.status(StatusCodes.UNAUTHORIZED).json({
                message: 'Invalid email or password.',
            });
        }
    } catch (error) {
        logger.error(`Admin authentication failed: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Get all users
 * @route GET /api/v1/admin/users
 * @access Admin
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password'); // Exclude password
        res.status(StatusCodes.OK).json(users);
    } catch (error) {
        logger.error(`Failed to fetch users: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Delete a user
 * @route DELETE /api/v1/admin/users/:id
 * @access Admin
 */
export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'User not found.' });
        }

        await user.deleteOne();
        res.status(StatusCodes.OK).json({
            message: 'User deleted successfully.',
        });
    } catch (error) {
        logger.error(`Failed to delete user: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Delete a transaction
 * @route DELETE /api/v1/admin/transactions/:id
 * @access Admin
 */
export const deleteTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Transaction not found.' });
        }

        await transaction.deleteOne();
        res.status(StatusCodes.OK).json({
            message: 'Transaction deleted successfully.',
        });
    } catch (error) {
        logger.error(`Failed to delete transaction: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Get all financial goals
 * @route GET /api/v1/admin/goals
 * @access Admin
 */
export const getAllGoals = async (req, res, next) => {
    try {
        const goals = await Goal.find();
        res.status(StatusCodes.OK).json(goals);
    } catch (error) {
        logger.error(`Failed to fetch goals: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Delete a financial goal
 * @route DELETE /api/v1/admin/goals/:id
 * @access Admin
 */
export const deleteGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Goal not found.' });
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
 * @desc    Get system settings
 * @route   GET /api/v1/admin/settings
 * @access  Private (Admin Only)
 */
export const getSettings = async (req, res, next) => {
    try {
        const settings = await Config.findOne();
        if (!settings) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'No settings found' });
        }
        res.status(StatusCodes.OK).json(settings);
    } catch (error) {
        logger.error(`Failed to fetch settings: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/v1/admin/settings
 * @access  Private (Admin Only)
 */
export const updateSettings = async (req, res, next) => {
    try {
        const { defaultCurrency, budgetLimit, transactionCategories } =
            req.body;

        let settings = await Config.findOne();
        if (!settings) {
            settings = new Config({});
        }

        if (defaultCurrency) settings.defaultCurrency = defaultCurrency;
        if (budgetLimit) settings.budgetLimit = budgetLimit;
        if (transactionCategories)
            settings.transactionCategories = transactionCategories;

        await settings.save();
        res.status(StatusCodes.OK).json({
            message: 'Settings updated successfully',
            settings,
        });
    } catch (error) {
        logger.error(`Failed to update settings: ${error.message}`);
        next(error);
    }
};
