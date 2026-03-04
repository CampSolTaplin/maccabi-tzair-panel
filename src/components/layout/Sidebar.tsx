'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  HandHeart,
  CalendarDays,
  Settings,
  ChevronLeft,
  Shield,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { section: 'Maccabi Tzair' },
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attendance', label: 'Asistencia', icon: ClipboardCheck },
  { href: '/events', label: 'Eventos', icon: CalendarDays },
  { href: '/hours', label: 'Horas Comunitarias', icon: HandHeart },
  { href: '/roster', label: 'Rosters', icon: Users },
  { section: 'Sistema' },
  { href: '/settings', label: 'Configuración', icon: Settings },
  { href: '/users', label: 'Usuarios', icon: Shield, adminOnly: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav
      className={cn(
        'fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[#1B2A6B] transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3.5 border-b border-white/[0.08] px-5 py-5 min-h-[80px]">
        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white/90 p-1 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/maccabi-logo.png"
            alt="Maccabi Tzair Miami"
            className="w-full h-full object-contain"
          />
        </div>
        <div
          className={cn(
            'whitespace-nowrap overflow-hidden transition-opacity duration-300',
            collapsed && 'opacity-0 pointer-events-none'
          )}
        >
          <h1 className="font-serif text-[1.1rem] font-bold text-[#C5E3F6] leading-tight tracking-wide">
            Maccabi Tzair
          </h1>
          <span className="text-[0.7rem] text-white/40 uppercase tracking-[0.12em] font-medium">
            Maccabi Tzair Miami
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 py-4 px-2.5 overflow-y-auto">
        {navItems.map((item, i) => {
          if ('section' in item && item.section) {
            return (
              <div
                key={`section-${i}`}
                className={cn(
                  'text-[0.65rem] uppercase tracking-[0.14em] text-white/25 px-3 pt-3 pb-1.5 font-semibold whitespace-nowrap transition-opacity duration-300',
                  collapsed && 'opacity-0'
                )}
              >
                {item.section}
              </div>
            );
          }

          if (!('href' in item) || !item.href) return null;

          // Hide admin-only items from non-admins
          if ('adminOnly' in item && item.adminOnly && user?.role !== 'admin') return null;

          const Icon = item.icon!;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[0.88rem] font-[450] whitespace-nowrap transition-all duration-200 mb-0.5',
                isActive
                  ? 'text-[#C5E3F6] bg-[#C5E3F6]/[0.12]'
                  : 'text-white/55 hover:text-white/85 hover:bg-white/[0.06]'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#E8687D] rounded-r" />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span
                className={cn(
                  'overflow-hidden transition-opacity duration-300',
                  collapsed && 'opacity-0 pointer-events-none'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* User info + Logout */}
      {user && (
        <div
          className={cn(
            'px-3 py-3 border-t border-white/[0.08] transition-opacity duration-300',
            collapsed && 'opacity-0 pointer-events-none'
          )}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#C5E3F6]/20 flex items-center justify-center flex-shrink-0">
              <UserCircle className="w-4 h-4 text-[#C5E3F6]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm text-[#C5E3F6] font-medium truncate">{user.displayName}</p>
              <p className="text-[0.65rem] text-white/30 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-4 border-t border-white/[0.08]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.06] text-white/50 hover:bg-white/[0.12] hover:text-white transition-all duration-200"
        >
          <ChevronLeft
            className={cn(
              'w-4 h-4 transition-transform duration-300',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>
    </nav>
  );
}
