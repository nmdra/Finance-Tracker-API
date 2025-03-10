import pino from 'pino';
import pinoHttp from 'pino-http';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
});

const httpLogger = pinoHttp({
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },

    serializers: {
        req(req) {
            return {
                method: req.method,
                url: req.url,
                query: req.query,
                params: req.params,
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },

    autoLogging: {
        ignore(req) {
            return false; // Do not ignore any requests by default
        },
    },
});

export { logger, httpLogger };
