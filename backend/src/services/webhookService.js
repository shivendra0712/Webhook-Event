import { Webhook } from '../models/index.js';
import { generateWebhookSecret } from '../utils/hmac.js';
import { EventService } from './eventService.js';
import logger from '../utils/logger.js';

export class WebhookService {
    /**
     * Create a new webhook
     */
    static async createWebhook(name, url, eventTypes, clientId, headers = {}) {
        try {
            const secret = generateWebhookSecret();

            const webhook = await Webhook.create({
                name,
                url,
                eventTypes: Array.isArray(eventTypes) ? eventTypes : [eventTypes],
                secret,
                clientId,
                headers,
                isActive: true,
            });

            logger.info(`Webhook created: ${webhook.id} for client ${clientId}`);

            // Create deliveries for existing events
            await EventService.createDeliveriesForWebhook(webhook.id, eventTypes);

            return webhook;
        } catch (error) {
            logger.error('Error creating webhook:', error);
            throw error;
        }
    }

    /**
     * Get webhooks for a client
     */
    static async getWebhooks(clientId, filters = {}, pagination = {}) {
        try {
            const { isActive } = filters;
            const { limit = 50, offset = 0 } = pagination;

            const where = { clientId };
            if (isActive !== undefined) where.isActive = isActive;

            const webhooks = await Webhook.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
                attributes: { exclude: ['secret'] },
            });

            return webhooks;
        } catch (error) {
            logger.error('Error fetching webhooks:', error);
            throw error;
        }
    }

    /**
     * Get webhook by ID
     */
    static async getWebhookById(webhookId, includeSecret = false) {
        try {
            const attributes = includeSecret ? undefined : { exclude: ['secret'] };
            const webhook = await Webhook.findByPk(webhookId, { attributes });

            if (!webhook) {
                throw new Error('Webhook not found');
            }

            return webhook;
        } catch (error) {
            logger.error('Error fetching webhook:', error);
            throw error;
        }
    }

    /**
     * Update webhook
     */
    static async updateWebhook(webhookId, updates) {
        try {
            const webhook = await Webhook.findByPk(webhookId);

            if (!webhook) {
                throw new Error('Webhook not found');
            }

            const { name, url, eventTypes, headers, isActive } = updates;

            if (name) webhook.name = name;
            if (url) webhook.url = url;
            if (eventTypes) webhook.eventTypes = eventTypes;
            if (headers) webhook.headers = headers;
            if (isActive !== undefined) webhook.isActive = isActive;

            await webhook.save();

            logger.info(`Webhook updated: ${webhook.id}`);

            return webhook;
        } catch (error) {
            logger.error('Error updating webhook:', error);
            throw error;
        }
    }

    /**
     * Delete webhook
     */
    static async deleteWebhook(webhookId) {
        try {
            const webhook = await Webhook.findByPk(webhookId);

            if (!webhook) {
                throw new Error('Webhook not found');
            }

            await webhook.destroy();

            logger.info(`Webhook deleted: ${webhook.id}`);

            return webhook;
        } catch (error) {
            logger.error('Error deleting webhook:', error);
            throw error;
        }
    }

    /**
     * Get webhooks for specific event type
     */
    static async getWebhooksForEventType(eventType) {
        try {
            const webhooks = await Webhook.findAll({
                where: {
                    isActive: true,
                    eventTypes: {
                        [require('sequelize').Op.contains]: [eventType],
                    },
                },
                attributes: { exclude: ['secret'] },
            });

            return webhooks;
        } catch (error) {
            logger.error('Error fetching webhooks for event type:', error);
            throw error;
        }
    }

    /**
     * Rotate webhook secret
     */
    static async rotateWebhookSecret(webhookId) {
        try {
            const webhook = await Webhook.findByPk(webhookId);

            if (!webhook) {
                throw new Error('Webhook not found');
            }

            const newSecret = generateWebhookSecret();
            webhook.secret = newSecret;
            await webhook.save();

            logger.info(`Webhook secret rotated: ${webhook.id}`);

            return webhook;
        } catch (error) {
            logger.error('Error rotating webhook secret:', error);
            throw error;
        }
    }
}

