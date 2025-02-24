import pino from "pino";
import pinoHttp from "pino-http";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
        },
    },
});

const httpLogger = pinoHttp({
    customLogLevel: (req, res, err) => {
        // Set log levels based on response status code
        if (res.statusCode >= 500) return 'error'; // Log errors for server issues
        if (res.statusCode >= 400) return 'warn'; // Log warnings for client issues
        return 'info';
    },

    serializers: {
        req(req) {
            return {
                method: req.method,  // Log only the HTTP method
                url: req.url,        // Log only the request URL
                query: req.query,                       // Log query parameters
                params: req.params                      // Log route parameters
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode // Log only the status code
            };
        }
    },

    autoLogging: {
        ignore(req) {
            return false; // Do not ignore any requests by default
        }
    }
});

export { logger, httpLogger };
