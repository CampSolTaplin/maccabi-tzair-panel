import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SINGLETON_ID = 'singleton';

// GET /api/data — return all 4 fields
export async function GET() {
  let row = await prisma.appState.findUnique({ where: { id: SINGLETON_ID } });

  if (!row) {
    row = await prisma.appState.create({
      data: { id: SINGLETON_ID },
    });
  }

  return NextResponse.json({
    attendanceData: row.attendanceData,
    events: row.events,
    memberOverrides: row.memberOverrides,
    addedMembers: row.addedMembers,
  });
}

// PUT /api/data — update a single key
// Body: { key: "attendanceData"|"events"|"memberOverrides"|"addedMembers", value: any }
export async function PUT(req: Request) {
  const { key, value } = await req.json();

  const allowed = ['attendanceData', 'events', 'memberOverrides', 'addedMembers'] as const;
  if (!allowed.includes(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  await prisma.appState.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, [key]: value },
    update: { [key]: value },
  });

  return NextResponse.json({ ok: true });
}
