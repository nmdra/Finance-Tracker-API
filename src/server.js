import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

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
const API_VERSION = process.env.API_VERSION || 'v1';
const FRONTEND_URL = process.env.FRONTEND_URL;

const app = express();

// Apply Security Middleware
// Secure HTTP Headers
app.use(helmet());

// CORS (Allow only specific domains)
app.use(
    cors({
        origin: [FRONTEND_URL], // Change to your frontend domain
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    })
);

// Rate Limiting (Prevent API abuse)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    headers: true,
});
app.use(limiter);

// Sanitize Request Data (Prevent NoSQL Injection)
app.use(mongoSanitize());

// Apply Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(httpLogger);

// API Routes
app.use(`/api/${API_VERSION}/health`, healthRoutes);
app.use(`/api/${API_VERSION}/user`, userRoute);
app.use(`/api/${API_VERSION}/transaction`, transactionRoute);
app.use(`/api/${API_VERSION}/budget`, budgetRoutes);
app.use(`/api/${API_VERSION}/goal`, goalRoutes);
app.use(`/api/${API_VERSION}/notification`, notificationRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const startServer = async () => {
    try {
        await connectDB(); // Connect to MongoDB
        await initializeDefaultConfig(); // Initialize system settings
        app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
    } catch (error) {
        logger.error(`Error starting server: ${error.message}`);
    }
};

startServer();
