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
  { key: 'fullName', label: 'Nombre Completo', defaultVisible: true, minWidth: '180px' },
  { key: 'gender', label: 'Genero', defaultVisible: true, minWidth: '80px' },
  { key: 'age', label: 'Edad', defaultVisible: true, minWidth: '60px' },
  { key: 'grade', label: 'Grado', defaultVisible: true, minWidth: '100px' },
  { key: 'school', label: 'Escuela', defaultVisible: true, minWidth: '140px' },
  { key: 'gradeLevel', label: 'Nivel/Grupo', defaultVisible: true, minWidth: '160px' },
  { key: 'accountName', label: 'Cuenta Familiar', defaultVisible: false, minWidth: '180px' },
  { key: 'emergencyContactName', label: 'Contacto Emergencia', defaultVisible: false, minWidth: '170px' },
  { key: 'emergencyPhone', label: 'Tel. Emergencia', defaultVisible: false, minWidth: '140px' },
  { key: 'allergies', label: 'Alergias', defaultVisible: false, minWidth: '120px' },
  { key: 'jewishIdentification', label: 'Identificacion Judia', defaultVisible: false, minWidth: '150px' },
  { key: 'communityService', label: 'Servicio Comunitario', defaultVisible: false, minWidth: '150px' },
  { key: 'keepKosher', label: 'Kosher', defaultVisible: false, minWidth: '80px' },
  { key: 'primaryEmail', label: 'Email Principal', defaultVisible: false, minWidth: '200px' },
  { key: 'primaryPhone', label: 'Telefono', defaultVisible: false, minWidth: '130px' },
  { key: 'contactPhone', label: 'Tel. Contacto', defaultVisible: false, minWidth: '130px' },
  { key: 'allEmails', label: 'Todos los Emails', defaultVisible: false, minWidth: '250px' },
  { key: 'courseOptionId', label: 'ID Enrollment', defaultVisible: false, minWidth: '160px' },
  { key: 'contactId', label: 'Contact ID', defaultVisible: false, minWidth: '160px' },
  { key: 'fullCourseOption', label: 'Full Course Option', defaultVisible: false, minWidth: '300px' },
];

// ── Program tabs ──

interface ProgramTab {
  key: string;
  label: string;
  color: string;
  activeBg: string;
}

const PROGRAM_TABS: ProgramTab[] = [
  { key: 'all', label: 'Todos', color: 'text-[#1B2A6B]', activeBg: 'bg-[#1B2A6B] text-white' },
  { key: 'Katan', label: 'Katan', color: 'text-blue-700', activeBg: 'bg-blue-600 text-white' },
  { key: 'Noar', label: 'Noar', color: 'text-purple-700', activeBg: 'bg-purple-600 text-white' },
  { key: 'Pre-SOM', label: 'Pre-SOM', color: 'text-amber-700', activeBg: 'bg-amber-600 text-white' },
  { key: 'SOM', label: 'SOM', color: 'text-green-700', activeBg: 'bg-green-600 text-white' },
  { key: 'Trips', label: 'Trips', color: 'text-rose-700', activeBg: 'bg-rose-600 text-white' },
  { key: 'Machanot', label: 'Machanot', color: 'text-cyan-700', activeBg: 'bg-cyan-600 text-white' },
];

export default function RosterPage() {
  const { rosterData, loading } = useData();
  const [showImport, setShowImport] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('all');
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

  // Filter data
  const filteredData = useMemo(() => {
    if (!rosterData) return [];
    let list = rosterData.chanichim;

    // Filter by group
    if (selectedGroup !== 'all') {
      list = list.filter(c => c.program === selectedGroup);
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
  }, [rosterData, selectedGroup, search]);

  // Group counts for tabs
  const groupCounts = useMemo(() => {
    if (!rosterData) return {};
    const counts: Record<string, number> = { all: rosterData.chanichim.length };
    for (const c of rosterData.chanichim) {
      counts[c.program] = (counts[c.program] || 0) + 1;
    }
    return counts;
  }, [rosterData]);

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
    const groupLabel = selectedGroup === 'all' ? 'todos' : selectedGroup;
    a.download = `roster-${groupLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <Topbar title="Rosters" subtitle="Registro de participantes" />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#1B2A6B]/20 border-t-[#1B2A6B] rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Rosters" subtitle="Registro de participantes — Maccabi Tzair Miami" />
      <div className="p-7">
        {/* Empty state */}
        {!rosterData && (
          <div className="max-w-lg mx-auto mt-12">
            <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-10 text-center">
              <FileSpreadsheet className="w-14 h-14 text-[#D8E1EA] mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold text-[#1B2A6B] mb-2">Sin roster importado</h3>
              <p className="text-sm text-[#5A6472] mb-6">
                Importa el reporte de Salesforce para ver los participantes de todos los programas.
              </p>
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all"
              >
                <Upload className="w-4 h-4" /> Importar Roster
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
                    <Users className="w-4 h-4 text-[#E8687D]" /> Participantes
                  </h3>
                  <span className="text-xs text-[#5A6472] bg-[#F2F0EC] px-2 py-0.5 rounded-full">
                    {filteredData.length} de {rosterData.chanichim.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Column visibility */}
                  <div className="relative" ref={colMenuRef}>
                    <button
                      onClick={() => setShowColMenu(!showColMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all"
                    >
                      <Columns3 className="w-3.5 h-3.5" /> Columnas
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showColMenu && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-[#D8E1EA] py-2 z-50 max-h-80 overflow-y-auto">
                        <div className="px-3 py-1.5 border-b border-[#D8E1EA] mb-1">
                          <span className="text-[0.65rem] font-semibold text-[#5A6472] uppercase tracking-wider">
                            Columnas visibles ({visibleCols.size})
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
                    <Upload className="w-3.5 h-3.5" /> Importar
                  </button>
                </div>
              </div>

              {/* Group tabs */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {PROGRAM_TABS.map(tab => {
                  const count = groupCounts[tab.key] || 0;
                  if (tab.key !== 'all' && count === 0) return null;
                  const isActive = selectedGroup === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedGroup(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? tab.activeBg + ' shadow-sm'
                          : 'bg-[#F2F0EC] ' + tab.color + ' hover:bg-[#E8E5DF]'
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-1.5 ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, escuela, grado, email..."
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
                    {selectedGroup === 'all' && (
                      <th className="text-left py-2.5 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-[#5A6472]" style={{ minWidth: '90px' }}>
                        Programa
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
                      {selectedGroup === 'all' && (
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
                  {search ? 'No se encontraron resultados para la busqueda.' : 'No hay participantes en este grupo.'}
                </div>
              )}
            </div>

            {/* Footer */}
            {rosterData && (
              <div className="px-5 py-3 border-t border-[#D8E1EA] bg-[#FAFAF8] text-xs text-[#5A6472] flex items-center justify-between">
                <span>
                  Ultima importacion: {new Date(rosterData.importedAt).toLocaleString('es')}
                  {' · '}
                  {rosterData.sourceFileName}
                </span>
                <span>{filteredData.length} participantes</span>
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
