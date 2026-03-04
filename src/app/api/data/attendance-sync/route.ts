import { NextResponse } from 'next/server';
import { loadAttendanceOnly, mergeGroupAttendanceCell, mergeSOMAttendanceCell } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/auth';

// GET — lightweight attendance-only data for polling (no roster, events, etc.)
export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await loadAttendanceOnly();
    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/data/attendance-sync error:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

// PATCH — atomic single-cell attendance update (prevents race conditions)
// Body: { type: 'group'|'som', group?, contactId, date, value }
export async function PATCH(req: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { type, group, contactId, date, value } = await req.json();

    if (type === 'group') {
      if (!group || !contactId || !date) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }
      await mergeGroupAttendanceCell(group, contactId, date, value);
    } else if (type === 'som') {
      if (!contactId || !date) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }
      await mergeSOMAttendanceCell(contactId, date, value);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/data/attendance-sync error:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
