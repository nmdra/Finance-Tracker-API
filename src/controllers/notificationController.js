import { Notification } from '../models/notificationModel.js';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../middleware/logger.js';

const API_VERSION = process.env.API_VERSION;

/**
 * @desc    Get filtered notifications for a user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
    try {
        const {
            markAsRead,
            type,
            startDate,
            endDate,
            page = 1,
            limit = 10,
        } = req.query;

        const query = {}; // Initialize query object

        // If user is not an admin, filter by user ID
        if (req.user.memberType !== 'admin') {
            query.user = req.user.id;
        }

        if (markAsRead !== undefined) query.isRead = markAsRead === 'true'; // Convert string to boolean
        if (type) query.type = type;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Convert pagination params to numbers & ensure they are positive
        const pageNumber = Math.max(parseInt(page, 10), 1);
        const pageSize = Math.max(parseInt(limit, 10), 1);
        const skip = (pageNumber - 1) * pageSize;

        // Fetch filtered notifications with pagination
        const [notifications, totalCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 }) // Sort by newest first
                .skip(skip)
                .limit(pageSize)
                .exec(),
            Notification.countDocuments(query), // Get total count
        ]);

        logger.info(
            `Fetched ${notifications.length} notifications (Page: ${pageNumber}, Limit: ${pageSize}, Total: ${totalCount})`
        );

        res.status(StatusCodes.OK).json({
            total: totalCount,
            page: pageNumber,
            totalPages: Math.ceil(totalCount / pageSize),
            notifications,
            links: {
                self: {
                    href: `/api/${API_VERSION}/notification`,
                    method: 'GET',
                },
            },
        });
    } catch (error) {
        logger.error(`Failed to get notifications: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification)
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Notification not found.' });
        if (notification.userId.toString() !== req.user.id)
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });

        notification.isRead = true;
        await notification.save();

        res.status(StatusCodes.OK).json(notification);
    } catch (error) {
        logger.error(`Failed to mark notification as read: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification)
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Notification not found.' });
        if (notification.userId.toString() !== req.user.id)
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'Unauthorized action.' });

        await notification.deleteOne();
        res.status(StatusCodes.OK).json({
            message: 'Notification deleted successfully.',
        });
    } catch (error) {
        logger.error(`Failed to delete notification: ${error.message}`);
        next(error);
    }
};
