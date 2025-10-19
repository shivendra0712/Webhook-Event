import Joi from 'joi';

export const eventSchema = Joi.object({
    eventType: Joi.string().required().min(1).max(255),
    payload: Joi.object().required(),
    idempotencyKey: Joi.string().optional().max(255),
});

export const webhookSchema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    url: Joi.string().required().uri(),
    eventTypes: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).required(),
    clientId: Joi.string().required().min(1).max(255),
    headers: Joi.object().optional().default({}),
});

export const webhookUpdateSchema = Joi.object({
    name: Joi.string().optional().min(1).max(255),
    url: Joi.string().optional().uri(),
    eventTypes: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).optional(),
    headers: Joi.object().optional(),
    isActive: Joi.boolean().optional(),
});

