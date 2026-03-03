'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { Database, Bell, Palette, Upload, Edit, CheckCircle2, Trash2, CalendarDays, Plus, X } from 'lucide-react';
import { useData } from '@/lib/data-context';

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
  const { setShowImportModal, isImported, attendance, clearImport, enabledDates, toggleEnabledDate } = useData();
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const sortedEnabledDates = [...enabledDates].sort((a, b) => b.localeCompare(a));

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = d.getDate();
    const month = d.toLocaleDateString('es-ES', { month: 'long' });
    const year = d.getFullYear();
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} de ${month} ${year}`;
  };

  const handleAddDate = () => {
    if (newDate && !enabledDates.includes(newDate)) {
      toggleEnabledDate(newDate);
    }
  };

  return (
    <>
      <Topbar title="Configuración" subtitle="Ajustes del sistema SOM" />
      <div className="p-7 max-w-4xl">
        {/* Attendance Dates for Madrichim */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6 mb-5">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#E8687D]" /> Habilitar Asistencia (Madrichim)
          </h3>
          <p className="text-xs text-[#5A6472] mb-4">
            Habilitá las fechas en las que los Madrichim pueden tomar asistencia desde sus celulares.
            Solo las fechas activas aparecerán en la app de los Madrichim.
          </p>

          {/* Add date */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm bg-white focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
            />
            <button
              onClick={handleAddDate}
              disabled={!newDate || enabledDates.includes(newDate)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Habilitar
            </button>
          </div>

          {/* Enabled dates list */}
          {sortedEnabledDates.length === 0 ? (
            <div className="text-center py-6 text-sm text-[#5A6472] bg-[#f8f7f5] rounded-lg">
              No hay fechas habilitadas. Los Madrichim no pueden tomar asistencia.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEnabledDates.map(date => (
                <div key={date} className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-[#D8E1EA] bg-[#f8f7f5]">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#2D8B4E]" />
                    <span className="text-sm font-medium text-[#1A1A2E]">{formatDate(date)}</span>
                  </div>
                  <button
                    onClick={() => toggleEnabledDate(date)}
                    className="p-1.5 rounded-lg text-[#C0392B] hover:bg-red-50 transition-all"
                    title="Deshabilitar fecha"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Source */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6 mb-5">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#E8687D]" /> Datos de Asistencia
          </h3>
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm font-medium">Archivo de Asistencia SOM</h4>
              <p className="text-xs text-[#5A6472] mt-0.5">
                {isImported && attendance
                  ? `${attendance.members.length} miembros · ${attendance.dates.length} sesiones · ${attendance.months.length} meses`
                  : 'Subir el archivo SOM ATTENDANCE.xlsx'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isImported && (
                <>
                  <span className="flex items-center gap-1 text-xs text-[#2D8B4E] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                  </span>
                  <button
                    onClick={clearImport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-[#C0392B] hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Borrar
                  </button>
                </>
              )}
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all"
              >
                <Upload className="w-3.5 h-3.5" /> {isImported ? 'Reimportar' : 'Subir Archivo'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-6 mb-5">
          <h3 className="text-base font-semibold text-[#1B2A6B] mb-4 pb-3 border-b border-[#D8E1EA] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#E8687D]" /> Notificaciones
          </h3>
          <div className="flex items-center justify-between py-3 border-b border-[#f4f2ee]">
            <div><h4 className="text-sm font-medium">Alertas de baja asistencia</h4><p className="text-xs text-[#5A6472] mt-0.5">Notificar cuando la asistencia baje del 40%</p></div>
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
            <div><h4 className="text-sm font-medium">Horario SOM</h4><p className="text-xs text-[#5A6472] mt-0.5">Miércoles + Sábados</p></div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all">
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
