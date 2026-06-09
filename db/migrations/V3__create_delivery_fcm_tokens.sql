-- ============================================================
-- V3__create_delivery_fcm_tokens.sql
-- CafeQR Delivery — FCM device tokens for push notifications
--
-- How it works:
--   Browser calls POST /delivery/fcm-tokens (backend API)
--   Backend stores the token here
--   When an order event fires, backend reads tokens for the
--   target role and calls the FCM Admin SDK (via Next.js API
--   route or directly from backend service)
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_fcm_tokens (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    client_id       UUID,           -- FK → clients.id
    org_id          UUID,           -- FK → organizations.id
    role            VARCHAR(20)     NOT NULL,
    --   customer | restaurant | agent
    entity_id       UUID,
    --   customer_id for role=customer
    --   agent_id    for role=agent
    --   NULL        for role=restaurant (restaurant staff use topic-based push)
    token           TEXT            NOT NULL,
    device_type     VARCHAR(20),    -- web | android | ios
    is_active       BOOLEAN         DEFAULT TRUE,
    last_seen_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT delivery_fcm_tokens_pkey    PRIMARY KEY (id),
    CONSTRAINT delivery_fcm_tokens_tok_uq  UNIQUE (token)  -- one row per device
);

CREATE INDEX IF NOT EXISTS idx_fcm_client_org  ON delivery_fcm_tokens (client_id, org_id);
CREATE INDEX IF NOT EXISTS idx_fcm_entity_id   ON delivery_fcm_tokens (entity_id);
CREATE INDEX IF NOT EXISTS idx_fcm_role        ON delivery_fcm_tokens (role);
CREATE INDEX IF NOT EXISTS idx_fcm_is_active   ON delivery_fcm_tokens (is_active);

COMMENT ON TABLE  delivery_fcm_tokens IS 'FCM device tokens for delivery push notification targeting';
COMMENT ON COLUMN delivery_fcm_tokens.token IS 'Unique per device/browser. Re-registered on every app launch; old token auto-deactivated if FCM returns NotRegistered error';
