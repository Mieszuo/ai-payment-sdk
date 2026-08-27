-- 003: Align identifier types so foreign keys can be enforced, and add the
-- missing FK between action_runs and projects.
ALTER TABLE projects ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE projects ALTER COLUMN developer_id TYPE TEXT USING developer_id::text;
ALTER TABLE action_runs ALTER COLUMN project_id TYPE TEXT USING project_id::text;
ALTER TABLE action_runs ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- The SQL-first ledger adapter treats user ids as opaque text strings (auth
-- user ids, demo/dev ids like "usr_1"); wallets must accept them like the
-- reservations table already does.
ALTER TABLE wallets ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE ledger_entries
    ADD CONSTRAINT fk_ledger_entries_transaction
    FOREIGN KEY (transaction_id) REFERENCES ledger_transactions(id) ON DELETE CASCADE;

ALTER TABLE action_runs
    ADD CONSTRAINT fk_action_runs_project
    FOREIGN KEY (project_id) REFERENCES projects(id);
