# ─────────────────────────────────────────────────────────────────────────────
# AI Payment Platform — Gateway container image
#
# Three stages:
#   deps    – install the exact dependency set from bun.lock
#   build   – typecheck the gateway sources (the same `bun run typecheck`
#             the CI/local workflow runs)
#   runtime – minimal image: node_modules + gateway packages + scripts
#             (migrate runner + retention cleanup)
#
# No `.env` is used inside the container. All configuration comes from
# environment variables injected by the platform (Fly.io secrets), see
# `.env.example` for the contract: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY,
# GEMINI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, REDIS_URL,
# REDIS_TOKEN, RESEND_API_KEY, RESEND_FROM, PORT.
# ─────────────────────────────────────────────────────────────────────────────

# ---- deps ----
FROM oven/bun:1.3 AS deps
WORKDIR /app

# Workspace manifests first so `bun install --frozen-lockfile` can resolve the
# `packages/*` and `apps/*` workspaces declared in the root package.json.
# EVERY workspace manifest must be present: bun errors out when a workspace
# glob matches a missing directory, and apps' devDependencies (e.g. typescript)
# are needed later in the build stage.
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
COPY packages/react/package.json packages/react/
COPY packages/sdk/package.json packages/sdk/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/demo/package.json apps/demo/
COPY apps/docs/package.json apps/docs/
COPY apps/landing/package.json apps/landing/
RUN bun install --frozen-lockfile

# ---- build (typecheck) ----
FROM deps AS build
# Root tsconfig compiles every .ts under the workdir, so bring in the full
# source of the workspaces the runtime needs plus the operational scripts
# (migrate runner and retention cleanup — typechecked locally by the same
# `tsc --build`). No apps/* source is required at runtime, so it is
# intentionally not copied here.
COPY tsconfig.json ./
COPY packages/shared packages/shared
COPY packages/core packages/core
COPY packages/server packages/server
COPY scripts/migrate.ts scripts/
COPY scripts/cleanup.ts scripts/
RUN bun run typecheck

# ---- runtime ----
FROM oven/bun:1.3 AS runtime
WORKDIR /app
ENV NODE_ENV=production
# node_modules from the deps stage: bun links the workspace packages
# (@ai-credits/shared, @ai-credits/core, @ai-credits/server) into /app/packages/*,
# which the copies below restore at the same paths.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
# Operational scripts for post-deploy steps: migration runner
# (fly ssh console -- 'bun run db:migrate:prod' or [deploy] release_command)
# and retention cleanup (fly machines cron / GitHub Actions cron
# running 'bun run scripts/cleanup.ts -- --days=30').
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./
EXPOSE 3000
# PORT comes from the platform env (fly.toml sets PORT=3000; server defaults to 3000).
CMD ["bun", "run", "packages/server/src/server.ts"]
