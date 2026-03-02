'use client';

import { useState, useMemo } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { computeAllMemberHours, MemberHours } from '@/lib/community-hours';
import { CommunityEvent } from '@/types';
import {
  Upload, Search, Plus, Trash2, Users, FileText,
  Calendar, Clock, Award, Star, X, Check,
} from 'lucide-react';

export default function HoursPage() {
  const { attendance, isImported, setShowImportModal, events, addEvent, updateEvent, deleteEvent, activeMembers } = useData();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'members' | 'events'>('members');
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [letterMember, setLetterMember] = useState<MemberHours | null>(null);

  // Only compute hours for active members
  const activeIds = useMemo(() => new Set(activeMembers.map(m => m.contactId)), [activeMembers]);

  const allHours = useMemo(() =>
    computeAllMemberHours(attendance, events).filter(m => activeIds.has(m.contactId)),
  [attendance, events, activeIds]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allHours;
    return allHours.filter(m =>
      m.fullName.toLowerCase().includes(q) ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      `${m.lastName} ${m.firstName}`.toLowerCase().includes(q)
    );
  }, [allHours, search]);

  const totalRegular = allHours.reduce((s, m) => s + m.regularHours, 0);
  const totalEvent = allHours.reduce((s, m) => s + m.eventHours, 0);
  const avgHours = allHours.length > 0 ? Math.round((totalRegular + totalEvent) / allHours.length) : 0;

  // ── No data ──
  if (!isImported || !attendance) {
    return (
      <>
        <Topbar title="Horas Comunitarias" subtitle="Community Service Hours — School of Madrichim" />
        <div className="p-7">
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E3F2FD] mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-[#1B2A6B]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Importar Asistencia</h3>
            <p className="text-sm text-[#5A6472] max-w-md mx-auto mb-6">
              Las horas comunitarias se calculan automáticamente desde la asistencia. Importá el archivo primero.
            </p>
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all mx-auto">
              <Upload className="w-4 h-4" /> Importar Asistencia
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Horas Comunitarias" subtitle="Community Service Hours — School of Madrichim" />
      <div className="p-5">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#1B2A6B]">{allHours.length}</div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Miembros</div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#2D8B4E]">{avgHours}</div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Promedio Horas</div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#E89B3A]">{events.length}</div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Eventos Especiales</div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#E8687D]">{totalRegular + totalEvent}</div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Total Horas</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tabs */}
            <div className="flex">
              <button onClick={() => setTab('members')} className={`px-5 py-2 text-sm font-medium border transition-all rounded-l-lg ${tab === 'members' ? 'bg-[#1B2A6B] text-white border-[#1B2A6B]' : 'bg-white text-[#5A6472] border-[#D8E1EA]'}`}>
                <Users className="w-4 h-4 inline mr-1.5" />Miembros
              </button>
              <button onClick={() => setTab('events')} className={`px-5 py-2 text-sm font-medium border-t border-b border-r transition-all rounded-r-lg ${tab === 'events' ? 'bg-[#1B2A6B] text-white border-[#1B2A6B]' : 'bg-white text-[#5A6472] border-[#D8E1EA]'}`}>
                <Calendar className="w-4 h-4 inline mr-1.5" />Eventos ({events.length})
              </button>
            </div>

            {tab === 'members' && (
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
                <input type="text" placeholder="Buscar miembro..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
              </div>
            )}

            {tab === 'events' && (
              <button onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8687D] text-white text-sm font-medium hover:bg-[#D4566A] transition-all ml-auto">
                <Plus className="w-4 h-4" /> Nuevo Evento
              </button>
            )}
          </div>
        </div>

        {/* Members Tab */}
        {tab === 'members' && (
          <div className="overflow-x-auto rounded-xl border border-[#D8E1EA] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['#', 'Miembro', 'Sesiones', 'Horas Regulares', 'Horas Eventos', 'Total Horas', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#D8E1EA] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, idx) => (
                  <tr key={m.contactId} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-[#5A6472]">{idx + 1}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] font-medium">{m.lastName}, {m.firstName}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee]">{m.regularSessions}</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-[#2D8B4E] font-medium">{m.regularHours}h</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-[#E89B3A] font-medium">{m.eventHours}h</td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee]">
                      <span className="font-bold text-[#1B2A6B]">{m.totalHours}h</span>
                    </td>
                    <td className="px-4 py-2.5 border-b border-[#f4f2ee]">
                      <button onClick={() => setLetterMember(m)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all">
                        <FileText className="w-3.5 h-3.5" /> Carta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Events Tab */}
        {tab === 'events' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-10 text-center">
                <Star className="w-10 h-10 text-[#D8E1EA] mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#1B2A6B] mb-1">No hay eventos especiales</h3>
                <p className="text-sm text-[#5A6472] mb-4">Creá un evento comunitario para asignar horas extra a los miembros.</p>
                <button onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E8687D] text-white text-sm font-medium hover:bg-[#D4566A] transition-all mx-auto">
                  <Plus className="w-4 h-4" /> Crear Primer Evento
                </button>
              </div>
            ) : (
              events.map(evt => (
                <div key={evt.id} className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#1B2A6B]">{evt.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-[#5A6472]">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(evt.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{evt.realHours}h duración</span>
                        <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />×{evt.multiplier} multiplicador</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{evt.attendees.length} asistentes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8687D]/10 text-[#E8687D]">
                        {evt.realHours * evt.multiplier}h por persona
                      </span>
                      <button onClick={() => { setEditingEvent(evt); setShowEventModal(true); }}
                        className="px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all">
                        Editar
                      </button>
                      <button onClick={() => deleteEvent(evt.id)}
                        className="p-1.5 rounded-lg border border-red-200 text-[#C0392B] hover:bg-red-50 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Show attendees */}
                  {evt.attendees.length > 0 && attendance && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-3 border-t border-[#f0eeea]">
                      {evt.attendees.map(id => {
                        const member = attendance.members.find(m => m.contactId === id);
                        return member ? (
                          <span key={id} className="px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[0.7rem] text-[#1B2A6B] font-medium">
                            {member.firstName} {member.lastName}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Event Create/Edit Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          members={activeMembers}
          onSave={(evt) => {
            if (editingEvent) updateEvent(evt);
            else addEvent(evt);
            setShowEventModal(false);
          }}
          onClose={() => setShowEventModal(false)}
        />
      )}

      {/* Letter Modal */}
      {letterMember && (
        <LetterModal member={letterMember} events={events} onClose={() => setLetterMember(null)} />
      )}
    </>
  );
}

// ─── Event Modal ───
function EventModal({
  event,
  members,
  onSave,
  onClose,
}: {
  event: CommunityEvent | null;
  members: { firstName: string; lastName: string; contactId: string }[];
  onSave: (evt: CommunityEvent) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(event?.name || '');
  const [date, setDate] = useState(event?.date || new Date().toISOString().split('T')[0]);
  const [realHours, setRealHours] = useState(event?.realHours || 2);
  const [multiplier, setMultiplier] = useState(event?.multiplier || 1);
  const [attendees, setAttendees] = useState<Set<string>>(new Set(event?.attendees || []));
  const [searchMember, setSearchMember] = useState('');

  const filteredMembers = members.filter(m => {
    const q = searchMember.trim().toLowerCase();
    if (!q) return true;
    const first = (m.firstName || '').trim().toLowerCase();
    const last = (m.lastName || '').trim().toLowerCase();
    return first.includes(q) || last.includes(q) || `${first} ${last}`.includes(q) || `${last} ${first}`.includes(q);
  });

  const toggleAttendee = (id: string) => {
    setAttendees(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setAttendees(new Set(members.map(m => m.contactId)));
  const clearAll = () => setAttendees(new Set());

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: event?.id || `evt-${Date.now()}`,
      name: name.trim(),
      date,
      realHours,
      multiplier,
      attendees: Array.from(attendees),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E1EA]">
          <h2 className="font-serif font-bold text-lg text-[#1B2A6B]">{event ? 'Editar Evento' : 'Nuevo Evento Comunitario'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f4f2ee]"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* Event details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Nombre del Evento</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Jornada de Voluntariado..."
                className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Duración Real (horas)</label>
              <input type="number" min={0.5} max={24} step={0.5} value={realHours} onChange={e => setRealHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">
                Multiplicador de Horas Comunitarias
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(m => (
                  <button key={m} onClick={() => setMultiplier(m)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      multiplier === m
                        ? 'bg-[#1B2A6B] text-white'
                        : 'bg-[#f4f2ee] text-[#5A6472] hover:bg-[#e8e5de]'
                    }`}>
                    ×{m}
                    <span className="block text-[0.65rem] font-normal mt-0.5">
                      {m === 1 ? '1:1' : `${m} por hora`}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#5A6472] mt-2">
                Cada asistente recibirá <strong className="text-[#1B2A6B]">{realHours * multiplier} horas comunitarias</strong> ({realHours}h × {multiplier})
              </p>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#5A6472] uppercase tracking-wider">
                Asistentes ({attendees.size}/{members.length})
              </label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-[#1B2A6B] font-medium hover:underline">Seleccionar todos</button>
                <button onClick={clearAll} className="text-xs text-[#C0392B] font-medium hover:underline">Limpiar</button>
              </div>
            </div>
            <input type="text" value={searchMember} onChange={e => setSearchMember(e.target.value)} placeholder="Filtrar miembros..."
              className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm mb-2 focus:outline-none focus:border-[#2A3D8F]" />
            <div className="max-h-[200px] overflow-y-auto border border-[#D8E1EA] rounded-lg">
              {filteredMembers.map(m => {
                const checked = attendees.has(m.contactId);
                return (
                  <button key={m.contactId} onClick={() => toggleAttendee(m.contactId)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left border-b border-[#f0eeea] last:border-b-0 transition-colors ${checked ? 'bg-[#E3F2FD]/50' : 'hover:bg-[#FAFAF8]'}`}>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-[#1B2A6B] border-[#1B2A6B]' : 'border-[#D8E1EA]'}`}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    {m.lastName}, {m.firstName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#D8E1EA] flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-[#D8E1EA] text-sm font-medium hover:bg-[#f8f7f5] transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="px-5 py-2 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all disabled:opacity-40">
            {event ? 'Guardar Cambios' : 'Crear Evento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Letter Modal ───
function LetterModal({ member, events, onClose }: { member: MemberHours; events: CommunityEvent[]; onClose: () => void }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Community Hours - ${member.fullName}</title>
  <style>
    @page { size: letter; margin: 0.8in 1in; }
    body { font-family: 'Georgia', serif; color: #1a1a1a; line-height: 1.6; margin: 0; padding: 40px 60px; }
    .header { text-align: center; border-bottom: 2px solid #1B2A6B; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-text { font-size: 24px; font-weight: bold; color: #1B2A6B; letter-spacing: 2px; }
    .logo-sub { font-size: 11px; color: #5A6472; letter-spacing: 1px; margin-top: 4px; }
    .org-name { font-size: 13px; color: #1B2A6B; margin-top: 8px; font-weight: 600; }
    .date { text-align: right; margin-bottom: 24px; font-size: 13px; color: #5A6472; }
    .ref { font-size: 13px; color: #5A6472; margin-bottom: 24px; }
    .ref strong { color: #1a1a1a; }
    .salutation { font-size: 14px; margin-bottom: 20px; }
    .body { font-size: 14px; text-align: justify; margin-bottom: 16px; }
    .body strong { color: #1B2A6B; }
    .breakdown { margin: 20px 0; padding: 16px 20px; background: #f8f7f5; border-radius: 8px; border-left: 3px solid #1B2A6B; }
    .breakdown h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #5A6472; margin: 0 0 10px; }
    .breakdown-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .breakdown-row.total { border-top: 1px solid #D8E1EA; padding-top: 8px; margin-top: 8px; font-weight: bold; color: #1B2A6B; }
    .signature { margin-top: 50px; }
    .sig-line { width: 200px; border-top: 1px solid #1a1a1a; margin-top: 40px; padding-top: 6px; }
    .sig-name { font-size: 14px; font-weight: bold; }
    .sig-title { font-size: 12px; color: #5A6472; }
    .footer { position: fixed; bottom: 30px; left: 60px; right: 60px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
    @media print { body { padding: 0; } .footer { position: fixed; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-text">MARJCC</div>
    <div class="logo-sub">MICHAEL-ANN RUSSELL JEWISH COMMUNITY CENTER</div>
    <div class="org-name">Hebraica — Maccabi Tzair Miami</div>
  </div>

  <div class="date">${dateStr}</div>

  <div class="ref">REF: <strong>${member.fullName}</strong></div>

  <div class="salutation">To Whom It May Concern,</div>

  <div class="body">
    This letter is to certify that <strong>${member.fullName}</strong> has been an active participant
    in the <strong>School of Madrichim (SOM)</strong> program at Maccabi Tzair Miami, a youth leadership
    program of the Michael-Ann Russell Jewish Community Center (MARJCC) during the
    <strong>2025-2026</strong> season.
  </div>

  <div class="body">
    Through their participation in regular weekly sessions and community service events,
    <strong>${member.fullName}</strong> has completed a total of
    <strong>${member.totalHours} community service hours</strong>.
  </div>

  <div class="breakdown">
    <h4>Hours Breakdown</h4>
    <div class="breakdown-row">
      <span>Regular Sessions (${member.regularSessions} sessions × 2h)</span>
      <span>${member.regularHours} hours</span>
    </div>
    ${member.eventBreakdown.map(e => `
    <div class="breakdown-row">
      <span>${e.eventName}</span>
      <span>${e.hours} hours</span>
    </div>`).join('')}
    <div class="breakdown-row total">
      <span>Total Community Service Hours</span>
      <span>${member.totalHours} hours</span>
    </div>
  </div>

  <div class="body">
    We commend ${member.firstName} for their dedication and commitment to community service
    and youth leadership development.
  </div>

  <div class="body">Sincerely,</div>

  <div class="signature">
    <div class="sig-line">
      <div class="sig-name">Marleny Rosemberg</div>
      <div class="sig-title">Hebraica Director</div>
      <div class="sig-title">Michael-Ann Russell JCC</div>
    </div>
  </div>

  <div class="footer">
    Michael-Ann Russell JCC · 18900 NE 25th Ave, North Miami Beach, FL 33180 · (305) 932-4200 · www.marjcc.org
  </div>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#D8E1EA]">
          <h2 className="font-serif font-bold text-lg text-[#1B2A6B]">Generar Carta</h2>
        </div>
        <div className="px-6 py-5">
          <div className="bg-[#FAFAF8] rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-[#1B2A6B] mb-2">{member.fullName}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-[#5A6472]">Sesiones regulares:</span> <strong>{member.regularSessions}</strong></div>
              <div><span className="text-[#5A6472]">Horas regulares:</span> <strong>{member.regularHours}h</strong></div>
              <div><span className="text-[#5A6472]">Horas eventos:</span> <strong>{member.eventHours}h</strong></div>
              <div><span className="text-[#5A6472]">Total:</span> <strong className="text-[#1B2A6B] text-base">{member.totalHours}h</strong></div>
            </div>
          </div>

          {member.eventBreakdown.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-2">Desglose Eventos</p>
              {member.eventBreakdown.map((e, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-[#f0eeea] last:border-b-0">
                  <span>{e.eventName}</span>
                  <span className="font-medium text-[#E89B3A]">{e.hours}h</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={handlePrint}
            className="w-full py-2.5 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" /> Generar e Imprimir Carta
          </button>
          <button onClick={onClose} className="w-full py-2 rounded-lg text-sm text-[#5A6472] hover:bg-[#f4f2ee] transition-all mt-2">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
