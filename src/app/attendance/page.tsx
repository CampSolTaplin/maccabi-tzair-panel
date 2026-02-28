'use client';

import { useState, useMemo } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { Upload, Search, Filter } from 'lucide-react';

export default function AttendancePage() {
  const { attendance, isImported, setShowImportModal } = useData();
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!attendance) return [];
    if (!search) return attendance.members;
    const q = search.toLowerCase();
    return attendance.members.filter(m =>
      m.fullName.toLowerCase().includes(q) ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q)
    );
  }, [attendance, search]);

  // Filter dates by selected month
  const visibleDates = useMemo(() => {
    if (!attendance) return [];
    if (selectedMonth === 'all') return attendance.dates;
    const month = attendance.months.find(m => m.name === selectedMonth);
    return month ? month.dates : attendance.dates;
  }, [attendance, selectedMonth]);

  // Visible months for header grouping
  const visibleMonths = useMemo(() => {
    if (!attendance) return [];
    if (selectedMonth === 'all') return attendance.months;
    const month = attendance.months.find(m => m.name === selectedMonth);
    return month ? [month] : [];
  }, [attendance, selectedMonth]);

  // Compute per-member stats
  const memberStats = useMemo(() => {
    if (!attendance) return new Map<string, { present: number; absent: number; total: number; rate: number }>();
    const stats = new Map<string, { present: number; absent: number; total: number; rate: number }>();
    for (const m of attendance.members) {
      const rec = attendance.records[m.contactId] || {};
      let present = 0, absent = 0;
      for (const d of visibleDates) {
        const v = rec[d];
        if (v === true) present++;
        else if (v === false) absent++;
      }
      const total = present + absent;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      stats.set(m.contactId, { present, absent, total, rate });
    }
    return stats;
  }, [attendance, visibleDates]);

  // Compute per-date stats
  const dateStats = useMemo(() => {
    if (!attendance) return new Map<string, { present: number; absent: number; rate: number }>();
    const stats = new Map<string, { present: number; absent: number; rate: number }>();
    for (const d of visibleDates) {
      let present = 0, absent = 0;
      for (const m of filteredMembers) {
        const v = (attendance.records[m.contactId] || {})[d];
        if (v === true) present++;
        else if (v === false) absent++;
      }
      const total = present + absent;
      stats.set(d, { present, absent, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
    }
    return stats;
  }, [attendance, visibleDates, filteredMembers]);

  // Format date for column header
  const fmtDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    const day = d.getDate();
    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3);
    return { day, weekday };
  };

  // ── No data state ──
  if (!isImported || !attendance) {
    return (
      <>
        <Topbar title="Asistencia SOM" subtitle="Control de asistencia — School of Madrichim" />
        <div className="p-7">
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E3F2FD] mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-[#1B2A6B]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Importar Asistencia</h3>
            <p className="text-sm text-[#5A6472] max-w-md mx-auto mb-6">
              Subí el archivo SOM ATTENDANCE.xlsx para ver la grilla completa de asistencia con los 114 miembros y todas las sesiones.
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all mx-auto"
            >
              <Upload className="w-4 h-4" /> Importar Archivo
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Main attendance grid ──
  return (
    <>
      <Topbar title="Asistencia SOM" subtitle="Control de asistencia — School of Madrichim" />
      <div className="p-5">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
              <input
                type="text"
                placeholder="Buscar miembro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F] focus:ring-2 focus:ring-[#2A3D8F]/10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#5A6472]" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#2A3D8F]"
              >
                <option value="all">Todos los meses</option>
                {attendance.months.map(m => (
                  <option key={m.name} value={m.name}>{m.name} ({m.dates.length})</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-[#5A6472]">
              {filteredMembers.length} miembros · {visibleDates.length} sesiones
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              {/* Month group headers */}
              <thead>
                <tr className="bg-[#1B2A6B]">
                  <th className="sticky left-0 z-20 bg-[#1B2A6B] px-3 py-2 text-left text-white font-semibold min-w-[180px]" rowSpan={2}>
                    Miembro
                  </th>
                  <th className="sticky left-[180px] z-20 bg-[#1B2A6B] px-2 py-2 text-center text-white font-semibold min-w-[44px]" rowSpan={2}>
                    %
                  </th>
                  {visibleMonths.map(m => (
                    <th
                      key={m.name}
                      colSpan={m.dates.length}
                      className="px-1 py-1.5 text-center text-[#C5E3F6] font-semibold text-[0.7rem] uppercase tracking-wider border-l border-white/10"
                    >
                      {m.name}
                    </th>
                  ))}
                </tr>
                {/* Date sub-headers */}
                <tr className="bg-[#233580]">
                  {visibleDates.map((d, i) => {
                    const { day, weekday } = fmtDate(d);
                    const isFirstOfMonth = i === 0 || new Date(d + 'T12:00:00').getMonth() !== new Date(visibleDates[i - 1] + 'T12:00:00').getMonth();
                    return (
                      <th
                        key={d}
                        className={`px-0.5 py-1.5 text-center min-w-[32px] ${isFirstOfMonth ? 'border-l border-white/10' : ''}`}
                      >
                        <div className="text-[0.6rem] text-white/50 capitalize">{weekday}</div>
                        <div className="text-[0.7rem] text-white font-semibold">{day}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member, idx) => {
                  const rec = attendance.records[member.contactId] || {};
                  const stats = memberStats.get(member.contactId);
                  const rate = stats?.rate ?? 0;

                  return (
                    <tr
                      key={member.contactId}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'} hover:bg-[#E3F2FD]/30 transition-colors`}
                    >
                      {/* Name */}
                      <td className={`sticky left-0 z-10 px-3 py-2 font-medium text-[#1A1A2E] whitespace-nowrap border-b border-[#f0eeea] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}>
                        {member.lastName}, {member.firstName}
                      </td>

                      {/* Rate */}
                      <td className={`sticky left-[180px] z-10 px-2 py-2 text-center font-bold border-b border-[#f0eeea] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}>
                        <span className={`${rate >= 70 ? 'text-[#2D8B4E]' : rate >= 40 ? 'text-[#E89B3A]' : 'text-[#C0392B]'}`}>
                          {stats?.total ? `${rate}%` : '—'}
                        </span>
                      </td>

                      {/* Attendance cells */}
                      {visibleDates.map((d, di) => {
                        const val = rec[d];
                        const isFirstOfMonth = di === 0 || new Date(d + 'T12:00:00').getMonth() !== new Date(visibleDates[di - 1] + 'T12:00:00').getMonth();
                        return (
                          <td
                            key={d}
                            className={`px-0.5 py-2 text-center border-b border-[#f0eeea] ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}
                          >
                            {val === true ? (
                              <span className="inline-block w-5 h-5 rounded bg-[#2D8B4E] text-white text-[0.6rem] font-bold leading-5">✓</span>
                            ) : val === false ? (
                              <span className="inline-block w-5 h-5 rounded bg-[#C0392B] text-white text-[0.6rem] font-bold leading-5">✗</span>
                            ) : (
                              <span className="inline-block w-5 h-5 rounded bg-[#f0eeea] text-[#C5CDD8] text-[0.6rem] leading-5">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Footer: per-date stats */}
                <tr className="bg-[#F5F3EF] font-semibold border-t-2 border-[#D8E1EA]">
                  <td className="sticky left-0 z-10 bg-[#F5F3EF] px-3 py-2 text-[#1B2A6B]">
                    Total Presentes
                  </td>
                  <td className="sticky left-[180px] z-10 bg-[#F5F3EF] px-2 py-2 text-center text-[#1B2A6B]">
                    —
                  </td>
                  {visibleDates.map((d, di) => {
                    const s = dateStats.get(d);
                    const isFirstOfMonth = di === 0 || new Date(d + 'T12:00:00').getMonth() !== new Date(visibleDates[di - 1] + 'T12:00:00').getMonth();
                    return (
                      <td key={d} className={`px-0.5 py-2 text-center ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}>
                        <span className="text-[0.65rem] text-[#2D8B4E] font-bold">{s?.present ?? 0}</span>
                      </td>
                    );
                  })}
                </tr>
                <tr className="bg-[#F5F3EF] font-semibold">
                  <td className="sticky left-0 z-10 bg-[#F5F3EF] px-3 py-2 text-[#1B2A6B]">
                    % Asistencia
                  </td>
                  <td className="sticky left-0 z-10 bg-[#F5F3EF] px-2 py-2 text-center text-[#1B2A6B]">
                    —
                  </td>
                  {visibleDates.map((d, di) => {
                    const s = dateStats.get(d);
                    const rate = s?.rate ?? 0;
                    const isFirstOfMonth = di === 0 || new Date(d + 'T12:00:00').getMonth() !== new Date(visibleDates[di - 1] + 'T12:00:00').getMonth();
                    return (
                      <td key={d} className={`px-0.5 py-2 text-center ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}>
                        <span className={`text-[0.65rem] font-bold ${rate >= 70 ? 'text-[#2D8B4E]' : rate >= 40 ? 'text-[#E89B3A]' : 'text-[#C0392B]'}`}>
                          {rate}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
