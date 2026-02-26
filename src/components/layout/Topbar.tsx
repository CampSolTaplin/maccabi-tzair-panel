'use client';

import { FileUp, Plus } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <div className="bg-white px-8 py-4 flex items-center justify-between border-b border-[#E2DFD8] sticky top-0 z-40">
      <div>
        <h2 className="font-serif text-[1.45rem] font-bold text-[#0F2440]">{title}</h2>
        <p className="text-[0.8rem] text-[#5A6472] mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E2DFD8] bg-white text-sm font-medium text-[#1A1A1A] hover:bg-[#f8f7f5] transition-all">
          <FileUp className="w-4 h-4" /> Importar Datos
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F2440] text-white text-sm font-medium hover:bg-[#1B3A5C] transition-all">
          <Plus className="w-4 h-4" /> Nueva Actividad
        </button>
      </div>
    </div>
  );
}
