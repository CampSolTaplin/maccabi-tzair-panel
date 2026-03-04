'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import RosterImportModal from '@/components/import/RosterImportModal';
import { Chanich, Program } from '@/types';
import {
  Users, Upload, Search, Download, Columns3, X, ChevronDown, FileSpreadsheet,
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
  const { rosterData, loading } = useData();
  const [showImport, setShowImport] = useState(false);
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');
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

    return list;
  }, [rosterData, selectedArea, selectedSubGroup, currentArea, search]);

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
                            <span className="font-medium">{c.fullName}</span>
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
