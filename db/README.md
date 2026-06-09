# CafeQR Delivery — Database Migrations

## Stack

| Layer | Tech |
|---|---|
| Database | PostgreSQL (Docker container) |
| Migration tool | Flyway (Docker service) |
| Cache | Redis (Docker container) |
| Async queue | RabbitMQ (Docker container) |

Supabase is used **only for hosting** (static files / CDN). The database is self-hosted PostgreSQL in Docker — the frontend never connects to it directly.

---

## Migration Files

Files follow the **Flyway naming convention**: `V{version}__{description}.sql`

| File | Creates |
|---|---|
| `V1__create_delivery_orders.sql` | `delivery_orders` table + indexes |
| `V2__create_delivery_agents.sql` | `delivery_agents` table + FK to orders |
| `V3__create_delivery_fcm_tokens.sql` | `delivery_fcm_tokens` table |
| `V4__create_delivery_addresses_and_notifications.sql` | `delivery_addresses` + `delivery_notifications_log` |
| `V5__create_delivery_settings.sql` | `delivery_settings` table |
| `V6__create_updated_at_triggers.sql` | `fn_set_updated_at()` trigger on all tables |
| `V7__create_delivery_views.sql` | `v_active_delivery_orders`, `v_customer_order_history` |

---

## Running Migrations

### Via Docker Compose (standard flow)

Add this service to your existing `docker-compose.yml`:

```yaml
  flyway-delivery:
    image: flyway/flyway:10-alpine
    depends_on:
      - postgres
    environment:
      - FLYWAY_URL=jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      - FLYWAY_USER=${POSTGRES_USER}
      - FLYWAY_PASSWORD=${POSTGRES_PASSWORD}
      - FLYWAY_SCHEMAS=public
      - FLYWAY_LOCATIONS=filesystem:/flyway/sql
      - FLYWAY_BASELINE_ON_MIGRATE=true
    volumes:
      - ./db/migrations:/flyway/sql
    command: migrate
    restart: on-failure
```

### Manually (one-off)

```bash
docker run --rm \
  --network your_docker_network \
  -v $(pwd)/db/migrations:/flyway/sql \
  flyway/flyway:10-alpine \
  -url=jdbc:postgresql://postgres:5432/cafeqr \
  -user=postgres \
  -password=yourpassword \
  migrate
```

---

## Rules for Adding New Migrations

1. **Never edit an existing migration file** — Flyway checksums each file and will fail if it detects a change.
2. Always increment the version: `V8__your_description.sql`
3. Use `IF NOT EXISTS` / `CREATE OR REPLACE` where possible for safety.
4. Test on the development DB first, then staging, then production.
5. Destructive changes (DROP, truncate) must be in a separate version file with a `-- DESTRUCTIVE` comment.
