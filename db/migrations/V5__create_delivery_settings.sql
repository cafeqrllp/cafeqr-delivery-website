-- ============================================================
-- V5__create_delivery_settings.sql
-- CafeQR Delivery — Per-restaurant delivery configuration
--
-- One row per client+org combination.
-- Read by the frontend via GET /delivery/restaurant/:id/settings
-- Written by restaurant admin panel.
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_settings (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid(),
    client_id               UUID            NOT NULL,  -- FK → clients.id
    org_id                  UUID,                      -- FK → organizations.id (NULL = all branches)

    -- Feature toggles
    is_delivery_enabled     BOOLEAN         DEFAULT TRUE,
    is_takeaway_enabled     BOOLEAN         DEFAULT TRUE,
    is_accepting_orders     BOOLEAN         DEFAULT TRUE,  -- manual on/off switch

    -- Fees
    delivery_fee            NUMERIC(10, 2)  DEFAULT 40.00,
    free_delivery_above     NUMERIC(10, 2)  DEFAULT 299.00,  -- 0 = never free
    min_order_amount        NUMERIC(10, 2)  DEFAULT 0.00,

    -- Geography
    max_delivery_radius_km  DOUBLE PRECISION DEFAULT 5.0,
    -- Restaurant coordinates (for radius check)
    restaurant_lat          DOUBLE PRECISION,
    restaurant_lng          DOUBLE PRECISION,

    -- Time estimates
    estimated_time_min      INTEGER         DEFAULT 20,
    estimated_time_max      INTEGER         DEFAULT 40,

    -- Operating hours as JSONB
    -- Format: { "mon": { "open": "09:00", "close": "22:00", "closed": false }, ... }
    operating_hours         JSONB           DEFAULT '{}'::JSONB,

    -- Promo / announcement banner shown on ordering page
    promo_text              TEXT,

    -- Razorpay / payment gateway config (nullable — falls back to COD only)
    razorpay_key_id         VARCHAR(100),
    -- razorpay_key_secret stored in backend env, NEVER in this table

    created_at              TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100),

    CONSTRAINT delivery_settings_pkey            PRIMARY KEY (id),
    CONSTRAINT delivery_settings_client_org_uq   UNIQUE (client_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_del_settings_client_id ON delivery_settings (client_id);

COMMENT ON TABLE  delivery_settings IS 'Per-restaurant delivery configuration: fees, radius, hours, toggles';
COMMENT ON COLUMN delivery_settings.is_accepting_orders IS 'Manual override: restaurant can pause all incoming delivery orders without changing hours';
COMMENT ON COLUMN delivery_settings.razorpay_key_id IS 'Public Razorpay key (safe to read from frontend). Secret key lives in backend Docker env only.';
