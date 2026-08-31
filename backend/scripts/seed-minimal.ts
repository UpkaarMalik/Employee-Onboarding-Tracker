import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});

async function seedMinimal(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1",
    );
    if (existing.length > 0) {
      console.log('Super Admin already exists — skipping minimal seed.');
      await client.query('ROLLBACK');
      return;
    }

    const { rows: deptRows } = await client.query(
      "SELECT id FROM departments WHERE code = 'ENG' LIMIT 1",
    );
    if (deptRows.length === 0) {
      throw new Error('Engineering department not found — run migrations first.');
    }
    const engineeringDeptId = deptRows[0].id;

    const passwordHash = await bcrypt.hash('SuperAdmin123!', 10);

    await client.query(
      `INSERT INTO users
        (full_name, personal_email, email, is_temp_email_active, password_hash,
         must_change_password, role, department_id, is_active)
       VALUES ($1, $2, $3, false, $4, false, 'SUPER_ADMIN', $5, true)`,
      [
        'System Super Admin',
        'superadmin.personal@example.com',
        'superadmin@company.com',
        passwordHash,
        engineeringDeptId,
      ],
    );

    await client.query('COMMIT');
    console.log('✔ Minimal seed complete.');
    console.log('  Login email:    superadmin@company.com');
    console.log('  Login password: SuperAdmin123!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✘ Minimal seed failed, rolled back:', (err as Error).message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedMinimal();