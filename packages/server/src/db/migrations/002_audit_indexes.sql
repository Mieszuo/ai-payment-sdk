-- 002: Reservations table, action_runs audit columns, and lookup indexes.
-- Applied automatically on first `docker compose up -d db` or via `bun run db:migrate`.

-- Pending credit reservations must survive a gateway restart so that
-- settle/release can find them after the process comes back up.
CREATE TABLE IF NOT EXISTS reservations (
    run_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend the immutable run audit trail with the data the gateway records
-- (prompt hash for integrity checks, provider cost, optional provider request id).
ALTER TABLE action_runs ADD COLUMN IF NOT EXISTS prompt_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE action_runs ADD COLUMN IF NOT EXISTS cost_cents DOUBLE PRECISION;
ALTER TABLE action_runs ADD COLUMN IF NOT EXISTS provider_request_id TEXT;

-- Lookup indexes (Supabase/Postgres best practices: index every foreign-key
-- and high-cardinality filter column used by the API).
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries (account_identifier);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction ON ledger_entries (transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_reference ON ledger_transactions (reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_type ON ledger_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_action_runs_project ON action_runs (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_runs_user ON action_runs (user_id, created_at DESC);
