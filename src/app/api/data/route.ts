import { NextResponse } from 'next/server';
import { loadAll, saveKey } from '@/lib/db';

// GET /api/data — return all 4 fields
export async function GET() {
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
  try {
    const { key, value } = await req.json();

    const allowed = ['attendanceData', 'events', 'memberOverrides', 'addedMembers'];
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
