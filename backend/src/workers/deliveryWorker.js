import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import { DeliveryService } from '../services/deliveryService.js';
import logger from '../utils/logger.js';

const deliveryQueue = new Queue('webhook-delivery', {
    connection: redisClient,
});

// Process delivery jobs
const deliveryWorker = new Worker('webhook-delivery', async (job) => {
    try {
        const { deliveryId } = job.data;
        logger.info(`Processing delivery job: ${deliveryId}`);

        const delivery = await DeliveryService.sendWebhook({ id: deliveryId });
        return { success: true, delivery };
    } catch (error) {
        logger.error(`Delivery job failed: ${job.data.deliveryId}`, error);
        throw error;
    }
}, {
    connection: redisClient,
    concurrency: 10,
});

// Job event handlers
deliveryWorker.on('completed', (job) => {
    logger.info(`Delivery job completed: ${job.id}`);
});

deliveryWorker.on('failed', (job, err) => {
    logger.error(`Delivery job failed: ${job.id}`, err);
});

/**
 * Add delivery to queue
 */
export async function queueDelivery(deliveryId) {
    try {
        await deliveryQueue.add(
            'send',
            { deliveryId },
            {
                attempts: 1,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            }
        );

        logger.info(`Delivery queued: ${deliveryId}`);
    } catch (error) {
        logger.error('Error queueing delivery:', error);
        throw error;
    }
}

/**
 * Process pending deliveries
 */
export async function processPendingDeliveries() {
    try {
        const deliveries = await DeliveryService.getPendingDeliveries(100);

        for (const delivery of deliveries) {
            await queueDelivery(delivery.id);
        }

        logger.info(`Queued ${deliveries.length} pending deliveries`);
    } catch (error) {
        logger.error('Error processing pending deliveries:', error);
    }
}

/**
 * Process retrying deliveries
 */
export async function processRetryingDeliveries() {
    try {
        const deliveries = await DeliveryService.getRetryingDeliveries(100);

        for (const delivery of deliveries) {
            await queueDelivery(delivery.id);
        }

        logger.info(`Queued ${deliveries.length} retrying deliveries`);
    } catch (error) {
        logger.error('Error processing retrying deliveries:', error);
    }
}

export { deliveryQueue, deliveryWorker };

