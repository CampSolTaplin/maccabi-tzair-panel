'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { useAuth } from '@/lib/auth-context';
import RosterImportModal from '@/components/import/RosterImportModal';
import MemberAvatar from '@/components/MemberAvatar';
import PhotoCaptureModal from '@/components/PhotoCaptureModal';
import { Chanich, Program } from '@/types';
import { formatPhoneForWhatsApp, parseEmails } from '@/lib/message-utils';
import { findGroupKey } from '@/lib/group-utils';
import {
  Users, Upload, Search, Download, Columns3, X, ChevronDown, FileSpreadsheet,
  MessageCircle, Mail, StickyNote, Plus, Trash2, Filter, Camera, SlidersHorizontal,
} from 'lucide-react';

// ── Column definitions ──

interface ColumnDef {
  key: keyof Chanich;
  label: string;
  defaultVisible: boolean;
  minWidth?: string;
}

const ROSTER_COLUMNS: ColumnDef[] = [
  { key: 'fullName', label: 'Full Name', defaultVisible: true, minWidth: '180px' },
  { key: 'gender', label: 'Gender', defaultVisible: true, minWidth: '80px' },
  { key: 'age', label: 'Age', defaultVisible: true, minWidth: '60px' },
  { key: 'grade', label: 'Grade', defaultVisible: true, minWidth: '100px' },
  { key: 'school', label: 'School', defaultVisible: true, minWidth: '140px' },
  { key: 'gradeLevel', label: 'Level/Group', defaultVisible: true, minWidth: '160px' },
  { key: 'accountName', label: 'Family Account', defaultVisible: false, minWidth: '180px' },
  { key: 'emergencyContactName', label: 'Emergency Contact', defaultVisible: false, minWidth: '170px' },
  { key: 'emergencyPhone', label: 'Emergency Phone', defaultVisible: false, minWidth: '140px' },
  { key: 'allergies', label: 'Allergies', defaultVisible: false, minWidth: '120px' },
  { key: 'jewishIdentification', label: 'Jewish Identification', defaultVisible: false, minWidth: '150px' },
  { key: 'communityService', label: 'Community Service', defaultVisible: false, minWidth: '150px' },
  { key: 'keepKosher', label: 'Kosher', defaultVisible: false, minWidth: '80px' },
  { key: 'primaryEmail', label: 'Primary Email', defaultVisible: false, minWidth: '200px' },
  { key: 'primaryPhone', label: 'Phone', defaultVisible: false, minWidth: '130px' },
  { key: 'contactPhone', label: 'Contact Phone', defaultVisible: false, minWidth: '130px' },
  { key: 'allEmails', label: 'All Emails', defaultVisible: false, minWidth: '250px' },
  { key: 'courseOptionId', label: 'ID Enrollment', defaultVisible: false, minWidth: '160px' },
  { key: 'contactId', label: 'Contact ID', defaultVisible: false, minWidth: '160px' },
  { key: 'fullCourseOption', label: 'Full Course Option', defaultVisible: false, minWidth: '300px' },
];

// ── Area definitions (top-level grouping) ──

interface AreaDef {
  key: string;
  label: string;
  programs: Program[];
  color: string;
  activeBg: string;
}

const AREAS: AreaDef[] = [
  { key: 'all', label: 'All', programs: ['Katan', 'Noar', 'Pre-SOM', 'SOM', 'Trips', 'Machanot'], color: 'text-[#1B2A6B]', activeBg: 'bg-[#1B2A6B] text-white' },
  { key: 'katan', label: 'Katan (K-5)', programs: ['Katan'], color: 'text-blue-700', activeBg: 'bg-blue-600 text-white' },
  { key: 'noar', label: 'Noar (6-8)', programs: ['Noar'], color: 'text-purple-700', activeBg: 'bg-purple-600 text-white' },
  { key: 'leadership', label: 'Leadership', programs: ['Pre-SOM', 'SOM'], color: 'text-amber-700', activeBg: 'bg-amber-600 text-white' },
  { key: 'special', label: 'Special Events', programs: ['Trips', 'Machanot'], color: 'text-rose-700', activeBg: 'bg-rose-600 text-white' },
];

export default function RosterPage() {
  const {
    rosterData, loading, memberPhotos, saveMemberPhoto, deleteMemberPhoto,
    memberNotes, addNote, deleteNote,
    events, groupAttendance, noSessionDates, getEnabledDatesForGroup,
  } = useData();
  const { user } = useAuth();
  const [showImport, setShowImport] = useState(false);
  const [photoModal, setPhotoModal] = useState<{ contactId: string; name: string } | null>(null);
  const [notesModal, setNotesModal] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // ── Smart filters ──
  const [showFilters, setShowFilters] = useState(false);
  const [filterEvent, setFilterEvent] = useState<string | null>(null);
  const [filterAttendanceMin, setFilterAttendanceMin] = useState<number | null>(null);
  const [filterAttendanceOp, setFilterAttendanceOp] = useState<'>=' | '<='>('>=');
  const [filterHasPhoto, setFilterHasPhoto] = useState<boolean | null>(null);
  const [filterHasNotes, setFilterHasNotes] = useState<boolean | null>(null);
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    () => new Set(ROSTER_COLUMNS.filter(c => c.defaultVisible).map(c => c.key))
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  // Close column menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setShowColMenu(false);
      }
    }
    if (showColMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColMenu]);

  // Reset sub-group when changing area
  const handleAreaChange = (areaKey: string) => {
    setSelectedArea(areaKey);
    setSelectedSubGroup(null);
  };

  // Current area config
  const currentArea = AREAS.find(a => a.key === selectedArea) || AREAS[0];

  // Area counts
  const areaCounts = useMemo(() => {
    if (!rosterData) return {};
    const counts: Record<string, number> = { all: rosterData.chanichim.length };
    for (const area of AREAS) {
      if (area.key !== 'all') {
        counts[area.key] = rosterData.chanichim.filter(c =>
          area.programs.includes(c.program)
        ).length;
      }
    }
    return counts;
  }, [rosterData]);

  // Sub-groups for current area (unique gradeLevel values)
  const subGroups = useMemo(() => {
    if (!rosterData || selectedArea === 'all') return [];
    const members = rosterData.chanichim.filter(c =>
      currentArea.programs.includes(c.program)
    );
    const groups = new Map<string, number>();
    for (const m of members) {
      const gl = m.gradeLevel || 'Unclassified';
      groups.set(gl, (groups.get(gl) || 0) + 1);
    }
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [rosterData, selectedArea, currentArea]);

  // For multi-program areas (Leadership, Special Events), also show program-level pills
  const programSubTabs = useMemo(() => {
    if (!rosterData || selectedArea === 'all') return [];
    if (currentArea.programs.length <= 1) return [];
    return currentArea.programs.map(p => ({
      program: p,
      count: rosterData.chanichim.filter(c => c.program === p).length,
    })).filter(p => p.count > 0);
  }, [rosterData, selectedArea, currentArea]);

  // ── Attendance % per member (for smart filter) ──
  const memberAttendanceRates = useMemo(() => {
    if (!rosterData) return new Map<string, number>();
    const rates = new Map<string, number>();
    const noSessionSet = new Set(noSessionDates);

    for (const chanich of rosterData.chanichim) {
      const groupKey = findGroupKey(chanich);
      if (!groupKey) { rates.set(chanich.contactId, -1); continue; }

      const datesForGroup = getEnabledDatesForGroup(groupKey);
      const regularDates = datesForGroup.filter(d => !noSessionSet.has(d));
      if (regularDates.length === 0) { rates.set(chanich.contactId, -1); continue; }

      const recs = groupAttendance[groupKey]?.[chanich.contactId] || {};
      let present = 0, late = 0;
      for (const d of regularDates) {
        const v = recs[d];
        if (v === true) present++;
        else if (v === 'late') late++;
      }
      const total = regularDates.length;
      rates.set(chanich.contactId, Math.round(((present + late) / total) * 100));
    }
    return rates;
  }, [rosterData, groupAttendance, getEnabledDatesForGroup, noSessionDates]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filterEvent) c++;
    if (filterAttendanceMin !== null) c++;
    if (filterHasPhoto !== null) c++;
    if (filterHasNotes !== null) c++;
    if (filterGender) c++;
    return c;
  }, [filterEvent, filterAttendanceMin, filterHasPhoto, filterHasNotes, filterGender]);

  const clearAllFilters = () => {
    setFilterEvent(null);
    setFilterAttendanceMin(null);
    setFilterAttendanceOp('>=');
    setFilterHasPhoto(null);
    setFilterHasNotes(null);
    setFilterGender(null);
  };

  // Filter data
  const filteredData = useMemo(() => {
    if (!rosterData) return [];
    let list = rosterData.chanichim;

    // Filter by area programs
    if (selectedArea !== 'all') {
      list = list.filter(c => currentArea.programs.includes(c.program));
    }

    // Filter by sub-group (gradeLevel or program)
    if (selectedSubGroup) {
      if (currentArea.programs.includes(selectedSubGroup as Program)) {
        list = list.filter(c => c.program === selectedSubGroup);
      } else {
        list = list.filter(c => (c.gradeLevel || 'Unclassified') === selectedSubGroup);
      }
    }

    // Filter by search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.accountName.toLowerCase().includes(q) ||
        c.school.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) ||
        c.gradeLevel.toLowerCase().includes(q) ||
        c.primaryEmail.toLowerCase().includes(q) ||
        c.contactId.toLowerCase().includes(q)
      );
    }

    // ── Smart filters (AND logic) ──

    // Event attendance
    if (filterEvent) {
      const event = events.find(e => e.id === filterEvent);
      if (event) {
        const attendeeSet = new Set(event.attendees);
        list = list.filter(c => attendeeSet.has(c.contactId));
      }
    }

    // Attendance %
    if (filterAttendanceMin !== null) {
      list = list.filter(c => {
        const rate = memberAttendanceRates.get(c.contactId);
        if (rate === undefined || rate === -1) return false;
        return filterAttendanceOp === '>=' ? rate >= filterAttendanceMin : rate <= filterAttendanceMin;
      });
    }

    // Has photo
    if (filterHasPhoto === true) {
      list = list.filter(c => !!memberPhotos[c.contactId]);
    } else if (filterHasPhoto === false) {
      list = list.filter(c => !memberPhotos[c.contactId]);
    }

    // Has notes
    if (filterHasNotes === true) {
      list = list.filter(c => (memberNotes[c.contactId]?.length || 0) > 0);
    } else if (filterHasNotes === false) {
      list = list.filter(c => (memberNotes[c.contactId]?.length || 0) === 0);
    }

    // Gender
    if (filterGender) {
      list = list.filter(c => c.gender === filterGender);
    }

    return list;
  }, [rosterData, selectedArea, selectedSubGroup, currentArea, search,
      filterEvent, filterAttendanceMin, filterAttendanceOp, filterHasPhoto,
      filterHasNotes, filterGender, events, memberAttendanceRates, memberPhotos, memberNotes]);

  // Active columns
  const activeCols = useMemo(() => {
    return ROSTER_COLUMNS.filter(c => visibleCols.has(c.key));
  }, [visibleCols]);

  // Toggle column
  const toggleCol = (key: string) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // CSV export
  const exportCSV = () => {
    if (filteredData.length === 0) return;

    const cols = activeCols;
    const header = cols.map(c => `"${c.label}"`).join(',');
    const rows = filteredData.map(row =>
      cols.map(c => {
        const val = String(row[c.key] ?? '');
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const groupLabel = selectedArea === 'all' ? 'all' : selectedSubGroup || selectedArea;
    a.download = `roster-${groupLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <Topbar title="Rosters" subtitle="Participant registry" />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#1B2A6B]/20 border-t-[#1B2A6B] rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Rosters" subtitle="Participant registry — Maccabi Tzair Miami" />
      <div className="p-7">
        {/* Empty state */}
        {!rosterData && (
          <div className="max-w-lg mx-auto mt-12">
            <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-10 text-center">
              <FileSpreadsheet className="w-14 h-14 text-[#D8E1EA] mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold text-[#1B2A6B] mb-2">No roster imported</h3>
              <p className="text-sm text-[#5A6472] mb-6">
                Import the Salesforce report to view participants from all programs.
              </p>
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all"
              >
                <Upload className="w-4 h-4" /> Import Roster
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        {rosterData && (
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA]">
            {/* Header bar */}
            <div className="px-5 py-4 border-b border-[#D8E1EA]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-[#1B2A6B] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#E8687D]" /> Participants
                  </h3>
                  <span className="text-xs text-[#5A6472] bg-[#F2F0EC] px-2 py-0.5 rounded-full">
                    {filteredData.length} of {rosterData.chanichim.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Column visibility */}
                  <div className="relative" ref={colMenuRef}>
                    <button
                      onClick={() => setShowColMenu(!showColMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all"
                    >
                      <Columns3 className="w-3.5 h-3.5" /> Columns
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showColMenu && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-[#D8E1EA] py-2 z-50 max-h-80 overflow-y-auto">
                        <div className="px-3 py-1.5 border-b border-[#D8E1EA] mb-1">
                          <span className="text-[0.65rem] font-semibold text-[#5A6472] uppercase tracking-wider">
                            Visible columns ({visibleCols.size})
                          </span>
                        </div>
                        {ROSTER_COLUMNS.map(col => (
                          <label
                            key={col.key}
                            className="flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-[#f8f7f5] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={visibleCols.has(col.key)}
                              onChange={() => toggleCol(col.key)}
                              className="w-3.5 h-3.5 rounded border-[#D8E1EA] text-[#1B2A6B] focus:ring-[#1B2A6B]/20"
                            />
                            <span className="text-[#1A1A2E]">{col.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Export CSV */}
                  <button
                    onClick={exportCSV}
                    disabled={filteredData.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>

                  {/* Re-import */}
                  <button
                    onClick={() => setShowImport(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B2A6B] text-white text-xs font-medium hover:bg-[#2A3D8F] transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" /> Import
                  </button>
                </div>
              </div>

              {/* Area tabs (top level) */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {AREAS.map(area => {
                  const count = areaCounts[area.key] || 0;
                  if (area.key !== 'all' && count === 0) return null;
                  const isActive = selectedArea === area.key;
                  return (
                    <button
                      key={area.key}
                      onClick={() => handleAreaChange(area.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? area.activeBg + ' shadow-sm'
                          : 'bg-[#F2F0EC] ' + area.color + ' hover:bg-[#E8E5DF]'
                      }`}
                    >
                      {area.label}
                      <span className={`ml-1.5 ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-group pills (second level) */}
              {selectedArea !== 'all' && (programSubTabs.length > 0 || subGroups.length > 0) && (
                <div className="flex flex-wrap items-center gap-1.5 mb-3 pl-1">
                  {/* "Todos" pill for the area */}
                  <button
                    onClick={() => setSelectedSubGroup(null)}
                    className={`px-2.5 py-1 rounded-md text-[0.7rem] font-medium transition-all ${
                      !selectedSubGroup
                        ? 'bg-[#1A1A2E] text-white shadow-sm'
                        : 'bg-[#F2F0EC] text-[#5A6472] hover:bg-[#E8E5DF]'
                    }`}
                  >
                    All ({areaCounts[selectedArea] || 0})
                  </button>

                  {/* Program sub-tabs for multi-program areas (Leadership, Special Events) */}
                  {programSubTabs.map(p => (
                    <button
                      key={p.program}
                      onClick={() => setSelectedSubGroup(p.program)}
                      className={`px-2.5 py-1 rounded-md text-[0.7rem] font-medium transition-all ${
                        selectedSubGroup === p.program
                          ? 'bg-[#1A1A2E] text-white shadow-sm'
                          : 'bg-[#F2F0EC] text-[#5A6472] hover:bg-[#E8E5DF]'
                      }`}
                    >
                      {p.program} ({p.count})
                    </button>
                  ))}

                  {/* Separator for multi-program areas */}
                  {programSubTabs.length > 0 && subGroups.length > 0 && (
                    <span className="text-[#D8E1EA] mx-0.5">|</span>
                  )}

                  {/* Grade-level sub-groups */}
                  {subGroups.map(sg => (
                    <button
                      key={sg.name}
                      onClick={() => setSelectedSubGroup(sg.name)}
                      className={`px-2.5 py-1 rounded-md text-[0.7rem] font-medium transition-all ${
                        selectedSubGroup === sg.name
                          ? 'bg-[#1A1A2E] text-white shadow-sm'
                          : 'bg-[#F2F0EC] text-[#5A6472] hover:bg-[#E8E5DF]'
                      }`}
                    >
                      {sg.name} ({sg.count})
                    </button>
                  ))}
                </div>
              )}

              {/* ── Smart Filters ── */}
              <div className="mb-3">
                {/* Toggle + active chips row */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.7rem] font-medium transition-all ${
                      showFilters || activeFilterCount > 0
                        ? 'bg-[#2D8B4E]/10 text-[#2D8B4E] border border-[#2D8B4E]/30'
                        : 'bg-[#F2F0EC] text-[#5A6472] hover:bg-[#E8E5DF]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-0.5 w-4 h-4 rounded-full bg-[#2D8B4E] text-white text-[0.6rem] flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Active filter chips (always visible when filters active) */}
                  {activeFilterCount > 0 && (
                    <>
                      {filterEvent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D8B4E]/10 text-[#2D8B4E] text-[0.65rem] font-medium">
                          {events.find(e => e.id === filterEvent)?.name || 'Event'}
                          <button onClick={() => setFilterEvent(null)} className="hover:text-[#1a5c30]"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      )}
                      {filterAttendanceMin !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D8B4E]/10 text-[#2D8B4E] text-[0.65rem] font-medium">
                          Attendance {filterAttendanceOp} {filterAttendanceMin}%
                          <button onClick={() => setFilterAttendanceMin(null)} className="hover:text-[#1a5c30]"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      )}
                      {filterHasPhoto !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D8B4E]/10 text-[#2D8B4E] text-[0.65rem] font-medium">
                          {filterHasPhoto ? 'Has Photo' : 'No Photo'}
                          <button onClick={() => setFilterHasPhoto(null)} className="hover:text-[#1a5c30]"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      )}
                      {filterHasNotes !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D8B4E]/10 text-[#2D8B4E] text-[0.65rem] font-medium">
                          {filterHasNotes ? 'Has Notes' : 'No Notes'}
                          <button onClick={() => setFilterHasNotes(null)} className="hover:text-[#1a5c30]"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      )}
                      {filterGender && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D8B4E]/10 text-[#2D8B4E] text-[0.65rem] font-medium">
                          {filterGender}
                          <button onClick={() => setFilterGender(null)} className="hover:text-[#1a5c30]"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      )}
                      <button
                        onClick={clearAllFilters}
                        className="text-[0.65rem] text-[#C0392B] hover:text-[#e0392b] font-medium ml-1"
                      >
                        Clear all
                      </button>
                    </>
                  )}
                </div>

                {/* Expanded filter controls */}
                {showFilters && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 pl-1 py-2.5 px-3 rounded-lg bg-[#FAFAF8] border border-[#D8E1EA]/60">
                    {/* Event filter */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-[0.65rem] text-[#5A6472] font-medium whitespace-nowrap">Event:</label>
                      <select
                        value={filterEvent || ''}
                        onChange={e => setFilterEvent(e.target.value || null)}
                        className="px-2 py-1 rounded-md text-[0.7rem] border border-[#D8E1EA] bg-white focus:outline-none focus:border-[#2D8B4E] min-w-[140px]"
                      >
                        <option value="">Any</option>
                        {events
                          .slice()
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.date})</option>
                          ))}
                      </select>
                    </div>

                    {/* Attendance % filter */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-[0.65rem] text-[#5A6472] font-medium whitespace-nowrap">Attendance:</label>
                      <button
                        onClick={() => setFilterAttendanceOp(prev => prev === '>=' ? '<=' : '>=')}
                        className="px-1.5 py-1 rounded-md text-[0.7rem] font-mono font-bold border border-[#D8E1EA] bg-white hover:bg-[#f0eeea] transition-colors min-w-[28px] text-center"
                      >
                        {filterAttendanceOp}
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={10}
                        value={filterAttendanceMin ?? ''}
                        onChange={e => setFilterAttendanceMin(e.target.value ? Number(e.target.value) : null)}
                        placeholder="%"
                        className="w-16 px-2 py-1 rounded-md text-[0.7rem] border border-[#D8E1EA] bg-white focus:outline-none focus:border-[#2D8B4E]"
                      />
                    </div>

                    <span className="text-[#D8E1EA]">|</span>

                    {/* Has Photo toggle */}
                    <button
                      onClick={() => setFilterHasPhoto(prev => prev === null ? true : prev === true ? false : null)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[0.7rem] font-medium transition-all ${
                        filterHasPhoto === null
                          ? 'bg-white border border-[#D8E1EA] text-[#5A6472]'
                          : filterHasPhoto
                          ? 'bg-[#2D8B4E]/10 border border-[#2D8B4E]/30 text-[#2D8B4E]'
                          : 'bg-red-50 border border-red-200 text-red-600'
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      {filterHasPhoto === null ? 'Photo: Any' : filterHasPhoto ? 'Has Photo' : 'No Photo'}
                    </button>

                    {/* Has Notes toggle (admin-only) */}
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => setFilterHasNotes(prev => prev === null ? true : prev === true ? false : null)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[0.7rem] font-medium transition-all ${
                          filterHasNotes === null
                            ? 'bg-white border border-[#D8E1EA] text-[#5A6472]'
                            : filterHasNotes
                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                            : 'bg-red-50 border border-red-200 text-red-600'
                        }`}
                      >
                        <StickyNote className="w-3 h-3" />
                        {filterHasNotes === null ? 'Notes: Any' : filterHasNotes ? 'Has Notes' : 'No Notes'}
                      </button>
                    )}

                    {/* Gender toggle */}
                    <div className="flex items-center gap-1">
                      <label className="text-[0.65rem] text-[#5A6472] font-medium">Gender:</label>
                      {['Male', 'Female'].map(g => (
                        <button
                          key={g}
                          onClick={() => setFilterGender(prev => prev === g ? null : g)}
                          className={`px-2 py-1 rounded-md text-[0.7rem] font-medium transition-all ${
                            filterGender === g
                              ? 'bg-[#1B2A6B] text-white shadow-sm'
                              : 'bg-white border border-[#D8E1EA] text-[#5A6472] hover:bg-[#f0eeea]'
                          }`}
                        >
                          {g === 'Male' ? 'M' : 'F'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
                <input
                  type="text"
                  placeholder="Search by name, school, grade, email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-[#5A6472] hover:text-[#1A1A2E]" />
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D8E1EA] bg-[#FAFAF8]">
                    <th className="text-left py-2.5 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-[#5A6472] w-10">
                      #
                    </th>
                    {selectedArea === 'all' && (
                      <th className="text-left py-2.5 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-[#5A6472]" style={{ minWidth: '90px' }}>
                        Program
                      </th>
                    )}
                    {activeCols.map(col => (
                      <th
                        key={col.key}
                        className="text-left py-2.5 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-[#5A6472]"
                        style={{ minWidth: col.minWidth }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((c, i) => (
                    <tr
                      key={c.courseOptionId}
                      className="border-b border-[#D8E1EA]/50 last:border-0 hover:bg-[#F8F7F5] transition-colors"
                    >
                      <td className="py-2.5 px-3 text-[#5A6472] text-xs">{i + 1}</td>
                      {selectedArea === 'all' && (
                        <td className="py-2.5 px-3">
                          <ProgramBadge program={c.program} />
                        </td>
                      )}
                      {activeCols.map(col => (
                        <td key={col.key} className="py-2.5 px-3 text-[#1A1A2E]">
                          {col.key === 'fullName' ? (
                            <span className="flex items-center gap-2">
                              <MemberAvatar
                                photoUrl={memberPhotos[c.contactId]?.dataUrl}
                                name={c.fullName}
                                size="sm"
                                onClick={() => setPhotoModal({ contactId: c.contactId, name: c.fullName })}
                              />
                              <span className="font-medium">{c.fullName}</span>
                              {user?.role === 'admin' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setNotesModal(c.contactId); }}
                                  className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                    (memberNotes[c.contactId]?.length || 0) > 0
                                      ? 'bg-amber-100 hover:bg-amber-200'
                                      : 'hover:bg-[#f0eeea] opacity-40 hover:opacity-80'
                                  }`}
                                  title={`${(memberNotes[c.contactId]?.length || 0)} notes`}
                                >
                                  <StickyNote className={`w-3 h-3 ${
                                    (memberNotes[c.contactId]?.length || 0) > 0 ? 'text-amber-600' : 'text-[#999]'
                                  }`} />
                                </button>
                              )}
                            </span>
                          ) : col.key === 'primaryPhone' || col.key === 'contactPhone' ? (
                            <span className="flex items-center gap-1.5">
                              <span className="truncate">{String(c[col.key] ?? '')}</span>
                              {c[col.key] && formatPhoneForWhatsApp(String(c[col.key])) && (
                                <a
                                  href={`https://wa.me/${formatPhoneForWhatsApp(String(c[col.key]))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-green-50 transition-colors"
                                  title={`WhatsApp ${String(c[col.key])}`}
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                                </a>
                              )}
                            </span>
                          ) : col.key === 'primaryEmail' ? (
                            <span className="flex items-center gap-1.5">
                              <span className="truncate">{String(c[col.key] ?? '')}</span>
                              {c[col.key] && (
                                <a
                                  href={`mailto:${String(c[col.key])}`}
                                  className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-blue-50 transition-colors"
                                  title={`Email ${String(c[col.key])}`}
                                >
                                  <Mail className="w-3.5 h-3.5 text-[#1B2A6B]" />
                                </a>
                              )}
                            </span>
                          ) : col.key === 'allEmails' ? (
                            <span className="flex items-center gap-1.5">
                              <span className="truncate">{String(c[col.key] ?? '')}</span>
                              {parseEmails(String(c[col.key] ?? '')).length > 0 && (
                                <a
                                  href={`mailto:${parseEmails(String(c[col.key] ?? '')).join(',')}`}
                                  className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-blue-50 transition-colors"
                                  title={`Email all: ${String(c[col.key])}`}
                                >
                                  <Mail className="w-3.5 h-3.5 text-[#1B2A6B]" />
                                </a>
                              )}
                            </span>
                          ) : (
                            String(c[col.key] ?? '')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredData.length === 0 && (
                <div className="text-center py-12 text-sm text-[#5A6472]">
                  {search ? 'No results found for the search.' : 'No participants in this group.'}
                </div>
              )}
            </div>

            {/* Footer */}
            {rosterData && (
              <div className="px-5 py-3 border-t border-[#D8E1EA] bg-[#FAFAF8] text-xs text-[#5A6472] flex items-center justify-between">
                <span>
                  Last import: {new Date(rosterData.importedAt).toLocaleString('en-US')}
                  {' · '}
                  {rosterData.sourceFileName}
                </span>
                <span>{filteredData.length} participants</span>
              </div>
            )}
          </div>
        )}
      </div>

      <RosterImportModal open={showImport} onClose={() => setShowImport(false)} />

      {/* Photo capture/upload modal */}
      {photoModal && (
        <PhotoCaptureModal
          memberName={photoModal.name}
          existingPhoto={memberPhotos[photoModal.contactId]?.dataUrl || null}
          onSave={(dataUrl) => {
            saveMemberPhoto(photoModal.contactId, {
              dataUrl,
              takenAt: new Date().toISOString(),
              takenBy: user?.displayName || 'Admin',
            });
            setPhotoModal(null);
          }}
          onDelete={() => {
            deleteMemberPhoto(photoModal.contactId);
            setPhotoModal(null);
          }}
          onClose={() => setPhotoModal(null)}
        />
      )}

      {/* Notes modal (admin-only) */}
      {notesModal && rosterData && (
        <NotesModal
          contactId={notesModal}
          memberName={rosterData.chanichim.find(c => c.contactId === notesModal)?.fullName || ''}
          notes={memberNotes[notesModal] || []}
          onAdd={(text) => addNote(notesModal, text, user?.displayName || 'Admin')}
          onDelete={(noteId) => deleteNote(notesModal, noteId)}
          onClose={() => setNotesModal(null)}
        />
      )}
    </>
  );
}

// ── Program badge ──

const BADGE_STYLES: Record<Program, string> = {
  Katan: 'bg-blue-50 text-blue-700',
  Noar: 'bg-purple-50 text-purple-700',
  'Pre-SOM': 'bg-amber-50 text-amber-700',
  SOM: 'bg-green-50 text-green-700',
  Trips: 'bg-rose-50 text-rose-700',
  Machanot: 'bg-cyan-50 text-cyan-700',
};

function ProgramBadge({ program }: { program: Program }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium ${BADGE_STYLES[program] || 'bg-gray-50 text-gray-700'}`}>
      {program}
    </span>
  );
}

// ── Notes Modal (Admin-only) ──

function NotesModal({ contactId, memberName, notes, onAdd, onDelete, onClose }: {
  contactId: string;
  memberName: string;
  notes: { id: string; text: string; createdAt: string; createdBy: string }[];
  onAdd: (text: string) => void;
  onDelete: (noteId: string) => void;
  onClose: () => void;
}) {
  const [newText, setNewText] = useState('');

  // Suppress unused variable warning — contactId may be needed for future features
  void contactId;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#D8E1EA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-bold text-[#1B2A6B]">Notes</h3>
              <p className="text-sm text-[#5A6472]">{memberName}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0eeea] transition-colors">
              <X className="w-4 h-4 text-[#5A6472]" />
            </button>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {notes.length === 0 && (
            <p className="text-sm text-[#5A6472] text-center py-4">No notes yet.</p>
          )}
          {notes.slice().reverse().map(note => (
            <div key={note.id} className="bg-[#FAFAF8] rounded-lg p-3 border border-[#f0eeea]">
              <p className="text-sm text-[#1A1A2E] whitespace-pre-wrap">{note.text}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[0.65rem] text-[#999]">
                  {new Date(note.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                  {note.createdBy && ` · ${note.createdBy}`}
                </span>
                <button
                  onClick={() => onDelete(note.id)}
                  className="p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-3 h-3 text-[#C0392B]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add note */}
        <div className="px-6 pb-6 pt-4 border-t border-[#D8E1EA]">
          <div className="flex gap-2">
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm resize-none focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
            />
            <button
              onClick={() => { if (newText.trim()) { onAdd(newText.trim()); setNewText(''); } }}
              disabled={!newText.trim()}
              className="px-3 py-2 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all disabled:opacity-40 self-end"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
