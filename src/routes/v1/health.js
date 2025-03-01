import express from 'express';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router.get('', (req, res) => {
    const response = {
        service: 'Finance API',
        status: 'healthy',
        timestamp: new Date().toISOString(),
    };

    req.log.info('Health check endpoint accessed', { response });
    res.status(StatusCodes.OK).json(response);
});

export default router;
