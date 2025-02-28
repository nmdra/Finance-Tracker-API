import User from "../models/userModel.js";
import { Transaction } from "../models/transactionModel.js";
import { Goal } from "../models/goalModel.js";
import { StatusCodes } from "http-status-codes";
import { logger } from "../middleware/logger.js";

/**
 * @desc Get all users
 * @route GET /api/v1/admin/users
 * @access Admin
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select("-password"); // Exclude password
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
            return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found." });
        }

        await user.deleteOne();
        res.status(StatusCodes.OK).json({ message: "User deleted successfully." });
    } catch (error) {
        logger.error(`Failed to delete user: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Get all transactions
 * @route GET /api/v1/admin/transactions
 * @access Admin
 */
export const getAllTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find();
        res.status(StatusCodes.OK).json(transactions);
    } catch (error) {
        logger.error(`Failed to fetch transactions: ${error.message}`);
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
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Transaction not found." });
        }

        await transaction.deleteOne();
        res.status(StatusCodes.OK).json({ message: "Transaction deleted successfully." });
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
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Goal not found." });
        }

        await goal.deleteOne();
        res.status(StatusCodes.OK).json({ message: "Goal deleted successfully." });
    } catch (error) {
        logger.error(`Failed to delete goal: ${error.message}`);
        next(error);
    }
};
