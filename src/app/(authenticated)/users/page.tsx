'use client';

import { useState, useEffect, useCallback } from 'react';
import Topbar from '@/components/layout/Topbar';
import { Shield, Plus, Trash2, X, AlertCircle, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface UserRow {
  id: number;
  username: string;
  display_name: string;
  role: string;
  group_name: string | null;
  created_at: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDeleting(null);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <>
        <Topbar title="Usuarios" subtitle="Gestión de usuarios del sistema" />
        <div className="p-7">
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
            <Shield className="w-12 h-12 text-[#D0CCC4] mx-auto mb-3" />
            <p className="text-[#5A6472] font-medium">No tienes permisos para ver esta sección</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Usuarios" subtitle="Gestión de usuarios del sistema" />
      <div className="p-7 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#D8E1EA]">
            <h3 className="text-base font-semibold text-[#1B2A6B] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#E8687D]" /> Usuarios del Sistema
            </h3>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B2A6B] text-white text-xs font-medium hover:bg-[#2A3D8F] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Usuario
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#1B2A6B]/20 border-t-[#1B2A6B] rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-[#5A6472] py-8">No hay usuarios registrados</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D8E1EA]">
                  <th className="text-left py-2.5 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-[#5A6472]">Usuario</th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-[#5A6472]">Nombre</th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-[#5A6472]">Rol</th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-[#5A6472]">Creado</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-[#D8E1EA]/50 last:border-0 hover:bg-[#F8F7F5] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-[#1B2A6B]/30" />
                        <span className="font-medium text-[#1B2A6B]">{u.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#5A6472]">{u.display_name}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-[#1B2A6B]/10 text-[#1B2A6B]'
                          : u.role === 'madrich'
                          ? 'bg-[#2D8B4E]/10 text-[#2D8B4E]'
                          : 'bg-[#D8E1EA]/50 text-[#5A6472]'
                      }`}>
                        {u.role}{u.group_name ? ` · ${u.group_name}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#5A6472] text-xs">
                      {new Date(u.created_at).toLocaleDateString('es')}
                    </td>
                    <td className="py-3 px-3">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deleting === u.id}
                          className="p-1.5 rounded-lg text-[#C0392B]/50 hover:text-[#C0392B] hover:bg-[#C0392B]/10 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && <CreateUserModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); fetchUsers(); }} />}
    </>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('admin');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'madrich' && !groupName.trim()) {
      setError('El grupo es requerido para usuarios Madrich');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          displayName,
          role,
          ...(role === 'madrich' ? { groupName: groupName.trim() } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear usuario');
        return;
      }

      onCreated();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-serif font-bold text-[#1B2A6B]">Nuevo Usuario</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F2F0EC] transition-colors">
            <X className="w-5 h-5 text-[#5A6472]" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-lg bg-red-50 text-[#C0392B] text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1.5">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="usuario123"
              className="w-full px-4 py-2.5 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1.5">
              Nombre para mostrar
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2.5 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="contraseña segura"
              className="w-full px-4 py-2.5 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1.5">
              Rol
            </label>
            <select
              value={role}
              onChange={e => { setRole(e.target.value); if (e.target.value !== 'madrich') setGroupName(''); }}
              className="w-full px-4 py-2.5 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10 bg-white"
            >
              <option value="admin">Admin</option>
              <option value="madrich">Madrich</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {role === 'madrich' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1.5">
                Grupo
              </label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="SOM"
                className="w-full px-4 py-2.5 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
                required
              />
              <p className="mt-1 text-xs text-[#5A6472]">
                Nombre del grupo que este madrich podrá gestionar (ej: SOM)
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#D8E1EA] text-sm font-medium text-[#5A6472] hover:bg-[#F2F0EC] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-colors disabled:opacity-50"
            >
              {saving ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
