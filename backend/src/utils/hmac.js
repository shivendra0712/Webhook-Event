import crypto from 'crypto';

export function generateHMACSignature(payload, secret) {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');
}

export function verifyHMACSignature(payload, signature, secret) {
    const expectedSignature = generateHMACSignature(payload, secret);
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

export function generateWebhookSecret() {
    return crypto.randomBytes(32).toString('hex');
}

