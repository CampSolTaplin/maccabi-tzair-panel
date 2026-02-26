'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { Database, Bell, Palette, Upload, Edit } from 'lucide-react';

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${on ? 'bg-[#1B2A6B]' : 'bg-[#D0CCC4]'}`}
    >
      <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Configuración" subtitle="Ajustes del sistema y conexiones" />
      <div className="p-7 max-w-4xl">
        {/* Data Source */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6 mb-5">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#E8687D]" /> Fuente de Datos
          </h3>
          <div className="flex items-center justify-between py-3 border-b border-[#f4f2ee]">
            <div>
              <h4 className="text-sm font-medium">Conexión Salesforce API</h4>
              <p className="text-xs text-[#5A6472] mt-0.5">Conectar directamente con Salesforce para importar datos automáticamente</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Próximamente</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm font-medium">Importación Manual CSV/Excel</h4>
              <p className="text-xs text-[#5A6472] mt-0.5">Subir reportes exportados de Salesforce manualmente</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all">
              <Upload className="w-3.5 h-3.5" /> Subir Archivo
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6 mb-5">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#E8687D]" /> Notificaciones
          </h3>
          <div className="flex items-center justify-between py-3 border-b border-[#f4f2ee]">
            <div><h4 className="text-sm font-medium">Alertas de baja asistencia</h4><p className="text-xs text-[#5A6472] mt-0.5">Notificar cuando la asistencia baje del 60%</p></div>
            <Toggle defaultOn />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#f4f2ee]">
            <div><h4 className="text-sm font-medium">Recordatorio de Shabat</h4><p className="text-xs text-[#5A6472] mt-0.5">Enviar recordatorio el viernes a las 3 PM</p></div>
            <Toggle defaultOn />
          </div>
          <div className="flex items-center justify-between py-3">
            <div><h4 className="text-sm font-medium">Reporte semanal por email</h4><p className="text-xs text-[#5A6472] mt-0.5">Resumen de asistencia cada domingo</p></div>
            <Toggle />
          </div>
        </div>

        {/* Season */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#E8687D]" /> Temporada
          </h3>
          <div className="flex items-center justify-between py-3 border-b border-[#f4f2ee]">
            <div><h4 className="text-sm font-medium">Temporada Activa</h4><p className="text-xs text-[#5A6472] mt-0.5">2025/2026</p></div>
            <select className="px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-sm bg-white">
              <option>2025/2026</option><option>2024/2025</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-3">
            <div><h4 className="text-sm font-medium">Horarios por Defecto</h4><p className="text-xs text-[#5A6472] mt-0.5">Katan/Noar: Sábados 10AM | Pre-SOM: Lun+Sáb | SOM: Mié+Sáb</p></div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all">
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
