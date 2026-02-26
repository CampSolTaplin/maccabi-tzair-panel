'use client';

import { useState, useMemo, useCallback } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { programBgClass } from '@/lib/utils';
import {
  ArrowLeft, Users, Clock, ClipboardList, Save,
  Check, X, Calendar, UserCheck, UserX, AlertTriangle,
  CheckCircle2, Upload,
} from 'lucide-react';
import type { GradeGroup } from '@/types';

type AttendanceStatus = 'present' | 'late' | 'absent';

export default function AttendancePage() {
  const { chanichim, gradeGroups, isImported } = useData();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [tab, setTab] = useState<'chanichim' | 'madrichim'>('chanichim');
  // attendance keyed by `${date}:${chanichId}`
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  const dateKey = (chanichId: string) => `${selectedDate}:${chanichId}`;

  // Get chanichim for selected grade, sorted alphabetically
  const gradeChanichim = useMemo(() => {
    if (!selectedGrade) return [];
    return chanichim
      .filter(c => c.gradeLevel === selectedGrade)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [selectedGrade]);

  const setStatus = useCallback((chanichId: string, status: AttendanceStatus) => {
    setAttendance(prev => {
      const key = `${selectedDate}:${chanichId}`;
      // Toggle off if clicking same status
      if (prev[key] === status) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: status };
    });
  }, [selectedDate]);

  const markAllPresent = useCallback(() => {
    setAttendance(prev => {
      const next = { ...prev };
      gradeChanichim.forEach(c => {
        next[`${selectedDate}:${c.id}`] = 'present';
      });
      return next;
    });
  }, [gradeChanichim, selectedDate]);

  // Stats for a specific grade on current date
  const getGradeStats = useCallback((gradeId: string) => {
    const gradeMembers = chanichim.filter(c => c.gradeLevel === gradeId);
    let marked = 0, presentCount = 0, lateCount = 0, absentCount = 0;
    gradeMembers.forEach(c => {
      const s = attendance[`${selectedDate}:${c.id}`];
      if (s) {
        marked++;
        if (s === 'present') presentCount++;
        else if (s === 'late') lateCount++;
        else if (s === 'absent') absentCount++;
      }
    });
    return { total: gradeMembers.length, marked, present: presentCount, late: lateCount, absent: absentCount };
  }, [chanichim, attendance, selectedDate]);

  // Stats for current detail view
  const detailStats = useMemo(() => {
    if (!selectedGrade) return { total: 0, marked: 0, present: 0, late: 0, absent: 0, rate: 0 };
    const stats = getGradeStats(selectedGrade);
    const rate = stats.marked > 0 ? Math.round(((stats.present + stats.late) / stats.marked) * 100) : 0;
    return { ...stats, rate };
  }, [selectedGrade, getGradeStats]);

  const selectedGroup = gradeGroups.find(g => g.id === selectedGrade);

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ─── DETAIL VIEW (when a grade is selected) ───
  if (selectedGrade && selectedGroup && tab === 'chanichim') {
    return (
      <>
        <Topbar title="Asistencia" subtitle="Control de asistencia semanal de Chanichim y Madrichim" />
        <div className="p-7">
          {/* Back + Header */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-5 mb-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedGrade(null)}
                  className="w-9 h-9 rounded-lg border border-[#D8E1EA] flex items-center justify-center hover:bg-[#f8f7f5] transition-all"
                >
                  <ArrowLeft className="w-4 h-4 text-[#5A6472]" />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-serif font-bold text-[#1B2A6B]">
                      {selectedGroup.id === '9th' ? 'Pre-SOM' : selectedGroup.id === '10th' ? 'SOM' : selectedGroup.id}
                    </h2>
                    <span className="text-sm text-[#5A6472]">{selectedGroup.label}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold ${programBgClass(selectedGroup.program)}`}>
                      {selectedGroup.program}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-[#5A6472]">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {selectedGroup.realCount} chanichim</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedGroup.schedule}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#f8f7f5] px-3 py-2 rounded-lg border border-[#D8E1EA]">
                  <Calendar className="w-4 h-4 text-[#5A6472]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-[#D8E1EA] px-4 py-3 text-center">
              <div className="text-2xl font-serif font-bold text-[#1B2A6B]">{gradeChanichim.length}</div>
              <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">En lista</div>
            </div>
            <div className="bg-white rounded-xl border border-[#D8E1EA] px-4 py-3 text-center">
              <div className="text-2xl font-serif font-bold text-[#2D8B4E]">{detailStats.present}</div>
              <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Presentes</div>
            </div>
            <div className="bg-white rounded-xl border border-[#D8E1EA] px-4 py-3 text-center">
              <div className="text-2xl font-serif font-bold text-[#E89B3A]">{detailStats.late}</div>
              <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Tardanza</div>
            </div>
            <div className="bg-white rounded-xl border border-[#D8E1EA] px-4 py-3 text-center">
              <div className="text-2xl font-serif font-bold text-[#C0392B]">{detailStats.absent}</div>
              <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Ausentes</div>
            </div>
            <div className="bg-white rounded-xl border border-[#D8E1EA] px-4 py-3 text-center">
              <div className="text-2xl font-serif font-bold" style={{ color: selectedGroup.color }}>
                {detailStats.marked > 0 ? `${detailStats.rate}%` : '—'}
              </div>
              <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Asistencia</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={markAllPresent}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D8E1EA] bg-white text-sm font-medium hover:bg-[#f8f7f5] transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-[#2D8B4E]" /> Marcar todos presente
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all">
              <Save className="w-4 h-4" /> Guardar Asistencia
            </button>
            <p className="text-xs text-[#5A6472] ml-2 capitalize">{formatDateDisplay(selectedDate)}</p>
          </div>

          {/* Attendance List */}
          <div className="bg-white rounded-xl border border-[#D8E1EA] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3 bg-[#FAFAF8] border-b border-[#D8E1EA]">
              <span className="text-xs uppercase tracking-wider text-[#5A6472] font-semibold">Chanich/a</span>
              <span className="text-xs uppercase tracking-wider text-[#5A6472] font-semibold text-right">Estado</span>
            </div>

            {gradeChanichim.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Users className="w-10 h-10 text-[#D8E1EA] mx-auto mb-3" />
                <p className="text-[#5A6472] text-sm">No hay chanichim cargados para este grado.</p>
                <p className="text-[#5A6472] text-xs mt-1">Los datos se cargarán al importar desde Salesforce.</p>
              </div>
            ) : (
              <div>
                {gradeChanichim.map((c, idx) => {
                  const status = attendance[dateKey(c.id)] || null;
                  return (
                    <div
                      key={c.id}
                      className={`grid grid-cols-[1fr_auto] gap-4 items-center px-5 py-3 transition-colors ${
                        idx < gradeChanichim.length - 1 ? 'border-b border-[#f4f2ee]' : ''
                      } ${status === 'absent' ? 'bg-red-50/40' : status === 'late' ? 'bg-amber-50/40' : status === 'present' ? 'bg-green-50/30' : 'hover:bg-[#FAFAF8]'}`}
                    >
                      {/* Name + info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: selectedGroup.color }}
                        >
                          {c.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.fullName}</p>
                          <p className="text-xs text-[#5A6472] truncate">{c.school}{c.allergies && c.allergies !== 'No' && c.allergies !== 'N/A' ? ` · ⚠ ${c.allergies}` : ''}</p>
                        </div>
                      </div>

                      {/* Status buttons */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setStatus(c.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            status === 'present'
                              ? 'bg-[#2D8B4E] text-white shadow-sm'
                              : 'bg-[#f4f2ee] text-[#5A6472] hover:bg-[#e8e5de]'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span className="hidden sm:inline">Presente</span>
                        </button>
                        <button
                          onClick={() => setStatus(c.id, 'late')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            status === 'late'
                              ? 'bg-[#E89B3A] text-white shadow-sm'
                              : 'bg-[#f4f2ee] text-[#5A6472] hover:bg-[#e8e5de]'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span className="hidden sm:inline">Tarde</span>
                        </button>
                        <button
                          onClick={() => setStatus(c.id, 'absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            status === 'absent'
                              ? 'bg-[#C0392B] text-white shadow-sm'
                              : 'bg-[#f4f2ee] text-[#5A6472] hover:bg-[#e8e5de]'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span className="hidden sm:inline">Ausente</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Data notice */}
          <p className="text-xs text-[#5A6472] mt-3">
            {isImported
              ? `Mostrando ${gradeChanichim.length} chanichim (datos importados de Salesforce)`
              : `Mostrando ${gradeChanichim.length} de ${selectedGroup.realCount} chanichim (datos de ejemplo — importar de Salesforce para ver la lista completa)`
            }
          </p>
        </div>
      </>
    );
  }

  // ─── MAIN VIEW (Grade cards + Madrichim tab) ───
  return (
    <>
      <Topbar title="Asistencia" subtitle="Control de asistencia semanal de Chanichim y Madrichim" />
      <div className="p-7">
        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-5 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Tabs */}
            <div className="flex">
              <button
                onClick={() => setTab('chanichim')}
                className={`px-6 py-2.5 text-sm font-medium border transition-all ${
                  tab === 'chanichim'
                    ? 'bg-[#1B2A6B] text-white border-[#1B2A6B]'
                    : 'bg-white text-[#5A6472] border-[#D8E1EA]'
                } rounded-l-lg`}
              >
                Chanichim
              </button>
              <button
                onClick={() => setTab('madrichim')}
                className={`px-6 py-2.5 text-sm font-medium border-t border-b border-r transition-all ${
                  tab === 'madrichim'
                    ? 'bg-[#1B2A6B] text-white border-[#1B2A6B]'
                    : 'bg-white text-[#5A6472] border-[#D8E1EA]'
                } rounded-r-lg`}
              >
                Madrichim
              </button>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-[#f8f7f5] px-3 py-2 rounded-lg border border-[#D8E1EA]">
              <Calendar className="w-4 h-4 text-[#5A6472]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none"
              />
            </div>
          </div>
          <p className="text-sm text-[#5A6472] mt-3 capitalize">{formatDateDisplay(selectedDate)}</p>
        </div>

        {tab === 'chanichim' ? (
          <>
            {/* ── Program Section Headers + Grade Cards ── */}
            {/* Maccabi Katan */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#1B2A6B]" />
                <h3 className="text-sm font-semibold text-[#1B2A6B] uppercase tracking-wider">Maccabi Katan</h3>
                <span className="text-xs text-[#5A6472]">K - 5to Grado · Sábados 10AM</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {gradeGroups.filter(g => g.program === 'Maccabi Katan').map(group => (
                  <GradeCard
                    key={group.id}
                    group={group}
                    stats={getGradeStats(group.id)}
                    onClick={() => setSelectedGrade(group.id)}
                  />
                ))}
              </div>
            </div>

            {/* Maccabi Noar */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#2D8B4E]" />
                <h3 className="text-sm font-semibold text-[#2D8B4E] uppercase tracking-wider">Maccabi Noar</h3>
                <span className="text-xs text-[#5A6472]">6to - 8vo Grado · Sábados 10AM</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {gradeGroups.filter(g => g.program === 'Maccabi Noar').map(group => (
                  <GradeCard
                    key={group.id}
                    group={group}
                    stats={getGradeStats(group.id)}
                    onClick={() => setSelectedGrade(group.id)}
                  />
                ))}
              </div>
            </div>

            {/* Pre-SOM & SOM */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#E8687D]" />
                <h3 className="text-sm font-semibold text-[#E8687D] uppercase tracking-wider">Pre-SOM &amp; SOM</h3>
                <span className="text-xs text-[#5A6472]">9no - 10mo Grado</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {gradeGroups.filter(g => g.program === 'Pre-SOM' || g.program === 'SOM').map(group => (
                  <GradeCard
                    key={group.id}
                    group={group}
                    stats={getGradeStats(group.id)}
                    onClick={() => setSelectedGrade(group.id)}
                  />
                ))}
              </div>
            </div>

            {/* Overall Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-5">
              <h4 className="text-sm font-semibold text-[#1B2A6B] mb-3">Resumen del día</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  let totalAll = 0, markedAll = 0, presentAll = 0, lateAll = 0, absentAll = 0;
                  gradeGroups.forEach(g => {
                    const s = getGradeStats(g.id);
                    totalAll += s.total;
                    markedAll += s.marked;
                    presentAll += s.present;
                    lateAll += s.late;
                    absentAll += s.absent;
                  });
                  return (
                    <>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <UserCheck className="w-4 h-4 text-[#2D8B4E]" />
                          <span className="text-lg font-serif font-bold text-[#2D8B4E]">{presentAll}</span>
                        </div>
                        <p className="text-xs text-[#5A6472]">Presentes</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-[#E89B3A]" />
                          <span className="text-lg font-serif font-bold text-[#E89B3A]">{lateAll}</span>
                        </div>
                        <p className="text-xs text-[#5A6472]">Tardanza</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <UserX className="w-4 h-4 text-[#C0392B]" />
                          <span className="text-lg font-serif font-bold text-[#C0392B]">{absentAll}</span>
                        </div>
                        <p className="text-xs text-[#5A6472]">Ausentes</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <ClipboardList className="w-4 h-4 text-[#1B2A6B]" />
                          <span className="text-lg font-serif font-bold text-[#1B2A6B]">{markedAll}/{totalAll}</span>
                        </div>
                        <p className="text-xs text-[#5A6472]">Marcados</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        ) : (
          /* ── Madrichim Tab (placeholder) ── */
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f4f2ee] mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-[#5A6472]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Gestión de Madrichim</h3>
            <p className="text-sm text-[#5A6472] max-w-md mx-auto mb-1">
              La lista de Madrichim se importará por separado. Cada Madrich/a será asignado/a a un grado específico o a un rol dentro del programa.
            </p>
            <p className="text-xs text-[#5A6472] max-w-md mx-auto mb-6">
              Los chanichim de 11vo y 12vo grado (Madrichim y Sr. Madrichim) aparecerán aquí una vez importada su lista.
            </p>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#D8E1EA] bg-white text-sm font-medium hover:bg-[#f8f7f5] transition-all mx-auto">
              <Upload className="w-4 h-4" /> Importar Lista de Madrichim
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Grade Card Component ───
function GradeCard({
  group,
  stats,
  onClick,
}: {
  group: GradeGroup;
  stats: { total: number; marked: number; present: number; late: number; absent: number };
  onClick: () => void;
}) {
  const hasAttendance = stats.marked > 0;
  const attendanceRate = stats.marked > 0 ? Math.round(((stats.present + stats.late) / stats.marked) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group w-full"
    >
      {/* Color accent */}
      <div className="h-1.5" style={{ backgroundColor: group.color }} />

      <div className="p-4">
        {/* Grade label */}
        <div className="mb-3">
          <h3 className="text-2xl font-serif font-bold" style={{ color: group.color }}>
            {group.id === '9th' ? 'Pre-SOM' : group.id === '10th' ? 'SOM' : group.id}
          </h3>
          <p className="text-xs text-[#5A6472] mt-0.5">
            {group.id === '9th' ? '9no Grado' : group.id === '10th' ? '10mo Grado' : group.label}
          </p>
        </div>

        {/* Count */}
        <div className="flex items-center gap-1.5 text-sm text-[#5A6472] mb-1">
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium">{group.realCount}</span>
          <span className="text-xs">chanichim</span>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-1.5 text-xs text-[#5A6472] mb-3">
          <Clock className="w-3 h-3" />
          <span>{group.schedule}</span>
        </div>

        {/* Attendance status or CTA */}
        <div className="pt-3 border-t border-[#f4f2ee]">
          {hasAttendance ? (
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#2D8B4E] font-medium">{stats.present + stats.late}/{stats.marked}</span>
                <span className="font-semibold" style={{ color: attendanceRate >= 75 ? '#2D8B4E' : attendanceRate >= 50 ? '#E89B3A' : '#C0392B' }}>
                  {attendanceRate}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#f4f2ee] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${attendanceRate}%`,
                    backgroundColor: attendanceRate >= 75 ? '#2D8B4E' : attendanceRate >= 50 ? '#E89B3A' : '#C0392B',
                  }}
                />
              </div>
              {stats.absent > 0 && (
                <p className="text-[0.65rem] text-[#C0392B] mt-1.5">{stats.absent} ausente{stats.absent > 1 ? 's' : ''}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#5A6472] flex items-center gap-1.5 group-hover:text-[#1B2A6B] transition-colors">
              <ClipboardList className="w-3.5 h-3.5" />
              Tomar asistencia
              <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
