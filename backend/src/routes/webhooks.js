import express from 'express';
import { WebhookService } from '../services/webhookService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Create a new webhook
router.post('/', async (req, res, next) => {
    try {
        const { name, url, eventTypes, clientId, headers = {} } = req.body;

        if (!name || !url || !eventTypes || !clientId) {
            return res.status(400).json({
                error: 'name, url, eventTypes, and clientId are required',
            });
        }

        const webhook = await WebhookService.createWebhook(
            name,
            url,
            eventTypes,
            clientId,
            headers
        );

        res.status(201).json({
            message: 'Webhook created successfully',
            webhook: {
                ...webhook.toJSON(),
                secret: webhook.secret, // Return secret only on creation
            },
        });
    } catch (error) {
        logger.error('Error creating webhook:', error);
        next(error);
    }
});

// Get all webhooks for a client
router.get('/', async (req, res, next) => {
    try {
        const { clientId, isActive, limit = 50, offset = 0 } = req.query;

        if (!clientId) {
            return res.status(400).json({ error: 'clientId is required' });
        }

        const webhooks = await WebhookService.getWebhooks(
            clientId,
            { isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined },
            { limit, offset }
        );

        res.json(webhooks);
    } catch (error) {
        logger.error('Error fetching webhooks:', error);
        next(error);
    }
});

// Get webhook by ID
router.get('/:id', async (req, res, next) => {
    try {
        const webhook = await WebhookService.getWebhookById(req.params.id);
        res.json(webhook);
    } catch (error) {
        if (error.message === 'Webhook not found') {
            return res.status(404).json({ error: 'Webhook not found' });
        }
        logger.error('Error fetching webhook:', error);
        next(error);
    }
});

// Update webhook
router.put('/:id', async (req, res, next) => {
    try {
        const webhook = await WebhookService.updateWebhook(req.params.id, req.body);

        res.json({
            message: 'Webhook updated successfully',
            webhook,
        });
    } catch (error) {
        if (error.message === 'Webhook not found') {
            return res.status(404).json({ error: 'Webhook not found' });
        }
        logger.error('Error updating webhook:', error);
        next(error);
    }
});

// Delete webhook
router.delete('/:id', async (req, res, next) => {
    try {
        await WebhookService.deleteWebhook(req.params.id);

        res.json({ message: 'Webhook deleted successfully' });
    } catch (error) {
        if (error.message === 'Webhook not found') {
            return res.status(404).json({ error: 'Webhook not found' });
        }
        logger.error('Error deleting webhook:', error);
        next(error);
    }
});

// Rotate webhook secret
router.post('/:id/rotate-secret', async (req, res, next) => {
    try {
        const webhook = await WebhookService.rotateWebhookSecret(req.params.id);

        res.json({
            message: 'Webhook secret rotated successfully',
            webhook: {
                ...webhook.toJSON(),
                secret: webhook.secret,
            },
        });
    } catch (error) {
        if (error.message === 'Webhook not found') {
            return res.status(404).json({ error: 'Webhook not found' });
        }
        logger.error('Error rotating webhook secret:', error);
        next(error);
    }
});

export default router;

