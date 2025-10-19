import { Delivery, Event, Webhook } from '../models/index.js';
import { generateHMACSignature } from '../utils/hmac.js';
import logger from '../utils/logger.js';
import axios from 'axios';
import { fn, col, Op } from 'sequelize';

export class DeliveryService {
    /**
     * Send webhook to endpoint
     */
    static async sendWebhook(delivery) {
        try {
            const event = await Event.findByPk(delivery.eventId);
            const webhook = await Webhook.findByPk(delivery.webhookId);

            if (!event || !webhook) {
                throw new Error('Event or Webhook not found');
            }

            // Generate HMAC signature
            const signature = generateHMACSignature(event.payload, webhook.secret);

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Event-Type': event.eventType,
                'X-Event-ID': event.id,
                'X-Delivery-ID': delivery.id,
                'X-Timestamp': new Date().toISOString(),
                ...webhook.headers,
            };

            // Send webhook
            const response = await axios.post(webhook.url, event.payload, {
                headers,
                timeout: 30000,
            });

            // Update delivery as successful
            delivery.status = 'delivered';
            delivery.httpStatus = response.status;
            delivery.responseHeaders = response.headers;
            delivery.responseBody = JSON.stringify(response.data);
            delivery.lastAttemptAt = new Date();
            await delivery.save();

            logger.info(`Webhook delivered: ${delivery.id} to ${webhook.url}`);

            return delivery;
        } catch (error) {
            logger.error(`Webhook delivery failed: ${delivery.id}`, error);
            throw error;
        }
    }

    /**
     * Handle delivery failure with retry logic
     */
    static async handleDeliveryFailure(delivery, error) {
        try {
            const webhook = await Webhook.findByPk(delivery.webhookId);
            const retryPolicy = webhook.retryPolicy || {
                maxRetries: 5,
                initialDelayMs: 1000,
                backoffMultiplier: 2,
                maxDelayMs: 60000,
            };

            delivery.error = error.message;
            delivery.lastAttemptAt = new Date();

            if (delivery.retryCount < retryPolicy.maxRetries) {
                // Calculate next retry delay with exponential backoff
                const delay = Math.min(
                    retryPolicy.initialDelayMs * Math.pow(retryPolicy.backoffMultiplier, delivery.retryCount),
                    retryPolicy.maxDelayMs
                );

                delivery.status = 'retrying';
                delivery.retryCount += 1;
                delivery.nextRetryAt = new Date(Date.now() + delay);

                logger.info(
                    `Webhook retry scheduled: ${delivery.id} (attempt ${delivery.retryCount}/${retryPolicy.maxRetries}) in ${delay}ms`
                );
            } else {
                delivery.status = 'failed';
                logger.error(`Webhook delivery failed permanently: ${delivery.id}`);
            }

            await delivery.save();
            return delivery;
        } catch (err) {
            logger.error('Error handling delivery failure:', err);
            throw err;
        }
    }

    /**
     * Get pending deliveries for processing
     */
    static async getPendingDeliveries(limit = 100) {
        try {
            const deliveries = await Delivery.findAll({
                where: {
                    status: 'pending',
                },
                limit,
                order: [['createdAt', 'ASC']],
            });

            return deliveries;
        } catch (error) {
            logger.error('Error fetching pending deliveries:', error);
            throw error;
        }
    }

    /**
     * Get retrying deliveries that are ready to retry
     */
    static async getRetryingDeliveries(limit = 100) {
        try {
            const deliveries = await Delivery.findAll({
                where: {
                    status: 'retrying',
                    nextRetryAt: {
                        [Op.lte]: new Date(),
                    },
                },
                limit,
                order: [['nextRetryAt', 'ASC']],
            });

            return deliveries;
        } catch (error) {
            logger.error('Error fetching retrying deliveries:', error);
            throw error;
        }
    }

    /**
     * Get delivery statistics
     */
    static async getDeliveryStats() {
        try {
            const stats = await Delivery.findAll({
                attributes: [
                    'status',
                    [fn('COUNT', col('id')), 'count'],
                ],
                group: ['status'],
                raw: true,
            });

            logger.info('Raw delivery stats from DB:', stats);

            const summary = {
                total: 0,
                pending: 0,
                delivered: 0,
                failed: 0,
                retrying: 0,
            };

            stats.forEach((stat) => {
                const count = parseInt(stat.count);
                summary[stat.status] = count;
                summary.total += count;
            });

            logger.info('Processed delivery stats:', summary);
            return summary;
        } catch (error) {
            logger.error('Error fetching delivery stats:', error);
            throw error;
        }
    }

    /**
     * Retry a specific delivery
     */
    static async retryDelivery(deliveryId) {
        try {
            const delivery = await Delivery.findByPk(deliveryId);

            if (!delivery) {
                throw new Error('Delivery not found');
            }

            delivery.status = 'pending';
            delivery.retryCount = 0;
            delivery.nextRetryAt = null;
            delivery.error = null;
            await delivery.save();

            logger.info(`Delivery retry initiated: ${deliveryId}`);

            return delivery;
        } catch (error) {
            logger.error('Error retrying delivery:', error);
            throw error;
        }
    }
}

