import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByUsername, ensureMadrichUser } from '@/lib/db';
import { createToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    let user = await findUserByUsername(username);

    // If user not found and it's a known madrich email, try to seed it
    if (!user && username.endsWith('@marjcc.org')) {
      await ensureMadrichUser(username);
      user = await findUserByUsername(username);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const token = await createToken({
      sub: String(user.id),
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      group: user.group_name || undefined,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
