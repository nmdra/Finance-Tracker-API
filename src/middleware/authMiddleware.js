import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { StatusCodes } from 'http-status-codes';
import { logger } from './logger.js';

/**
 * Middleware to protect routes by verifying JWT token.
 */
export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            logger.warn('Unauthorized access attempt. No token provided.');
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ error: 'Not authorized. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            logger.warn(`User not found for token: ${token}`);
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: 'User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            logger.error('Invalid token signature.');
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ error: 'Invalid token signature.' });
        }

        logger.error(`Authentication error: ${error.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: 'Authentication failed.',
        });
    }
};

/**
 * Middleware to restrict access to admin users only.
 */
export const adminOnly = (req, res, next) => {
    if (!req.user || req.user.memberType !== 'admin') {
        logger.warn(`Access denied for user ID: ${req.user?.id || 'Unknown'}`);
        return res
            .status(StatusCodes.FORBIDDEN)
            .json({ error: 'Access denied. Admins only.' });
    }

    next();
};

/**
 * Middleware to restrict access to admin users only.
 */
export const regularOnly = (req, res, next) => {
    if (!req.user || req.user.memberType !== 'regular') {
        logger.warn(`Access denied for user ID: ${req.user?.id || 'Unknown'}`);
        return res
            .status(StatusCodes.FORBIDDEN)
            .json({ error: 'Access denied. Regular Users only.' });
    }

    next();
};
