-- ============================================================
-- V6__create_updated_at_triggers.sql
-- CafeQR Delivery — Auto-update updated_at on row changes
--
-- Creates a shared trigger function and attaches it to all
-- delivery tables. No application-level updated_at management needed.
-- ============================================================

-- Shared trigger function (idempotent)
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to each delivery table
DROP TRIGGER IF EXISTS trg_delivery_orders_updated_at   ON delivery_orders;
CREATE TRIGGER trg_delivery_orders_updated_at
    BEFORE UPDATE ON delivery_orders
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_agents_updated_at   ON delivery_agents;
CREATE TRIGGER trg_delivery_agents_updated_at
    BEFORE UPDATE ON delivery_agents
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_fcm_tokens_updated_at ON delivery_fcm_tokens;
CREATE TRIGGER trg_delivery_fcm_tokens_updated_at
    BEFORE UPDATE ON delivery_fcm_tokens
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_addresses_updated_at ON delivery_addresses;
CREATE TRIGGER trg_delivery_addresses_updated_at
    BEFORE UPDATE ON delivery_addresses
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_settings_updated_at  ON delivery_settings;
CREATE TRIGGER trg_delivery_settings_updated_at
    BEFORE UPDATE ON delivery_settings
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON FUNCTION fn_set_updated_at() IS 'Shared trigger: sets updated_at = NOW() on every UPDATE across delivery tables';
