'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { Database, Bell, Palette, Upload, Edit, CheckCircle2, Trash2, CalendarDays, Plus, X, Star, Zap, Check, Tag, Ban } from 'lucide-react';
import { useData } from '@/lib/data-context';

// ── Group definitions (same as events page) ──

interface GroupDef {
  key: string;
  label: string;
  area: string;
  color: string;
  bgColor: string;
}

const GROUP_DEFS: GroupDef[] = [
  { key: 'Kinder', label: 'Kinder', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '1st Grade', label: '1st', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '2nd Grade', label: '2nd', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '3rd Grade', label: '3rd', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '4th Grade', label: '4th', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '5th Grade', label: '5th', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '6th Grade', label: '6th', area: 'Noar', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  { key: '7th Grade', label: '7th', area: 'Noar', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  { key: '8th Grade', label: '8th', area: 'Noar', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  { key: 'Pre-SOM', label: 'Pre-SOM', area: 'Leadership', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  { key: 'SOM', label: 'SOM', area: 'Leadership', color: 'text-green-700', bgColor: 'bg-green-50' },
  { key: 'Trips', label: 'Trips', area: 'Special', color: 'text-rose-700', bgColor: 'bg-rose-50' },
  { key: 'Machanot', label: 'Machanot', area: 'Special', color: 'text-cyan-700', bgColor: 'bg-cyan-50' },
];

const AREA_LABELS: Record<string, string> = {
  Katan: 'Katan (K-5)',
  Noar: 'Noar (6-8)',
  Leadership: 'Leadership',
  Special: 'Special',
};

const AREA_COLORS: Record<string, { text: string; border: string }> = {
  Katan: { text: 'text-blue-700', border: 'border-blue-200' },
  Noar: { text: 'text-purple-700', border: 'border-purple-200' },
  Leadership: { text: 'text-amber-700', border: 'border-amber-200' },
  Special: { text: 'text-rose-700', border: 'border-rose-200' },
};

// Group into areas
const AREAS = (() => {
  const map = new Map<string, GroupDef[]>();
  for (const g of GROUP_DEFS) {
    if (!map.has(g.area)) map.set(g.area, []);
    map.get(g.area)!.push(g);
  }
  return Array.from(map.entries());
})();

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${on ? 'bg-[#1B2A6B]' : 'bg-[#D0CCC4]'}`}
    >
      <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function SettingsPage() {
  const {
    setShowImportModal, isImported, attendance, clearImport,
    enabledDates, enabledDateGroups, toggleEnabledDate, updateEnabledDateGroups,
    events,
    noSessionDates, toggleNoSessionDate,
  } = useData();
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDateGroups, setNewDateGroups] = useState<Set<string>>(new Set());
  const [editingDateGroups, setEditingDateGroups] = useState<string | null>(null);
  const [editGroups, setEditGroups] = useState<Set<string>>(new Set());
  const [newNoSessionDate, setNewNoSessionDate] = useState(new Date().toISOString().split('T')[0]);

  const sortedEnabledDates = [...enabledDates].sort((a, b) => b.localeCompare(a));

  // Map event dates to event names for display
  const eventByDate = new Map(events.map(e => [e.date, e.name]));

  // Events that are NOT yet enabled for attendance
  const unenbledEvents = events.filter(e => !enabledDates.includes(e.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `${weekday} ${month} ${day}, ${year}`;
  };

  const formatDateShort = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleAddDate = () => {
    if (newDate && !enabledDates.includes(newDate)) {
      toggleEnabledDate(newDate, Array.from(newDateGroups));
      setNewDateGroups(new Set());
    }
  };

  const toggleNewDateGroup = (key: string) => {
    setNewDateGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleNewDateArea = (area: string) => {
    const areaKeys = GROUP_DEFS.filter(g => g.area === area).map(g => g.key);
    const allSelected = areaKeys.every(k => newDateGroups.has(k));
    setNewDateGroups(prev => {
      const next = new Set(prev);
      if (allSelected) areaKeys.forEach(k => next.delete(k));
      else areaKeys.forEach(k => next.add(k));
      return next;
    });
  };

  const startEditingGroups = (date: string) => {
    setEditingDateGroups(date);
    setEditGroups(new Set(enabledDateGroups[date] || []));
  };

  const saveEditGroups = () => {
    if (editingDateGroups) {
      updateEnabledDateGroups(editingDateGroups, Array.from(editGroups));
      setEditingDateGroups(null);
    }
  };

  const toggleEditGroup = (key: string) => {
    setEditGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleEditArea = (area: string) => {
    const areaKeys = GROUP_DEFS.filter(g => g.area === area).map(g => g.key);
    const allSelected = areaKeys.every(k => editGroups.has(k));
    setEditGroups(prev => {
      const next = new Set(prev);
      if (allSelected) areaKeys.forEach(k => next.delete(k));
      else areaKeys.forEach(k => next.add(k));
      return next;
    });
  };

  return (
    <>
      <Topbar title="Settings" subtitle="System settings" />
      <div className="p-7 max-w-4xl">
        {/* Attendance Dates for Madrichim */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6 mb-5">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#E8687D]" /> Enable Attendance (Madrichim)
          </h3>
          <p className="text-xs text-[#5A6472] mb-4">
            Enable the dates on which Madrichim can take attendance.
            You can choose whether the date applies to all groups or only some.
          </p>

          {/* Quick enable from events */}
          {unenbledEvents.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-2">
                Events without attendance enabled
              </label>
              <div className="space-y-1.5">
                {unenbledEvents.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-[#E89B3A]/40 bg-[#E89B3A]/[0.04]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Star className="w-3.5 h-3.5 text-[#E89B3A] flex-shrink-0" />
                      <span className="text-sm font-medium text-[#1A1A2E] truncate">{ev.name}</span>
                      <span className="text-xs text-[#5A6472] flex-shrink-0">{formatDateShort(ev.date)}</span>
                      {/* Show event groups */}
                      {ev.groups.length > 0 && (
                        <div className="flex gap-1 flex-shrink-0">
                          {ev.groups.slice(0, 3).map(g => {
                            const def = GROUP_DEFS.find(d => d.key === g);
                            return (
                              <span key={g} className={`px-1.5 py-0.5 rounded text-[0.55rem] font-medium ${def ? `${def.bgColor} ${def.color}` : 'bg-gray-100 text-gray-600'}`}>
                                {def?.label || g}
                              </span>
                            );
                          })}
                          {ev.groups.length > 3 && (
                            <span className="text-[0.55rem] text-[#5A6472]">+{ev.groups.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleEnabledDate(ev.date, ev.groups)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#E89B3A] text-white text-xs font-medium hover:bg-[#D08A2F] transition-all flex-shrink-0 ml-2"
                    >
                      <Zap className="w-3 h-3" /> Enable
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add date manually with group selector */}
          <div className="mb-4 p-4 rounded-lg border border-[#D8E1EA] bg-[#FAFAF8]">
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-2">
              Add date manually
            </label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
              />
              <button
                onClick={handleAddDate}
                disabled={!newDate || enabledDates.includes(newDate)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Enable
              </button>
            </div>

            {/* Group selector for new date */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-3.5 h-3.5 text-[#5A6472]" />
                <span className="text-[0.7rem] font-semibold text-[#5A6472] uppercase tracking-wider">
                  Groups {newDateGroups.size === 0 ? '(All)' : `(${newDateGroups.size} selected)`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AREAS.map(([area, groups]) => {
                  const areaColors = AREA_COLORS[area] || { text: 'text-gray-700', border: 'border-gray-200' };
                  const areaKeys = groups.map(g => g.key);
                  const allSelected = areaKeys.every(k => newDateGroups.has(k));
                  return (
                    <span key={area} className="contents">
                      <button
                        onClick={() => toggleNewDateArea(area)}
                        className={`px-2 py-1 rounded text-[0.6rem] font-bold uppercase tracking-wider transition-all ${
                          allSelected
                            ? `${areaColors.text} bg-current/10 ring-1 ring-current`
                            : 'text-[#5A6472] bg-[#f0eeea] hover:bg-[#e8e5de]'
                        }`}
                      >
                        {AREA_LABELS[area] || area}
                      </button>
                      {groups.map(g => {
                        const sel = newDateGroups.has(g.key);
                        return (
                          <button key={g.key} onClick={() => toggleNewDateGroup(g.key)}
                            className={`px-2 py-1 rounded-full text-[0.65rem] font-medium transition-all ${
                              sel
                                ? `${g.bgColor} ${g.color} ring-1 ring-current`
                                : 'bg-[#f0eeea] text-[#999] hover:bg-[#e8e5de]'
                            }`}>
                            {g.label}
                          </button>
                        );
                      })}
                      <span className="text-[#D8E1EA] mx-0.5 text-xs">|</span>
                    </span>
                  );
                })}
              </div>
              {newDateGroups.size === 0 && (
                <p className="text-[0.65rem] text-[#999] mt-1.5">No selection = enabled for all groups</p>
              )}
            </div>
          </div>

          {/* Enabled dates list */}
          {sortedEnabledDates.length === 0 ? (
            <div className="text-center py-6 text-sm text-[#5A6472] bg-[#f8f7f5] rounded-lg">
              No enabled dates. Madrichim cannot take attendance.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEnabledDates.map(date => {
                const eventName = eventByDate.get(date);
                const dateGroups = enabledDateGroups[date] || [];
                const isEditing = editingDateGroups === date;

                return (
                  <div key={date} className="rounded-lg border border-[#D8E1EA] bg-[#f8f7f5] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {eventName ? (
                          <Star className="w-4 h-4 text-[#E89B3A] flex-shrink-0" />
                        ) : (
                          <CalendarDays className="w-4 h-4 text-[#2D8B4E] flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-[#1A1A2E] truncate">
                          {formatDate(date)}
                        </span>
                        {eventName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-[#E89B3A]/10 text-[#E89B3A] flex-shrink-0">
                            {eventName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <button
                          onClick={() => isEditing ? saveEditGroups() : startEditingGroups(date)}
                          className={`px-2 py-1 rounded-lg text-[0.65rem] font-medium transition-all ${
                            isEditing
                              ? 'bg-[#2D8B4E] text-white hover:bg-[#24734A]'
                              : 'border border-[#D8E1EA] text-[#5A6472] hover:bg-white'
                          }`}
                          title={isEditing ? 'Save groups' : 'Edit groups'}
                        >
                          {isEditing ? (
                            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Save</span>
                          ) : (
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Groups</span>
                          )}
                        </button>
                        <button
                          onClick={() => toggleEnabledDate(date)}
                          className="p-1.5 rounded-lg text-[#C0392B] hover:bg-red-50 transition-all"
                          title="Disable date"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Group badges */}
                    {!isEditing && dateGroups.length > 0 && (
                      <div className="px-4 pb-2.5 flex flex-wrap gap-1">
                        {dateGroups.map(g => {
                          const def = GROUP_DEFS.find(d => d.key === g);
                          return (
                            <span key={g} className={`px-1.5 py-0.5 rounded text-[0.6rem] font-medium ${def ? `${def.bgColor} ${def.color}` : 'bg-gray-100 text-gray-600'}`}>
                              {def?.label || g}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {!isEditing && dateGroups.length === 0 && (
                      <div className="px-4 pb-2.5">
                        <span className="text-[0.6rem] text-[#999] italic">All groups</span>
                      </div>
                    )}

                    {/* Inline group editor */}
                    {isEditing && (
                      <div className="px-4 pb-3 pt-1 border-t border-[#e8e5de]">
                        <div className="flex flex-wrap gap-1.5">
                          {AREAS.map(([area, groups]) => {
                            const areaColors = AREA_COLORS[area] || { text: 'text-gray-700', border: 'border-gray-200' };
                            const areaKeys = groups.map(g => g.key);
                            const allSelected = areaKeys.every(k => editGroups.has(k));
                            return (
                              <span key={area} className="contents">
                                <button
                                  onClick={() => toggleEditArea(area)}
                                  className={`px-2 py-1 rounded text-[0.6rem] font-bold uppercase tracking-wider transition-all ${
                                    allSelected
                                      ? `${areaColors.text} bg-current/10 ring-1 ring-current`
                                      : 'text-[#5A6472] bg-[#e8e5de] hover:bg-[#ddd]'
                                  }`}
                                >
                                  {AREA_LABELS[area] || area}
                                </button>
                                {groups.map(g => {
                                  const sel = editGroups.has(g.key);
                                  return (
                                    <button key={g.key} onClick={() => toggleEditGroup(g.key)}
                                      className={`px-2 py-1 rounded-full text-[0.65rem] font-medium transition-all ${
                                        sel
                                          ? `${g.bgColor} ${g.color} ring-1 ring-current`
                                          : 'bg-[#e8e5de] text-[#999] hover:bg-[#ddd]'
                                      }`}>
                                      {g.label}
                                    </button>
                                  );
                                })}
                                <span className="text-[#D8E1EA] mx-0.5 text-xs">|</span>
                              </span>
                            );
                          })}
                        </div>
                        {editGroups.size === 0 && (
                          <p className="text-[0.6rem] text-[#999] mt-1">No selection = enabled for all</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* No-Session Dates */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6 mb-5">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <Ban className="w-4 h-4 text-[#C0392B]" /> No-Session Dates
          </h3>
          <p className="text-xs text-[#5A6472] mb-4">
            Mark dates when there was no session (holidays, cancellations, etc.).
            These dates will appear grayed out in the attendance grid and won&apos;t count toward attendance percentages.
          </p>

          {/* Add no-session date */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="date"
              value={newNoSessionDate}
              onChange={e => setNewNoSessionDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
            />
            <button
              onClick={() => {
                if (newNoSessionDate && !noSessionDates.includes(newNoSessionDate)) {
                  toggleNoSessionDate(newNoSessionDate);
                }
              }}
              disabled={!newNoSessionDate || noSessionDates.includes(newNoSessionDate)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C0392B] text-white text-sm font-medium hover:bg-[#A93226] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Add No-Session
            </button>
          </div>

          {/* No-session dates list */}
          {noSessionDates.length === 0 ? (
            <div className="text-center py-4 text-sm text-[#5A6472] bg-[#f8f7f5] rounded-lg">
              No no-session dates added.
            </div>
          ) : (
            <div className="space-y-1.5">
              {[...noSessionDates].sort((a, b) => b.localeCompare(a)).map(date => (
                <div key={date} className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-[#D8E1EA] bg-[#f8f7f5]">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-[#C0392B] flex-shrink-0" />
                    <span className="text-sm font-medium text-[#1A1A2E]">{formatDate(date)}</span>
                  </div>
                  <button
                    onClick={() => toggleNoSessionDate(date)}
                    className="p-1.5 rounded-lg text-[#C0392B] hover:bg-red-50 transition-all"
                    title="Remove no-session date"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Source */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6 mb-5">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#E8687D]" /> Attendance Data
          </h3>
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm font-medium">SOM Attendance File</h4>
              <p className="text-xs text-[#5A6472] mt-0.5">
                {isImported && attendance
                  ? `${attendance.members.length} members · ${attendance.dates.length} sessions · ${attendance.months.length} months`
                  : 'Upload the SOM ATTENDANCE.xlsx file'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isImported && (
                <>
                  <span className="flex items-center gap-1 text-xs text-[#2D8B4E] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                  <button
                    onClick={clearImport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-[#C0392B] hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              )}
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all"
              >
                <Upload className="w-3.5 h-3.5" /> {isImported ? 'Re-import' : 'Upload File'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6 mb-5">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#E8687D]" /> Notifications
          </h3>
          <div className="flex items-center justify-between py-3 border-b border-[#f4f2ee]">
            <div><h4 className="text-sm font-medium">Low attendance alerts</h4><p className="text-xs text-[#5A6472] mt-0.5">Notify when attendance drops below 40%</p></div>
            <Toggle defaultOn />
          </div>
          <div className="flex items-center justify-between py-3">
            <div><h4 className="text-sm font-medium">Weekly email report</h4><p className="text-xs text-[#5A6472] mt-0.5">Attendance summary every Sunday</p></div>
            <Toggle />
          </div>
        </div>

        {/* Season */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#E8687D]" /> Season
          </h3>
          <div className="flex items-center justify-between py-3 border-b border-[#f4f2ee]">
            <div><h4 className="text-sm font-medium">Active Season</h4><p className="text-xs text-[#5A6472] mt-0.5">2025/2026</p></div>
            <select className="px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-sm bg-white">
              <option>2025/2026</option><option>2024/2025</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-3">
            <div><h4 className="text-sm font-medium">SOM Schedule</h4><p className="text-xs text-[#5A6472] mt-0.5">Wednesdays + Saturdays</p></div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
