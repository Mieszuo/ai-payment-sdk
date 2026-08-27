/**
 * Retention cleanup: deletes completed action runs and stale reservations
 * older than `--days` (default 30). Safe to run nightly via cron.
 *
 * Usage: bun run cleanup -- --days=30   (requires DATABASE_URL, e.g. from .env)
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[cleanup] DATABASE_URL is not set.");
  process.exit(1);
}

const days = Number(process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] ?? 30);
const sql = postgres(url, { max: 1 });

try {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const runs = await sql`
    DELETE FROM action_runs WHERE status IN ('SUCCEEDED', 'FAILED', 'CANCELLED') AND completed_at < ${cutoff} RETURNING id
  `;
  const reservations = await sql`
    DELETE FROM reservations WHERE created_at < ${cutoff} RETURNING run_id
  `;
  console.log(`[cleanup] deleted ${runs.length} completed runs and ${reservations.length} stale reservations older than ${days} days`);
} finally {
  await sql.end();
}
