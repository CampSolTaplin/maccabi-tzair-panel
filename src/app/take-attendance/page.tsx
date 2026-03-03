'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { SOMAttendanceValue } from '@/types';
import {
  LogOut, Search, Check, Clock, X, ChevronDown, UserCircle, CalendarDays, Users, Star,
} from 'lucide-react';

export default function TakeAttendancePage() {
  const { user, logout } = useAuth();
  const {
    attendance, isImported, updateAttendanceCell,
    activeMembers, enabledDates, events, loading,
  } = useData();

  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Sort enabled dates descending (most recent first), auto-select first
  const sortedEnabledDates = useMemo(() => {
    return [...enabledDates].sort((a, b) => b.localeCompare(a));
  }, [enabledDates]);

  // Auto-select the most recent enabled date
  const effectiveDate = selectedDate && enabledDates.includes(selectedDate)
    ? selectedDate
    : sortedEnabledDates[0] || null;

  // Map event dates to event names
  const eventByDate = useMemo(() => {
    return new Map(events.map(e => [e.date, e.name]));
  }, [events]);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = activeMembers;
    if (q) {
      list = list.filter(m =>
        m.fullName.toLowerCase().includes(q) ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [activeMembers, search]);

  // Get attendance value for a member on the selected date
  const getVal = (contactId: string): SOMAttendanceValue => {
    if (!attendance || !effectiveDate) return null;
    const rec = attendance.records[contactId];
    if (!rec) return null;
    return rec[effectiveDate] ?? null;
  };

  // Set attendance for a member
  const setAttendance = (contactId: string, val: SOMAttendanceValue) => {
    if (!effectiveDate) return;
    updateAttendanceCell(contactId, effectiveDate, val);
  };

  // Stats for the selected date
  const stats = useMemo(() => {
    if (!attendance || !effectiveDate) return { present: 0, late: 0, absent: 0, unmarked: 0 };
    let present = 0, late = 0, absent = 0, unmarked = 0;
    for (const m of activeMembers) {
      const v = (attendance.records[m.contactId] || {})[effectiveDate];
      if (v === true) present++;
      else if (v === 'late') late++;
      else if (v === false) absent++;
      else unmarked++;
    }
    return { present, late, absent, unmarked };
  }, [attendance, effectiveDate, activeMembers]);

  const formatDateDisplay = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = d.getDate();
    const month = d.toLocaleDateString('es-ES', { month: 'long' });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} de ${month}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F0EC] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#1B2A6B]/20 border-t-[#1B2A6B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F0EC]">
      {/* Header */}
      <header className="bg-[#1B2A6B] text-white sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/90 p-1 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/maccabi-logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#C5E3F6] leading-tight">Asistencia</h1>
              <span className="text-[0.65rem] text-white/40">School of Madrichim</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.displayName}</span>
            </div>
            <button onClick={logout}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white/80">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* No data imported */}
        {(!isImported || !attendance) && (
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-8 text-center mt-8">
            <Users className="w-12 h-12 text-[#D8E1EA] mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Sin datos</h3>
            <p className="text-sm text-[#5A6472]">
              El administrador aun no ha importado la lista de miembros.
            </p>
          </div>
        )}

        {/* No enabled dates */}
        {isImported && attendance && enabledDates.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-8 text-center mt-8">
            <CalendarDays className="w-12 h-12 text-[#D8E1EA] mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Sin fechas habilitadas</h3>
            <p className="text-sm text-[#5A6472]">
              El administrador no ha habilitado ninguna fecha para tomar asistencia.
            </p>
          </div>
        )}

        {/* Main attendance taking UI */}
        {isImported && attendance && enabledDates.length > 0 && effectiveDate && (
          <>
            {/* Date selector */}
            {sortedEnabledDates.length > 1 ? (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1.5">
                  Fecha
                </label>
                <div className="relative">
                  <select
                    value={effectiveDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#D8E1EA] text-sm font-medium bg-white appearance-none focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
                  >
                    {sortedEnabledDates.map(d => {
                      const evName = eventByDate.get(d);
                      return (
                        <option key={d} value={d}>
                          {formatDateDisplay(d)}{evName ? ` — ${evName}` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472] pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="bg-[#1B2A6B]/5 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-2">
                  {eventByDate.has(effectiveDate) ? (
                    <Star className="w-4 h-4 text-[#E89B3A]" />
                  ) : (
                    <CalendarDays className="w-4 h-4 text-[#1B2A6B]" />
                  )}
                  <span className="text-sm font-medium text-[#1B2A6B]">
                    {formatDateDisplay(effectiveDate)}
                  </span>
                </div>
                {eventByDate.has(effectiveDate) && (
                  <div className="mt-1 ml-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-[#E89B3A]/15 text-[#E89B3A]">
                      {eventByDate.get(effectiveDate)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-white rounded-xl border border-[#D8E1EA] p-2.5 text-center">
                <div className="text-lg font-bold text-[#2D8B4E]">{stats.present}</div>
                <div className="text-[0.6rem] text-[#5A6472] uppercase font-medium">Presente</div>
              </div>
              <div className="bg-white rounded-xl border border-[#D8E1EA] p-2.5 text-center">
                <div className="text-lg font-bold text-[#E89B3A]">{stats.late}</div>
                <div className="text-[0.6rem] text-[#5A6472] uppercase font-medium">Tarde</div>
              </div>
              <div className="bg-white rounded-xl border border-[#D8E1EA] p-2.5 text-center">
                <div className="text-lg font-bold text-[#C0392B]">{stats.absent}</div>
                <div className="text-[0.6rem] text-[#5A6472] uppercase font-medium">Ausente</div>
              </div>
              <div className="bg-white rounded-xl border border-[#D8E1EA] p-2.5 text-center">
                <div className="text-lg font-bold text-[#5A6472]">{stats.unmarked}</div>
                <div className="text-[0.6rem] text-[#5A6472] uppercase font-medium">Sin marcar</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
              <input
                type="text"
                placeholder="Buscar miembro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
              />
            </div>

            {/* Member list */}
            <div className="space-y-2">
              {filteredMembers.map(member => {
                const val = getVal(member.contactId);
                return (
                  <MemberRow
                    key={member.contactId}
                    name={`${member.lastName}, ${member.firstName}`}
                    value={val}
                    onSet={(v) => setAttendance(member.contactId, v)}
                  />
                );
              })}
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-sm text-[#5A6472]">
                No se encontraron miembros
              </div>
            )}

            {/* Footer spacing */}
            <div className="h-6" />
          </>
        )}
      </div>
    </div>
  );
}

// ── Member Row Component ──
function MemberRow({ name, value, onSet }: {
  name: string;
  value: SOMAttendanceValue;
  onSet: (v: SOMAttendanceValue) => void;
}) {
  return (
    <div className={`bg-white rounded-xl border transition-all ${
      value === true ? 'border-[#2D8B4E]/30 bg-[#2D8B4E]/[0.03]'
      : value === 'late' ? 'border-[#E89B3A]/30 bg-[#E89B3A]/[0.03]'
      : value === false ? 'border-[#C0392B]/30 bg-[#C0392B]/[0.03]'
      : 'border-[#D8E1EA]'
    }`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Name */}
        <span className="flex-1 text-sm font-medium text-[#1A1A2E] truncate">{name}</span>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onSet(value === true ? null : true)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              value === true
                ? 'bg-[#2D8B4E] text-white shadow-sm'
                : 'bg-[#f0eeea] text-[#999] hover:bg-[#2D8B4E]/10 hover:text-[#2D8B4E]'
            }`}
            title="Presente"
          >
            <Check className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => onSet(value === 'late' ? null : 'late')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              value === 'late'
                ? 'bg-[#E89B3A] text-white shadow-sm'
                : 'bg-[#f0eeea] text-[#999] hover:bg-[#E89B3A]/10 hover:text-[#E89B3A]'
            }`}
            title="Tarde"
          >
            <Clock className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => onSet(value === false ? null : false)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              value === false
                ? 'bg-[#C0392B] text-white shadow-sm'
                : 'bg-[#f0eeea] text-[#999] hover:bg-[#C0392B]/10 hover:text-[#C0392B]'
            }`}
            title="Ausente"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
