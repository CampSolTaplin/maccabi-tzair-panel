'use client';

import Topbar from '@/components/layout/Topbar';
import { hoursLeaderboard } from '@/lib/mock-data';
import { Plus, Trophy } from 'lucide-react';

export default function HoursPage() {
  const rankStyles = ['bg-[#FBF4E0] text-[#9A7520]', 'bg-gray-100 text-gray-600', 'bg-[#F0E6D8] text-[#8B6914]'];

  return (
    <>
      <Topbar title="Horas Comunitarias" subtitle="Seguimiento de horas de servicio comunitario" />
      <div className="p-7">
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
          {/* Hours Table */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D8E1EA] flex items-center justify-between">
              <h3 className="text-[0.95rem] font-semibold text-[#1B2A6B]">Registro de Horas Comunitarias</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1B2A6B] text-white text-xs font-medium hover:bg-[#2A3D8F] transition-all">
                <Plus className="w-3.5 h-3.5" /> Agregar Horas
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Chanich/a', 'Programa', 'Grado', 'Horas Totales', 'Última Actividad', 'Agregar'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#D8E1EA]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hoursLeaderboard.map((h) => (
                    <tr key={h.name} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-4 py-3 border-b border-[#f4f2ee] font-medium">{h.name}</td>
                      <td className="px-4 py-3 border-b border-[#f4f2ee]">{h.program}</td>
                      <td className="px-4 py-3 border-b border-[#f4f2ee]">{h.grade}</td>
                      <td className="px-4 py-3 border-b border-[#f4f2ee] font-bold text-[#1B2A6B]">{h.hours}h</td>
                      <td className="px-4 py-3 border-b border-[#f4f2ee] text-[#5A6472]">{h.lastActivity}</td>
                      <td className="px-4 py-3 border-b border-[#f4f2ee]">
                        <input type="number" placeholder="0" min="0" className="w-16 text-center px-2 py-1 rounded-lg border border-[#D8E1EA] text-sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D8E1EA] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#E8687D]" />
              <h3 className="text-[0.95rem] font-semibold text-[#1B2A6B]">Top 8 — Leaderboard</h3>
            </div>
            <div className="px-5 py-2">
              {hoursLeaderboard.map((h, i) => (
                <div key={h.name} className="flex items-center gap-3 py-3 border-b border-[#f0eeea] last:border-b-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < 3 ? rankStyles[i] : 'bg-[#f4f2ee] text-[#5A6472]'}`}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium flex-1">{h.name}</span>
                  <span className="text-sm font-bold text-[#1B2A6B]">
                    {h.hours}<span className="text-xs text-[#5A6472] font-normal">h</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
