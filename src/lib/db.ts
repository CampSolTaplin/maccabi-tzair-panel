import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

// Auto-create tables on first use
let initialized = false;

async function init() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      attendance_data JSONB,
      events JSONB NOT NULL DEFAULT '[]',
      member_overrides JSONB NOT NULL DEFAULT '{}',
      added_members JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mtz_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      permissions JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Ensure default admin exists with correct password
  try {
    const hash = await bcrypt.hash('M@rjcc2026', 10);
    await pool.query(
      `INSERT INTO mtz_users (username, password_hash, display_name, role, permissions)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
      ['maccabiadmin', hash, 'Administrador', 'admin', JSON.stringify({ all: true })]
    );
    console.log('✅ Default admin user ready');
  } catch (seedErr) {
    console.error('❌ Failed to seed admin user:', seedErr);
  }

  initialized = true;
}

// ── App State ──

export async function loadAll() {
  await init();
  const { rows } = await pool.query(
    `SELECT * FROM app_state WHERE id = 'singleton'`
  );
  if (rows.length === 0) {
    return {
      attendanceData: null,
      events: [],
      memberOverrides: {},
      addedMembers: [],
    };
  }
  const row = rows[0];
  return {
    attendanceData: row.attendance_data,
    events: row.events,
    memberOverrides: row.member_overrides,
    addedMembers: row.added_members,
  };
}

const COLUMN_MAP: Record<string, string> = {
  attendanceData: 'attendance_data',
  events: 'events',
  memberOverrides: 'member_overrides',
  addedMembers: 'added_members',
};

export async function saveKey(key: string, value: unknown) {
  await init();
  const col = COLUMN_MAP[key];
  if (!col) throw new Error(`Invalid key: ${key}`);

  await pool.query(
    `INSERT INTO app_state (id, ${col}, updated_at)
     VALUES ('singleton', $1, NOW())
     ON CONFLICT (id) DO UPDATE SET ${col} = $1, updated_at = NOW()`,
    [JSON.stringify(value)]
  );
}

// ── Users ──

export async function findUserByUsername(username: string) {
  await init();
  const { rows } = await pool.query('SELECT * FROM mtz_users WHERE username = $1', [username]);
  return rows[0] || null;
}

export async function findUserById(id: number) {
  await init();
  const { rows } = await pool.query(
    'SELECT id, username, display_name, role, permissions, created_at, updated_at FROM mtz_users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function listUsers() {
  await init();
  const { rows } = await pool.query(
    'SELECT id, username, display_name, role, permissions, created_at, updated_at FROM mtz_users ORDER BY created_at ASC'
  );
  return rows;
}

export async function createUser(username: string, passwordHash: string, displayName: string, role: string) {
  await init();
  const { rows } = await pool.query(
    `INSERT INTO mtz_users (username, password_hash, display_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, display_name, role, created_at`,
    [username, passwordHash, displayName, role]
  );
  return rows[0];
}

export async function deleteUser(id: number) {
  await init();
  const { rowCount } = await pool.query('DELETE FROM mtz_users WHERE id = $1', [id]);
  return rowCount != null && rowCount > 0;
}
