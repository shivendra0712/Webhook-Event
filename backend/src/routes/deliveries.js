import express from 'express';
import { Delivery } from '../models/index.js';
import { DeliveryService } from '../services/deliveryService.js';
import logger from '../utils/logger.js';

const router = express.Router();
/*  */
// Get delivery statistics (MUST be before /:id route)
router.get('/stats/summary', async (req, res, next) => {
    try {
        const stats = await DeliveryService.getDeliveryStats();
        res.json(stats);
    } catch (error) {
        logger.error('Error fetching delivery stats:', error);
        next(error);
    }
});



// Get all deliveries with filters
router.get('/', async (req, res, next) => {
    try {
        const { status, eventId, webhookId, limit = 50, offset = 0 } = req.query;
        const where = {};

        if (status) where.status = status;
        if (eventId) where.eventId = eventId;
        if (webhookId) where.webhookId = webhookId;

        const deliveries = await Delivery.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [
                { association: 'event', attributes: ['id', 'eventType', 'payload'] },
                { association: 'webhook', attributes: ['id', 'name', 'url'] },
            ],
        });

        res.json(deliveries);
    } catch (error) {
        logger.error('Error fetching deliveries:', error);
        next(error);
    }
});

// Get delivery by ID
router.get('/:id', async (req, res, next) => {
    try {
        const delivery = await Delivery.findByPk(req.params.id, {
            include: [
                { association: 'event' },
                { association: 'webhook', attributes: { exclude: ['secret'] } },
            ],
        });

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        res.json(delivery);
    } catch (error) {
        logger.error('Error fetching delivery:', error);
        next(error);
    }
});

// Retry a failed delivery
router.post('/:id/retry', async (req, res, next) => {
    try {
        const delivery = await DeliveryService.retryDelivery(req.params.id);

        res.json({
            message: 'Delivery retry initiated',
            delivery,
        });
    } catch (error) {
        if (error.message === 'Delivery not found') {
            return res.status(404).json({ error: 'Delivery not found' });
        }
        logger.error('Error retrying delivery:', error);
        next(error);
    }
});

export default router;

