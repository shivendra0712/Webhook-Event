import { Event, Delivery, Webhook } from '../models/index.js';
import logger from '../utils/logger.js';
import { Op, fn, col } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export class EventService {
    /**
     * Create a new event with idempotency support
     */
    static async createEvent(eventType, payload, idempotencyKey = null) {
        try {
            // Check for duplicate using idempotency key
            if (idempotencyKey) {
                const existingEvent = await Event.findOne({
                    where: { idempotencyKey },
                });
                if (existingEvent) {
                    logger.info(`Duplicate event detected: ${idempotencyKey}`);
                    return { event: existingEvent, isDuplicate: true };
                }
            }

            // Create new event
            const event = await Event.create({
                eventType,
                payload,
                idempotencyKey: idempotencyKey || uuidv4(),
                status: 'pending',
            });

            logger.info(`Event created: ${event.id} (${eventType})`);

            // Find matching webhooks
            // For SQLite, we need to use a different approach since Op.contains doesn't work
            const webhooks = await Webhook.findAll({
                where: {
                    isActive: true,
                },
                raw: true,
            });

            // Filter webhooks that have the eventType in their eventTypes array
            const matchingWebhooks = webhooks.filter(webhook => {
                const types = typeof webhook.eventTypes === 'string'
                    ? JSON.parse(webhook.eventTypes)
                    : webhook.eventTypes;
                return Array.isArray(types) && types.includes(eventType);
            });

            // Create delivery records
            const deliveries = [];
            for (const webhook of matchingWebhooks) {
                const delivery = await Delivery.create({
                    eventId: event.id,
                    webhookId: webhook.id,
                    status: 'pending',
                });
                deliveries.push(delivery);
            }

            return { event, deliveries, isDuplicate: false };
        } catch (error) {
            logger.error('Error creating event:', error);
            throw error;
        }
    }

    /**
     * Get event with delivery status
     */
    static async getEventWithDeliveries(eventId) {
        try {
            const event = await Event.findByPk(eventId, {
                include: [
                    {
                        association: 'deliveries',
                        include: [
                            {
                                association: 'webhook',
                                attributes: ['id', 'name', 'url'],
                            },
                        ],
                    },
                ],
            });

            if (!event) {
                throw new Error('Event not found');
            }

            return event;
        } catch (error) {
            logger.error('Error fetching event:', error);
            throw error;
        }
    }

    /**
     * Get events with pagination and filters
     */
    static async getEvents(filters = {}, pagination = {}) {
        try {
            const { status, eventType } = filters;
            const { limit = 50, offset = 0 } = pagination;

            const where = {};
            if (status) where.status = status;
            if (eventType) where.eventType = eventType;

            const result = await Event.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        association: 'deliveries',
                        attributes: ['id', 'status'],
                    },
                ],
            });

            return result;
        } catch (error) {
            logger.error('Error fetching events:', error);
            throw error;
        }
    }

    /**
     * Update event status
     */
    static async updateEventStatus(eventId, status) {
        try {
            const event = await Event.findByPk(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            event.status = status;
            await event.save();

            logger.info(`Event status updated: ${eventId} -> ${status}`);
            return event;
        } catch (error) {
            logger.error('Error updating event status:', error);
            throw error;
        }
    }

    /**
     * Create deliveries for existing events when new webhook is added
     */
    static async createDeliveriesForWebhook(webhookId, eventTypes) {
        try {
            const events = await Event.findAll({
                where: {
                    eventType: eventTypes,
                    status: 'pending'
                }
            });

            const deliveries = [];
            for (const event of events) {
                // Check if delivery already exists
                const existingDelivery = await Delivery.findOne({
                    where: {
                        eventId: event.id,
                        webhookId: webhookId
                    }
                });

                if (!existingDelivery) {
                    const delivery = await Delivery.create({
                        eventId: event.id,
                        webhookId: webhookId,
                        status: 'pending',
                    });
                    deliveries.push(delivery);
                }
            }

            logger.info(`Created ${deliveries.length} deliveries for webhook ${webhookId}`);
            return deliveries;
        } catch (error) {
            logger.error('Error creating deliveries for webhook:', error);
            throw error;
        }
    }

    /**
     * Get event statistics
     */
    static async getEventStats() {
        try {
            const stats = await Event.findAll({
                attributes: [
                    'status',
                    [fn('COUNT', col('id')), 'count'],
                ],
                group: ['status'],
                raw: true,
            });

            logger.info('Raw event stats from DB:', stats);

            const summary = {
                total: 0,
                pending: 0,
                processing: 0,
                completed: 0,
                failed: 0,
            };

            stats.forEach((stat) => {
                const count = parseInt(stat.count);
                summary[stat.status] = count;
                summary.total += count;
            });

            logger.info('Processed event stats:', summary);
            return summary;
        } catch (error) {
            logger.error('Error fetching event stats:', error);
            throw error;
        }
    }
}

