'use client';

import { FileUp, CheckCircle2 } from 'lucide-react';
import { useData } from '@/lib/data-context';

interface TopbarProps {
  title: string;
  subtitle: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { setShowImportModal, isImported, attendance } = useData();

  return (
    <div className="bg-white px-8 py-4 flex items-center justify-between border-b border-[#D8E1EA] sticky top-0 z-40">
      <div>
        <h2 className="font-serif text-[1.45rem] font-bold text-[#1B2A6B]">{title}</h2>
        <p className="text-[0.8rem] text-[#5A6472] mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {isImported && attendance && (
          <span className="flex items-center gap-1.5 text-xs text-[#2D8B4E] font-medium bg-green-50 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {attendance.members.length} miembros · {attendance.dates.length} sesiones
          </span>
        )}
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D8E1EA] bg-white text-sm font-medium text-[#1A1A2E] hover:bg-[#F0F4F8] transition-all"
        >
          <FileUp className="w-4 h-4" /> Importar Asistencia
        </button>
      </div>
    </div>
  );
}
