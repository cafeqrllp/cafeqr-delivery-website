-- ============================================================
-- V1__create_delivery_orders.sql
-- CafeQR Delivery — Core delivery orders table
--
-- Flyway naming convention: V{version}__{description}.sql
-- Run by: Flyway Docker service on startup
-- Safe: uses IF NOT EXISTS throughout
-- Does NOT alter any existing POS tables
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_orders (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid(),
    client_id               UUID            NOT NULL,  -- FK → clients.id
    org_id                  UUID,                      -- FK → organizations.id (branch)

    -- Order identity
    order_no                VARCHAR(50)     NOT NULL,
    order_type              VARCHAR(20)     NOT NULL DEFAULT 'DELIVERY', -- DELIVERY | TAKEAWAY
    order_status            VARCHAR(30)     NOT NULL DEFAULT 'PENDING',
    --   PENDING → CONFIRMED → PREPARING → ASSIGNED → PICKED_UP → DELIVERED
    --   PENDING → CANCELLED (any stage)
    payment_status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    --   PENDING | PAID | REFUNDED | FAILED
    payment_method          VARCHAR(20)     DEFAULT 'CASH',
    --   CASH | UPI | CARD | RAZORPAY

    -- Customer info (snapshot — does not require a registered account)
    customer_id             UUID,           -- FK → customers.id (nullable, guest orders allowed)
    customer_name           VARCHAR(150)    NOT NULL,
    customer_phone          VARCHAR(20)     NOT NULL,
    customer_email          VARCHAR(150),

    -- Delivery address (JSONB for flexibility across Indian address formats)
    -- Expected keys: line1, line2, area, city, pincode, landmark, lat, lng
    delivery_address        JSONB,

    -- Delivery agent
    agent_id                UUID,           -- FK → delivery_agents.id
    agent_assigned_at       TIMESTAMP WITHOUT TIME ZONE,
    picked_up_at            TIMESTAMP WITHOUT TIME ZONE,
    delivered_at            TIMESTAMP WITHOUT TIME ZONE,

    -- Financial (all amounts in INR)
    subtotal_amount         NUMERIC(12, 2)  NOT NULL DEFAULT 0,
    total_tax_amount        NUMERIC(12, 2)  DEFAULT 0,
    total_discount_amount   NUMERIC(12, 2)  DEFAULT 0,
    delivery_fee            NUMERIC(12, 2)  DEFAULT 0,
    grand_total             NUMERIC(12, 2)  NOT NULL DEFAULT 0,

    -- Order line items snapshot (JSONB array — avoids join complexity)
    -- Each element: { product_id, product_name, variant_id, variant_name,
    --                 quantity, unit_price, line_total, notes }
    order_lines_snapshot    JSONB           NOT NULL DEFAULT '[]'::JSONB,

    -- Timing
    estimated_time_minutes  INTEGER         DEFAULT 30,
    order_date              TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at            TIMESTAMP WITHOUT TIME ZONE,
    cancelled_at            TIMESTAMP WITHOUT TIME ZONE,
    cancellation_reason     TEXT,
    cancelled_by            VARCHAR(30),    -- customer | restaurant | system

    -- Link back to POS order once restaurant confirms and creates it
    pos_order_id            UUID,           -- FK → orders.id

    -- Source tracking
    order_source            VARCHAR(20)     DEFAULT 'ONLINE', -- ONLINE | APP
    device_info             JSONB,
    utm_source              VARCHAR(100),

    -- Special instructions
    notes                   TEXT,

    -- Standard audit columns (matching existing CafeQR table conventions)
    isactive                CHAR(1)         DEFAULT 'Y',
    created_at              TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100),
    version                 BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT delivery_orders_pkey PRIMARY KEY (id),
    CONSTRAINT delivery_orders_order_no_client_uq UNIQUE (client_id, order_no)
);

CREATE INDEX IF NOT EXISTS idx_del_orders_client_id   ON delivery_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_del_orders_org_id      ON delivery_orders (org_id);
CREATE INDEX IF NOT EXISTS idx_del_orders_status      ON delivery_orders (order_status);
CREATE INDEX IF NOT EXISTS idx_del_orders_phone       ON delivery_orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_del_orders_agent_id    ON delivery_orders (agent_id);
CREATE INDEX IF NOT EXISTS idx_del_orders_created_at  ON delivery_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_del_orders_pos_order   ON delivery_orders (pos_order_id);

COMMENT ON TABLE  delivery_orders IS 'Online delivery and takeaway orders placed via CafeQR Delivery portal';
COMMENT ON COLUMN delivery_orders.order_lines_snapshot IS 'Point-in-time snapshot of ordered items; does not change if menu prices change later';
COMMENT ON COLUMN delivery_orders.pos_order_id IS 'Set by restaurant backend when they confirm the order and create a corresponding POS order';
