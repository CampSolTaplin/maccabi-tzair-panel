import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

// Auto-create table on first use
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
  initialized = true;
}

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
