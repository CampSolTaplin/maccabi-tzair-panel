'use client';

import { useState, useMemo } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { Chanich, CommunityEvent } from '@/types';
import { Users, TrendingUp, CalendarCheck, Upload, UserCheck, AlertTriangle } from 'lucide-react';

// ── Group definitions (same as attendance page) ──

const PROGRAM_GROUPS = ['Pre-SOM', 'Trips', 'Machanot'];

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
  { key: 'Trips', label: 'Trips', area: 'Special', color: 'text-rose-700' },
  { key: 'Machanot', label: 'Machanot', area: 'Special', color: 'text-cyan-700' },
];

function matchesGroup(groupKey: string, chanich: Chanich): boolean {
  if (PROGRAM_GROUPS.includes(groupKey)) return chanich.program === groupKey;
  return chanich.gradeLevel.toLowerCase().includes(groupKey.toLowerCase());
}

const MONTH_NAMES: Record<number, string> = {
  0: 'January', 1: 'February', 2: 'March', 3: 'April', 4: 'May', 5: 'June',
  6: 'July', 7: 'August', 8: 'September', 9: 'October', 10: 'November', 11: 'December',
};

export default function DashboardPage() {
  const {
    attendance, isImported, setShowImportModal, activeMembers,
    rosterData, groupAttendance, getEnabledDatesForGroup,
    events, noSessionDates,
  } = useData();

  const [selectedGroup, setSelectedGroup] = useState<string>('som-legacy');

  // Available roster groups (that have members)
  const availableGroups = useMemo(() => {
    if (!rosterData) return [];
    return GROUP_DEFS.filter(g =>
      rosterData.chanichim.some(c => matchesGroup(g.key, c))
    ).map(g => ({
      ...g,
      count: rosterData.chanichim.filter(c => matchesGroup(g.key, c)).length,
    }));
  }, [rosterData]);

  const areaGrouped = useMemo(() => {
    const map = new Map<string, typeof availableGroups>();
    for (const g of availableGroups) {
      if (!map.has(g.area)) map.set(g.area, []);
      map.get(g.area)!.push(g);
    }
    return map;
  }, [availableGroups]);

  // ── Legacy SOM KPIs ──
  const somKpis = useMemo(() => {
    if (!attendance) return null;

    const totalMembers = activeMembers.length;
    const totalSessions = attendance.dates.length;

    let totalPresent = 0, totalLate = 0, totalAbsent = 0;
    for (const m of activeMembers) {
      const rec = attendance.records[m.contactId] || {};
      for (const d of attendance.dates) {
        if (rec[d] === true) totalPresent++;
        else if (rec[d] === 'late') totalLate++;
        else if (rec[d] === false) totalAbsent++;
      }
    }
    const totalMarked = totalPresent + totalLate + totalAbsent;
    const overallRate = totalMarked > 0 ? Math.round(((totalPresent + totalLate) / totalMarked) * 100) : 0;

    // Last session
    const lastDate = attendance.dates[attendance.dates.length - 1];
    let lastPresent = 0, lastLate = 0, lastAbsent = 0;
    for (const m of activeMembers) {
      const v = (attendance.records[m.contactId] || {})[lastDate];
      if (v === true) lastPresent++;
      else if (v === 'late') lastLate++;
      else if (v === false) lastAbsent++;
    }
    const lastTotal = lastPresent + lastLate + lastAbsent;
    const lastRate = lastTotal > 0 ? Math.round(((lastPresent + lastLate) / lastTotal) * 100) : 0;

    // Monthly
    const monthlyRates = attendance.months.map(month => {
      let p = 0, l = 0, a = 0;
      for (const m of activeMembers) {
        const rec = attendance.records[m.contactId] || {};
        for (const d of month.dates) {
          if (rec[d] === true) p++;
          else if (rec[d] === 'late') l++;
          else if (rec[d] === false) a++;
        }
      }
      const total = p + l + a;
      return { name: month.name, sessions: month.dates.length, rate: total > 0 ? Math.round(((p + l) / total) * 100) : 0 };
    });

    // Member rankings
    const memberRates = activeMembers.map(m => {
      const rec = attendance.records[m.contactId] || {};
      let p = 0, l = 0, a = 0;
      for (const d of attendance.dates) {
        if (rec[d] === true) p++;
        else if (rec[d] === 'late') l++;
        else if (rec[d] === false) a++;
      }
      const total = p + l + a;
      return { ...m, present: p + l, absent: a, total, rate: total > 0 ? Math.round(((p + l) / total) * 100) : 0 };
    }).filter(m => m.total > 0);
    memberRates.sort((a, b) => b.rate - a.rate);

    return {
      totalMembers, totalSessions, overallRate, totalPresent, totalAbsent,
      lastDate, lastPresent, lastAbsent, lastRate,
      monthlyRates,
      topMembers: memberRates.slice(0, 5),
      bottomMembers: [...memberRates].sort((a, b) => a.rate - b.rate).slice(0, 5),
    };
  }, [attendance, activeMembers]);

  // ── Group-based KPIs ──
  const groupKpis = useMemo(() => {
    if (selectedGroup === 'som-legacy' || !rosterData) return null;

    const noSessionSet = new Set(noSessionDates);
    const enabledDates = getEnabledDatesForGroup(selectedGroup);

    // Members for this group
    const seen = new Set<string>();
    const members = rosterData.chanichim
      .filter(c => matchesGroup(selectedGroup, c))
      .filter(c => {
        if (!c.contactId) return true;
        if (seen.has(c.contactId)) return false;
        seen.add(c.contactId);
        return true;
      });

    if (members.length === 0 || enabledDates.length === 0) return null;

    // All dates sorted
    const allDates = [...new Set([...enabledDates, ...noSessionDates])].sort();

    // Build event lookup for this group
    const eventDates = new Set(
      events
        .filter((e: CommunityEvent) => !e.groups || e.groups.length === 0 || e.groups.includes(selectedGroup))
        .map((e: CommunityEvent) => e.date)
    );

    // Regular dates = not event, not no-session
    const regularDates = allDates.filter(d => !eventDates.has(d) && !noSessionSet.has(d));

    const groupRecs = groupAttendance[selectedGroup] || {};

    // Overall stats (only regular dates)
    let totalPresent = 0, totalLate = 0, totalAbsent = 0;
    for (const m of members) {
      const rec = groupRecs[m.contactId] || {};
      for (const d of regularDates) {
        if (rec[d] === true) totalPresent++;
        else if (rec[d] === 'late') totalLate++;
        else if (rec[d] === false) totalAbsent++;
      }
    }
    const totalMarked = totalPresent + totalLate + totalAbsent;
    const overallRate = totalMarked > 0 ? Math.round(((totalPresent + totalLate) / totalMarked) * 100) : 0;

    // Last session (most recent regular date with any data)
    let lastDate = '';
    for (let i = regularDates.length - 1; i >= 0; i--) {
      const d = regularDates[i];
      const hasData = members.some(m => {
        const v = (groupRecs[m.contactId] || {})[d];
        return v === true || v === 'late' || v === false;
      });
      if (hasData) { lastDate = d; break; }
    }
    if (!lastDate && regularDates.length > 0) lastDate = regularDates[regularDates.length - 1];

    let lastPresent = 0, lastLate = 0, lastAbsent = 0;
    if (lastDate) {
      for (const m of members) {
        const v = (groupRecs[m.contactId] || {})[lastDate];
        if (v === true) lastPresent++;
        else if (v === 'late') lastLate++;
        else if (v === false) lastAbsent++;
      }
    }
    const lastTotal = lastPresent + lastLate + lastAbsent;
    const lastRate = lastTotal > 0 ? Math.round(((lastPresent + lastLate) / lastTotal) * 100) : 0;

    // Monthly breakdown (only regular dates)
    const monthMap = new Map<string, { name: string; dates: string[] }>();
    for (const d of regularDates) {
      const dt = new Date(d + 'T12:00:00');
      const monthKey = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, '0')}`;
      const monthName = MONTH_NAMES[dt.getMonth()] || '';
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { name: monthName, dates: [] });
      monthMap.get(monthKey)!.dates.push(d);
    }
    const monthlyRates = Array.from(monthMap.values()).map(month => {
      let p = 0, l = 0, a = 0;
      for (const m of members) {
        const rec = groupRecs[m.contactId] || {};
        for (const d of month.dates) {
          if (rec[d] === true) p++;
          else if (rec[d] === 'late') l++;
          else if (rec[d] === false) a++;
        }
      }
      const total = p + l + a;
      return { name: month.name, sessions: month.dates.length, rate: total > 0 ? Math.round(((p + l) / total) * 100) : 0 };
    });

    // Member rankings (only regular dates)
    const memberRates = members.map(m => {
      const rec = groupRecs[m.contactId] || {};
      let p = 0, l = 0, a = 0;
      for (const d of regularDates) {
        if (rec[d] === true) p++;
        else if (rec[d] === 'late') l++;
        else if (rec[d] === false) a++;
      }
      const total = p + l + a;
      return { contactId: m.contactId, fullName: m.fullName, present: p + l, absent: a, total, rate: total > 0 ? Math.round(((p + l) / total) * 100) : 0 };
    }).filter(m => m.total > 0);
    memberRates.sort((a, b) => b.rate - a.rate);

    return {
      totalMembers: members.length,
      totalSessions: regularDates.length,
      overallRate,
      totalPresent,
      totalAbsent,
      lastDate,
      lastPresent,
      lastAbsent,
      lastRate,
      monthlyRates,
      topMembers: memberRates.slice(0, 5),
      bottomMembers: [...memberRates].sort((a, b) => a.rate - b.rate).slice(0, 5),
    };
  }, [selectedGroup, rosterData, groupAttendance, getEnabledDatesForGroup, events, noSessionDates]);

  // Choose which KPIs to display
  const kpis = selectedGroup === 'som-legacy' ? somKpis : groupKpis;

  const hasAnyData = isImported || availableGroups.length > 0;

  // Empty state
  if (!hasAnyData) {
    return (
      <>
        <Topbar title="Dashboard" subtitle="Maccabi Tzair — Season 2025/2026" />
        <div className="p-7">
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E3F2FD] mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-[#1B2A6B]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Welcome to the Dashboard</h3>
            <p className="text-sm text-[#5A6472] max-w-md mx-auto mb-6">
              Import the SOM attendance file or the Salesforce roster to view statistics, trends, and participation metrics.
            </p>
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all mx-auto">
              <Upload className="w-4 h-4" /> Import Attendance
            </button>
          </div>
        </div>
      </>
    );
  }

  const groupLabel = selectedGroup === 'som-legacy'
    ? 'SOM (Excel)'
    : availableGroups.find(g => g.key === selectedGroup)?.label || selectedGroup;

  const fmtLast = (dateStr: string) => {
    if (!dateStr) return 'No sessions yet';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <>
      <Topbar title="Dashboard" subtitle={`${groupLabel} — Season 2025/2026`} />
      <div className="p-7">
        {/* Group selector */}
        {(availableGroups.length > 0 || isImported) && (
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#5A6472]" />
              <span className="text-xs font-semibold text-[#5A6472] uppercase tracking-wider">Group</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
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
              {Array.from(areaGrouped.entries()).map(([area, groups], i) => (
                <span key={area} className="contents">
                  {(i > 0 || isImported) && <span className="text-[#D8E1EA] mx-0.5 text-xs">|</span>}
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
                    </button>
                  ))}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* No data for selected group */}
        {!kpis ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
            <CalendarCheck className="w-14 h-14 text-[#D8E1EA] mx-auto mb-4" />
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">No attendance data yet</h3>
            <p className="text-sm text-[#5A6472] max-w-md mx-auto">
              {selectedGroup === 'som-legacy'
                ? 'Import the SOM attendance file to view statistics.'
                : 'Enable dates in Settings and take attendance in the Attendance section to see stats here.'}
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
              <KPI icon={Users} label="Members" value={kpis.totalMembers} accent="#1B2A6B" bg="rgba(27,42,107,0.08)" sub={`${kpis.totalSessions} sessions recorded`} />
              <KPI icon={TrendingUp} label="Overall Attendance" value={`${kpis.overallRate}%`} accent="#2D8B4E" bg="rgba(45,139,78,0.1)" sub={`${kpis.totalPresent} total present`} />
              <KPI icon={CalendarCheck} label="Last Session" value={`${kpis.lastRate}%`} accent="#E8687D" bg="rgba(232,104,125,0.12)" sub={fmtLast(kpis.lastDate)} />
              <KPI icon={UserCheck} label="Last Present" value={`${kpis.lastPresent}/${kpis.lastPresent + kpis.lastAbsent}`} accent="#E89B3A" bg="rgba(232,155,58,0.1)" sub={`${kpis.lastPresent} present · ${kpis.lastAbsent} absent`} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Monthly rates */}
              <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#D8E1EA]">
                  <h3 className="text-[0.95rem] font-semibold text-[#1B2A6B]">Attendance by Month</h3>
                </div>
                <div className="px-5 py-3">
                  {kpis.monthlyRates.length === 0 ? (
                    <p className="text-sm text-[#5A6472] text-center py-4">No monthly data available.</p>
                  ) : (
                    kpis.monthlyRates.map(m => (
                      <div key={m.name} className="flex items-center justify-between py-2.5 border-b border-[#f0eeea] last:border-b-0">
                        <div className="min-w-[110px]">
                          <span className="text-[0.85rem] font-medium">{m.name}</span>
                          <span className="text-xs text-[#5A6472] ml-2">({m.sessions})</span>
                        </div>
                        <div className="flex-1 mx-4 h-2 bg-[#f0eeea] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.rate}%`, backgroundColor: m.rate >= 70 ? '#2D8B4E' : m.rate >= 40 ? '#E89B3A' : '#C0392B' }} />
                        </div>
                        <span className="text-sm font-bold min-w-[40px] text-right" style={{ color: m.rate >= 70 ? '#2D8B4E' : m.rate >= 40 ? '#E89B3A' : '#C0392B' }}>{m.rate}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Rankings */}
              <div className="space-y-5">
                <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#D8E1EA] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#2D8B4E]" />
                    <h3 className="text-[0.85rem] font-semibold text-[#1B2A6B]">Highest Attendance</h3>
                  </div>
                  <div className="px-5 py-2">
                    {kpis.topMembers.length === 0 ? (
                      <p className="text-sm text-[#5A6472] text-center py-3">No data yet.</p>
                    ) : (
                      kpis.topMembers.map((m, i) => (
                        <div key={m.contactId} className="flex items-center justify-between py-2 border-b border-[#f0eeea] last:border-b-0">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#2D8B4E] text-white text-[0.6rem] font-bold flex items-center justify-center">{i + 1}</span>
                            <span className="text-sm">{m.fullName}</span>
                          </div>
                          <span className="text-sm font-bold text-[#2D8B4E]">{m.rate}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#D8E1EA] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#C0392B]" />
                    <h3 className="text-[0.85rem] font-semibold text-[#1B2A6B]">Lowest Attendance</h3>
                  </div>
                  <div className="px-5 py-2">
                    {kpis.bottomMembers.length === 0 ? (
                      <p className="text-sm text-[#5A6472] text-center py-3">No data yet.</p>
                    ) : (
                      kpis.bottomMembers.map((m, i) => (
                        <div key={m.contactId} className="flex items-center justify-between py-2 border-b border-[#f0eeea] last:border-b-0">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#C0392B] text-white text-[0.6rem] font-bold flex items-center justify-center">{i + 1}</span>
                            <span className="text-sm">{m.fullName}</span>
                          </div>
                          <span className="text-sm font-bold text-[#C0392B]">{m.rate}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function KPI({ icon: Icon, label, value, accent, bg, sub }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; value: string | number; accent: string; bg: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs uppercase tracking-wider text-[#5A6472] font-semibold">{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon className="w-[18px] h-[18px]" style={{ color: accent }} />
        </div>
      </div>
      <h3 className="text-[1.7rem] font-serif font-bold leading-none" style={{ color: accent }}>{value}</h3>
      <p className="text-xs text-[#5A6472] mt-2 capitalize">{sub}</p>
    </div>
  );
}
