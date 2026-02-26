'use client';

import dynamic from 'next/dynamic';
import Topbar from '@/components/layout/Topbar';
import KPICard from '@/components/dashboard/KPICard';
import { kpiData, mockActivities } from '@/lib/mock-data';
import { Baby, ShieldCheck, TrendingUp, Clock } from 'lucide-react';

const AttendanceChart = dynamic(() => import('@/components/charts/AttendanceChart'), { ssr: false });
const ProgramChart = dynamic(() => import('@/components/charts/ProgramChart'), { ssr: false });

const programAttendance = [
  { name: 'Katan (K-5)', pct: 82, color: '#1B3A5C' },
  { name: 'Noar (6-8)', pct: 75, color: '#2D8B4E' },
  { name: 'Pre-SOM (9th)', pct: 71, color: '#D4A843' },
  { name: 'SOM (10th)', pct: 80, color: '#C0392B' },
  { name: 'Madrichim', pct: 91, color: '#6C3483' },
];

const upcomingActivities = mockActivities.slice(0, 4);

const typeLabels: Record<string, { label: string; className: string }> = {
  shabat: { label: 'Semanal', className: 'bg-red-50 text-red-700' },
  sleepover: { label: 'Sleepover', className: 'bg-blue-50 text-blue-700' },
  machaneh: { label: 'Machaneh', className: 'bg-green-50 text-green-700' },
  trip: { label: 'Viaje', className: 'bg-amber-50 text-amber-700' },
  special: { label: 'Especial', className: 'bg-purple-50 text-purple-700' },
};

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" subtitle="Resumen general — Temporada 2025/2026" />
      <div className="p-7">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
          <KPICard label="Total Chanichim" value={kpiData.totalChanichim.toLocaleString()} change="12% vs. temporada anterior" changeUp={true} icon={Baby} accentColor="#0F2440" accentBg="rgba(15,36,64,0.08)" />
          <KPICard label="Madrichim Activos" value={kpiData.totalMadrichim} change="3 nuevos este mes" changeUp={true} icon={ShieldCheck} accentColor="#D4A843" accentBg="rgba(212,168,67,0.15)" />
          <KPICard label="Asistencia Promedio" value={`${kpiData.avgAttendance}%`} change="+4% este mes" changeUp={true} icon={TrendingUp} accentColor="#2D8B4E" accentBg="rgba(45,139,78,0.1)" />
          <KPICard label="Horas Comunitarias" value={kpiData.totalCommunityHours.toLocaleString()} change="180 este mes" changeUp={true} icon={Clock} accentColor="#D4843A" accentBg="rgba(212,132,58,0.1)" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 mb-7">
          <div className="bg-white rounded-xl shadow-sm border border-[#E2DFD8] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2DFD8]">
              <h3 className="text-[0.95rem] font-semibold text-[#0F2440]">Tendencia de Asistencia — Últimos 8 Shabatot</h3>
            </div>
            <div className="p-5"><AttendanceChart /></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E2DFD8] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2DFD8]">
              <h3 className="text-[0.95rem] font-semibold text-[#0F2440]">Chanichim por Programa</h3>
            </div>
            <div className="p-5"><ProgramChart /></div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-[#E2DFD8] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2DFD8]">
              <h3 className="text-[0.95rem] font-semibold text-[#0F2440]">Próximas Actividades</h3>
            </div>
            <div className="px-5 py-2">
              {upcomingActivities.map((act) => {
                const d = new Date(act.date);
                const month = d.toLocaleDateString('es-ES', { month: 'short' }).slice(0, 3);
                const day = d.getDate();
                const badge = typeLabels[act.type] || typeLabels.special;
                return (
                  <div key={act.id} className="flex items-center gap-3.5 py-3 border-b border-[#f0eeea] last:border-b-0">
                    <div className="w-[46px] h-[50px] rounded-lg bg-[#FBF4E0] border border-[#D4A843]/20 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[0.6rem] uppercase tracking-wider text-[#D4A843] font-bold">{month}</span>
                      <span className="text-[1.15rem] font-bold text-[#0F2440] leading-none">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[0.85rem] font-semibold text-[#1A1A1A] truncate">{act.name}</h4>
                      <p className="text-[0.75rem] text-[#5A6472] mt-0.5">{act.location} — {act.registeredCount} registrados</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold whitespace-nowrap ${badge.className}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E2DFD8] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2DFD8]">
              <h3 className="text-[0.95rem] font-semibold text-[#0F2440]">Asistencia por Programa — Último Shabat</h3>
            </div>
            <div className="px-5 py-3">
              {programAttendance.map((p) => (
                <div key={p.name} className="flex items-center justify-between py-2.5 border-b border-[#f0eeea] last:border-b-0">
                  <span className="text-[0.85rem] font-medium w-32">{p.name}</span>
                  <div className="flex-1 mx-4 h-1.5 bg-[#f0eeea] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.pct}%`, background: p.color }} />
                  </div>
                  <span className="text-[0.8rem] font-semibold min-w-[40px] text-right" style={{ color: p.color }}>{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
