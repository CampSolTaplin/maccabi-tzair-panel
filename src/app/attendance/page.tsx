'use client';

import { useState, useMemo } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { CommunityEvent } from '@/types';
import { Upload, Search, Filter, Star } from 'lucide-react';

type ColumnType = 'session' | 'event';
interface GridColumn {
  type: ColumnType;
  date: string;       // ISO date string
  event?: CommunityEvent; // only for event columns
}

export default function AttendancePage() {
  const { attendance, isImported, setShowImportModal, updateAttendanceCell, events } = useData();
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showEvents, setShowEvents] = useState(true);

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!attendance) return [];
    const q = search.trim().toLowerCase();
    if (!q) return attendance.members;
    return attendance.members.filter(m =>
      m.fullName.toLowerCase().includes(q) ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      `${m.lastName} ${m.firstName}`.toLowerCase().includes(q)
    );
  }, [attendance, search]);

  // Filter dates by selected month
  const visibleSessionDates = useMemo(() => {
    if (!attendance) return [];
    if (selectedMonth === 'all') return attendance.dates;
    const month = attendance.months.find(m => m.name === selectedMonth);
    return month ? month.dates : attendance.dates;
  }, [attendance, selectedMonth]);

  // Build unified columns: sessions + events, sorted by date
  const columns = useMemo(() => {
    const cols: GridColumn[] = visibleSessionDates.map(d => ({ type: 'session' as ColumnType, date: d }));
    if (showEvents) {
      for (const evt of events) {
        // Filter by selected month if applicable
        if (selectedMonth !== 'all') {
          const evtDate = new Date(evt.date + 'T12:00:00');
          const evtMonthName = evtDate.toLocaleDateString('es-ES', { month: 'long' });
          const capitalizedMonth = evtMonthName.charAt(0).toUpperCase() + evtMonthName.slice(1);
          // Map Spanish month to our month names
          const monthNameMap: Record<string, string> = {
            'Enero': 'Enero', 'Febrero': 'Febrero', 'Marzo': 'Marzo', 'Abril': 'Abril',
            'Mayo': 'Mayo', 'Junio': 'Junio', 'Julio': 'Julio', 'Agosto': 'Agosto',
            'Septiembre': 'Septiembre', 'Octubre': 'Octubre', 'Noviembre': 'Noviembre', 'Diciembre': 'Diciembre',
          };
          const mapped = monthNameMap[capitalizedMonth] || capitalizedMonth;
          if (mapped !== selectedMonth) continue;
        }
        cols.push({ type: 'event', date: evt.date, event: evt });
      }
    }
    cols.sort((a, b) => a.date.localeCompare(b.date));
    return cols;
  }, [visibleSessionDates, events, showEvents, selectedMonth]);

  // Detect "no session" dates: dates where ALL members have null
  const noSessionDates = useMemo(() => {
    if (!attendance) return new Set<string>();
    const set = new Set<string>();
    for (const d of visibleSessionDates) {
      let allNull = true;
      for (const m of attendance.members) {
        const val = (attendance.records[m.contactId] || {})[d];
        if (val !== null && val !== undefined) {
          allNull = false;
          break;
        }
      }
      if (allNull) set.add(d);
    }
    return set;
  }, [attendance, visibleSessionDates]);

  // Group columns by month for header spans
  const monthGroups = useMemo(() => {
    const groups: { name: string; count: number; isEvent?: boolean }[] = [];
    let currentMonth = '';
    let currentCount = 0;

    for (const col of columns) {
      const d = new Date(col.date + 'T12:00:00');
      const monthNames: Record<number, string> = {
        0: 'Enero', 1: 'Febrero', 2: 'Marzo', 3: 'Abril',
        4: 'Mayo', 5: 'Junio', 6: 'Julio', 7: 'Agosto',
        8: 'Septiembre', 9: 'Octubre', 10: 'Noviembre', 11: 'Diciembre',
      };
      const monthName = monthNames[d.getMonth()] || '';

      if (monthName !== currentMonth) {
        if (currentCount > 0) groups.push({ name: currentMonth, count: currentCount });
        currentMonth = monthName;
        currentCount = 1;
      } else {
        currentCount++;
      }
    }
    if (currentCount > 0) groups.push({ name: currentMonth, count: currentCount });
    return groups;
  }, [columns]);

  // Compute per-member stats (sessions only, excluding no-session dates)
  const memberStats = useMemo(() => {
    if (!attendance) return new Map<string, { present: number; absent: number; total: number; rate: number }>();
    const stats = new Map<string, { present: number; absent: number; total: number; rate: number }>();
    const activeDates = visibleSessionDates.filter(d => !noSessionDates.has(d));
    for (const m of attendance.members) {
      const rec = attendance.records[m.contactId] || {};
      let present = 0, absent = 0;
      for (const d of activeDates) {
        const v = rec[d];
        if (v === true) present++;
        else if (v === false) absent++;
      }
      const total = present + absent;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      stats.set(m.contactId, { present, absent, total, rate });
    }
    return stats;
  }, [attendance, visibleSessionDates, noSessionDates]);

  // Compute per-date stats (sessions only)
  const dateStats = useMemo(() => {
    if (!attendance) return new Map<string, { present: number; absent: number; rate: number }>();
    const stats = new Map<string, { present: number; absent: number; rate: number }>();
    for (const d of visibleSessionDates) {
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
  }, [attendance, visibleSessionDates, filteredMembers]);

  // Format date for column header
  const fmtDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    const day = d.getDate();
    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3);
    return { day, weekday };
  };

  // Click handler for session cells: cycle null → true → false → null
  const handleCellClick = (contactId: string, date: string, currentVal: boolean | null | undefined) => {
    let next: boolean | null;
    if (currentVal === null || currentVal === undefined) next = true;
    else if (currentVal === true) next = false;
    else next = null;
    updateAttendanceCell(contactId, date, next);
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
              Subí el archivo SOM ATTENDANCE.xlsx para ver la grilla completa de asistencia con los miembros y sesiones.
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
            {events.length > 0 && (
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)}
                  className="rounded border-[#D8E1EA] text-[#E8687D] focus:ring-[#E8687D]" />
                <Star className="w-3.5 h-3.5 text-[#E8687D]" />
                <span className="text-[#5A6472] font-medium">Eventos ({events.length})</span>
              </label>
            )}
            <div className="text-xs text-[#5A6472]">
              {filteredMembers.length} miembros · {visibleSessionDates.length} sesiones
              {noSessionDates.size > 0 && <span className="text-[#C0392B]"> · {noSessionDates.size} sin sesión</span>}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f0eeea]">
            <span className="text-[0.65rem] text-[#5A6472] font-semibold uppercase tracking-wider">Click para editar:</span>
            <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
              <span className="inline-block w-4 h-4 rounded bg-[#2D8B4E] text-white text-[0.55rem] font-bold leading-4 text-center">✓</span> Presente
            </span>
            <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
              <span className="inline-block w-4 h-4 rounded bg-[#C0392B] text-white text-[0.55rem] font-bold leading-4 text-center">✗</span> Ausente
            </span>
            <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
              <span className="inline-block w-4 h-4 rounded bg-[#f0eeea] text-[#C5CDD8] text-[0.55rem] leading-4 text-center">—</span> Sin dato
            </span>
            {noSessionDates.size > 0 && (
              <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
                <span className="inline-block w-4 h-4 rounded text-[0.55rem] leading-4 text-center" style={{ background: 'repeating-linear-gradient(45deg, #f0eeea, #f0eeea 2px, #e4e1da 2px, #e4e1da 4px)' }} /> No hubo sesión
              </span>
            )}
            {showEvents && events.length > 0 && (
              <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
                <span className="inline-block w-4 h-4 rounded bg-[#E8687D] text-white text-[0.55rem] font-bold leading-4 text-center">★</span> Evento especial
              </span>
            )}
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
                  {monthGroups.map((g, i) => (
                    <th
                      key={`month-${i}`}
                      colSpan={g.count}
                      className="px-1 py-1.5 text-center text-[#C5E3F6] font-semibold text-[0.7rem] uppercase tracking-wider border-l border-white/10"
                    >
                      {g.name}
                    </th>
                  ))}
                </tr>
                {/* Date sub-headers */}
                <tr>
                  {columns.map((col, i) => {
                    const { day, weekday } = fmtDate(col.date);
                    const isEvent = col.type === 'event';
                    const isNoSession = col.type === 'session' && noSessionDates.has(col.date);
                    const prevCol = columns[i - 1];
                    const isFirstOfMonth = i === 0 || new Date(col.date + 'T12:00:00').getMonth() !== new Date((prevCol?.date || col.date) + 'T12:00:00').getMonth();

                    return (
                      <th
                        key={`${col.type}-${col.date}-${col.event?.id || ''}`}
                        className={`px-0.5 py-1.5 text-center min-w-[32px] ${isFirstOfMonth ? 'border-l border-white/10' : ''} ${isEvent ? 'bg-[#E8687D]' : isNoSession ? 'bg-[#5A6472]' : 'bg-[#233580]'}`}
                        title={isEvent ? col.event!.name : isNoSession ? 'No hubo sesión' : undefined}
                      >
                        {isEvent ? (
                          <>
                            <div className="text-[0.55rem] text-white/70">★</div>
                            <div className="text-[0.65rem] text-white font-semibold">{day}</div>
                          </>
                        ) : (
                          <>
                            <div className={`text-[0.6rem] capitalize ${isNoSession ? 'text-white/40' : 'text-white/50'}`}>{weekday}</div>
                            <div className={`text-[0.7rem] font-semibold ${isNoSession ? 'text-white/50 line-through' : 'text-white'}`}>{day}</div>
                          </>
                        )}
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
                  const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]';

                  return (
                    <tr
                      key={member.contactId}
                      className={`${rowBg} hover:bg-[#E3F2FD]/30 transition-colors`}
                    >
                      {/* Name */}
                      <td className={`sticky left-0 z-10 px-3 py-2 font-medium text-[#1A1A2E] whitespace-nowrap border-b border-[#f0eeea] ${rowBg}`}>
                        {member.lastName}, {member.firstName}
                      </td>

                      {/* Rate */}
                      <td className={`sticky left-[180px] z-10 px-2 py-2 text-center font-bold border-b border-[#f0eeea] ${rowBg}`}>
                        <span className={`${rate >= 70 ? 'text-[#2D8B4E]' : rate >= 40 ? 'text-[#E89B3A]' : 'text-[#C0392B]'}`}>
                          {stats?.total ? `${rate}%` : '—'}
                        </span>
                      </td>

                      {/* Cells */}
                      {columns.map((col, di) => {
                        const isEvent = col.type === 'event';
                        const isNoSession = col.type === 'session' && noSessionDates.has(col.date);
                        const prevCol = columns[di - 1];
                        const isFirstOfMonth = di === 0 || new Date(col.date + 'T12:00:00').getMonth() !== new Date((prevCol?.date || col.date) + 'T12:00:00').getMonth();

                        if (isEvent) {
                          // Event column: check if member is in attendees
                          const attended = col.event!.attendees.includes(member.contactId);
                          return (
                            <td
                              key={`evt-${col.event!.id}`}
                              className={`px-0.5 py-2 text-center border-b border-[#f0eeea] bg-[#FFF5F6] ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}
                              title={`${col.event!.name}: ${attended ? 'Asistió' : 'No asistió'}`}
                            >
                              {attended ? (
                                <span className="inline-block w-5 h-5 rounded bg-[#E8687D] text-white text-[0.6rem] font-bold leading-5">★</span>
                              ) : (
                                <span className="inline-block w-5 h-5 rounded bg-[#f0eeea] text-[#D8CCC4] text-[0.6rem] leading-5">—</span>
                              )}
                            </td>
                          );
                        }

                        if (isNoSession) {
                          // No-session column: greyed out, not clickable
                          return (
                            <td
                              key={col.date}
                              className={`px-0.5 py-2 text-center border-b border-[#f0eeea] ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}
                              title="No hubo sesión"
                            >
                              <span
                                className="inline-block w-5 h-5 rounded text-[0.5rem] text-[#b8b0a4] leading-5"
                                style={{ background: 'repeating-linear-gradient(45deg, #f0eeea, #f0eeea 2px, #e4e1da 2px, #e4e1da 4px)' }}
                              />
                            </td>
                          );
                        }

                        // Regular session cell — clickable
                        const val = rec[col.date];
                        return (
                          <td
                            key={col.date}
                            className={`px-0.5 py-2 text-center border-b border-[#f0eeea] ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}
                          >
                            <button
                              onClick={() => handleCellClick(member.contactId, col.date, val)}
                              className="inline-flex items-center justify-center w-5 h-5 rounded text-[0.6rem] font-bold leading-5 transition-all hover:scale-110 hover:shadow-sm cursor-pointer"
                              title={`Click para cambiar: ${val === true ? 'Presente → Ausente' : val === false ? 'Ausente → Sin dato' : 'Sin dato → Presente'}`}
                            >
                              {val === true ? (
                                <span className="w-5 h-5 rounded bg-[#2D8B4E] text-white leading-5 text-center">✓</span>
                              ) : val === false ? (
                                <span className="w-5 h-5 rounded bg-[#C0392B] text-white leading-5 text-center">✗</span>
                              ) : (
                                <span className="w-5 h-5 rounded bg-[#f0eeea] text-[#C5CDD8] leading-5 text-center">—</span>
                              )}
                            </button>
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
                  {columns.map((col, di) => {
                    const prevCol = columns[di - 1];
                    const isFirstOfMonth = di === 0 || new Date(col.date + 'T12:00:00').getMonth() !== new Date((prevCol?.date || col.date) + 'T12:00:00').getMonth();
                    const isEvent = col.type === 'event';
                    const isNoSession = col.type === 'session' && noSessionDates.has(col.date);

                    if (isEvent) {
                      return (
                        <td key={`evt-foot-${col.event!.id}`} className={`px-0.5 py-2 text-center bg-[#FFF5F6] ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}>
                          <span className="text-[0.65rem] text-[#E8687D] font-bold">{col.event!.attendees.length}</span>
                        </td>
                      );
                    }
                    if (isNoSession) {
                      return (
                        <td key={col.date} className={`px-0.5 py-2 text-center ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}>
                          <span className="text-[0.65rem] text-[#b8b0a4]">—</span>
                        </td>
                      );
                    }
                    const s = dateStats.get(col.date);
                    return (
                      <td key={col.date} className={`px-0.5 py-2 text-center ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}>
                        <span className="text-[0.65rem] text-[#2D8B4E] font-bold">{s?.present ?? 0}</span>
                      </td>
                    );
                  })}
                </tr>
                <tr className="bg-[#F5F3EF] font-semibold">
                  <td className="sticky left-0 z-10 bg-[#F5F3EF] px-3 py-2 text-[#1B2A6B]">
                    % Asistencia
                  </td>
                  <td className="sticky left-[180px] z-10 bg-[#F5F3EF] px-2 py-2 text-center text-[#1B2A6B]">
                    —
                  </td>
                  {columns.map((col, di) => {
                    const prevCol = columns[di - 1];
                    const isFirstOfMonth = di === 0 || new Date(col.date + 'T12:00:00').getMonth() !== new Date((prevCol?.date || col.date) + 'T12:00:00').getMonth();
                    const isEvent = col.type === 'event';
                    const isNoSession = col.type === 'session' && noSessionDates.has(col.date);

                    if (isEvent) {
                      const pct = attendance.members.length > 0 ? Math.round((col.event!.attendees.length / attendance.members.length) * 100) : 0;
                      return (
                        <td key={`evt-pct-${col.event!.id}`} className={`px-0.5 py-2 text-center bg-[#FFF5F6] ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}>
                          <span className="text-[0.65rem] text-[#E8687D] font-bold">{pct}%</span>
                        </td>
                      );
                    }
                    if (isNoSession) {
                      return (
                        <td key={col.date} className={`px-0.5 py-2 text-center ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}>
                          <span className="text-[0.65rem] text-[#b8b0a4]">—</span>
                        </td>
                      );
                    }
                    const s = dateStats.get(col.date);
                    const rate = s?.rate ?? 0;
                    return (
                      <td key={col.date} className={`px-0.5 py-2 text-center ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}>
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
