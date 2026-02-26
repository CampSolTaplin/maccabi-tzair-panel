'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { mockChanichim } from '@/lib/mock-data';
import { programBgClass } from '@/lib/utils';
import { Save } from 'lucide-react';

type Status = 'present' | 'absent' | 'late';

export default function AttendancePage() {
  const [tab, setTab] = useState<'chanichim' | 'madrichim'>('chanichim');
  const [attendance, setAttendance] = useState<Record<string, Status>>(() => {
    const init: Record<string, Status> = {};
    mockChanichim.forEach((c, i) => {
      init[c.id] = i % 8 === 6 ? 'absent' : i % 10 === 7 ? 'late' : 'present';
    });
    return init;
  });

  const toggle = (id: string) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === 'present' ? 'absent' : prev[id] === 'absent' ? 'late' : 'present',
    }));
  };

  const present = Object.values(attendance).filter((s) => s === 'present').length;
  const absent = Object.values(attendance).filter((s) => s === 'absent').length;
  const late = Object.values(attendance).filter((s) => s === 'late').length;
  const total = mockChanichim.length;
  const rate = Math.round(((present + late) / total) * 100);

  return (
    <>
      <Topbar title="Asistencia" subtitle="Control de asistencia semanal de Chanichim y Madrichim" />
      <div className="p-7">
        <div className="bg-white rounded-xl shadow-sm border border-[#E2DFD8] p-5 mb-5">
          {/* Tabs */}
          <div className="flex mb-5">
            <button onClick={() => setTab('chanichim')} className={`px-6 py-2.5 text-sm font-medium border transition-all ${tab === 'chanichim' ? 'bg-[#0F2440] text-white border-[#0F2440]' : 'bg-white text-[#5A6472] border-[#E2DFD8]'} rounded-l-lg`}>Chanichim</button>
            <button onClick={() => setTab('madrichim')} className={`px-6 py-2.5 text-sm font-medium border-t border-b border-r transition-all ${tab === 'madrichim' ? 'bg-[#0F2440] text-white border-[#0F2440]' : 'bg-white text-[#5A6472] border-[#E2DFD8]'} rounded-r-lg`}>Madrichim</button>
          </div>

          {/* Controls */}
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[0.72rem] uppercase tracking-wider text-[#5A6472] font-semibold">Fecha</label>
              <input type="date" defaultValue="2026-02-28" className="px-3.5 py-2 rounded-lg border border-[#E2DFD8] text-sm bg-white focus:outline-none focus:border-[#1B3A5C] focus:ring-2 focus:ring-[#1B3A5C]/10" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.72rem] uppercase tracking-wider text-[#5A6472] font-semibold">Programa</label>
              <select className="px-3.5 py-2 rounded-lg border border-[#E2DFD8] text-sm bg-white focus:outline-none focus:border-[#1B3A5C]">
                <option>Todos los Programas</option>
                <option>Maccabi Katan (K-5)</option>
                <option>Maccabi Noar (6-8)</option>
                <option>Pre-SOM (9th)</option>
                <option>SOM (10th)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.72rem] uppercase tracking-wider text-[#5A6472] font-semibold">Grado</label>
              <select className="px-3.5 py-2 rounded-lg border border-[#E2DFD8] text-sm bg-white focus:outline-none focus:border-[#1B3A5C]">
                <option>Todos</option>
                {['K','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F2440] text-white text-sm font-medium hover:bg-[#1B3A5C] transition-all">
              <Save className="w-4 h-4" /> Guardar Asistencia
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E2DFD8] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#E2DFD8] w-10"></th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#E2DFD8]">Nombre</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#E2DFD8]">Grado</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#E2DFD8]">Programa</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#E2DFD8]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {mockChanichim.map((c) => {
                const st = attendance[c.id] || 'absent';
                const dotColor = st === 'present' ? 'bg-[#2D8B4E]' : st === 'late' ? 'bg-[#D4843A]' : 'bg-[#C0392B]';
                const label = st === 'present' ? 'Presente' : st === 'late' ? 'Tarde' : 'Ausente';
                return (
                  <tr key={c.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-center">
                      <input type="checkbox" checked={st !== 'absent'} onChange={() => toggle(c.id)} className="w-4 h-4 accent-[#0F2440] cursor-pointer" />
                    </td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] font-medium">{c.fullName}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee]">{c.gradeLevel}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee]">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold ${programBgClass(c.program)}`}>{c.program}</span>
                    </td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee]">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex gap-8 mt-5 pt-5 border-t border-[#E2DFD8]">
          <div className="text-center">
            <div className="font-serif text-2xl font-bold text-[#0F2440]">{present}</div>
            <div className="text-[0.72rem] uppercase tracking-wider text-[#5A6472] font-semibold">Presentes</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-2xl font-bold text-[#C0392B]">{absent}</div>
            <div className="text-[0.72rem] uppercase tracking-wider text-[#5A6472] font-semibold">Ausentes</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-2xl font-bold text-[#D4843A]">{late}</div>
            <div className="text-[0.72rem] uppercase tracking-wider text-[#5A6472] font-semibold">Tarde</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-2xl font-bold text-[#2D8B4E]">{rate}%</div>
            <div className="text-[0.72rem] uppercase tracking-wider text-[#5A6472] font-semibold">Tasa</div>
          </div>
        </div>
      </div>
    </>
  );
}
