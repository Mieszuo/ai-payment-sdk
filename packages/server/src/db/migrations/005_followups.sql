-- 005: Persist the deferred action-version fields (final-review follow-up).
-- developer_action_versions gains fallback_model / output_schema so a published
-- action's fallback provider and output JSON shape survive gateway restarts.
-- The migration runner (scripts/migrate.ts) tracks applied files in
-- schema_migrations, so these ALTERs (which are also individually
-- re-runnable via IF NOT EXISTS) apply exactly once per database.
ALTER TABLE developer_action_versions ADD COLUMN IF NOT EXISTS fallback_model TEXT;
ALTER TABLE developer_action_versions ADD COLUMN IF NOT EXISTS output_schema JSONB;
