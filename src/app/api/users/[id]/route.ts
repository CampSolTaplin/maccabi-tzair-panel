import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { deleteUser } from '@/lib/db';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  if (userId === Number(session.sub)) {
    return NextResponse.json(
      { error: 'No puedes eliminar tu propia cuenta' },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteUser(userId);
    if (!deleted) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/users/[id] error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
