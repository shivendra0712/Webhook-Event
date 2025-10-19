# Webhook Event Relay System - Architecture

## System Overview

The Webhook Event Relay System is a distributed event delivery platform that acts as a message broker between internal AlgoHire modules and external webhook subscribers. It ensures reliable, secure, and idempotent event delivery with comprehensive monitoring and retry capabilities.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Internal Modules                              │
│              (Job Creation, Candidate Updates, etc.)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Event Ingestion  │  Webhook Management  │  Delivery API │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐      ┌──────────┐
   │PostgreSQL│      │  Redis  │      │  BullMQ  │
   │ Database │      │  Cache  │      │  Queue   │
   └─────────┘      └─────────┘      └──────────┘
        │                                   │
        └───────────────┬───────────────────┘
                        ▼
            ┌──────────────────────┐
            │ Background Workers   │
            │ (Delivery Service)   │
            └──────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  External Webhook Endpoints   │
        │  (Client Systems)             │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  React Dashboard              │
        │  (Monitoring & Management)    │
        └───────────────────────────────┘
```

## Core Components

### 1. Backend API (Node.js + Express)

**Responsibilities:**
- Accept incoming events from internal modules
- Manage webhook subscriptions
- Track delivery status
- Provide management APIs

**Key Modules:**
- `routes/events.js`: Event management endpoints
- `routes/webhooks.js`: Webhook subscription endpoints
- `routes/deliveries.js`: Delivery tracking endpoints
- `services/eventService.js`: Event business logic
- `services/webhookService.js`: Webhook business logic
- `services/deliveryService.js`: Delivery business logic
- `middleware/auth.js`: Authentication and validation
- `utils/hmac.js`: HMAC signing utilities

### 2. Database Layer (PostgreSQL)

**Tables:**

#### Events Table
```sql
- id (UUID, PK)
- eventType (VARCHAR)
- payload (JSONB)
- idempotencyKey (VARCHAR, UNIQUE)
- status (ENUM: pending, processing, completed, failed)
- retryCount (INTEGER)
- lastError (TEXT)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### Webhooks Table
```sql
- id (UUID, PK)
- name (VARCHAR)
- url (VARCHAR)
- eventTypes (TEXT[])
- secret (VARCHAR)
- isActive (BOOLEAN)
- headers (JSONB)
- retryPolicy (JSONB)
- clientId (VARCHAR)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### Deliveries Table
```sql
- id (UUID, PK)
- eventId (UUID, FK)
- webhookId (UUID, FK)
- status (ENUM: pending, delivered, failed, retrying)
- httpStatus (INTEGER)
- responseBody (TEXT)
- responseHeaders (JSONB)
- retryCount (INTEGER)
- nextRetryAt (TIMESTAMP)
- lastAttemptAt (TIMESTAMP)
- error (TEXT)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### 3. Cache Layer (Redis)

**Key Patterns:**
- `webhooks:event:{eventType}`: Cached webhooks for event type (TTL: 5 min)
- `webhook:{webhookId}`: Cached webhook details (TTL: 10 min)
- `delivery:stats`: Cached delivery statistics (TTL: 1 min)
- `event:stats`: Cached event statistics (TTL: 1 min)

**Benefits:**
- Reduces database queries for frequently accessed data
- Improves response times
- Reduces load on database

### 4. Background Workers (BullMQ)

**Job Queue:** `webhook-delivery`

**Process:**
1. Pending deliveries added to queue
2. Worker picks up job
3. Sends webhook with HMAC signature
4. On success: marks delivery as delivered
5. On failure: calculates retry delay and reschedules

**Concurrency:** 10 concurrent jobs

### 5. Frontend (React + Redux)

**Pages:**
- Dashboard: System statistics and health
- Events: Create and view events
- Webhooks: Manage subscriptions
- Deliveries: Monitor delivery status

**State Management:**
- Redux Toolkit for global state
- Async thunks for API calls
- Slices for events, webhooks, deliveries

## Data Flow

### Event Creation Flow
```
1. Internal Module → POST /api/events
2. API validates event
3. Check idempotency key (if provided)
4. Create Event record in DB
5. Find matching webhooks (from cache or DB)
6. Create Delivery records for each webhook
7. Add deliveries to BullMQ queue
8. Return response to client
```

### Event Delivery Flow
```
1. Background worker picks up delivery job
2. Fetch event and webhook details
3. Generate HMAC signature
4. Prepare headers with signature
5. Send HTTP POST to webhook URL
6. On success (2xx): Mark delivery as delivered
7. On failure: Calculate retry delay
8. Reschedule delivery with exponential backoff
9. After max retries: Mark delivery as failed
```

### Retry Logic
```
Retry Delay = min(
  initialDelayMs * (backoffMultiplier ^ retryCount),
  maxDelayMs
)

Default:
- initialDelayMs: 1000ms
- backoffMultiplier: 2
- maxDelayMs: 60000ms
- maxRetries: 5

Example:
- Attempt 1: Fail
- Attempt 2: Retry after 1s
- Attempt 3: Retry after 2s
- Attempt 4: Retry after 4s
- Attempt 5: Retry after 8s
- Attempt 6: Retry after 16s
- Attempt 7: Fail permanently
```

## Security Architecture

### Authentication
- API Key in `X-API-Key` header
- Client ID in `X-Client-ID` header
- Validated on every request

### HMAC Signing
- Algorithm: SHA256
- Secret: Unique per webhook
- Signature in `X-Webhook-Signature` header
- Payload: JSON stringified event

### Input Validation
- Joi schemas for all inputs
- Type checking
- URL validation
- JSON validation

### Rate Limiting
- Per-client rate limiting
- Default: 100 requests/minute
- Prevents abuse

## Idempotency Implementation

### Problem
- Network retries can cause duplicate events
- Replay attacks could cause duplicate deliveries

### Solution
- Optional `idempotencyKey` on event creation
- Unique constraint on idempotencyKey
- If duplicate detected: return original event
- Ensures exactly-once delivery semantics

### Example
```
Request 1: POST /events with idempotencyKey="evt_123"
Response: Event created with id="abc"

Request 2: POST /events with idempotencyKey="evt_123" (retry)
Response: Same event with id="abc" (no duplicate)
```

## Performance Optimizations

### Database
- Connection pooling (max 5 connections)
- Indexes on frequently queried columns
- Pagination for large result sets
- Efficient queries with Sequelize

### Caching
- Redis for webhook lookups
- Cache invalidation on updates
- TTL-based expiration
- Reduces DB load by ~70%

### Async Processing
- Background workers for delivery
- Non-blocking API responses
- Concurrent job processing (10 workers)
- Queue-based processing

### Monitoring
- Structured logging with Winston
- Error tracking
- Performance metrics
- Dashboard statistics

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (can run multiple instances)
- Shared PostgreSQL database
- Shared Redis cache
- Shared BullMQ queue

### Vertical Scaling
- Increase worker concurrency
- Increase database connection pool
- Increase Redis memory

### Future Enhancements
- Database sharding by clientId
- Redis cluster for high availability
- Multiple worker instances
- Load balancing with Nginx
- CDN for static assets

## Error Handling

### API Errors
- Validation errors: 400
- Authentication errors: 401
- Not found: 404
- Rate limit: 429
- Server errors: 500

### Delivery Errors
- Network timeout: Retry
- 4xx responses: Fail (no retry)
- 5xx responses: Retry
- Connection refused: Retry

### Logging
- All errors logged with context
- Stack traces for debugging
- Request/response logging
- Performance metrics

## Monitoring & Observability

### Metrics
- Event count by type
- Delivery success rate
- Retry count distribution
- Response time percentiles
- Error rate by type

### Logs
- Structured JSON logs
- Log levels: debug, info, warn, error
- Separate error log file
- Combined log file

### Dashboard
- Real-time statistics
- System health status
- Delivery status breakdown
- Event status breakdown

## Deployment Architecture

### Development
- Single machine setup
- PostgreSQL local
- Redis local
- All services on localhost

### Production
- Multiple API servers behind load balancer
- Managed PostgreSQL (RDS/Cloud SQL)
- Managed Redis (ElastiCache/Cloud Memorystore)
- Multiple worker instances
- Monitoring and alerting
- Backup and disaster recovery

## Technology Choices & Rationale

### Node.js + Express
- Fast, lightweight framework
- Excellent async/await support
- Large ecosystem
- Easy to scale

### PostgreSQL
- ACID compliance
- JSONB support for flexible payloads
- Excellent indexing
- Proven reliability

### Redis
- In-memory performance
- Pub/Sub capabilities
- Atomic operations
- Simple to operate

### BullMQ
- Reliable job queue
- Built on Redis
- Retry mechanisms
- Job scheduling

### React + Redux
- Component-based UI
- Predictable state management
- Large community
- Easy to test

## Future Improvements

1. **Webhook Signing Verification**: Client library for signature verification
2. **Batch Delivery**: Support for batch webhook delivery
3. **Webhook Testing**: Built-in webhook testing tool
4. **Advanced Filtering**: More sophisticated event filtering
5. **Analytics**: Advanced analytics and reporting
6. **Multi-tenancy**: Support for multiple organizations
7. **Webhook Replay**: Ability to replay historical events
8. **Custom Transformations**: Event transformation pipelines

