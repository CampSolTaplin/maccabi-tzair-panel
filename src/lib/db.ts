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
      enabled_dates JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Add columns if missing (existing databases)
  await pool.query(`
    ALTER TABLE app_state ADD COLUMN IF NOT EXISTS enabled_dates JSONB NOT NULL DEFAULT '[]'
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE app_state ADD COLUMN IF NOT EXISTS roster_data JSONB
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE app_state ADD COLUMN IF NOT EXISTS group_attendance JSONB NOT NULL DEFAULT '{}'
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE app_state ADD COLUMN IF NOT EXISTS enabled_date_groups JSONB NOT NULL DEFAULT '{}'
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE app_state ADD COLUMN IF NOT EXISTS no_session_dates JSONB NOT NULL DEFAULT '[]'
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE app_state ADD COLUMN IF NOT EXISTS member_photos JSONB NOT NULL DEFAULT '{}'
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE app_state ADD COLUMN IF NOT EXISTS member_notes JSONB NOT NULL DEFAULT '{}'
  `).catch(() => {});

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

  // Add group_name column if missing (existing databases)
  await pool.query(`
    ALTER TABLE mtz_users ADD COLUMN IF NOT EXISTS group_name TEXT
  `).catch(() => {});

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

  // Seed madrich users for ALL sub-groups (one per grade level)
  const madrichGroups = [
    // Katan area
    { username: 'kinder@marjcc.org', display: 'Madrichim Kinder', group: 'Kinder' },
    { username: '1stgrade@marjcc.org', display: 'Madrichim 1st Grade', group: '1st Grade' },
    { username: '2ndgrade@marjcc.org', display: 'Madrichim 2nd Grade', group: '2nd Grade' },
    { username: '3rdgrade@marjcc.org', display: 'Madrichim 3rd Grade', group: '3rd Grade' },
    { username: '4thgrade@marjcc.org', display: 'Madrichim 4th Grade', group: '4th Grade' },
    { username: '5thgrade@marjcc.org', display: 'Madrichim 5th Grade', group: '5th Grade' },
    // Noar area
    { username: '6thgrade@marjcc.org', display: 'Madrichim 6th Grade', group: '6th Grade' },
    { username: '7thgrade@marjcc.org', display: 'Madrichim 7th Grade', group: '7th Grade' },
    { username: '8thgrade@marjcc.org', display: 'Madrichim 8th Grade', group: '8th Grade' },
    // Leadership area
    { username: 'presom@marjcc.org', display: 'Madrichim Pre-SOM', group: 'Pre-SOM' },
    { username: 'som@marjcc.org', display: 'Madrichim SOM', group: 'SOM' },
    // Special Events
    { username: 'trips@marjcc.org', display: 'Madrichim Trips', group: 'Trips' },
    { username: 'machanot@marjcc.org', display: 'Madrichim Machanot', group: 'Machanot' },
  ];
  try {
    const hash = await bcrypt.hash('M@rjcc2026', 10);
    for (const mg of madrichGroups) {
      await pool.query(
        `INSERT INTO mtz_users (username, password_hash, display_name, role, permissions, group_name)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO UPDATE SET password_hash = $2, group_name = $6`,
        [mg.username, hash, mg.display, 'madrich', JSON.stringify({ group: mg.group }), mg.group]
      );
    }
    console.log('✅ All madrich users ready');
  } catch (seedErr) {
    console.error('❌ Failed to seed madrich users:', seedErr);
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
      enabledDates: [],
      enabledDateGroups: {},
      rosterData: null,
      groupAttendance: {},
      noSessionDates: [],
      memberPhotos: {},
      memberNotes: {},
    };
  }
  const row = rows[0];
  return {
    attendanceData: row.attendance_data,
    events: row.events,
    memberOverrides: row.member_overrides,
    addedMembers: row.added_members,
    enabledDates: row.enabled_dates || [],
    enabledDateGroups: row.enabled_date_groups || {},
    rosterData: row.roster_data || null,
    groupAttendance: row.group_attendance || {},
    noSessionDates: row.no_session_dates || [],
    memberPhotos: row.member_photos || {},
    memberNotes: row.member_notes || {},
  };
}

const COLUMN_MAP: Record<string, string> = {
  attendanceData: 'attendance_data',
  events: 'events',
  memberOverrides: 'member_overrides',
  addedMembers: 'added_members',
  enabledDates: 'enabled_dates',
  enabledDateGroups: 'enabled_date_groups',
  rosterData: 'roster_data',
  groupAttendance: 'group_attendance',
  noSessionDates: 'no_session_dates',
  memberPhotos: 'member_photos',
  memberNotes: 'member_notes',
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

// ── Atomic attendance cell merge (prevents race conditions with concurrent writers) ──

export async function mergeGroupAttendanceCell(group: string, contactId: string, date: string, value: unknown) {
  await init();
  await pool.query(
    `INSERT INTO app_state (id, group_attendance, updated_at)
     VALUES ('singleton',
       jsonb_build_object($1::text, jsonb_build_object($2::text, jsonb_build_object($3::text, $4::jsonb))),
       NOW()
     )
     ON CONFLICT (id) DO UPDATE SET
       group_attendance =
         COALESCE(app_state.group_attendance, '{}') ||
         jsonb_build_object($1::text,
           COALESCE(app_state.group_attendance->$1, '{}') ||
           jsonb_build_object($2::text,
             COALESCE(app_state.group_attendance->$1->$2, '{}') ||
             jsonb_build_object($3::text, $4::jsonb)
           )
         ),
       updated_at = NOW()`,
    [group, contactId, date, JSON.stringify(value)]
  );
}

export async function mergeSOMAttendanceCell(contactId: string, date: string, value: unknown) {
  await init();
  await pool.query(
    `UPDATE app_state SET
       attendance_data = jsonb_set(
         COALESCE(attendance_data, '{"members":[],"records":{},"dates":[],"months":[]}'),
         '{records}',
         COALESCE(attendance_data->'records', '{}') ||
         jsonb_build_object($1::text,
           COALESCE(attendance_data->'records'->$1, '{}') ||
           jsonb_build_object($2::text, $3::jsonb)
         )
       ),
       updated_at = NOW()
     WHERE id = 'singleton'`,
    [contactId, date, JSON.stringify(value)]
  );
}

export async function loadAttendanceOnly() {
  await init();
  const { rows } = await pool.query(
    `SELECT group_attendance, attendance_data->'records' as attendance_records
     FROM app_state WHERE id = 'singleton'`
  );
  if (rows.length === 0) return { groupAttendance: {}, attendanceRecords: {} };
  return {
    groupAttendance: rows[0].group_attendance || {},
    attendanceRecords: rows[0].attendance_records || {},
  };
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
    'SELECT id, username, display_name, role, permissions, group_name, created_at, updated_at FROM mtz_users ORDER BY created_at ASC'
  );
  return rows;
}

export async function createUser(username: string, passwordHash: string, displayName: string, role: string, groupName?: string) {
  await init();
  const { rows } = await pool.query(
    `INSERT INTO mtz_users (username, password_hash, display_name, role, group_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, display_name, role, group_name, created_at`,
    [username, passwordHash, displayName, role, groupName || null]
  );
  return rows[0];
}

export async function deleteUser(id: number) {
  await init();
  const { rowCount } = await pool.query('DELETE FROM mtz_users WHERE id = $1', [id]);
  return rowCount != null && rowCount > 0;
}

/** Map of madrich usernames to their group config (per sub-group/grade) */
const MADRICH_ACCOUNTS: Record<string, { display: string; group: string }> = {
  // Katan
  'kinder@marjcc.org': { display: 'Madrichim Kinder', group: 'Kinder' },
  '1stgrade@marjcc.org': { display: 'Madrichim 1st Grade', group: '1st Grade' },
  '2ndgrade@marjcc.org': { display: 'Madrichim 2nd Grade', group: '2nd Grade' },
  '3rdgrade@marjcc.org': { display: 'Madrichim 3rd Grade', group: '3rd Grade' },
  '4thgrade@marjcc.org': { display: 'Madrichim 4th Grade', group: '4th Grade' },
  '5thgrade@marjcc.org': { display: 'Madrichim 5th Grade', group: '5th Grade' },
  // Noar
  '6thgrade@marjcc.org': { display: 'Madrichim 6th Grade', group: '6th Grade' },
  '7thgrade@marjcc.org': { display: 'Madrichim 7th Grade', group: '7th Grade' },
  '8thgrade@marjcc.org': { display: 'Madrichim 8th Grade', group: '8th Grade' },
  // Leadership
  'presom@marjcc.org': { display: 'Madrichim Pre-SOM', group: 'Pre-SOM' },
  'som@marjcc.org': { display: 'Madrichim SOM', group: 'SOM' },
  // Special Events
  'trips@marjcc.org': { display: 'Madrichim Trips', group: 'Trips' },
  'machanot@marjcc.org': { display: 'Madrichim Machanot', group: 'Machanot' },
};

/**
 * Ensure a madrich user exists. Called on-demand if user not found during login.
 * Handles all known madrich accounts (katan, noar, presom, som, trips, machanot).
 */
export async function ensureMadrichUser(username: string) {
  const config = MADRICH_ACCOUNTS[username];
  if (!config) return false;

  try {
    await pool.query('ALTER TABLE mtz_users ADD COLUMN IF NOT EXISTS group_name TEXT').catch(() => {});
    await pool.query("ALTER TABLE app_state ADD COLUMN IF NOT EXISTS enabled_dates JSONB NOT NULL DEFAULT '[]'").catch(() => {});
    await pool.query("ALTER TABLE app_state ADD COLUMN IF NOT EXISTS group_attendance JSONB NOT NULL DEFAULT '{}'").catch(() => {});

    const hash = await bcrypt.hash('M@rjcc2026', 10);
    await pool.query(
      `INSERT INTO mtz_users (username, password_hash, display_name, role, permissions, group_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2, role = $4, permissions = $5, group_name = $6`,
      [username, hash, config.display, 'madrich', JSON.stringify({ group: config.group }), config.group]
    );
    console.log(`✅ Madrich user ${username} ensured`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to ensure madrich user ${username}:`, err);
    return false;
  }
}
