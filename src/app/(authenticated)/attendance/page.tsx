'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { CommunityEvent, AttendanceValue, Chanich } from '@/types';
import {
  Upload, Search, Filter, Star, UserMinus, UserPlus, X,
  RotateCcw, MoreVertical, ArrowUpDown, ChevronRight, ChevronDown,
  Users, CalendarDays,
} from 'lucide-react';

type ColumnType = 'session' | 'event';
interface GridColumn {
  type: ColumnType;
  date: string;
  event?: CommunityEvent;
  month: string;
}

type StatusFilter = 'active' | 'dropped' | 'all';
type SortField = 'lastName' | 'firstName';
type SortDir = 'asc' | 'desc';

const MONTH_NAMES: Record<number, string> = {
  0: 'Enero', 1: 'Febrero', 2: 'Marzo', 3: 'Abril', 4: 'Mayo', 5: 'Junio',
  6: 'Julio', 7: 'Agosto', 8: 'Septiembre', 9: 'Octubre', 10: 'Noviembre', 11: 'Diciembre',
};

function getMonth(iso: string) {
  return MONTH_NAMES[new Date(iso + 'T12:00:00').getMonth()] || '';
}

// ── Group definitions for attendance tabs ──

const PROGRAM_GROUPS = ['Pre-SOM', 'SOM', 'Trips', 'Machanot'];

interface GroupDef {
  key: string;
  label: string;
  area: string;
  color: string;
}

const GROUP_DEFS: GroupDef[] = [
  { key: 'Kinder', label: 'Kinder', area: 'Katan', color: 'text-blue-700' },
  { key: '1st Grade', label: '1st Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '2nd Grade', label: '2nd Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '3rd Grade', label: '3rd Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '4th Grade', label: '4th Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '5th Grade', label: '5th Grade', area: 'Katan', color: 'text-blue-700' },
  { key: '6th Grade', label: '6th Grade', area: 'Noar', color: 'text-purple-700' },
  { key: '7th Grade', label: '7th Grade', area: 'Noar', color: 'text-purple-700' },
  { key: '8th Grade', label: '8th Grade', area: 'Noar', color: 'text-purple-700' },
  { key: 'Pre-SOM', label: 'Pre-SOM', area: 'Leadership', color: 'text-amber-700' },
  { key: 'SOM', label: 'SOM (Roster)', area: 'Leadership', color: 'text-green-700' },
  { key: 'Trips', label: 'Trips', area: 'Special', color: 'text-rose-700' },
  { key: 'Machanot', label: 'Machanot', area: 'Special', color: 'text-cyan-700' },
];

function matchesGroup(groupKey: string, chanich: Chanich): boolean {
  if (PROGRAM_GROUPS.includes(groupKey)) return chanich.program === groupKey;
  return chanich.gradeLevel.toLowerCase().includes(groupKey.toLowerCase());
}

// ═══════════════════════════════════════════════════════════════
// Main AttendancePage — Group selector + SOM Legacy / Group views
// ═══════════════════════════════════════════════════════════════

export default function AttendancePage() {
  const {
    attendance, isImported, setShowImportModal, updateAttendanceCell, events,
    getMemberStatus, dropMember, reactivateMember, addNewMember,
    activeMembers, droppedMembers,
    rosterData, groupAttendance, updateGroupAttendance, enabledDates,
  } = useData();

  const [selectedGroup, setSelectedGroup] = useState('som-legacy');

  // Available groups from roster (only groups that have members)
  const availableGroups = useMemo(() => {
    if (!rosterData) return [];
    return GROUP_DEFS.filter(g =>
      rosterData.chanichim.some(c => matchesGroup(g.key, c))
    ).map(g => ({
      ...g,
      count: rosterData.chanichim.filter(c => matchesGroup(g.key, c)).length,
    }));
  }, [rosterData]);

  // Area groups for display
  const areaGrouped = useMemo(() => {
    const map = new Map<string, typeof availableGroups>();
    for (const g of availableGroups) {
      if (!map.has(g.area)) map.set(g.area, []);
      map.get(g.area)!.push(g);
    }
    return map;
  }, [availableGroups]);

  const subtitle = selectedGroup === 'som-legacy'
    ? 'Control de asistencia — SOM (Importacion Excel)'
    : `Control de asistencia — ${availableGroups.find(g => g.key === selectedGroup)?.label || selectedGroup}`;

  return (
    <>
      <Topbar title="Asistencia" subtitle={subtitle} />
      <div className="p-5">
        {/* Group selector tabs */}
        {(availableGroups.length > 0 || isImported) && (
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#5A6472]" />
              <span className="text-xs font-semibold text-[#5A6472] uppercase tracking-wider">Grupo</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* SOM Legacy tab */}
              {isImported && (
                <button
                  onClick={() => setSelectedGroup('som-legacy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedGroup === 'som-legacy'
                      ? 'bg-[#1B2A6B] text-white shadow-sm'
                      : 'bg-[#F2F0EC] text-[#5A6472] hover:bg-[#E8E5DF]'
                  }`}
                >
                  SOM (Excel)
                </button>
              )}

              {/* Roster-based group tabs by area */}
              {Array.from(areaGrouped.entries()).map(([area, groups], i) => (
                <span key={area} className="contents">
                  {(i > 0 || isImported) && (
                    <span className="text-[#D8E1EA] mx-0.5 text-xs">|</span>
                  )}
                  {groups.map(g => (
                    <button
                      key={g.key}
                      onClick={() => setSelectedGroup(g.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedGroup === g.key
                          ? 'bg-[#1B2A6B] text-white shadow-sm'
                          : `bg-[#F2F0EC] ${g.color} hover:bg-[#E8E5DF]`
                      }`}
                    >
                      {g.label}
                      <span className={`ml-1 ${selectedGroup === g.key ? 'opacity-80' : 'opacity-60'}`}>
                        {g.count}
                      </span>
                    </button>
                  ))}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SOM Legacy view */}
        {selectedGroup === 'som-legacy' && (
          <SOMAttendanceGrid />
        )}

        {/* Group Attendance view */}
        {selectedGroup !== 'som-legacy' && (
          <GroupAttendanceGrid
            groupKey={selectedGroup}
            rosterData={rosterData}
            groupAttendance={groupAttendance}
            updateGroupAttendance={updateGroupAttendance}
            enabledDates={enabledDates}
            events={events}
          />
        )}
      </div>
    </>
  );
}


// ═══════════════════════════════════════════════════════════
// GroupAttendanceGrid — Roster-based attendance for any group
// ═══════════════════════════════════════════════════════════

function GroupAttendanceGrid({
  groupKey,
  rosterData,
  groupAttendance,
  updateGroupAttendance,
  enabledDates,
  events,
}: {
  groupKey: string;
  rosterData: ReturnType<typeof useData>['rosterData'];
  groupAttendance: ReturnType<typeof useData>['groupAttendance'];
  updateGroupAttendance: ReturnType<typeof useData>['updateGroupAttendance'];
  enabledDates: string[];
  events: CommunityEvent[];
}) {
  const [search, setSearch] = useState('');

  // Get members for this group, deduplicated by contactId
  const members = useMemo(() => {
    if (!rosterData) return [];
    const seen = new Set<string>();
    return rosterData.chanichim
      .filter(c => matchesGroup(groupKey, c))
      .filter(c => {
        if (!c.contactId) return true;
        if (seen.has(c.contactId)) return false;
        seen.add(c.contactId);
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [rosterData, groupKey]);

  // Filter by search
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m =>
      m.fullName.toLowerCase().includes(q) ||
      m.grade.toLowerCase().includes(q) ||
      m.school.toLowerCase().includes(q)
    );
  }, [members, search]);

  // Sorted dates (ascending)
  const dates = useMemo(() => [...enabledDates].sort(), [enabledDates]);

  // Map event dates to event names
  const eventByDate = useMemo(() => {
    return new Map(events.map(e => [e.date, e.name]));
  }, [events]);

  const getVal = (contactId: string, date: string): AttendanceValue => {
    return groupAttendance[groupKey]?.[contactId]?.[date] ?? null;
  };

  const handleCellClick = (contactId: string, date: string) => {
    const current = getVal(contactId, date);
    let next: AttendanceValue;
    if (current === null || current === undefined) next = true;
    else if (current === true) next = 'late';
    else if (current === 'late') next = false;
    else next = null;
    updateGroupAttendance(groupKey, contactId, date, next);
  };

  // Per-member stats
  const memberStats = useMemo(() => {
    const stats = new Map<string, { present: number; late: number; absent: number; total: number; rate: number }>();
    for (const m of filteredMembers) {
      let present = 0, late = 0, absent = 0;
      for (const d of dates) {
        const v = getVal(m.contactId, d);
        if (v === true) present++;
        else if (v === 'late') late++;
        else if (v === false) absent++;
      }
      const total = present + late + absent;
      const effectivePresent = present + (late * 0.5);
      stats.set(m.contactId, { present, late, absent, total, rate: total > 0 ? Math.round((effectivePresent / total) * 100) : 0 });
    }
    return stats;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMembers, dates, groupAttendance, groupKey]);

  // Per-date stats
  const dateStats = useMemo(() => {
    const stats = new Map<string, { present: number; late: number; absent: number; rate: number }>();
    for (const d of dates) {
      let present = 0, late = 0, absent = 0;
      for (const m of filteredMembers) {
        const v = getVal(m.contactId, d);
        if (v === true) present++;
        else if (v === 'late') late++;
        else if (v === false) absent++;
      }
      const total = present + late + absent;
      stats.set(d, { present, late, absent, rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0 });
    }
    return stats;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMembers, dates, groupAttendance, groupKey]);

  const fmtDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return {
      day: d.getDate(),
      weekday: d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3),
      month: MONTH_NAMES[d.getMonth()] || '',
    };
  };

  // Empty states
  if (!rosterData || members.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
        <Users className="w-14 h-14 text-[#D8E1EA] mx-auto mb-4" />
        <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Sin datos de roster</h3>
        <p className="text-sm text-[#5A6472] max-w-md mx-auto">
          Importa el roster de Salesforce en la seccion Rosters para ver la asistencia de este grupo.
        </p>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
        <CalendarDays className="w-14 h-14 text-[#D8E1EA] mx-auto mb-4" />
        <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Sin fechas habilitadas</h3>
        <p className="text-sm text-[#5A6472] max-w-md mx-auto">
          Habilita fechas en Configuracion &gt; Habilitar Asistencia para que los madrichim puedan tomar asistencia.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
            <input type="text" placeholder="Buscar participante..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F] focus:ring-2 focus:ring-[#2A3D8F]/10" />
          </div>
          <span className="text-xs text-[#5A6472]">
            {filteredMembers.length} participantes · {dates.length} fechas
          </span>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f0eeea] flex-wrap">
          <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
            <span className="inline-block w-3.5 h-3.5 rounded bg-[#2D8B4E] text-white text-[0.5rem] font-bold leading-[14px] text-center">✓</span> Presente
          </span>
          <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
            <span className="inline-block w-3.5 h-3.5 rounded bg-[#E89B3A] text-white text-[0.5rem] font-bold leading-[14px] text-center">L</span> Tarde
          </span>
          <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
            <span className="inline-block w-3.5 h-3.5 rounded bg-[#C0392B] text-white text-[0.5rem] font-bold leading-[14px] text-center">✗</span> Ausente
          </span>
          <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
            <span className="inline-block w-3.5 h-3.5 rounded bg-[#f0eeea] text-[#C5CDD8] text-[0.5rem] leading-[14px] text-center">&mdash;</span> Sin dato
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
        <div className="overflow-x-scroll overflow-y-auto max-h-[calc(100vh-340px)]"
          style={{ scrollbarGutter: 'stable' }}>
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-30">
              <tr className="bg-[#1B2A6B]">
                <th className="sticky left-0 z-40 bg-[#1B2A6B] px-3 py-2.5 text-left text-white font-semibold min-w-[200px]">
                  Nombre
                </th>
                <th className="sticky left-[200px] z-40 bg-[#1B2A6B] px-2 py-2.5 text-center text-white font-semibold min-w-[44px]">%</th>
                {dates.map(d => {
                  const { day, weekday } = fmtDate(d);
                  const evName = eventByDate.get(d);
                  return (
                    <th key={d} className={`px-0.5 py-1.5 text-center min-w-[32px] ${evName ? 'bg-[#E8687D]' : 'bg-[#233580]'}`}
                      title={evName || undefined}>
                      {evName ? (
                        <><div className="text-[0.55rem] text-white/70">★</div><div className="text-[0.65rem] text-white font-semibold">{day}</div></>
                      ) : (
                        <><div className="text-[0.6rem] capitalize text-white/50">{weekday}</div><div className="text-[0.7rem] text-white font-semibold">{day}</div></>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, idx) => {
                const stats = memberStats.get(member.contactId);
                const rate = stats?.rate ?? 0;
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]';

                return (
                  <tr key={member.contactId} className={`${rowBg} hover:bg-[#E3F2FD]/30 transition-colors`}>
                    <td className={`sticky left-0 z-10 px-3 py-2 border-b border-[#f0eeea] ${rowBg}`}>
                      <span className="font-medium text-[#1A1A2E] whitespace-nowrap">{member.fullName}</span>
                    </td>
                    <td className={`sticky left-[200px] z-10 px-2 py-2 text-center font-bold border-b border-[#f0eeea] ${rowBg}`}>
                      <span className={`${rate >= 70 ? 'text-[#2D8B4E]' : rate >= 40 ? 'text-[#E89B3A]' : 'text-[#C0392B]'}`}>
                        {stats?.total ? `${rate}%` : '\u2014'}
                      </span>
                    </td>
                    {dates.map(d => {
                      const val = getVal(member.contactId, d);
                      return (
                        <td key={d} className="px-0.5 py-2 text-center border-b border-[#f0eeea]">
                          <button
                            onClick={() => handleCellClick(member.contactId, d)}
                            className="inline-flex items-center justify-center w-5 h-5 rounded text-[0.6rem] font-bold leading-5 transition-all hover:scale-110 hover:shadow-sm cursor-pointer"
                            title={`Click: ${val === true ? '\u2192 Tarde' : val === 'late' ? '\u2192 Ausente' : val === false ? '\u2192 Sin dato' : '\u2192 Presente'}`}
                          >
                            {val === true
                              ? <span className="w-5 h-5 rounded bg-[#2D8B4E] text-white leading-5 text-center">✓</span>
                              : val === 'late'
                              ? <span className="w-5 h-5 rounded bg-[#E89B3A] text-white leading-5 text-center">L</span>
                              : val === false
                              ? <span className="w-5 h-5 rounded bg-[#C0392B] text-white leading-5 text-center">✗</span>
                              : <span className="w-5 h-5 rounded bg-[#f0eeea] text-[#C5CDD8] leading-5 text-center">&mdash;</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Footer stats */}
              <tr className="bg-[#F5F3EF] font-semibold border-t-2 border-[#D8E1EA]">
                <td className="sticky left-0 z-10 bg-[#F5F3EF] px-3 py-2 text-[#1B2A6B]">Total Presentes</td>
                <td className="sticky left-[200px] z-10 bg-[#F5F3EF] px-2 py-2 text-center text-[#1B2A6B]">&mdash;</td>
                {dates.map(d => {
                  const s = dateStats.get(d);
                  return (
                    <td key={d} className="px-0.5 py-2 text-center">
                      <span className="text-[0.65rem] text-[#2D8B4E] font-bold">{(s?.present ?? 0) + (s?.late ?? 0)}</span>
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-[#F5F3EF] font-semibold">
                <td className="sticky left-0 z-10 bg-[#F5F3EF] px-3 py-2 text-[#1B2A6B]">% Asistencia</td>
                <td className="sticky left-[200px] z-10 bg-[#F5F3EF] px-2 py-2 text-center text-[#1B2A6B]">&mdash;</td>
                {dates.map(d => {
                  const s = dateStats.get(d);
                  const r = s?.rate ?? 0;
                  return (
                    <td key={d} className="px-0.5 py-2 text-center">
                      <span className={`text-[0.65rem] font-bold ${r >= 70 ? 'text-[#2D8B4E]' : r >= 40 ? 'text-[#E89B3A]' : 'text-[#C0392B]'}`}>{r}%</span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12 text-sm text-[#5A6472]">
              {search ? 'No se encontraron resultados.' : 'No hay participantes en este grupo.'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


// ═══════════════════════════════════════════════════════
// SOMAttendanceGrid — Legacy SOM Excel-imported attendance
// ═══════════════════════════════════════════════════════

function SOMAttendanceGrid() {
  const {
    attendance, isImported, setShowImportModal, updateAttendanceCell, events,
    getMemberStatus, dropMember, reactivateMember, addNewMember,
    activeMembers, droppedMembers,
  } = useData();
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showEvents, setShowEvents] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [dropConfirm, setDropConfirm] = useState<string | null>(null);
  // Sort
  const [sortField, setSortField] = useState<SortField>('lastName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  // Collapsible months
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  // Member action menu (fixed position)
  const [menuInfo, setMenuInfo] = useState<{ contactId: string; x: number; y: number } | null>(null);

  const toggleMonth = (name: string) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // Members based on status filter
  const baseMembers = useMemo(() => {
    if (!attendance) return [];
    if (statusFilter === 'active') return activeMembers;
    if (statusFilter === 'dropped') return droppedMembers;
    return attendance.members.map(m => ({ ...m }));
  }, [attendance, statusFilter, activeMembers, droppedMembers]);

  // Filter by search, then sort
  const filteredMembers = useMemo(() => {
    let list = baseMembers;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(m =>
        m.fullName.toLowerCase().includes(q) ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        `${m.lastName} ${m.firstName}`.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sortField].toLowerCase();
      const bv = b[sortField].toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [baseMembers, search, sortField, sortDir]);

  // Filter dates by selected month
  const visibleSessionDates = useMemo(() => {
    if (!attendance) return [];
    if (selectedMonth === 'all') return attendance.dates;
    const month = attendance.months.find(m => m.name === selectedMonth);
    return month ? month.dates : attendance.dates;
  }, [attendance, selectedMonth]);

  // Build unified columns with month tag
  const allColumns = useMemo(() => {
    const cols: GridColumn[] = visibleSessionDates.map(d => ({ type: 'session' as ColumnType, date: d, month: getMonth(d) }));
    if (showEvents) {
      for (const evt of events) {
        const evtMonth = getMonth(evt.date);
        if (selectedMonth !== 'all' && evtMonth !== selectedMonth) continue;
        cols.push({ type: 'event', date: evt.date, event: evt, month: evtMonth });
      }
    }
    cols.sort((a, b) => a.date.localeCompare(b.date));
    return cols;
  }, [visibleSessionDates, events, showEvents, selectedMonth]);

  // Visible columns (exclude collapsed months)
  const columns = useMemo(() => {
    return allColumns.filter(c => !collapsedMonths.has(c.month));
  }, [allColumns, collapsedMonths]);

  // Detect "no session" dates
  const noSessionDates = useMemo(() => {
    if (!attendance) return new Set<string>();
    const set = new Set<string>();
    for (const d of visibleSessionDates) {
      let allNull = true;
      for (const m of attendance.members) {
        const val = (attendance.records[m.contactId] || {})[d];
        if (val !== null && val !== undefined) { allNull = false; break; }
      }
      if (allNull) set.add(d);
    }
    return set;
  }, [attendance, visibleSessionDates]);

  // Month groups for header — including collapsed placeholders
  const monthGroups = useMemo(() => {
    const groups: { name: string; count: number; collapsed: boolean; totalInMonth: number }[] = [];
    const seen = new Set<string>();
    const orderedMonths: string[] = [];
    for (const c of allColumns) {
      if (!seen.has(c.month)) { seen.add(c.month); orderedMonths.push(c.month); }
    }
    for (const monthName of orderedMonths) {
      const isCollapsed = collapsedMonths.has(monthName);
      const totalInMonth = allColumns.filter(c => c.month === monthName).length;
      if (isCollapsed) {
        groups.push({ name: monthName, count: 1, collapsed: true, totalInMonth });
      } else {
        const colsInMonth = columns.filter(c => c.month === monthName).length;
        if (colsInMonth > 0) groups.push({ name: monthName, count: colsInMonth, collapsed: false, totalInMonth });
      }
    }
    return groups;
  }, [allColumns, columns, collapsedMonths]);

  // For rendering: columns including collapsed placeholders
  const renderColumns = useMemo(() => {
    const result: (GridColumn | { type: 'collapsed'; month: string })[] = [];
    const seenCollapsed = new Set<string>();
    for (const col of allColumns) {
      if (collapsedMonths.has(col.month)) {
        if (!seenCollapsed.has(col.month)) {
          seenCollapsed.add(col.month);
          result.push({ type: 'collapsed', month: col.month });
        }
      } else {
        result.push(col);
      }
    }
    return result;
  }, [allColumns, collapsedMonths]);

  // Per-member stats
  const memberStats = useMemo(() => {
    if (!attendance) return new Map<string, { present: number; late: number; absent: number; total: number; rate: number }>();
    const stats = new Map<string, { present: number; late: number; absent: number; total: number; rate: number }>();
    const activeDates = visibleSessionDates.filter(d => !noSessionDates.has(d));
    for (const m of filteredMembers) {
      const rec = attendance.records[m.contactId] || {};
      let present = 0, late = 0, absent = 0;
      for (const d of activeDates) {
        const v = rec[d];
        if (v === true) present++;
        else if (v === 'late') late++;
        else if (v === false) absent++;
      }
      const total = present + late + absent;
      const effectivePresent = present + (late * 0.5);
      stats.set(m.contactId, { present, late, absent, total, rate: total > 0 ? Math.round((effectivePresent / total) * 100) : 0 });
    }
    return stats;
  }, [attendance, visibleSessionDates, noSessionDates, filteredMembers]);

  // Per-date stats
  const dateStats = useMemo(() => {
    if (!attendance) return new Map<string, { present: number; late: number; absent: number; rate: number }>();
    const stats = new Map<string, { present: number; late: number; absent: number; rate: number }>();
    for (const d of visibleSessionDates) {
      let present = 0, late = 0, absent = 0;
      for (const m of filteredMembers) {
        const v = (attendance.records[m.contactId] || {})[d];
        if (v === true) present++;
        else if (v === 'late') late++;
        else if (v === false) absent++;
      }
      const total = present + late + absent;
      stats.set(d, { present, late, absent, rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0 });
    }
    return stats;
  }, [attendance, visibleSessionDates, filteredMembers]);

  const fmtDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return { day: d.getDate(), weekday: d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3) };
  };

  const handleCellClick = (contactId: string, date: string, currentVal: boolean | 'late' | null | undefined) => {
    let next: boolean | 'late' | null;
    if (currentVal === null || currentVal === undefined) next = true;
    else if (currentVal === true) next = 'late';
    else if (currentVal === 'late') next = false;
    else next = null;
    updateAttendanceCell(contactId, date, next);
  };

  const openMenu = (contactId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuInfo({ contactId, x: rect.left, y: rect.bottom + 4 });
  };

  // ── No data state ──
  if (!isImported || !attendance) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#E3F2FD] mx-auto mb-4 flex items-center justify-center">
          <Upload className="w-8 h-8 text-[#1B2A6B]" />
        </div>
        <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Importar Asistencia SOM</h3>
        <p className="text-sm text-[#5A6472] max-w-md mx-auto mb-6">
          Subi el archivo SOM ATTENDANCE.xlsx para ver la grilla completa de asistencia.
        </p>
        <button onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all mx-auto">
          <Upload className="w-4 h-4" /> Importar Archivo
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
            <input type="text" placeholder="Buscar miembro..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F] focus:ring-2 focus:ring-[#2A3D8F]/10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#5A6472]" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#2A3D8F]">
              <option value="all">Todos los meses</option>
              {attendance.months.map(m => (
                <option key={m.name} value={m.name}>{m.name} ({m.dates.length})</option>
              ))}
            </select>
          </div>
          <div className="flex rounded-lg border border-[#D8E1EA] overflow-hidden">
            {([['active', 'Activos'], ['dropped', 'Bajas'], ['all', 'Todos']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === val ? 'bg-[#1B2A6B] text-white' : 'bg-white text-[#5A6472] hover:bg-[#f8f7f5]'}`}>
                {label}{val === 'dropped' && droppedMembers.length > 0 && <span className="ml-1 text-[0.6rem] opacity-70">({droppedMembers.length})</span>}
              </button>
            ))}
          </div>
          {events.length > 0 && (
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)}
                className="rounded border-[#D8E1EA] text-[#E8687D] focus:ring-[#E8687D]" />
              <Star className="w-3.5 h-3.5 text-[#E8687D]" />
              <span className="text-[#5A6472] font-medium">Eventos</span>
            </label>
          )}
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2D8B4E] text-white text-xs font-medium hover:bg-[#24734A] transition-all ml-auto">
            <UserPlus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f0eeea] flex-wrap">
          <span className="text-xs text-[#5A6472]">
            {filteredMembers.length} miembros
            {droppedMembers.length > 0 && statusFilter === 'active' && <span className="text-[#C0392B]"> · {droppedMembers.length} bajas</span>}
          </span>
          <span className="text-[0.6rem] text-[#999]">|</span>
          <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
            <span className="inline-block w-3.5 h-3.5 rounded bg-[#2D8B4E] text-white text-[0.5rem] font-bold leading-[14px] text-center">✓</span> Presente
          </span>
          <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
            <span className="inline-block w-3.5 h-3.5 rounded bg-[#E89B3A] text-white text-[0.5rem] font-bold leading-[14px] text-center">L</span> Tarde
          </span>
          <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
            <span className="inline-block w-3.5 h-3.5 rounded bg-[#C0392B] text-white text-[0.5rem] font-bold leading-[14px] text-center">✗</span> Ausente
          </span>
          <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
            <span className="inline-block w-3.5 h-3.5 rounded bg-[#f0eeea] text-[#C5CDD8] text-[0.5rem] leading-[14px] text-center">&mdash;</span> Sin dato
          </span>
          {noSessionDates.size > 0 && (
            <span className="flex items-center gap-1 text-[0.65rem] text-[#5A6472]">
              <span className="inline-block w-3.5 h-3.5 rounded text-[0.5rem] leading-[14px] text-center" style={{ background: 'repeating-linear-gradient(45deg, #f0eeea, #f0eeea 2px, #e4e1da 2px, #e4e1da 4px)' }} /> Sin sesion
            </span>
          )}
          <span className="text-[0.6rem] text-[#999]">|</span>
          <span className="text-[0.65rem] text-[#5A6472]">Click encabezado mes para colapsar</span>
        </div>
      </div>

      {/* Grid — scrollbar always visible */}
      <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
        <div className="overflow-x-scroll overflow-y-auto max-h-[calc(100vh-280px)]"
          style={{ scrollbarGutter: 'stable' }}>
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-30">
              {/* Month header row */}
              <tr className="bg-[#1B2A6B]">
                <th className="sticky left-0 z-40 bg-[#1B2A6B] px-2 py-2 text-left text-white font-semibold min-w-[200px]" rowSpan={2}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleSort('lastName')} className="hover:text-[#C5E3F6] transition-colors flex items-center gap-0.5"
                      title="Ordenar por apellido">
                      Apellido{sortField === 'lastName' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                    <span className="text-white/30">/</span>
                    <button onClick={() => toggleSort('firstName')} className="hover:text-[#C5E3F6] transition-colors flex items-center gap-0.5"
                      title="Ordenar por nombre">
                      Nombre{sortField === 'firstName' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </div>
                </th>
                <th className="sticky left-[200px] z-40 bg-[#1B2A6B] px-2 py-2 text-center text-white font-semibold min-w-[44px]" rowSpan={2}>%</th>
                {monthGroups.map((g, i) => (
                  <th key={`month-${i}`}
                    colSpan={g.count}
                    className={`px-1 py-1.5 text-center font-semibold text-[0.7rem] uppercase tracking-wider border-l border-white/10 cursor-pointer select-none transition-colors ${g.collapsed ? 'bg-[#5A6472] hover:bg-[#6b7785]' : 'text-[#C5E3F6] hover:bg-[#2A3D8F]'}`}
                    onClick={() => toggleMonth(g.name)}
                    title={g.collapsed ? `Expandir ${g.name} (${g.totalInMonth} columnas)` : `Colapsar ${g.name}`}>
                    <div className="flex items-center justify-center gap-1">
                      {g.collapsed
                        ? <ChevronRight className="w-3 h-3 text-white/60" />
                        : <ChevronDown className="w-3 h-3 text-white/40" />}
                      <span className={g.collapsed ? 'text-white/80' : ''}>{g.name}</span>
                      {g.collapsed && <span className="text-white/40 text-[0.55rem]">({g.totalInMonth})</span>}
                    </div>
                  </th>
                ))}
              </tr>
              {/* Date sub-headers */}
              <tr>
                {renderColumns.map((col, i) => {
                  if (col.type === 'collapsed') {
                    return <th key={`collapsed-${col.month}`} className="bg-[#5A6472] min-w-[20px] px-0" />;
                  }
                  const { day, weekday } = fmtDate(col.date);
                  const isEvent = col.type === 'event';
                  const isNoSession = col.type === 'session' && noSessionDates.has(col.date);
                  const prevRendered = renderColumns[i - 1];
                  const isFirstOfMonth = i === 0 || !prevRendered || prevRendered.type === 'collapsed' || col.month !== (prevRendered as GridColumn).month;
                  return (
                    <th key={`${col.type}-${col.date}-${col.event?.id || ''}`}
                      className={`px-0.5 py-1.5 text-center min-w-[32px] ${isFirstOfMonth ? 'border-l border-white/10' : ''} ${isEvent ? 'bg-[#E8687D]' : isNoSession ? 'bg-[#5A6472]' : 'bg-[#233580]'}`}
                      title={isEvent ? col.event!.name : isNoSession ? 'No hubo sesion' : undefined}>
                      {isEvent ? (
                        <><div className="text-[0.55rem] text-white/70">★</div><div className="text-[0.65rem] text-white font-semibold">{day}</div></>
                      ) : (
                        <><div className={`text-[0.6rem] capitalize ${isNoSession ? 'text-white/40' : 'text-white/50'}`}>{weekday}</div>
                        <div className={`text-[0.7rem] font-semibold ${isNoSession ? 'text-white/50 line-through' : 'text-white'}`}>{day}</div></>
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
                const isDropped = getMemberStatus(member.contactId) === 'dropped';

                return (
                  <tr key={member.contactId} className={`${rowBg} ${isDropped ? 'opacity-50' : ''} hover:bg-[#E3F2FD]/30 transition-colors`}>
                    <td className={`sticky left-0 z-10 px-2 py-2 border-b border-[#f0eeea] ${rowBg} ${isDropped ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => openMenu(member.contactId, e)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#e8e5de] transition-colors flex-shrink-0">
                          <MoreVertical className="w-3 h-3 text-[#999]" />
                        </button>
                        <span className={`font-medium text-[#1A1A2E] whitespace-nowrap ${isDropped ? 'line-through' : ''}`}>
                          {member.lastName}, {member.firstName}
                        </span>
                        {isDropped && <span className="text-[0.55rem] text-[#C0392B] font-semibold ml-1">BAJA</span>}
                      </div>
                    </td>
                    <td className={`sticky left-[200px] z-10 px-2 py-2 text-center font-bold border-b border-[#f0eeea] ${rowBg}`}>
                      <span className={`${rate >= 70 ? 'text-[#2D8B4E]' : rate >= 40 ? 'text-[#E89B3A]' : 'text-[#C0392B]'}`}>
                        {stats?.total ? `${rate}%` : '\u2014'}
                      </span>
                    </td>
                    {renderColumns.map((col, di) => {
                      if (col.type === 'collapsed') {
                        return <td key={`collapsed-${col.month}-${member.contactId}`}
                          className="bg-[#f4f2ee] border-b border-[#e8e5de] min-w-[20px] px-0" />;
                      }
                      const isEvent = col.type === 'event';
                      const isNoSession = col.type === 'session' && noSessionDates.has(col.date);
                      const prevRendered = renderColumns[di - 1];
                      const isFirstOfMonth = di === 0 || !prevRendered || prevRendered.type === 'collapsed' || col.month !== (prevRendered as GridColumn).month;

                      if (isEvent) {
                        const attended = col.event!.attendees.includes(member.contactId);
                        return (
                          <td key={`evt-${col.event!.id}`} className={`px-0.5 py-2 text-center border-b border-[#f0eeea] bg-[#FFF5F6] ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}
                            title={`${col.event!.name}: ${attended ? 'Asistio' : 'No asistio'}`}>
                            {attended
                              ? <span className="inline-block w-5 h-5 rounded bg-[#E8687D] text-white text-[0.6rem] font-bold leading-5">★</span>
                              : <span className="inline-block w-5 h-5 rounded bg-[#f0eeea] text-[#D8CCC4] text-[0.6rem] leading-5">&mdash;</span>}
                          </td>
                        );
                      }
                      if (isNoSession) {
                        return (
                          <td key={col.date} className={`px-0.5 py-2 text-center border-b border-[#f0eeea] ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`} title="No hubo sesion">
                            <span className="inline-block w-5 h-5 rounded text-[0.5rem] text-[#b8b0a4] leading-5"
                              style={{ background: 'repeating-linear-gradient(45deg, #f0eeea, #f0eeea 2px, #e4e1da 2px, #e4e1da 4px)' }} />
                          </td>
                        );
                      }
                      const val = rec[col.date];
                      return (
                        <td key={col.date} className={`px-0.5 py-2 text-center border-b border-[#f0eeea] ${isFirstOfMonth ? 'border-l border-[#D8E1EA]' : ''}`}>
                          <button onClick={() => handleCellClick(member.contactId, col.date, val)}
                            className="inline-flex items-center justify-center w-5 h-5 rounded text-[0.6rem] font-bold leading-5 transition-all hover:scale-110 hover:shadow-sm cursor-pointer"
                            title={`Click: ${val === true ? '\u2192 Tarde' : val === 'late' ? '\u2192 Ausente' : val === false ? '\u2192 Sin dato' : '\u2192 Presente'}`}>
                            {val === true
                              ? <span className="w-5 h-5 rounded bg-[#2D8B4E] text-white leading-5 text-center">✓</span>
                              : val === 'late'
                              ? <span className="w-5 h-5 rounded bg-[#E89B3A] text-white leading-5 text-center">L</span>
                              : val === false
                              ? <span className="w-5 h-5 rounded bg-[#C0392B] text-white leading-5 text-center">✗</span>
                              : <span className="w-5 h-5 rounded bg-[#f0eeea] text-[#C5CDD8] leading-5 text-center">&mdash;</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Footer stats */}
              <tr className="bg-[#F5F3EF] font-semibold border-t-2 border-[#D8E1EA]">
                <td className="sticky left-0 z-10 bg-[#F5F3EF] px-3 py-2 text-[#1B2A6B]">Total Presentes</td>
                <td className="sticky left-[200px] z-10 bg-[#F5F3EF] px-2 py-2 text-center text-[#1B2A6B]">&mdash;</td>
                {renderColumns.map((col, di) => {
                  if (col.type === 'collapsed') return <td key={`collapsed-foot-${col.month}`} className="bg-[#eae7e1] px-0" />;
                  if (col.type === 'event') {
                    return <td key={`evt-foot-${col.event!.id}`} className="px-0.5 py-2 text-center bg-[#FFF5F6]">
                      <span className="text-[0.65rem] text-[#E8687D] font-bold">{col.event!.attendees.length}</span></td>;
                  }
                  if (noSessionDates.has(col.date)) {
                    return <td key={col.date} className="px-0.5 py-2 text-center"><span className="text-[0.65rem] text-[#b8b0a4]">&mdash;</span></td>;
                  }
                  const s = dateStats.get(col.date);
                  return <td key={col.date} className="px-0.5 py-2 text-center">
                    <span className="text-[0.65rem] text-[#2D8B4E] font-bold">{(s?.present ?? 0) + (s?.late ?? 0)}</span></td>;
                })}
              </tr>
              <tr className="bg-[#F5F3EF] font-semibold">
                <td className="sticky left-0 z-10 bg-[#F5F3EF] px-3 py-2 text-[#1B2A6B]">% Asistencia</td>
                <td className="sticky left-[200px] z-10 bg-[#F5F3EF] px-2 py-2 text-center text-[#1B2A6B]">&mdash;</td>
                {renderColumns.map((col, di) => {
                  if (col.type === 'collapsed') return <td key={`collapsed-pct-${col.month}`} className="bg-[#eae7e1] px-0" />;
                  if (col.type === 'event') {
                    const pct = attendance.members.length > 0 ? Math.round((col.event!.attendees.length / attendance.members.length) * 100) : 0;
                    return <td key={`evt-pct-${col.event!.id}`} className="px-0.5 py-2 text-center bg-[#FFF5F6]">
                      <span className="text-[0.65rem] text-[#E8687D] font-bold">{pct}%</span></td>;
                  }
                  if (noSessionDates.has(col.date)) {
                    return <td key={col.date} className="px-0.5 py-2 text-center"><span className="text-[0.65rem] text-[#b8b0a4]">&mdash;</span></td>;
                  }
                  const s = dateStats.get(col.date);
                  const r = s?.rate ?? 0;
                  return <td key={col.date} className="px-0.5 py-2 text-center">
                    <span className={`text-[0.65rem] font-bold ${r >= 70 ? 'text-[#2D8B4E]' : r >= 40 ? 'text-[#E89B3A]' : 'text-[#C0392B]'}`}>{r}%</span></td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed-position member action menu */}
      {menuInfo && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setMenuInfo(null)} />
          <div className="fixed z-[95] bg-white rounded-lg shadow-lg border border-[#D8E1EA] py-1 min-w-[160px]"
            style={{ left: menuInfo.x, top: menuInfo.y }}>
            {getMemberStatus(menuInfo.contactId) === 'dropped' ? (
              <button onClick={() => { reactivateMember(menuInfo.contactId); setMenuInfo(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#2D8B4E] hover:bg-[#f4f2ee] transition-colors text-left">
                <RotateCcw className="w-3.5 h-3.5" /> Reactivar miembro
              </button>
            ) : (
              <button onClick={() => { setDropConfirm(menuInfo.contactId); setMenuInfo(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#C0392B] hover:bg-[#f4f2ee] transition-colors text-left">
                <UserMinus className="w-3.5 h-3.5" /> Dar de baja
              </button>
            )}
          </div>
        </>
      )}

      {dropConfirm && (
        <DropConfirmModal
          memberName={attendance.members.find(m => m.contactId === dropConfirm)?.fullName || ''}
          onConfirm={(date) => { dropMember(dropConfirm, date); setDropConfirm(null); }}
          onCancel={() => setDropConfirm(null)}
        />
      )}

      {showAddModal && (
        <AddMemberModal
          onSave={(first, last, date) => { addNewMember(first, last, date); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}

// ─── Drop Confirmation Modal ───
function DropConfirmModal({ memberName, onConfirm, onCancel }: {
  memberName: string; onConfirm: (date: string) => void; onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><UserMinus className="w-5 h-5 text-[#C0392B]" /></div>
          <div><h3 className="font-serif font-bold text-[#1B2A6B]">Dar de baja</h3><p className="text-sm text-[#5A6472]">{memberName}</p></div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Fecha de baja</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-[#D8E1EA] text-sm font-medium hover:bg-[#f8f7f5] transition-all">Cancelar</button>
          <button onClick={() => onConfirm(date)} className="flex-1 py-2 rounded-lg bg-[#C0392B] text-white text-sm font-medium hover:bg-[#A93226] transition-all">Confirmar Baja</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ───
function AddMemberModal({ onSave, onClose }: {
  onSave: (firstName: string, lastName: string, joinDate: string) => void; onClose: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#E3F2FD] flex items-center justify-center"><UserPlus className="w-5 h-5 text-[#2D8B4E]" /></div>
          <div><h3 className="font-serif font-bold text-[#1B2A6B]">Agregar Miembro</h3><p className="text-xs text-[#5A6472]">Se suma a la lista de SOM</p></div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Nombre</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nombre..."
              className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Apellido</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apellido..."
              className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Fecha de ingreso</label>
            <input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#D8E1EA] text-sm font-medium hover:bg-[#f8f7f5] transition-all">Cancelar</button>
          <button onClick={() => { if (firstName.trim() && lastName.trim()) onSave(firstName, lastName, joinDate); }}
            disabled={!firstName.trim() || !lastName.trim()}
            className="flex-1 py-2 rounded-lg bg-[#2D8B4E] text-white text-sm font-medium hover:bg-[#24734A] transition-all disabled:opacity-40">Agregar</button>
        </div>
      </div>
    </div>
  );
}
