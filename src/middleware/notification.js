import { Notification } from "../models/notificationModel.js";
import { logger } from "./logger.js";

/**
 * Middleware to create a notification
 */
export const createNotification = async (userId, type, message) => {
    try {
        const notification = new Notification({ userId, type, message });
        await notification.save();
        logger.info(`Notification created for user ${userId}: ${message}`);
    } catch (error) {
        logger.error(`Failed to create notification: ${error.message}`);
    }
};
