/**
 * Applies SQL migrations (packages/server/src/db/migrations/*.sql) to the
 * configured database, in filename order.
 *
 * Tracking: applied files are recorded in a `schema_migrations` table
 * (file TEXT PRIMARY KEY, applied_at TIMESTAMPTZ), so a re-run applies only
 * the files that are missing — migrations no longer need to be individually
 * re-runnable, and a later migration is never blocked by an earlier one
 * (e.g. 004's `ADD CONSTRAINT fk_action_runs_project` runs exactly once).
 *
 * Usage: bun run db:migrate     (requires DATABASE_URL, e.g. from .env)
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL is not set. Copy .env.example to .env and set DATABASE_URL.");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
const migrationsDir = join(import.meta.dir, "..", "packages", "server", "src", "db", "migrations");

try {
  // Tracking table: which migration files have already been applied. Created
  // unconditionally (IF NOT EXISTS) so both fresh databases and databases
  // created before this runner existed converge on the same bookkeeping.
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      file TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const appliedRows = await sql`SELECT file FROM schema_migrations`;
  const applied = new Set(appliedRows.map((r: any) => r.file));

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const pending = files.filter((f) => !applied.has(f));

  for (const file of pending) {
    const content = await readFile(join(migrationsDir, file), "utf-8");
    // Migration + tracking row commit atomically: a failed migration rolls
    // the transaction back and stays "pending" for the next run.
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`INSERT INTO schema_migrations (file) VALUES (${file})`;
    });
    console.log(`[migrate] applied ${file}`);
  }

  const skipped = files.length - pending.length;
  console.log(
    `[migrate] done — ${pending.length} applied, ${skipped} already applied (${files.length} total) to ${url.replace(/:[^:@/]+@/, ":***@")}`
  );
} finally {
  await sql.end();
}
