import { Cron } from 'croner';
import { Transaction } from '../models/transactionModel.js';
import { Notification } from '../models/notificationModel.js';
import { sendEmail } from '../middleware/email.js';
import { logger } from '../middleware/logger.js';
import dayjs from 'dayjs';

// Base URL for the finance app (update this with your actual app URL)
const APP_URL = process.env.APP_URL || 'https://finance-tracker.com';

/**
 * Function to check recurring transactXDG_STATE_HOMEions and notify users.
 */
const checkRecurringTransactions = async () => {
    try {
        const now = dayjs();
        const upcomingThreshold = now.add(1, 'day').toDate(); // Look ahead 1 day
        const missedThreshold = now.subtract(1, 'day').toDate(); // Look back 1 day

        // Find upcoming transactions
        const upcomingTransactions = await Transaction.find({
            isRecurring: true,
            nextDueDate: { $lte: upcomingThreshold, $gte: now.toDate() },
        }).populate('user');

        for (const transaction of upcomingTransactions) {
            const message = `Reminder: Your ${transaction.category} transaction of ${transaction.amount} ${transaction.currency} is due soon.`;

            // Save notification in DB
            await Notification.create({
                userId: transaction.user._id,
                type: 'recurrence_alert',
                message,
                isRead: false,
            });

            // Send email notification
            if (transaction.user.email) {
                const emailBody = `
                    <p>Dear ${transaction.user.name || 'User'},</p>
                    <p>This is a friendly reminder that your <strong>${transaction.category}</strong> transaction of <strong>${transaction.amount} ${transaction.currency}</strong> is due on <strong>${dayjs(transaction.nextDueDate).format('MMMM D, YYYY')}</strong>.</p>
                    <p>Please ensure you make the necessary arrangements to complete the transaction.</p>
                    <p>You can review your transactions <a href="${APP_URL}/transactions">here</a>.</p>
                    <p>Best regards,<br>Finance Tracker Team</p>
                `;

                await sendEmail({
                    to: transaction.user.email,
                    subject: 'Upcoming Transaction Reminder',
                    html: emailBody,
                });
            }
        }

        // Find missed transactions
        const missedTransactions = await Transaction.find({
            isRecurring: true,
            nextDueDate: { $lt: missedThreshold },
        }).populate('user');

        for (const transaction of missedTransactions) {
            const message = `Missed Payment Alert: You missed your ${transaction.category} transaction of ${transaction.amount} ${transaction.currency}.`;

            // Save notification in DB
            await Notification.create({
                userId: transaction.user._id,
                type: 'missed_payment',
                message,
                isRead: false,
            });

            // Send email notification
            if (transaction.user.email) {
                const emailBody = `
                    <p>Dear ${transaction.user.name || 'User'},</p>
                    <p>We noticed that you missed your scheduled <strong>${transaction.category}</strong> transaction of <strong>${transaction.amount} ${transaction.currency}</strong>, which was due on <strong>${dayjs(transaction.nextDueDate).format('MMMM D, YYYY')}</strong>.</p>
                    <p>Please take the necessary steps to complete this payment.</p>
                    <p>You can review your transactions <a href="${APP_URL}/transactions">here</a>.</p>
                    <p>If you have already made this payment, please ignore this message.</p>
                    <p>Best regards,<br>Finance Tracker Team</p>
                `;

                await sendEmail({
                    to: transaction.user.email,
                    subject: 'Missed Payment Alert',
                    html: emailBody,
                });
            }
        }

        logger.info('Recurring transaction check completed.');
    } catch (error) {
        logger.error(`Error checking recurring transactions: ${error.message}`);
    }
};

// Schedule job to run every day at midnight
new Cron('*/30 * * * *', { timezone: 'Asia/Colombo' }, async () => {
    try {
        logger.info(
            'Running scheduled job: Checking recurring transactions...'
        );
        await checkRecurringTransactions();
        logger.info('Scheduled job completed successfully.');
    } catch (error) {
        logger.error(`Error in scheduled job: ${error.message}`);
    }
});
