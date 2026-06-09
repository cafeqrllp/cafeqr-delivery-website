-- ============================================================
-- V4__create_delivery_addresses_and_notifications.sql
-- CafeQR Delivery — Saved addresses + notification audit log
-- ============================================================

-- -----------------------------------------------------------
-- 1. delivery_addresses — saved addresses per customer phone
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_addresses (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    client_id       UUID,           -- FK → clients.id (addresses are scoped per restaurant)
    customer_phone  VARCHAR(20)     NOT NULL,
    label           VARCHAR(30)     DEFAULT 'Home',  -- Home | Work | Other
    line1           TEXT            NOT NULL,
    line2           TEXT,
    area            VARCHAR(100),
    city            VARCHAR(100),
    pincode         VARCHAR(10),
    landmark        TEXT,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    is_default      BOOLEAN         DEFAULT FALSE,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT delivery_addresses_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_del_addr_phone     ON delivery_addresses (customer_phone);
CREATE INDEX IF NOT EXISTS idx_del_addr_client_id ON delivery_addresses (client_id);

COMMENT ON TABLE delivery_addresses IS 'Saved delivery addresses per customer phone number, scoped per restaurant';


-- -----------------------------------------------------------
-- 2. delivery_notifications_log — audit trail for all pushes & emails
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_notifications_log (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    order_id        UUID            REFERENCES delivery_orders (id) ON DELETE SET NULL,
    client_id       UUID,
    target_role     VARCHAR(20)     NOT NULL,  -- customer | restaurant | agent
    event_type      VARCHAR(50)     NOT NULL,
    --   NEW_ORDER | ORDER_CONFIRMED | AGENT_ASSIGNED |
    --   ORDER_PICKED_UP | ORDER_DELIVERED | ORDER_CANCELLED
    channel         VARCHAR(20)     DEFAULT 'PUSH',  -- PUSH | EMAIL | SMS
    title           TEXT,
    body            TEXT,
    data            JSONB           DEFAULT '{}'::JSONB,
    success         BOOLEAN         DEFAULT TRUE,
    error_message   TEXT,
    sent_at         TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT delivery_notifications_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_notif_log_order_id  ON delivery_notifications_log (order_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_client_id ON delivery_notifications_log (client_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_event     ON delivery_notifications_log (event_type);
CREATE INDEX IF NOT EXISTS idx_notif_log_sent_at   ON delivery_notifications_log (sent_at DESC);

COMMENT ON TABLE delivery_notifications_log IS 'Audit log for every push notification and email sent for delivery order events';
