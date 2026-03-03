import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromCookie } from '@/lib/auth';
import { listUsers, createUser } from '@/lib/db';

async function requireAdmin() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { username, password, displayName, role } = await req.json();

    if (!username || !password || !displayName) {
      return NextResponse.json(
        { error: 'Campos requeridos: usuario, contraseña, nombre' },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await createUser(username, hash, displayName, role || 'admin');
    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
    }
    console.error('POST /api/users error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
