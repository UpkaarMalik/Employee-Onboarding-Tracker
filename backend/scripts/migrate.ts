import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Pool, PoolClient } from 'pg';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
console.log('DEBUG MIGRATIONS_DIR:', MIGRATIONS_DIR);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Neon
});

async function ensureTrackingTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(255) NOT NULL UNIQUE,
      applied_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

function listUpFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.up.sql'))
    .sort(); // filenames are timestamp-prefixed, so alphabetical = chronological
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>(
    'SELECT name FROM schema_migrations ORDER BY id',
  );
  return new Set(rows.map((r) => r.name));
}

async function up(): Promise<void> {
  await ensureTrackingTable();
  const applied = await getAppliedMigrations();
  const upFiles = listUpFiles();
  const pending = upFiles.filter((f) => !applied.has(f.replace('.up.sql', '')));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const file of pending) {
    const migrationName = file.replace('.up.sql', '');
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migrationName]);
      await client.query('COMMIT');
      console.log(`✔ Applied: ${migrationName}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✘ Failed: ${migrationName}`);
      console.error((err as Error).message);
      process.exit(1);
    } finally {
      client.release();
    }
  }
}

async function down(): Promise<void> {
  await ensureTrackingTable();
  const { rows } = await pool.query<{ name: string }>(
    'SELECT name FROM schema_migrations ORDER BY id DESC LIMIT 1',
  );

  if (rows.length === 0) {
    console.log('No migrations to roll back.');
    return;
  }

  const migrationName = rows[0].name;
  const downFile = path.join(MIGRATIONS_DIR, `${migrationName}.down.sql`);

  if (!fs.existsSync(downFile)) {
    console.error(`✘ Missing down file for: ${migrationName}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(downFile, 'utf8');
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [migrationName]);
    await client.query('COMMIT');
    console.log(`✔ Rolled back: ${migrationName}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`✘ Failed to roll back: ${migrationName}`);
    console.error((err as Error).message);
    process.exit(1);
  } finally {
    client.release();
  }
}

function create(name: string | undefined): void {
  if (!name) {
    console.error('Usage: npm run migrate:create -- <migration-name>');
    process.exit(1);
  }
  const timestamp = Date.now();
  const base = `${timestamp}_${name}`;
  fs.writeFileSync(
    path.join(MIGRATIONS_DIR, `${base}.up.sql`),
    '-- Write your UP migration here\n',
  );
  fs.writeFileSync(
    path.join(MIGRATIONS_DIR, `${base}.down.sql`),
    '-- Write your DOWN migration here\n',
  );
  console.log(`Created:\n  migrations/${base}.up.sql\n  migrations/${base}.down.sql`);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    if (command === 'up') await up();
    else if (command === 'down') await down();
    else if (command === 'create') create(arg);
    else {
      console.error('Usage: ts-node scripts/migrate.ts [up|down|create <name>]');
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main();