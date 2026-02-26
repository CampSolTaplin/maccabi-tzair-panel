'use client';

import Topbar from '@/components/layout/Topbar';
import KPICard from '@/components/dashboard/KPICard';
import { RefreshCw, UserPlus, CalendarCheck, Hourglass } from 'lucide-react';

export default function StatisticsPage() {
  return (
    <>
      <Topbar title="Estadísticas" subtitle="Análisis y métricas del programa" />
      <div className="p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
          <KPICard label="Retención" value="84%" change="+6% vs. año pasado" changeUp={true} icon={RefreshCw} accentColor="#0F2440" accentBg="rgba(15,36,64,0.08)" />
          <KPICard label="Nuevos Chanichim" value="97" change="16% del total" changeUp={true} icon={UserPlus} accentColor="#D4A843" accentBg="rgba(212,168,67,0.15)" />
          <KPICard label="Actividades Realizadas" value="34" change="8 este mes" changeUp={true} icon={CalendarCheck} accentColor="#2D8B4E" accentBg="rgba(45,139,78,0.1)" />
          <KPICard label="Horas/Chanich Prom." value="12.4" change="Meta: 20 horas" changeUp={false} icon={Hourglass} accentColor="#D4843A" accentBg="rgba(212,132,58,0.1)" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E2DFD8] p-8 text-center">
          <p className="text-[#5A6472] text-lg">Gráficos detallados de estadísticas se activarán con datos reales de Supabase.</p>
          <p className="text-[#5A6472] text-sm mt-2">Por ahora, los KPIs de arriba muestran datos de ejemplo.</p>
        </div>
      </div>
    </>
  );
}
