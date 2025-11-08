# Webhook Event Relay System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All API requests require the following headers:
- `X-API-Key`: Your API key (default: `test-api-key-12345`)
- `X-Client-ID`: Your client identifier (default: `default-client`)

## Response Format
All responses are in JSON format with the following structure:
```json
{
  "message": "Success message",
  "data": { /* response data */ },
  "error": "Error message (if applicable)"
}
```

## Events Endpoints

### 1. Create Event
**POST** `/events`

Creates a new event and automatically creates delivery records for matching webhooks.

**Request Body:**
```json
{
  "eventType": "job.created",
  "payload": {
    "jobId": "123",
    "title": "Software Engineer",
    "company": "TechCorp"
  },
  "idempotencyKey": "evt_123_abc" (optional)
}
```

**Response (201):**
```json
{
  "message": "Event created successfully",
  "event": {
    "id": "uuid",
    "eventType": "job.created",
    "payload": { /* payload */ },
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "deliveriesCreated": 3,
  "isDuplicate": false
}
```

**Error Responses:**
- `400`: Missing required fields
- `409`: Duplicate event (same idempotencyKey)

---

### 2. Get All Events
**GET** `/events?status=pending&eventType=job.created&limit=50&offset=0`

Retrieves paginated list of events with optional filters.

**Query Parameters:**
- `status`: Filter by status (pending, processing, completed, failed)
- `eventType`: Filter by event type
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "rows": [
    {
      "id": "uuid",
      "eventType": "job.created",
      "status": "pending",
      "payload": { /* payload */ },
      "deliveries": [
        { "id": "uuid", "status": "pending" }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 150
}
```

---

### 3. Get Event Details
**GET** `/events/:id`

Retrieves detailed information about a specific event including all delivery attempts.

**Response (200):**
```json
{
  "id": "uuid",
  "eventType": "job.created",
  "payload": { /* payload */ },
  "status": "pending",
  "deliveries": [
    {
      "id": "uuid",
      "webhookId": "uuid",
      "status": "delivered",
      "httpStatus": 200,
      "retryCount": 0,
      "lastAttemptAt": "2024-01-15T10:31:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### 4. Get Event Statistics
**GET** `/events/stats/summary`

Retrieves aggregated statistics about all events.

**Response (200):**
```json
{
  "total": 1000,
  "pending": 50,
  "processing": 10,
  "completed": 900,
  "failed": 40
}
```

---

## Webhooks Endpoints

### 1. Create Webhook
**POST** `/webhooks`

Registers a new webhook subscription.

**Request Body:**
```json
{
  "name": "My Webhook",
  "url": "https://example.com/webhooks/events",
  "eventTypes": ["job.created", "job.updated"],
  "clientId": "client-123",
  "headers": {
    "Authorization": "Bearer token123",
    "X-Custom-Header": "value"
  }
}
```

**Response (201):**
```json
{
  "message": "Webhook created successfully",
  "webhook": {
    "id": "uuid",
    "name": "My Webhook",
    "url": "https://example.com/webhooks/events",
    "eventTypes": ["job.created", "job.updated"],
    "secret": "whk_secret_abc123xyz",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Note:** Secret is only returned on creation. Store it securely for HMAC verification.

---

### 2. Get Webhooks
**GET** `/webhooks?clientId=client-123&isActive=true&limit=50&offset=0`

Retrieves webhooks for a client.

**Query Parameters:**
- `clientId`: Required. Client identifier
- `isActive`: Filter by active status (true/false)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "rows": [
    {
      "id": "uuid",
      "name": "My Webhook",
      "url": "https://example.com/webhooks/events",
      "eventTypes": ["job.created"],
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 5
}
```

---

### 3. Get Webhook Details
**GET** `/webhooks/:id`

Retrieves detailed information about a specific webhook.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Webhook",
  "url": "https://example.com/webhooks/events",
  "eventTypes": ["job.created", "job.updated"],
  "isActive": true,
  "headers": { /* custom headers */ },
  "retryPolicy": {
    "maxRetries": 5,
    "initialDelayMs": 1000,
    "backoffMultiplier": 2,
    "maxDelayMs": 60000
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### 4. Update Webhook
**PUT** `/webhooks/:id`

Updates webhook configuration.

**Request Body:**
```json
{
  "name": "Updated Webhook Name",
  "url": "https://example.com/new-endpoint",
  "eventTypes": ["job.created"],
  "isActive": false,
  "headers": { /* updated headers */ }
}
```

**Response (200):**
```json
{
  "message": "Webhook updated successfully",
  "webhook": { /* updated webhook */ }
}
```

---

### 5. Delete Webhook
**DELETE** `/webhooks/:id`

Deletes a webhook subscription.

**Response (200):**
```json
{
  "message": "Webhook deleted successfully"
}
```

---

### 6. Rotate Webhook Secret
**POST** `/webhooks/:id/rotate-secret`

Generates a new secret for the webhook.

**Response (200):**
```json
{
  "message": "Webhook secret rotated successfully",
  "webhook": {
    "id": "uuid",
    "secret": "whk_secret_new_xyz789"
  }
}
```

---

## Deliveries Endpoints

### 1. Get Deliveries
**GET** `/deliveries?status=failed&eventId=uuid&webhookId=uuid&limit=50&offset=0`

Retrieves delivery records with optional filters.

**Query Parameters:**
- `status`: Filter by status (pending, delivered, failed, retrying)
- `eventId`: Filter by event ID
- `webhookId`: Filter by webhook ID
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "rows": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "webhookId": "uuid",
      "status": "delivered",
      "httpStatus": 200,
      "responseBody": "{ \"success\": true }",
      "retryCount": 0,
      "lastAttemptAt": "2024-01-15T10:31:00Z",
      "event": { /* event details */ },
      "webhook": { /* webhook details */ }
    }
  ],
  "count": 100
}
```

---

### 2. Get Delivery Details
**GET** `/deliveries/:id`

Retrieves detailed information about a specific delivery.

**Response (200):**
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "webhookId": "uuid",
  "status": "failed",
  "httpStatus": 500,
  "responseBody": "Internal Server Error",
  "responseHeaders": { /* response headers */ },
  "retryCount": 2,
  "nextRetryAt": "2024-01-15T10:35:00Z",
  "lastAttemptAt": "2024-01-15T10:30:00Z",
  "error": "Connection timeout",
  "event": { /* full event */ },
  "webhook": { /* full webhook */ }
}
```

---

### 3. Retry Delivery
**POST** `/deliveries/:id/retry`

Manually retries a failed delivery.

**Response (200):**
```json
{
  "message": "Delivery retry initiated",
  "delivery": {
    "id": "uuid",
    "status": "pending",
    "retryCount": 0,
    "nextRetryAt": null
  }
}
```

---

### 4. Get Delivery Statistics
**GET** `/deliveries/stats/summary`

Retrieves aggregated statistics about all deliveries.

**Response (200):**
```json
{
  "total": 5000,
  "pending": 100,
  "delivered": 4800,
  "failed": 50,
  "retrying": 50
}
```

---

## Error Handling

All errors follow this format:
```json
{
  "error": "Error message",
  "status": 400
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid API key)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

---

## Webhook Payload Format

When a webhook is triggered, the following payload is sent:

```json
{
  "eventId": "uuid",
  "eventType": "job.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "payload": {
    /* original event payload */
  }
}
```

### Webhook Headers
- `X-Webhook-Signature`: HMAC-SHA256 signature of the payload
- `X-Event-Type`: Type of the event
- `X-Event-ID`: Unique event identifier
- `X-Delivery-ID`: Unique delivery identifier
- `X-Timestamp`: ISO 8601 timestamp
- Plus any custom headers configured for the webhook

### Verifying Webhook Signature

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Rate Limiting

- Default: 100 requests per minute per client
- Exceeding limit returns `429 Too Many Requests`

---

## Pagination

All list endpoints support pagination:
- `limit`: Results per page (default: 50, max: 100)
- `offset`: Number of results to skip (default: 0)

Response includes `count` field with total number of records.

