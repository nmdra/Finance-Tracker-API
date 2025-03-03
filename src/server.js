import express from 'express';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import { logger, httpLogger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { initializeDefaultConfig } from './utils/initializeDefaultConfig.js';

import healthRoutes from './routes/v1/health.js';
import userRoute from './routes/v1/user.js';
import transactionRoute from './routes/v1/transaction.js';
import budgetRoutes from './routes/v1/budget.js';
import goalRoutes from './routes/v1/goal.js';
import notificationRoutes from './routes/v1/notification.js';
import analyticsRoutes from './routes/v1/analytics.js';
import adminRoutes from './routes/v1/admin.js';

// Scheduled Jobs
import './jobs/transactionScheduler.js';
import './jobs/automateReport.js';

const PORT = process.env.PORT || 5000;

const app = express();

// Apply middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(httpLogger);

// API Version
const API_VERSION = process.env.API_VERSION;

app.use(`/api/${API_VERSION}/health`, healthRoutes);
app.use(`/api/${API_VERSION}/user`, userRoute);
app.use(`/api/${API_VERSION}/transaction`, transactionRoute);
app.use(`/api/${API_VERSION}/budget`, budgetRoutes);
app.use(`/api/${API_VERSION}/goal`, goalRoutes);
app.use(`/api/${API_VERSION}/notification`, notificationRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);

app.use(notFound); // Handle 404 Not Found
app.use(errorHandler); // Error handler middleware

const startServer = async () => {
    try {
        await connectDB(); // Connect to MongoDB
        await initializeDefaultConfig(); // Initialize settings from config.json
        app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
    } catch (error) {
        logger.error(`Error starting server: ${error.message}`);
    }
};

startServer();
