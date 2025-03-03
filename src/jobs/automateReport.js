import { Cron } from 'croner';
import { logger } from '../middleware/logger.js';
import { sendMonthlyFinancialReport } from '../controllers/reportController.js';

// **Weekly Report Job**: Sends report every Sunday at midnight
// new Cron("0 0 * * 0", { timezone: "Asia/Colombo" }, async () => {
//     try {
//         logger.info("Running scheduled job: Sending weekly financial report...");
//         await sendWeeklyFinancialReport();
//         logger.info("Weekly financial report sent successfully.");
//     } catch (error) {
//         logger.error(`Error in weekly report job: ${error.message}`);
//     }
// });

// **Monthly Report Job**: Sends report on the 1st day of every month at midnight
new Cron('0 0 1 * *', { timezone: 'Asia/Colombo' }, async () => {
    try {
        logger.info(
            'Running scheduled job: Sending monthly financial report...'
        );
        await sendMonthlyFinancialReport();
        logger.info('Monthly financial report sent successfully.');
    } catch (error) {
        logger.error(`Error in monthly report job: ${error.message}`);
    }
});
