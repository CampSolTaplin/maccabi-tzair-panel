'use client';

import { useState, useMemo } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { Search, Upload } from 'lucide-react';

export default function RosterPage() {
  const { attendance, isImported, setShowImportModal } = useData();
  const [search, setSearch] = useState('');

  const members = useMemo(() => {
    if (!attendance) return [];
    if (!search) return attendance.members;
    const q = search.toLowerCase();
    return attendance.members.filter(m =>
      m.fullName.toLowerCase().includes(q) ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q)
    );
  }, [attendance, search]);

  // Compute attendance stats per member
  const memberStats = useMemo(() => {
    if (!attendance) return new Map<string, { present: number; absent: number; noData: number; rate: number }>();
    const stats = new Map<string, { present: number; absent: number; noData: number; rate: number }>();
    for (const m of attendance.members) {
      const rec = attendance.records[m.contactId] || {};
      let present = 0, absent = 0, noData = 0;
      for (const d of attendance.dates) {
        const v = rec[d];
        if (v === true) present++;
        else if (v === false) absent++;
        else noData++;
      }
      const total = present + absent;
      stats.set(m.contactId, { present, absent, noData, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
    }
    return stats;
  }, [attendance]);

  if (!isImported || !attendance) {
    return (
      <>
        <Topbar title="Miembros SOM" subtitle="Lista de miembros — School of Madrichim" />
        <div className="p-7">
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E3F2FD] mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-[#1B2A6B]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Importar Datos</h3>
            <p className="text-sm text-[#5A6472] max-w-md mx-auto mb-6">
              Importá el archivo de asistencia SOM para ver la lista completa de miembros.
            </p>
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all mx-auto">
              <Upload className="w-4 h-4" /> Importar Archivo
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Miembros SOM" subtitle="Lista de miembros — School of Madrichim" />
      <div className="p-7">
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-5 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
              <input
                type="text"
                placeholder="Buscar miembro por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F] focus:ring-2 focus:ring-[#2A3D8F]/10"
              />
            </div>
            <span className="text-sm text-[#5A6472]">{members.length} miembros</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#D8E1EA] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['#', 'Nombre', 'Apellido', 'Presentes', 'Ausentes', '% Asistencia'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#D8E1EA] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, idx) => {
                const s = memberStats.get(m.contactId);
                const rate = s?.rate ?? 0;
                return (
                  <tr key={m.contactId} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-[#5A6472]">{idx + 1}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] font-medium">{m.firstName}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] font-medium">{m.lastName}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-[#2D8B4E] font-medium">{s?.present ?? 0}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-[#C0392B] font-medium">{s?.absent ?? 0}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee]">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#f0eeea] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${rate}%`, backgroundColor: rate >= 70 ? '#2D8B4E' : rate >= 40 ? '#E89B3A' : '#C0392B' }} />
                        </div>
                        <span className="font-bold text-xs" style={{ color: rate >= 70 ? '#2D8B4E' : rate >= 40 ? '#E89B3A' : '#C0392B' }}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
