'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { programBgClass } from '@/lib/utils';
import { Search, FileUp } from 'lucide-react';

export default function RosterPage() {
  const { chanichim, isImported, setShowImportModal } = useData();
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('');
  const [grade, setGrade] = useState('');

  const filtered = chanichim.filter((c) => {
    if (search && !c.fullName.toLowerCase().includes(search.toLowerCase()) && !c.school.toLowerCase().includes(search.toLowerCase())) return false;
    if (program && c.program !== program) return false;
    if (grade && c.gradeLevel !== grade) return false;
    return true;
  });

  return (
    <>
      <Topbar title="Registro / Roster" subtitle="Base de datos de chanichim y madrichim" />
      <div className="p-7">
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-5 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
              <input
                type="text"
                placeholder="Buscar chanich/a por nombre, escuela..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F] focus:ring-2 focus:ring-[#2A3D8F]/10"
              />
            </div>
            <select value={program} onChange={(e) => setProgram(e.target.value)} className="px-3.5 py-2.5 rounded-lg border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#2A3D8F]">
              <option value="">Todos los Programas</option>
              <option value="Maccabi Katan">Maccabi Katan</option>
              <option value="Maccabi Noar">Maccabi Noar</option>
              <option value="Pre-SOM">Pre-SOM</option>
              <option value="SOM">SOM</option>
            </select>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="px-3.5 py-2.5 rounded-lg border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#2A3D8F]">
              <option value="">Todos los Grados</option>
              {['K','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D8E1EA] bg-white text-sm font-medium hover:bg-[#f8f7f5] transition-all"
            >
              <FileUp className="w-4 h-4" /> Importar de Salesforce
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#D8E1EA] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Nombre', 'Grado', 'Programa', 'Escuela', 'Contacto de Emergencia', 'Teléfono', 'Alergias'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#D8E1EA] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee] font-medium">{c.fullName}</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee]">{c.gradeLevel}</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee]">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold ${programBgClass(c.program)}`}>{c.program}</span>
                  </td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee]">{c.school}</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee]">{c.emergencyContactName}</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee]">{c.emergencyPhone}</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee]">{c.allergies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-[#5A6472] mt-3">
          {isImported
            ? `Mostrando ${filtered.length} de ${chanichim.length} registros (datos importados de Salesforce)`
            : `Mostrando ${filtered.length} de ${chanichim.length} registros (datos de ejemplo — importar para ver los 608 chanichim)`
          }
        </p>
      </div>
    </>
  );
}
