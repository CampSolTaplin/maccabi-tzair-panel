'use client';

import Topbar from '@/components/layout/Topbar';
import { mockActivities } from '@/lib/mock-data';
import { Plus, Users } from 'lucide-react';

const typeConfig: Record<string, { label: string; color: string; bgClass: string }> = {
  shabat: { label: 'SEMANAL', color: '#C0392B', bgClass: 'bg-red-50 text-red-700' },
  sleepover: { label: 'SLEEPOVER', color: '#2A3D8F', bgClass: 'bg-blue-50 text-blue-700' },
  machaneh: { label: 'MACHANEH', color: '#2D8B4E', bgClass: 'bg-green-50 text-green-700' },
  trip: { label: 'VIAJE', color: '#B87514', bgClass: 'bg-amber-50 text-amber-700' },
  special: { label: 'ESPECIAL', color: '#6C3483', bgClass: 'bg-purple-50 text-purple-700' },
};

export default function ActivitiesPage() {
  return (
    <>
      <Topbar title="Actividades Especiales" subtitle="Machanot, viajes, sleepovers y eventos" />
      <div className="p-7">
        <div className="flex justify-between items-center mb-6">
          <div className="flex">
            {['Todas', 'Machanot', 'Viajes', 'Sleepovers'].map((t, i) => (
              <button key={t} className={`px-5 py-2 text-sm font-medium border transition-all ${i === 0 ? 'bg-[#1B2A6B] text-white border-[#1B2A6B]' : 'bg-white text-[#5A6472] border-[#D8E1EA]'} ${i === 0 ? 'rounded-l-lg' : ''} ${i === 3 ? 'rounded-r-lg' : ''} ${i > 0 ? 'border-l-0' : ''}`}>
                {t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all">
            <Plus className="w-4 h-4" /> Crear Actividad
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mockActivities.map((act) => {
            const cfg = typeConfig[act.type] || typeConfig.special;
            const d = new Date(act.date);
            const dateStr = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
            return (
              <div key={act.id} className="bg-white rounded-xl border border-[#D8E1EA] p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="text-[0.68rem] uppercase tracking-[0.1em] font-bold mb-2" style={{ color: cfg.color }}>{cfg.label}</div>
                <h3 className="text-base font-semibold text-[#1B2A6B] mb-1.5">{act.name}</h3>
                <p className="text-sm text-[#5A6472] mb-4">{act.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[0.78rem] font-semibold text-[#1A1A1A] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#5A6472]" /> {act.registeredCount} registrados
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold ${cfg.bgClass}`}>{dateStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
