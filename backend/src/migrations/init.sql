-- Create ENUM types
CREATE TYPE event_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE delivery_status AS ENUM ('pending', 'delivered', 'failed', 'retrying');

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE,
    status event_status DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_idempotency_key ON events(idempotency_key);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    event_types TEXT[] NOT NULL DEFAULT '{}',
    secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    headers JSONB DEFAULT '{}',
    retry_policy JSONB DEFAULT '{"maxRetries": 5, "initialDelayMs": 1000, "backoffMultiplier": 2, "maxDelayMs": 60000}',
    client_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_client_id ON webhooks(client_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    status delivery_status DEFAULT 'pending',
    http_status INTEGER,
    response_body TEXT,
    response_headers JSONB,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    last_attempt_at TIMESTAMP,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deliveries_event_id ON deliveries(event_id);
CREATE INDEX idx_deliveries_webhook_id ON deliveries(webhook_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at);
CREATE INDEX idx_deliveries_next_retry_at ON deliveries(next_retry_at);

