import logger from '../utils/logger.js';

/**
 * API Key authentication middleware
 */
export function apiKeyAuth(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                error: 'Missing API key',
            });
        }

        // Validate API key (in production, check against database)
        const validApiKey = process.env.API_SECRET_KEY || 'test-api-key';
        if (apiKey !== validApiKey) {
            logger.warn(`Invalid API key attempt: ${apiKey}`);
            return res.status(401).json({
                error: 'Invalid API key',
            });
        }

        req.clientId = req.headers['x-client-id'] || 'default-client';
        next();
    } catch (error) {
        logger.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
}

/**
 * Client ID validation middleware
 */
export function validateClientId(req, res, next) {
    try {
        const clientId = req.headers['x-client-id'] || req.query.clientId || req.body.clientId;

        if (!clientId) {
            return res.status(400).json({
                error: 'Missing client ID',
            });
        }

        req.clientId = clientId;
        next();
    } catch (error) {
        logger.error('Client ID validation error:', error);
        res.status(500).json({ error: 'Validation error' });
    }
}

/**
 * Input validation middleware
 */
export function validateInput(schema) {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.body);

            if (error) {
                return res.status(400).json({
                    error: 'Validation error',
                    details: error.details.map((d) => ({
                        field: d.path.join('.'),
                        message: d.message,
                    })),
                });
            }

            req.validatedData = value;
            next();
        } catch (err) {
            logger.error('Input validation error:', err);
            res.status(500).json({ error: 'Validation error' });
        }
    };
}

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map();

export function rateLimit(maxRequests = 100, windowMs = 60000) {
    return (req, res, next) => {
        const clientId = req.clientId || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!requestCounts.has(clientId)) {
            requestCounts.set(clientId, []);
        }

        const requests = requestCounts.get(clientId);
        const recentRequests = requests.filter((time) => time > windowStart);

        if (recentRequests.length >= maxRequests) {
            logger.warn(`Rate limit exceeded for ${clientId}`);
            return res.status(429).json({
                error: 'Too many requests',
            });
        }

        recentRequests.push(now);
        requestCounts.set(clientId, recentRequests);

        next();
    };
}

