import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';
import { apiKeyAuth } from './middleware/auth.js';
import eventRoutes from './routes/events.js';
import webhookRoutes from './routes/webhooks.js';
import deliveryRoutes from './routes/deliveries.js';

const app = express();

// Middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-ID'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes with authentication
app.use('/api/events', apiKeyAuth, eventRoutes);
app.use('/api/webhooks', apiKeyAuth, webhookRoutes);
app.use('/api/deliveries', apiKeyAuth, deliveryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        status: err.status || 500,
    });
});

export default app;
