import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Middleware to log HTTP requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log the incoming request
    logger.http(`${req.method} ${req.url} - Started`);

    // Capture the original res.send to log response
    const originalSend = res.send;
    res.send = function (data): Response {
        const duration = Date.now() - startTime;
        logger.http(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
        return originalSend.call(this, data);
    };

    next();
};
