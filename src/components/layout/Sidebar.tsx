'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { section: 'SOM' },
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attendance', label: 'Asistencia', icon: ClipboardCheck },
  { href: '/roster', label: 'Miembros', icon: Users },
  { section: 'Sistema' },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[#1B2A6B] transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3.5 border-b border-white/[0.08] px-5 py-5 min-h-[80px]">
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-10 h-10">
            <polygon points="50,8 61,30 83,30 65,46 73,70 50,55 27,70 35,46 17,30 39,30" fill="#C5E3F6" />
            <polygon points="50,92 39,70 17,70 35,54 27,30 50,45 73,30 65,54 83,70 61,70" fill="#C5E3F6" />
            <text x="50" y="58" textAnchor="middle" fill="#1B2A6B" fontSize="22" fontWeight="bold" fontFamily="serif">מצ</text>
          </svg>
        </div>
        <div
          className={cn(
            'whitespace-nowrap overflow-hidden transition-opacity duration-300',
            collapsed && 'opacity-0 pointer-events-none'
          )}
        >
          <h1 className="font-serif text-[1.1rem] font-bold text-[#C5E3F6] leading-tight tracking-wide">
            School of Madrichim
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

      {/* Footer */}
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
