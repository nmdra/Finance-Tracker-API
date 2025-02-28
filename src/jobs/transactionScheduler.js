import { Cron } from "croner";
import { Transaction } from "../models/transactionModel.js";
import { Notification } from "../models/notificationModel.js";
import { logger } from "../middleware/logger.js";
import dayjs from "dayjs";

// Function to check and notify users
const checkRecurringTransactions = async () => {
    try {
        const now = dayjs();
        const upcomingThreshold = now.add(1, "day").toDate(); // Look ahead 1 day
        const missedThreshold = now.subtract(1, "day").toDate(); // Look back 1 day

        // Find upcoming transactions
        const upcomingTransactions = await Transaction.find({
            isRecurring: true,
            nextDueDate: { $lte: upcomingThreshold, $gte: now.toDate() },
        });

        for (const transaction of upcomingTransactions) {
            await Notification.create({
                userId: transaction.user,
                type: `recurrence_alert`,
                message: `Reminder: Your ${transaction.category} transaction of ${transaction.amount} ${transaction.currency} is due soon.`,
                isRead: false,
            });
        }

        // Find missed transactions
        const missedTransactions = await Transaction.find({
            isRecurring: true,
            nextDueDate: { $lt: missedThreshold },
        });

        for (const transaction of missedTransactions) {
            await Notification.create({
                userId: transaction.user,
                type: `missed_payment`,
                message: `Missed Payment Alert: You missed your ${transaction.category} transaction of ${transaction.amount} ${transaction.currency}.`,
                isRead: false,
            });
        }

        logger.info("Recurring transaction check completed.");
    } catch (error) {
        logger.error(`Error checking recurring transactions: ${error.message}`);
    }
};

// Schedule job to run every day at midnight

new Cron("0 0 * * *", { timezone: "Asia/Colombo" }, async () => {

    try {
        logger.info("Running scheduled job: Checking recurring transactions...");
        await checkRecurringTransactions();
        logger.info("Scheduled job completed successfully.");
    } catch (error) {
        logger.error(`Error in scheduled job: ${error.message}`);
    }
});