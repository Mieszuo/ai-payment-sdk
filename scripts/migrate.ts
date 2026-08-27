/**
 * Applies SQL migrations (packages/server/src/db/migrations/*.sql) to the
 * configured database, in filename order.
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
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const content = await readFile(join(migrationsDir, file), "utf-8");
    await sql.unsafe(content);
    console.log(`[migrate] applied ${file}`);
  }

  console.log(`[migrate] done — ${files.length} migration${files.length === 1 ? "" : "s"} applied to ${url.replace(/:[^:@/]+@/, ":***@")}`);
} finally {
  await sql.end();
}
