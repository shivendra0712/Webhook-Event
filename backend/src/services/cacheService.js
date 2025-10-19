import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';

const CACHE_KEYS = {
    WEBHOOKS_FOR_EVENT: 'webhooks:event:',
    WEBHOOK_DETAIL: 'webhook:',
    DELIVERY_STATS: 'delivery:stats',
    EVENT_STATS: 'event:stats',
};

const CACHE_TTL = {
    WEBHOOKS: 300, // 5 minutes
    WEBHOOK_DETAIL: 600, // 10 minutes
    STATS: 60, // 1 minute
};

export class CacheService {
    /**
     * Get webhooks for event type from cache
     */
    static async getWebhooksForEvent(eventType) {
        try {
            const key = `${CACHE_KEYS.WEBHOOKS_FOR_EVENT}${eventType}`;
            const cached = await redisClient.get(key);

            if (cached) {
                logger.debug(`Cache hit: ${key}`);
                return JSON.parse(cached);
            }

            return null;
        } catch (error) {
            logger.error('Error getting webhooks from cache:', error);
            return null;
        }
    }

    /**
     * Set webhooks for event type in cache
     */
    static async setWebhooksForEvent(eventType, webhooks) {
        try {
            const key = `${CACHE_KEYS.WEBHOOKS_FOR_EVENT}${eventType}`;
            await redisClient.setEx(
                key,
                CACHE_TTL.WEBHOOKS,
                JSON.stringify(webhooks)
            );

            logger.debug(`Cache set: ${key}`);
        } catch (error) {
            logger.error('Error setting webhooks in cache:', error);
        }
    }

    /**
     * Get webhook detail from cache
     */
    static async getWebhookDetail(webhookId) {
        try {
            const key = `${CACHE_KEYS.WEBHOOK_DETAIL}${webhookId}`;
            const cached = await redisClient.get(key);

            if (cached) {
                logger.debug(`Cache hit: ${key}`);
                return JSON.parse(cached);
            }

            return null;
        } catch (error) {
            logger.error('Error getting webhook from cache:', error);
            return null;
        }
    }

    /**
     * Set webhook detail in cache
     */
    static async setWebhookDetail(webhookId, webhook) {
        try {
            const key = `${CACHE_KEYS.WEBHOOK_DETAIL}${webhookId}`;
            await redisClient.setEx(
                key,
                CACHE_TTL.WEBHOOK_DETAIL,
                JSON.stringify(webhook)
            );

            logger.debug(`Cache set: ${key}`);
        } catch (error) {
            logger.error('Error setting webhook in cache:', error);
        }
    }

    /**
     * Invalidate webhook cache
     */
    static async invalidateWebhookCache(webhookId) {
        try {
            const key = `${CACHE_KEYS.WEBHOOK_DETAIL}${webhookId}`;
            await redisClient.del(key);

            logger.debug(`Cache invalidated: ${key}`);
        } catch (error) {
            logger.error('Error invalidating webhook cache:', error);
        }
    }

    /**
     * Invalidate event type webhooks cache
     */
    static async invalidateEventWebhooksCache(eventType) {
        try {
            const key = `${CACHE_KEYS.WEBHOOKS_FOR_EVENT}${eventType}`;
            await redisClient.del(key);

            logger.debug(`Cache invalidated: ${key}`);
        } catch (error) {
            logger.error('Error invalidating event webhooks cache:', error);
        }
    }

    /**
     * Get delivery stats from cache
     */
    static async getDeliveryStats() {
        try {
            const cached = await redisClient.get(CACHE_KEYS.DELIVERY_STATS);

            if (cached) {
                logger.debug(`Cache hit: ${CACHE_KEYS.DELIVERY_STATS}`);
                return JSON.parse(cached);
            }

            return null;
        } catch (error) {
            logger.error('Error getting delivery stats from cache:', error);
            return null;
        }
    }

    /**
     * Set delivery stats in cache
     */
    static async setDeliveryStats(stats) {
        try {
            await redisClient.setEx(
                CACHE_KEYS.DELIVERY_STATS,
                CACHE_TTL.STATS,
                JSON.stringify(stats)
            );

            logger.debug(`Cache set: ${CACHE_KEYS.DELIVERY_STATS}`);
        } catch (error) {
            logger.error('Error setting delivery stats in cache:', error);
        }
    }

    /**
     * Get event stats from cache
     */
    static async getEventStats() {
        try {
            const cached = await redisClient.get(CACHE_KEYS.EVENT_STATS);

            if (cached) {
                logger.debug(`Cache hit: ${CACHE_KEYS.EVENT_STATS}`);
                return JSON.parse(cached);
            }

            return null;
        } catch (error) {
            logger.error('Error getting event stats from cache:', error);
            return null;
        }
    }

    /**
     * Set event stats in cache
     */
    static async setEventStats(stats) {
        try {
            await redisClient.setEx(
                CACHE_KEYS.EVENT_STATS,
                CACHE_TTL.STATS,
                JSON.stringify(stats)
            );

            logger.debug(`Cache set: ${CACHE_KEYS.EVENT_STATS}`);
        } catch (error) {
            logger.error('Error setting event stats in cache:', error);
        }
    }

    /**
     * Clear all cache
     */
    static async clearAllCache() {
        try {
            await redisClient.flushDb();
            logger.info('All cache cleared');
        } catch (error) {
            logger.error('Error clearing cache:', error);
        }
    }
}

