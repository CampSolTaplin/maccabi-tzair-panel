import { NextResponse } from 'next/server';
import { loadAll, saveKey } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/auth';

// GET /api/data — return all 4 fields
export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await loadAll();
    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/data error:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

// PUT /api/data — update a single key
// Body: { key: "attendanceData"|"events"|"memberOverrides"|"addedMembers", value: any }
export async function PUT(req: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { key, value } = await req.json();

    const allowed = ['attendanceData', 'events', 'memberOverrides', 'addedMembers', 'enabledDates', 'rosterData', 'groupAttendance'];
    if (!allowed.includes(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    await saveKey(key, value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/data error:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
