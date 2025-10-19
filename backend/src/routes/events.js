import express from 'express';
import { EventService } from '../services/eventService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Create a new event
router.post('/', async (req, res, next) => {
    try {
        const { eventType, payload, idempotencyKey } = req.body;

        if (!eventType || !payload) {
            return res.status(400).json({
                error: 'eventType and payload are required',
            });
        }

        const result = await EventService.createEvent(eventType, payload, idempotencyKey);

        const statusCode = result.isDuplicate ? 200 : 201;
        res.status(statusCode).json({
            message: result.isDuplicate ? 'Event already processed' : 'Event created successfully',
            event: result.event,
            deliveriesCreated: result.deliveries?.length || 0,
            isDuplicate: result.isDuplicate,
        });
    } catch (error) {
        logger.error('Error creating event:', error);
        next(error);
    }
});

// Get event statistics (MUST be before /:id route)
router.get('/stats/summary', async (req, res, next) => {
    try {
        const stats = await EventService.getEventStats();
        res.json(stats);
    } catch (error) {
        logger.error('Error fetching event stats:', error);
        next(error);
    }
});

// Get all events
router.get('/', async (req, res, next) => {
    try {
        const { status, eventType, limit = 50, offset = 0 } = req.query;
        const events = await EventService.getEvents(
            { status, eventType },
            { limit, offset }
        );

        res.json(events);
    } catch (error) {
        logger.error('Error fetching events:', error);
        next(error);
    }
});

// Get event by ID
router.get('/:id', async (req, res, next) => {
    try {
        const event = await EventService.getEventWithDeliveries(req.params.id);
        res.json(event);
    } catch (error) {
        if (error.message === 'Event not found') {
            return res.status(404).json({ error: 'Event not found' });
        }
        logger.error('Error fetching event:', error);
        next(error);
    }
});

export default router;

