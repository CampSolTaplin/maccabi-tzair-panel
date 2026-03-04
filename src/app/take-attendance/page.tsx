'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { AttendanceValue, SOMAttendanceValue } from '@/types';
import {
  LogOut, Search, Check, Clock, X, ChevronDown, UserCircle, CalendarDays, Users, Star,
} from 'lucide-react';

/** Programs that are matched at program-level (not gradeLevel) */
const PROGRAM_GROUPS = ['Pre-SOM', 'SOM', 'Trips', 'Machanot'];

const GROUP_LABELS: Record<string, string> = {
  Kinder: 'Maccabi Katan — Kinder',
  '1st Grade': 'Maccabi Katan — 1st Grade',
  '2nd Grade': 'Maccabi Katan — 2nd Grade',
  '3rd Grade': 'Maccabi Katan — 3rd Grade',
  '4th Grade': 'Maccabi Katan — 4th Grade',
  '5th Grade': 'Maccabi Katan — 5th Grade',
  '6th Grade': 'Maccabi Noar — 6th Grade',
  '7th Grade': 'Maccabi Noar — 7th Grade',
  '8th Grade': 'Maccabi Noar — 8th Grade',
  'Pre-SOM': 'Pre School of Madrichim',
  SOM: 'School of Madrichim',
  Trips: 'Trips & Seminars',
  Machanot: 'Machanot',
};

interface MemberEntry {
  fullName: string;
  contactId: string;
  gradeLevel?: string;
}

export default function TakeAttendancePage() {
  const { user, logout } = useAuth();
  const {
    attendance, isImported, updateAttendanceCell,
    activeMembers, events, loading,
    rosterData, groupAttendance, updateGroupAttendance,
    getEnabledDatesForGroup,
    refreshAttendanceFromServer,
  } = useData();

  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const userGroup = user?.group || 'SOM';
  const groupLabel = GROUP_LABELS[userGroup] || userGroup;

  // Helper: check if a chanich matches the user's group
  const matchesGroup = (gradeLevel: string, program: string) => {
    // Program-level groups: match by program name
    if (PROGRAM_GROUPS.includes(userGroup)) {
      return program === userGroup;
    }
    // Grade-level groups: match by gradeLevel containing the group keyword
    const gl = gradeLevel.toLowerCase();
    const gk = userGroup.toLowerCase();
    return gl.includes(gk);
  };

  // Determine data source: roster-based or legacy SOM
  const useRosterFlow = useMemo(() => {
    if (!rosterData) return false;
    const rosterMembers = rosterData.chanichim.filter(c =>
      matchesGroup(c.gradeLevel, c.program)
    );
    return rosterMembers.length > 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterData, userGroup]);

  // Get member list
  const allGroupMembers: MemberEntry[] = useMemo(() => {
    if (useRosterFlow && rosterData) {
      // Use Set to avoid duplicate contactIds within the same group
      const seen = new Set<string>();
      return rosterData.chanichim
        .filter(c => matchesGroup(c.gradeLevel, c.program))
        .filter(c => {
          const id = c.contactId || c.courseOptionId;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .map(c => ({
          fullName: c.fullName,
          contactId: c.contactId || c.courseOptionId,
          gradeLevel: c.gradeLevel,
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    // Legacy SOM flow
    if (isImported && attendance) {
      return activeMembers.map(m => ({
        fullName: `${m.lastName}, ${m.firstName}`,
        contactId: m.contactId,
      })).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    return [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useRosterFlow, rosterData, userGroup, isImported, attendance, activeMembers]);

  // Get dates enabled for this madrich's group
  const groupEnabledDates = useMemo(() => {
    return getEnabledDatesForGroup(userGroup);
  }, [getEnabledDatesForGroup, userGroup]);

  // Sort enabled dates descending (most recent first), auto-select first
  const sortedEnabledDates = useMemo(() => {
    return [...groupEnabledDates].sort((a, b) => b.localeCompare(a));
  }, [groupEnabledDates]);

  // Auto-select the most recent enabled date
  const effectiveDate = selectedDate && groupEnabledDates.includes(selectedDate)
    ? selectedDate
    : sortedEnabledDates[0] || null;

  // Map event dates to event names (only events relevant to this group)
  const eventByDate = useMemo(() => {
    const relevant = events.filter(e =>
      !e.groups || e.groups.length === 0 || e.groups.includes(userGroup)
    );
    return new Map(relevant.map(e => [e.date, e.name]));
  }, [events, userGroup]);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allGroupMembers;
    if (q) {
      list = list.filter(m =>
        m.fullName.toLowerCase().includes(q) ||
        (m.gradeLevel && m.gradeLevel.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allGroupMembers, search]);

  // Get attendance value for a member on the selected date
  const getVal = (contactId: string): AttendanceValue => {
    if (!effectiveDate) return null;
    if (useRosterFlow) {
      return groupAttendance[userGroup]?.[contactId]?.[effectiveDate] ?? null;
    }
    // Legacy SOM
    if (!attendance) return null;
    const rec = attendance.records[contactId];
    if (!rec) return null;
    return rec[effectiveDate] ?? null;
  };

  // Set attendance for a member
  const setAttendanceValue = (contactId: string, val: AttendanceValue) => {
    if (!effectiveDate) return;
    if (useRosterFlow) {
      updateGroupAttendance(userGroup, contactId, effectiveDate, val);
    } else {
      updateAttendanceCell(contactId, effectiveDate, val as SOMAttendanceValue);
    }
  };

  // Stats for the selected date
  const stats = useMemo(() => {
    if (!effectiveDate) return { present: 0, late: 0, absent: 0, unmarked: 0 };
    let present = 0, late = 0, absent = 0, unmarked = 0;
    for (const m of allGroupMembers) {
      const v = getVal(m.contactId);
      if (v === true) present++;
      else if (v === 'late') late++;
      else if (v === false) absent++;
      else unmarked++;
    }
    return { present, late, absent, unmarked };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDate, allGroupMembers, groupAttendance, attendance, useRosterFlow, userGroup]);

  // Sub-group sections for roster flow
  const gradeLevelSections = useMemo(() => {
    if (!useRosterFlow) return null;
    const sections = new Map<string, MemberEntry[]>();
    for (const m of filteredMembers) {
      const gl = m.gradeLevel || 'Unclassified';
      if (!sections.has(gl)) sections.set(gl, []);
      sections.get(gl)!.push(m);
    }
    if (sections.size <= 1) return null;
    return Array.from(sections.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [useRosterFlow, filteredMembers]);

  const formatDateDisplay = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    return `${weekday}, ${month} ${day}`;
  };

  const hasData = allGroupMembers.length > 0;

  // ── Real-time sync: poll server every 5s so multiple madrichim see each other's changes ──
  useEffect(() => {
    if (!hasData || groupEnabledDates.length === 0) return;

    const poll = () => {
      if (document.visibilityState === 'visible') {
        refreshAttendanceFromServer();
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(poll, 5000);

    // Also refresh immediately when the tab becomes visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAttendanceFromServer();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [hasData, groupEnabledDates.length, refreshAttendanceFromServer]);

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
              <h1 className="text-sm font-bold text-[#C5E3F6] leading-tight">Attendance</h1>
              <span className="text-[0.65rem] text-white/40">{groupLabel}</span>
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
        {/* No data */}
        {!hasData && (
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-8 text-center mt-8">
            <Users className="w-12 h-12 text-[#D8E1EA] mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">No data</h3>
            <p className="text-sm text-[#5A6472]">
              The administrator has not yet imported the {groupLabel} roster.
            </p>
          </div>
        )}

        {/* No enabled dates */}
        {hasData && groupEnabledDates.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-8 text-center mt-8">
            <CalendarDays className="w-12 h-12 text-[#D8E1EA] mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">No enabled dates</h3>
            <p className="text-sm text-[#5A6472]">
              The administrator has not enabled any dates for taking attendance.
            </p>
          </div>
        )}

        {/* Main attendance taking UI */}
        {hasData && groupEnabledDates.length > 0 && effectiveDate && (
          <>
            {/* Date selector */}
            {sortedEnabledDates.length > 1 ? (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1.5">
                  Date
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
                <div className="text-[0.6rem] text-[#5A6472] uppercase font-medium">Present</div>
              </div>
              <div className="bg-white rounded-xl border border-[#D8E1EA] p-2.5 text-center">
                <div className="text-lg font-bold text-[#E89B3A]">{stats.late}</div>
                <div className="text-[0.6rem] text-[#5A6472] uppercase font-medium">Late</div>
              </div>
              <div className="bg-white rounded-xl border border-[#D8E1EA] p-2.5 text-center">
                <div className="text-lg font-bold text-[#C0392B]">{stats.absent}</div>
                <div className="text-[0.6rem] text-[#5A6472] uppercase font-medium">Absent</div>
              </div>
              <div className="bg-white rounded-xl border border-[#D8E1EA] p-2.5 text-center">
                <div className="text-lg font-bold text-[#5A6472]">{stats.unmarked}</div>
                <div className="text-[0.6rem] text-[#5A6472] uppercase font-medium">Unmarked</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
              <input
                type="text"
                placeholder="Search participant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
              />
            </div>

            {/* Member list with grade-level sections */}
            {gradeLevelSections ? (
              <div className="space-y-4">
                {gradeLevelSections.map(([sectionName, members]) => (
                  <div key={sectionName}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[0.7rem] font-semibold text-[#5A6472] uppercase tracking-wider">
                        {sectionName}
                      </span>
                      <span className="text-[0.6rem] text-[#999]">({members.length})</span>
                    </div>
                    <div className="space-y-2">
                      {members.map(member => (
                        <MemberRow
                          key={member.contactId}
                          name={member.fullName}
                          value={getVal(member.contactId)}
                          onSet={(v) => setAttendanceValue(member.contactId, v)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map(member => (
                  <MemberRow
                    key={member.contactId}
                    name={member.fullName}
                    value={getVal(member.contactId)}
                    onSet={(v) => setAttendanceValue(member.contactId, v)}
                  />
                ))}
              </div>
            )}

            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-sm text-[#5A6472]">
                No participants found
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
  value: AttendanceValue;
  onSet: (v: AttendanceValue) => void;
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
            title="Present"
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
            title="Late"
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
            title="Absent"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
