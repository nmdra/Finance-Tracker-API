const notFound = (req, res, next) => {
    req.log.warn(`NOT_FOUND: ${req.originalUrl}`);
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Check for Mongoose bad ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        message = `Resource not found`;
        statusCode = 404;
    }

    req.log.error(
        `ERROR: ${message} - Status: ${statusCode} - Path: ${req.originalUrl}`
    );

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });

    next();
};

export { errorHandler, notFound };
