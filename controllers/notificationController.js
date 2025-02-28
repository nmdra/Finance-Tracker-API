import { Notification } from "../models/notificationModel.js";
import { StatusCodes } from "http-status-codes";
import { logger } from "../middleware/logger.js";

/**
 * @desc    Get filtered notifications for a user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
    try {
        const { markAsRead, type, startDate, endDate } = req.query;

        // Build query object dynamically based on filters
        let query = { userId: req.user.id };

        if (markAsRead !== undefined) query.isRead = markAsRead === "true"; // Convert string to boolean

        if (type) query.type = type;

        if (startDate || endDate) {
            query.createdAt = {};

            if (startDate) query.createdAt.$gte = new Date(startDate);

            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Fetch filtered notifications
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 }) // Sort by newest first
            .exec();

        res.status(StatusCodes.OK).json(notifications);
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

        if (!notification) return res.status(StatusCodes.NOT_FOUND).json({ message: "Notification not found." });

        if (notification.userId.toString() !== req.user.id) return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });

        notification.isRead = true;
        await notification.save();

        res.status(StatusCodes.OK).json(notification);
    } catch (error) {
        logger.error(`Failed to mark notification as read: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Create a new notification
 * @route   POST /api/v1/notifications
 * @access  Private
 */
// export const createNotification = async (userId, message, type, alertData) => {
//     try {
//         const notification = new Notification({
//             userId,
//             message,
//             type,
//             alertData,
//             markAsRead: false,
//         });

//         await notification.save();
//     } catch (error) {
//         logger.error(`Failed to create notification: ${error.message}`);
//     }
// };

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) return res.status(StatusCodes.NOT_FOUND).json({ message: "Notification not found." });

        if (notification.userId.toString() !== req.user.id) return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized action." });

        await notification.deleteOne();
        res.status(StatusCodes.OK).json({ message: "Notification deleted successfully." });
    } catch (error) {
        logger.error(`Failed to delete notification: ${error.message}`);
        next(error);
    }
};
