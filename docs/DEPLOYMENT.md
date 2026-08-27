# Deployment Runbook — Gateway (Docker + Fly.io)

This document covers running and deploying the AI Credits **gateway**
(the Bun/Hono server in `packages/server`) as a container image on
[Fly.io](https://fly.io). The static apps (dashboard, demo, docs, landing) are
deployed separately (Vercel); only the gateway lives in this container.

The container image **never reads a `.env` file** — all configuration comes
from environment variables injected by the platform (Fly secrets). Locally we
still use the `.env` convention for developer ergonomics.

---

## 1. Environment contract

Everything the gateway needs comes from the environment. Names only — values
are never committed. See `.env.example` for the canonical list:

| Variable             | Required | Purpose                                                        |
| -------------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL`       | yes\*    | Supabase/Postgres connection string (pooler URL is fine).      |
| `JWT_SECRET`         | yes\*    | HS256 session-token secret — **must be ≥ 32 characters**.      |
| `OPENAI_API_KEY`     | optional | Enables the real OpenAI model provider.                        |
| `GEMINI_API_KEY`     | optional | Enables the real Gemini model provider (fallback to OpenAI).   |
| `STRIPE_SECRET_KEY`  | optional | Real Stripe Checkout sessions (otherwise demo webhook mode).   |
| `STRIPE_WEBHOOK_SECRET` | optional | Verifies Stripe webhook signatures.                         |
| `REDIS_URL`          | optional | Upstash REST endpoint for shared rate limiting.                |
| `REDIS_TOKEN`        | optional | Upstash REST token (used with `REDIS_URL`).                    |
| `RESEND_API_KEY`     | optional | Enables real OTP email delivery; without it the fallback only logs a PII-safe warning (never the code). |
| `RESEND_FROM`        | optional | OTP sender address (default `no-reply@example.com`).           |
| `PORT`               | no       | Listen port (default `3000`).                                  |

\* `DATABASE_URL`/`JWT_SECRET` have demo fallbacks baked into the code, but a
production deployment should always set real values. `GET /` reports whether
the database is `postgres` or `in-memory` — use it to confirm the wiring.

**Fail-closed secrets:** when the gateway runs with `NODE_ENV=production` (or
`SECRETS_STRICT=1`) it **fails to start** unless both `JWT_SECRET` and
`STRIPE_WEBHOOK_SECRET` are set — the compiled-in demo secrets are for local
development only and are never used in production. Deployments that omit
either variable will crash-loop on boot instead of silently signing sessions
or accepting webhooks with a known public secret.

---

## 2. Local smoke test (before deploying)

The local flow uses Docker **only** for the dev database (docker-compose.yml).

```bash
# 1) Start the local Supabase-compatible Postgres (requires a running Docker daemon)
bun run db:up

# 2) Create and fill the local env file
cp .env.example .env
#    edit .env: DATABASE_URL, JWT_SECRET, API keys, Stripe keys

# 3) Apply migrations to the local database
bun run db:migrate

# 4) Boot the gateway and smoke-test the health endpoint
bun run server
curl http://localhost:3000/
#    expect: {"status":"ok","service":"AI Credits Gateway & Managed Actions Engine",...,"database":"postgres"}
```

---

## 3. Building the container image locally

```bash
docker build -t ai-payment-gateway .
docker run --rm -p 3000:3000 --env-file .env ai-payment-gateway
curl http://localhost:3000/
```

Notes on the image:

- **Workspace layout:** the root `package.json` declares `packages/*` **and**
  `apps/*` workspaces. The deps stage copies the manifest of *every* workspace
  before `bun install --frozen-lockfile` — if a workspace directory is missing
  (e.g. only `packages/shared|core|server` are copied), install fails.
- **`.dockerignore`:** host `node_modules` (bun 1.3 keeps per-package
  `node_modules` dirs with absolute-path links) is excluded from the build
  context so it can never clobber the image's own install.
- The build stage runs the same `bun run typecheck` (`tsc --build`) the CI and
  local workflows run; the image fails to build if typecheck fails.
- The runtime stage contains `node_modules`, the full source of
  `packages/shared`, `packages/core`, `packages/server`, the migration runner
  (`scripts/migrate.ts`) and the root `package.json`. **No `apps/*` source is
  copied** — the gateway does not need it.
- The image runs `bun run packages/server/src/server.ts` and listens on
  `PORT` (default 3000).

---

## 4. Deploying to Fly.io

Prerequisites: `flyctl` installed and authenticated (`fly auth login`).

```bash
# 1) Create the app (fly.toml already exists — app name ai-payment-gateway,
#    region waw, http_service on port 3000 with GET / health check).
#    `--no-deploy` creates the app + config without deploying yet.
fly launch --no-deploy

# 2) Inject secrets (NEVER put real values in fly.toml or git)
fly secrets set \
  DATABASE_URL=postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres \
  JWT_SECRET='<random string, at least 32 chars>' \
  OPENAI_API_KEY=... \
  GEMINI_API_KEY=... \
  STRIPE_SECRET_KEY=... \
  STRIPE_WEBHOOK_SECRET=...

# 3) Deploy (builds the Dockerfile and starts the machine)
fly deploy

# 4) After the FIRST deploy, apply migrations once:
fly ssh console -- 'bun run db:migrate:prod'
#    db:migrate:prod (package.json) runs scripts/migrate.ts against
#    DATABASE_URL from the app environment — no .env file involved.

# 5) Verify
fly status
fly logs
curl https://ai-payment-gateway.fly.dev/
#    expect: {"status":"ok",...,"database":"postgres"}
```

### Migrations — one-shot vs `release_command`

The migration runner (`scripts/migrate.ts`) is **tracking-based**: it records
every applied file in a `schema_migrations` table (file primary key +
`applied_at`) and applies only the files that are missing, in filename order.
Re-running it is a no-op for already-applied files, so migrations no longer
need to be individually re-runnable. In particular `004_developer_registry.sql`
contains the non-idempotent statement `ALTER TABLE action_runs ADD CONSTRAINT
fk_action_runs_project ...` — it now runs **exactly once** because the runner
skips files already recorded in `schema_migrations`.

- **One-shot (recommended today):** `fly ssh console -- 'bun run db:migrate:prod'`
  after the first deploy. Simple and explicit; the runner applies only the
  migrations the database has not seen.
- **`release_command` (once CI is set up):** add to `fly.toml` and Fly runs it
  before the app starts on *every* deploy:

  ```toml
  [deploy]
    release_command = "bun run db:migrate:prod"
  ```

  This is now safe: a second deploy re-runs the runner but the `schema_migrations`
  tracking means no migration (including 004's `ADD CONSTRAINT`) executes twice.

---

## 5. Pointing the demo app at the production gateway

The demo app's client is created in `apps/demo/src/main.ts` with a hardcoded
`baseUrl: "http://localhost:3000"`. To target the production gateway, drive
the URL from the environment instead of the constant:

```ts
import { createAI } from "@ai-credits/sdk";

const ai = createAI({
  project: "pk_live_demo123",
  baseUrl: import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3000",
  mock: false,
});
```

Then build the demo with the production URL:

```bash
VITE_GATEWAY_URL=https://ai-payment-gateway.fly.dev bun run demo
```

> CORS: the gateway validates the browser `Origin` against the project's
> `allowedDomains` (see the CORS policy service). Add the demo's deployed
> origin (e.g. its Vercel URL) to the project's allowed domains, or browser
> calls will get `403 Origin not allowed for this project`.

---

## 6. Operational notes

- **Health checks:** Fly polls `GET /` on the internal port 3000
  (`[http_service.checks.health]`); `grace_period = "10s"` covers the async
  `createPlatformApp()` startup (which connects to the database). If
  `DATABASE_URL` is unreachable at boot, the process exits and Fly restarts it.
- **Scaling:** `auto_stop_machines`/`auto_start_machines` with
  `min_machines_running = 1` keeps a single always-on machine; scale up with
  `fly machine clone`/`fly scale count` when needed.
- **Secrets rotation:** `fly secrets set JWT_SECRET=<new>` triggers a rolling
  redeploy; existing sessions signed with the old secret stop validating
  immediately.
- **Rolling back:** `fly deploy --image <previous-image>` or
  `fly releases` / `fly release rollback`.

---

## 7. Monitoring & Ops

- **Structured logs:** the gateway emits newline-delimited JSON to stdout with
  `request_id` / `run_id` / `action_name` correlation fields, and the logger
  redacts PII (emails, OTP codes, raw prompts) before anything reaches the log
  stream. Wire a log drain that tails stdout — Fly log shipping (`fly logs`
  / Logtail), Betterstack, or Grafana Loki — and alert on error-level entries
  or elevated 429/5xx rates.
- **Retention cleanup:** completed `action_runs` and stale `reservations`
  accumulate in Postgres and should be purged on a schedule. The image bundles
  `scripts/cleanup.ts`, so run `bun run cleanup -- --days=30` nightly — via Fly
  machines cron (`fly m run --schedule daily` executing the cleanup command
  against the app environment) or a GitHub Actions cron that runs the same
  command against the production `DATABASE_URL`. The script is guarded: it
  exits unless `DATABASE_URL` is set.
- **Shared rate limiting:** set `REDIS_URL` + `REDIS_TOKEN` (Upstash REST) so
  every gateway instance shares one rate-limit counter. Without them the
  server falls back to the per-process `SlidingWindowRateLimiter` — fine for
  a single machine, ineffective across replicas. `GET /` (the health check)
  and the boot banner report which limiter is active (`redis` vs
  `in-memory`).
- **Point-in-time recovery of the ledger:** the ledger is an append-only
  Postgres double-entry log. Enable Supabase's managed continuous backups so
  it can be recovered to any point in time, and periodically test a restore
  into a scratch project to prove the recovery path.

---

## 8. Security notes

- **Developer secret keys are stored in plaintext.** `sk_live_*` keys are kept
  in the `developer_projects` table as written by the developer dashboard —
  they are **not hashed at rest**. Treat that table (and any database dump or
  backup that contains it) with the same care as a credentials vault:
  - Restrict `developer_projects` access to the gateway service role and
    minimal-privilege operators only; never grant broad read access to DB
    users, analytics tools, or CI jobs that do not need it.
  - Guard database backups / point-in-time snapshots (they contain the table)
    and use Supabase's restricted access settings for backup storage.
  - Rotate a developer's secret key (dashboard "rotate key", backed by
    `DeveloperService.rotateSecretKey`) immediately on any suspected
    compromise — leaked key, breached backup, or departing access.
  - Hashing secret keys at rest (and verifying via hash lookup) is a planned
    follow-up; until then the mitigations above are the control.
