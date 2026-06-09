-- ============================================================
-- V2__create_delivery_agents.sql
-- CafeQR Delivery — Delivery personnel per client/branch
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_agents (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    client_id       UUID            NOT NULL,   -- FK → clients.id
    org_id          UUID,                       -- FK → organizations.id
    name            VARCHAR(150)    NOT NULL,
    phone           VARCHAR(20)     NOT NULL,
    email           VARCHAR(150),
    photo_url       TEXT,
    status          VARCHAR(20)     DEFAULT 'AVAILABLE',
    --   AVAILABLE | BUSY | OFFLINE
    vehicle_type    VARCHAR(20),    -- BIKE | CYCLE | WALK
    vehicle_no      VARCHAR(30),
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    CONSTRAINT delivery_agents_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_del_agents_client_id ON delivery_agents (client_id);
CREATE INDEX IF NOT EXISTS idx_del_agents_status    ON delivery_agents (status);
CREATE INDEX IF NOT EXISTS idx_del_agents_phone     ON delivery_agents (phone);

-- Add FK from delivery_orders.agent_id → delivery_agents.id
-- (Added here, after both tables exist)
ALTER TABLE delivery_orders
    ADD CONSTRAINT fk_del_orders_agent
    FOREIGN KEY (agent_id) REFERENCES delivery_agents (id)
    ON DELETE SET NULL;

COMMENT ON TABLE delivery_agents IS 'Delivery personnel registered per restaurant client/branch';
