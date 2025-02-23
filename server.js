import express from 'express'
import connectDB from './config/db.js'
import { logger, httpLogger } from "./middleware/logger.js"
import healthRoutes from "./routes/health.js";

const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

const app = express()

// Apply middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(httpLogger)

app.use("/health", healthRoutes)

// Start the server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
}).on('error', (error) => {
    logger.error(`Error starting server: ${error.message}`)
})