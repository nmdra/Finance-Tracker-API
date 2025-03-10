import { Transaction } from '../models/transactionModel.js';
import { Goal } from '../models/goalModel.js';
import { logger } from '../middleware/logger.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { sendEmail } from '../middleware/email.js';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';

/**
 * @desc    Get income vs expenses report
 * @route   GET /api/v1/reports/income-vs-expenses
 * @access  Private
 */
export const getIncomeVsExpenses = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const matchCriteria = {
            user: req.user._id,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        };

        const incomeVsExpenses = await Transaction.aggregate([
            { $match: matchCriteria },
            { $group: { _id: '$type', total: { $sum: '$amount' } } },
        ]);

        // Default structure
        const result = {
            income: 0,
            expenses: 0,
        };

        incomeVsExpenses.forEach((item) => {
            if (item._id === 'income') result.income = item.total;
            if (item._id === 'expense') result.expenses = item.total;
        });

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

/**
 * @desc    Send Finacial Report
 * @route   GET /api/v1/analytics report
 * @access  Private
 */

export const sendFinancialReport = async (
    req,
    res,
    next,
    startDate,
    endDate
) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;

        const transactions = await fetchTransactions(
            userId,
            startDate,
            endDate
        );

        if (!transactions.length) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'No transactions found for the selected period.',
            });
        }

        const pdfPath = await generateFinancialReport(
            userId,
            transactions,
            startDate,
            endDate
        );

        // Calculate financial summary
        const summary = createFinancialSummary(transactions);

        // Prepare email body
        const emailBody = {
            from: process.env.EMAIL_HOST,
            to: userEmail,
            subject: `📊 Your Financial Report - ${dayjs(startDate).format('MMMM YYYY')}`,
            ...createEmailBody(req.user, startDate, endDate, summary, true),
            attachments: [{ filename: 'Financial_Report.pdf', path: pdfPath }],
        };

        const emailResponse = await sendEmail(emailBody);

        // Cleanup temporary PDF file
        fs.unlinkSync(pdfPath);

        res.status(StatusCodes.OK).json({ message: emailResponse.message });
    } catch (error) {
        console.error(`Error sending financial report: ${error.message}`);
        next(error);
    }
};

// export const sendWeeklyFinancialReport = async (req, res, next) => {
//     const startDate = dayjs().subtract(1, 'week').startOf('week').toDate();
//     const endDate = dayjs().subtract(1, 'week').endOf('week').toDate();
//     await sendFinancialReport(req, res, next, startDate, endDate);
// };

export const sendMonthlyFinancialReport = async (req, res, next) => {
    const startDate = dayjs().subtract(1, 'month').startOf('month').toDate();
    const endDate = dayjs().subtract(1, 'month').endOf('month').toDate();
    await sendFinancialReport(req, res, next, startDate, endDate);
};

export const sendCurrentMonthFinancialReport = async (req, res, next) => {
    const startDate = dayjs().startOf('month').toDate(); // Start of the current month
    const endDate = dayjs().endOf('month').toDate(); // End of the current month
    await sendFinancialReport(req, res, next, startDate, endDate);
};

const createFinancialSummary = (transactions) => {
    return transactions.reduce(
        (acc, t) => {
            if (t.type === 'income') acc.income += t.amount;
            if (t.type === 'expense') acc.expenses += t.amount;
            return acc;
        },
        { income: 0, expenses: 0 }
    );
};

const createEmailBody = (user, startDate, endDate, summary, isHtml = true) => {
    const formattedDate = dayjs(startDate).format('MMMM YYYY');

    const emailText = `
        Your Financial Report

        Dear ${user.firstname},

        Attached is your financial report for ${formattedDate}.

        Financial Summary:
        - Total Income: $${summary.income.toFixed(2)}
        - Total Expenses: $${summary.expenses.toFixed(2)}

        For a detailed breakdown, please see the attached PDF.

        Best Regards,
        Your Finance App Team
    `;

    const emailHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #333;">📊 Your Financial Report</h2>
            <p>Dear ${user.firstname},</p>
            <p>Attached is your financial report for <strong>${formattedDate}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                    <th style="text-align: left; padding: 8px; background-color: #f4f4f4; border-bottom: 1px solid #ddd;">Category</th>
                    <th style="text-align: right; padding: 8px; background-color: #f4f4f4; border-bottom: 1px solid #ddd;">Amount ($)</th>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">💰 Total Income</td>
                    <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd; color: green;">$${summary.income.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">💸 Total Expenses</td>
                    <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd; color: red;">$${summary.expenses.toFixed(2)}</td>
                </tr>
            </table>
            <p style="margin-top: 15px;">For a detailed breakdown, please find the attached PDF report.</p>
            <p style="margin-top: 15px;">Best Regards,</p>
            <p><strong>Your Finance App Team</strong></p>
        </div>
    `;

    return isHtml ? { html: emailHTML } : { text: emailText };
};

export const generateFinancialReport = async (
    userId,
    transactions,
    startDate,
    endDate
) => {
    return new Promise((resolve, reject) => {
        try {
            const pdfPath = path.join('/tmp', `Financial_Report_${userId}.pdf`);
            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(pdfPath);
            doc.pipe(writeStream);

            // Function to add a page number footer
            const addPageNumber = (doc, pageNumber) => {
                doc.fontSize(10)
                    .fillColor('gray')
                    .text(
                        `Page ${pageNumber}`,
                        doc.page.width - 60,
                        doc.page.height - 40,
                        { align: 'right' }
                    );
            };

            let pageNumber = 1;

            // **Title Page**
            doc.fontSize(24)
                .fillColor('#333')
                .text('Monthly Financial Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14)
                .fillColor('#555')
                .text(
                    `Period: ${dayjs(startDate).format('YYYY-MM-DD')} to ${dayjs(endDate).format('YYYY-MM-DD')}`,
                    { align: 'center' }
                );
            doc.moveDown();
            doc.moveDown();
            doc.fontSize(12)
                .fillColor('#777')
                .text(
                    `Generated on: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
                    { align: 'center' }
                );
            addPageNumber(doc, pageNumber++);
            doc.addPage(); // Move to the next page

            // **Summary Table**
            const summary = { income: 0, expenses: 0 };
            transactions.forEach((t) => {
                if (t.type === 'income') summary.income += t.amount;
                if (t.type === 'expense') summary.expenses += t.amount;
            });

            doc.fontSize(18)
                .fillColor('#222')
                .text('Financial Summary', { underline: true });
            doc.moveDown(1);

            // Draw table headers
            doc.fontSize(14).fillColor('black').text('Category', 100, doc.y);
            doc.text('Amount ($)', 400, doc.y);
            doc.moveDown(0.5);

            // Draw income row
            doc.fontSize(12)
                .fillColor('#007bff')
                .text('Total Income', 100, doc.y);
            doc.text(`$${summary.income.toFixed(2)}`, 400, doc.y);
            doc.moveDown(0.5);

            // Draw expense row
            doc.fillColor('#dc3545').text('Total Expenses', 100, doc.y);
            doc.text(`$${summary.expenses.toFixed(2)}`, 400, doc.y);
            doc.moveDown();

            // **Transaction Details Table**
            if (transactions.length) {
                doc.moveDown();
                doc.fontSize(18)
                    .fillColor('#222')
                    .text('Transaction Details', { underline: true });
                doc.moveDown(0.5);

                const tableTop = doc.y;
                const columnWidths = [100, 150, 120, 80]; // Date, Category, Amount, Type

                doc.fontSize(12).fillColor('black').text('Date', 50, tableTop);
                doc.text('Category', 150, tableTop);
                doc.text('Amount ($)', 300, tableTop);
                doc.text('Type', 450, tableTop);
                doc.moveDown(0.5);

                transactions.forEach((t, index) => {
                    if (doc.y > doc.page.height - 100) {
                        addPageNumber(doc, pageNumber++);
                        doc.addPage();
                    }

                    const yPos = doc.y;
                    doc.fontSize(10)
                        .fillColor('black')
                        .text(dayjs(t.date).format('YYYY-MM-DD'), 50, yPos);
                    doc.text(t.category, 150, yPos);
                    doc.text(`$${t.amount.toFixed(2)}`, 300, yPos);
                    doc.fillColor(
                        t.type === 'income' ? '#007bff' : '#dc3545'
                    ).text(t.type.toUpperCase(), 450, yPos);
                    doc.moveDown(0.3);
                });
            } else {
                doc.moveDown();
                doc.fontSize(12)
                    .fillColor('gray')
                    .text('No transactions recorded during this period.');
            }

            // Finalize PDF
            addPageNumber(doc, pageNumber);
            doc.end();

            writeStream.on('finish', () => resolve(pdfPath));
            writeStream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

const fetchTransactions = async (userId, startDate, endDate) => {
    try {
        // If not cached, fetch from the database
        const transactions = await Transaction.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate },
        }).sort({ date: 1 });

        return transactions;
    } catch (error) {
        logger.error(`Error fetching transactions: ${error.message}`);
        throw error; // Throw error if something goes wrong
    }
};
