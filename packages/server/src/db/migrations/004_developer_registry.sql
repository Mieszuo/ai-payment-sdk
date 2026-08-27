-- 004: Developer registry persistence.
CREATE TABLE IF NOT EXISTS developer_projects (
    project_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    public_key TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL UNIQUE,
    allowed_domains TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developer_action_versions (
    project_id TEXT NOT NULL,
    action_name TEXT NOT NULL,
    version INTEGER NOT NULL,
    model TEXT NOT NULL,
    price_credits INTEGER NOT NULL,
    max_provider_cost_cents INTEGER NOT NULL DEFAULT 10,
    max_output_tokens INTEGER NOT NULL DEFAULT 1000,
    output_format TEXT NOT NULL DEFAULT 'json',
    system_prompt TEXT NOT NULL DEFAULT '',
    user_prompt_template TEXT NOT NULL DEFAULT '',
    input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    rate_limit JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id, action_name, version)
);

-- Projects now persist, so the run-audit FK from 003 can be enforced.
ALTER TABLE action_runs
    ADD CONSTRAINT fk_action_runs_project
    FOREIGN KEY (project_id) REFERENCES developer_projects(project_id);
