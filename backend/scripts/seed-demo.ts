import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const BASE_URL = process.env.SEED_BASE_URL || 'http://localhost:3000';
const DEMO_PASSWORD = 'Demo@12345';
const GALLERY_DIR = process.env.SEED_GALLERY_DIR;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

interface ApiOpts {
  method?: string;
  token?: string;
  body?: unknown;
  isForm?: boolean;
}

async function api(pathName: string, opts: ApiOpts = {}) {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: any = undefined;
  if (opts.body !== undefined) {
    if (opts.isForm) {
      body = opts.body;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }
  }
  const res = await fetch(`${BASE_URL}${pathName}`, { method: opts.method || 'GET', headers, body });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${pathName} -> ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function login(identifier: string, password: string): Promise<string> {
  const data = await api('/auth/login', { method: 'POST', body: { identifier, password } });
  return data.accessToken;
}

async function getExistingUserIds(): Promise<string[]> {
  const { rows } = await pool.query<{ id: string }>('SELECT id FROM users');
  return rows.map((r) => r.id);
}

async function wipeOldUsers(oldUserIds: string[], newSuperAdminId: string) {
  console.log('Wiping previous demo data...');
  // Several FKs to users are ON DELETE RESTRICT (not NO ACTION), which
  // Postgres checks immediately rather than waiting for same-statement
  // cascades to resolve first — so explicitly clear the dependency chain
  // in order instead of relying on cascade timing.
  await pool.query('DELETE FROM audit_logs');
  await pool.query('DELETE FROM content_gallery');
  await pool.query('DELETE FROM poll_votes');
  await pool.query('DELETE FROM poll_options');
  await pool.query('DELETE FROM polls');
  await pool.query('DELETE FROM post_reactions');
  await pool.query('DELETE FROM posts');
  await pool.query('DELETE FROM notifications');
  await pool.query('DELETE FROM private_notes');
  await pool.query('DELETE FROM task_status_history');
  await pool.query('DELETE FROM tasks');
  await pool.query('DELETE FROM onboarding_instances');
  // onboarding_templates.created_by is ON DELETE RESTRICT — repoint to the
  // new Super Admin before removing whoever created them originally (the
  // templates themselves are catalog data and stay).
  await pool.query('UPDATE onboarding_templates SET created_by = $1', [newSuperAdminId]);
  if (oldUserIds.length > 0) {
    await pool.query('DELETE FROM users WHERE id = ANY($1)', [oldUserIds]);
  }
}

async function fixTemplateLinks() {
  console.log('Fixing template <-> department links...');
  const { rows: depts } = await pool.query<{ id: string; code: string }>('SELECT id, code FROM departments');
  const finance = depts.find((d) => d.code === 'FIN')!;
  await pool.query('UPDATE onboarding_templates SET department_id = $1 WHERE name = $2', [
    finance.id,
    'Finance Onboarding Template',
  ]);
  await pool.query("UPDATE onboarding_templates SET is_active = true WHERE name = 'Sales Onboarding Template'");
}

interface AdminSeed {
  full_name: string;
  personal_email: string;
  email: string;
  role: 'SUPER_ADMIN' | 'HR' | 'ADMIN';
  department_code: string;
  mobile: string;
  dob: string;
  address: string;
  joining_date: string;
}

async function insertAdminUser(deptByCode: Record<string, string>, seed: AdminSeed): Promise<string> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO users
      (full_name, personal_email, email, is_temp_email_active, password_hash,
       must_change_password, role, department_id, mobile, dob, address, joining_date, is_active)
     VALUES ($1,$2,$3,false,$4,false,$5,$6,$7,$8,$9,$10,true)
     RETURNING id`,
    [
      seed.full_name,
      seed.personal_email,
      seed.email,
      passwordHash,
      seed.role,
      deptByCode[seed.department_code],
      seed.mobile,
      seed.dob,
      seed.address,
      seed.joining_date,
    ],
  );
  return rows[0].id;
}

interface EmployeePlan {
  department_code: string;
  full_name: string;
  joining_date: string;
  outcome: 'completed' | 'in_progress' | 'not_onboarded';
}

const EMPLOYEE_PLAN: EmployeePlan[] = [
  { department_code: 'ENG', full_name: 'Priya Nair', joining_date: '2026-06-10', outcome: 'completed' },
  { department_code: 'ENG', full_name: 'Karan Malhotra', joining_date: '2026-08-05', outcome: 'in_progress' },
  { department_code: 'ENG', full_name: 'Simran Chawla', joining_date: '2026-08-25', outcome: 'not_onboarded' },

  { department_code: 'SALES', full_name: 'Arjun Reddy', joining_date: '2026-05-20', outcome: 'completed' },
  { department_code: 'SALES', full_name: 'Divya Iyer', joining_date: '2026-07-18', outcome: 'in_progress' },
  { department_code: 'SALES', full_name: 'Aman Bhatia', joining_date: '2026-08-28', outcome: 'not_onboarded' },

  { department_code: 'MKT_OPS', full_name: 'Meera Pillai', joining_date: '2026-06-01', outcome: 'completed' },
  { department_code: 'MKT_OPS', full_name: 'Rahul Deshmukh', joining_date: '2026-07-25', outcome: 'in_progress' },
  { department_code: 'MKT_OPS', full_name: 'Tanvi Joshi', joining_date: '2026-08-22', outcome: 'not_onboarded' },

  { department_code: 'FIN', full_name: 'Sanjay Kulkarni', joining_date: '2026-05-15', outcome: 'completed' },
  { department_code: 'FIN', full_name: 'Neha Agarwal', joining_date: '2026-07-10', outcome: 'in_progress' },
  { department_code: 'FIN', full_name: 'Vikas Choudhary', joining_date: '2026-08-30', outcome: 'not_onboarded' },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, '.');
}

async function seedAdmins(deptByCode: Record<string, string>) {
  console.log('Seeding Super Admin, HR, and one Department Admin per department...');

  const superAdminId = await insertAdminUser(deptByCode, {
    full_name: 'Ananya Rao',
    personal_email: 'ananya.rao.personal@example.com',
    email: 'ananya.rao@company.com',
    role: 'SUPER_ADMIN',
    department_code: 'ENG',
    mobile: '+91 98200 11223',
    dob: '1987-03-18',
    address: '14 Lakeview Residency, Indiranagar, Bengaluru, Karnataka 560038',
    joining_date: '2023-01-10',
  });

  const hrId = await insertAdminUser(deptByCode, {
    full_name: 'Kavya Menon',
    personal_email: 'kavya.menon.personal@example.com',
    email: 'kavya.menon@company.com',
    role: 'HR',
    department_code: 'ENG',
    mobile: '+91 98450 22334',
    dob: '1990-07-22',
    address: '22 Palm Meadows, Whitefield, Bengaluru, Karnataka 560066',
    joining_date: '2023-03-05',
  });

  const adminSeeds: AdminSeed[] = [
    {
      full_name: 'Rohan Verma', personal_email: 'rohan.verma.personal@example.com', email: 'rohan.verma@company.com',
      role: 'ADMIN', department_code: 'ENG', mobile: '+91 99000 33445', dob: '1985-11-02',
      address: '7 Cambridge Layout, Ulsoor, Bengaluru, Karnataka 560008', joining_date: '2022-09-12',
    },
    {
      full_name: 'Neha Kapoor', personal_email: 'neha.kapoor.personal@example.com', email: 'neha.kapoor@company.com',
      role: 'ADMIN', department_code: 'SALES', mobile: '+91 99110 44556', dob: '1986-02-14',
      address: '45 Marine Drive Apartments, Mumbai, Maharashtra 400020', joining_date: '2022-11-01',
    },
    {
      full_name: 'Aditya Shah', personal_email: 'aditya.shah.personal@example.com', email: 'aditya.shah@company.com',
      role: 'ADMIN', department_code: 'MKT_OPS', mobile: '+91 99220 55667', dob: '1988-06-30',
      address: '9 Satellite Road, Ahmedabad, Gujarat 380015', joining_date: '2023-02-20',
    },
    {
      full_name: 'Ishaan Gupta', personal_email: 'ishaan.gupta.personal@example.com', email: 'ishaan.gupta@company.com',
      role: 'ADMIN', department_code: 'FIN', mobile: '+91 99330 66778', dob: '1984-09-09',
      address: '18 Golf Course Road, Gurugram, Haryana 122002', joining_date: '2022-07-18',
    },
  ];

  const deptAdminId: Record<string, string> = {};
  for (const seed of adminSeeds) {
    deptAdminId[seed.department_code] = await insertAdminUser(deptByCode, seed);
  }

  return { superAdminId, hrId, deptAdminId };
}

async function walkTasks(instanceTasks: any[], outcome: EmployeePlan['outcome'], empToken: string, deptAdminToken: string, empSlug: string) {
  const sorted = instanceTasks.slice().sort((a, b) => a.order_index - b.order_index);
  const required = sorted.filter((t) => t.is_required);
  const walkCount = outcome === 'completed'
    ? sorted.length
    : Math.min(sorted.length, Math.ceil(required.length * 0.45));

  for (let i = 0; i < walkCount; i++) {
    const task = sorted[i];
    const actorToken = task.owner_type === 'EMPLOYEE' ? empToken : deptAdminToken;

    if (task.task_type === 'READING') {
      // activeSeconds is capped at 60 per call — five 60s heartbeats reach
      // the 300s completion threshold.
      for (let h = 0; h < 5; h++) {
        await api(`/reading/${task.id}/heartbeat`, { method: 'POST', token: actorToken, body: { activeSeconds: 60 } });
      }
      continue;
    }

    if (task.title === 'Complete Personal Details') {
      // Completed via the dedicated endpoint, which marks this task done as a side effect.
      await api('/users/me/complete-profile', {
        method: 'PATCH',
        token: actorToken,
        body: { mobile: '+91 90000 00000', dob: '1996-01-15', address: 'Employee-submitted address, Bengaluru' },
      });
      continue;
    }

    await api(`/tasks/${task.id}/start`, { method: 'PATCH', token: actorToken, body: {} });
    const body = task.title === 'Company Email ID Issuance' ? { official_email: `${empSlug}@company.com` } : {};
    await api(`/tasks/${task.id}/complete`, { method: 'PATCH', token: actorToken, body });
  }
}

async function seedEmployees(deptByCode: Record<string, string>, hrToken: string, deptAdminToken: Record<string, string>) {
  console.log('Seeding employees...');
  for (const plan of EMPLOYEE_PLAN) {
    const slug = slugify(plan.full_name);
    console.log(`  - ${plan.full_name} (${plan.department_code}, ${plan.outcome})`);

    const created = await api('/users', {
      method: 'POST',
      token: hrToken,
      body: {
        full_name: plan.full_name,
        personal_email: `${slug}.personal@example.com`,
        department_id: deptByCode[plan.department_code],
        joining_date: plan.joining_date,
      },
    });

    // Seed-only: reset the randomly-generated temp password to a known one so
    // this script can log in as the employee to walk their own tasks.
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await pool.query('UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2', [
      passwordHash,
      created.id,
    ]);

    if (plan.outcome === 'not_onboarded') continue;

    const instance = await api('/onboarding/instances', {
      method: 'POST',
      token: hrToken,
      body: { employee_id: created.id },
    });

    const empToken = await login(created.temp_email, DEMO_PASSWORD);
    await walkTasks(instance.tasks, plan.outcome, empToken, deptAdminToken[plan.department_code], slug);
  }
}

async function seedGallery(hrToken: string) {
  if (!GALLERY_DIR || !fs.existsSync(GALLERY_DIR)) {
    console.log('Skipping content gallery — SEED_GALLERY_DIR not set or not found.');
    return;
  }
  console.log('Uploading content gallery images...');

  const items: { file: string; type: 'COMPANY_FAMILY' | 'SPORTS'; title: string; description: string }[] = [
    { file: 'team-offsite.svg', type: 'COMPANY_FAMILY', title: 'Team Offsite 2026', description: 'The whole crew getting away from their desks for a weekend.' },
    { file: 'annual-day.svg', type: 'COMPANY_FAMILY', title: 'Annual Day Celebrations', description: 'Recognizing a year of milestones together.' },
    { file: 'office-space.svg', type: 'COMPANY_FAMILY', title: 'Our New Office Space', description: 'A peek at where the team works every day.' },
    { file: 'cricket-tournament.svg', type: 'SPORTS', title: 'Inter-Department Cricket Tournament', description: 'Engineering vs. Sales — closest final in years.' },
    { file: 'badminton-league.svg', type: 'SPORTS', title: 'Badminton League Finals', description: 'Weekly badminton league wrapped up with a finals night.' },
  ];

  for (const item of items) {
    const filePath = path.join(GALLERY_DIR, item.file);
    const fileBuffer = fs.readFileSync(filePath);

    // Supabase Storage isn't actually configured in this project (.env still
    // has the .env.example placeholder URL/key), so a real upload would fail
    // with a network error. Falling back to an inline data: URI — visually
    // identical for the demo. Once real SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
    // are set, swap this for the commented-out real upload path below.
    const imageUrl = `data:image/svg+xml;base64,${fileBuffer.toString('base64')}`;

    // const form = new FormData();
    // form.append('file', new Blob([fileBuffer], { type: 'image/svg+xml' }), item.file);
    // const uploadRes = await api('/uploads/content-gallery', { method: 'POST', token: hrToken, body: form, isForm: true });
    // const imageUrl = uploadRes.url;

    await api('/content-gallery', {
      method: 'POST',
      token: hrToken,
      body: { type: item.type, title: item.title, description: item.description, image_url: imageUrl },
    });
    console.log(`  - seeded ${item.file}`);
  }
}

async function main() {
  const oldUserIds = await getExistingUserIds();

  const { rows: depts } = await pool.query<{ id: string; code: string }>('SELECT id, code FROM departments');
  const deptByCode = Object.fromEntries(depts.map((d) => [d.code, d.id]));

  const { hrId, deptAdminId, superAdminId } = await seedAdmins(deptByCode);

  await wipeOldUsers(oldUserIds, superAdminId);
  await fixTemplateLinks();

  const hrToken = await login('kavya.menon@company.com', DEMO_PASSWORD);
  const deptAdminToken: Record<string, string> = {};
  const adminEmails: Record<string, string> = {
    ENG: 'rohan.verma@company.com',
    SALES: 'neha.kapoor@company.com',
    MKT_OPS: 'aditya.shah@company.com',
    FIN: 'ishaan.gupta@company.com',
  };
  for (const [code, email] of Object.entries(adminEmails)) {
    deptAdminToken[code] = await login(email, DEMO_PASSWORD);
  }

  await seedEmployees(deptByCode, hrToken, deptAdminToken);
  await seedGallery(hrToken);

  console.log('\n✔ Demo seed complete.');
  console.log(`  Super Admin: ananya.rao@company.com / ${DEMO_PASSWORD}`);
  console.log(`  HR:          kavya.menon@company.com / ${DEMO_PASSWORD}`);
  console.log(`  Dept Admins: ${Object.values(adminEmails).join(', ')} / ${DEMO_PASSWORD}`);
  console.log(`  Employees:   <firstname>.<lastname>.personal@example.com's temp_email, or check DB / ${DEMO_PASSWORD}`);

  await pool.end();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await pool.end();
  process.exit(1);
});
