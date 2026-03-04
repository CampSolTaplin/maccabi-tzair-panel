'use client';

import { useState, useMemo } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { CommunityEvent, Chanich } from '@/types';
import {
  Plus, Trash2, Users, Calendar, Clock, Award, Star,
  X, Check, ClipboardPaste, Search, Tag,
} from 'lucide-react';

// ── Group definitions (same as attendance page) ──

const PROGRAM_GROUPS = ['Pre-SOM', 'SOM', 'Trips', 'Machanot'];

interface GroupDef {
  key: string;
  label: string;
  area: string;
  color: string;
  bgColor: string;
}

const GROUP_DEFS: GroupDef[] = [
  { key: 'Kinder', label: 'Kinder', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '1st Grade', label: '1st', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '2nd Grade', label: '2nd', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '3rd Grade', label: '3rd', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '4th Grade', label: '4th', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '5th Grade', label: '5th', area: 'Katan', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: '6th Grade', label: '6th', area: 'Noar', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  { key: '7th Grade', label: '7th', area: 'Noar', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  { key: '8th Grade', label: '8th', area: 'Noar', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  { key: 'Pre-SOM', label: 'Pre-SOM', area: 'Leadership', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  { key: 'SOM', label: 'SOM', area: 'Leadership', color: 'text-green-700', bgColor: 'bg-green-50' },
  { key: 'Trips', label: 'Trips', area: 'Special', color: 'text-rose-700', bgColor: 'bg-rose-50' },
  { key: 'Machanot', label: 'Machanot', area: 'Special', color: 'text-cyan-700', bgColor: 'bg-cyan-50' },
];

const AREA_LABELS: Record<string, string> = {
  Katan: 'Katan (K-5)',
  Noar: 'Noar (6-8)',
  Leadership: 'Leadership',
  Special: 'Especiales',
};

const AREA_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Katan: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Noar: { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  Leadership: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Special: { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

function matchesGroup(groupKey: string, chanich: Chanich): boolean {
  if (PROGRAM_GROUPS.includes(groupKey)) return chanich.program === groupKey;
  return chanich.gradeLevel.toLowerCase().includes(groupKey.toLowerCase());
}

export default function EventsPage() {
  const { events, addEvent, updateEvent, deleteEvent, rosterData } = useData();
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // Filter events by selected group
  const filteredEvents = useMemo(() => {
    if (filterGroup === 'all') return events;
    return events.filter(evt =>
      evt.groups.length === 0 || evt.groups.includes(filterGroup)
    );
  }, [events, filterGroup]);

  // Sort events by date descending
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredEvents]);

  // Available groups from roster
  const availableGroups = useMemo(() => {
    if (!rosterData) return [];
    return GROUP_DEFS.filter(g =>
      rosterData.chanichim.some(c => matchesGroup(g.key, c))
    );
  }, [rosterData]);

  return (
    <>
      <Topbar title="Eventos Comunitarios" subtitle="Gestionar eventos y asignar grupos" />
      <div className="p-5">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Group filter */}
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#5A6472]" />
              <select
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]"
              >
                <option value="all">Todos los grupos</option>
                {Object.entries(AREA_LABELS).map(([area, label]) => (
                  <optgroup key={area} label={label}>
                    {availableGroups.filter(g => g.area === area).map(g => (
                      <option key={g.key} value={g.key}>{g.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8687D] text-white text-sm font-medium hover:bg-[#D4566A] transition-all"
            >
              <Plus className="w-4 h-4" /> Nuevo Evento
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#E89B3A]">{events.length}</div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Total Eventos</div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#1B2A6B]">{filteredEvents.length}</div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">
              {filterGroup === 'all' ? 'Mostrando' : `Eventos: ${filterGroup}`}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#2D8B4E]">
              {events.reduce((sum, e) => sum + e.realHours * e.multiplier, 0)}h
            </div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Horas Totales</div>
          </div>
        </div>

        {/* Event list */}
        {sortedEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-10 text-center">
            <Star className="w-10 h-10 text-[#D8E1EA] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#1B2A6B] mb-1">
              {events.length === 0 ? 'No hay eventos' : 'No hay eventos para este grupo'}
            </h3>
            <p className="text-sm text-[#5A6472] mb-4">
              {events.length === 0
                ? 'Crea un evento comunitario para asignar horas a los participantes.'
                : 'Intenta con otro filtro de grupo.'}
            </p>
            {events.length === 0 && (
              <button
                onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E8687D] text-white text-sm font-medium hover:bg-[#D4566A] transition-all mx-auto"
              >
                <Plus className="w-4 h-4" /> Crear Primer Evento
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map(evt => (
              <EventCard
                key={evt.id}
                event={evt}
                rosterData={rosterData}
                onEdit={() => { setEditingEvent(evt); setShowEventModal(true); }}
                onDelete={() => deleteEvent(evt.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          rosterData={rosterData}
          onSave={(evt) => {
            if (editingEvent) updateEvent(evt);
            else addEvent(evt);
            setShowEventModal(false);
          }}
          onClose={() => setShowEventModal(false)}
        />
      )}
    </>
  );
}

// ─── Event Card ───
function EventCard({
  event,
  rosterData,
  onEdit,
  onDelete,
}: {
  event: CommunityEvent;
  rosterData: ReturnType<typeof useData>['rosterData'];
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Resolve attendee names from roster data
  const attendeeNames = useMemo(() => {
    if (!rosterData) return [];
    return event.attendees.map(id => {
      const chanich = rosterData.chanichim.find(c => c.contactId === id);
      return chanich ? chanich.fullName : id;
    });
  }, [event.attendees, rosterData]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-[#1B2A6B]">{event.name}</h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-[#5A6472]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(event.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.realHours}h</span>
            <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />&times;{event.multiplier}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.attendees.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8687D]/10 text-[#E8687D]">
            {event.realHours * event.multiplier}h por persona
          </span>
          <button onClick={onEdit} className="px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all">
            Editar
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg border border-red-200 text-[#C0392B] hover:bg-red-50 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Group badges */}
      {event.groups.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {event.groups.map(g => {
            const def = GROUP_DEFS.find(d => d.key === g);
            return (
              <span key={g} className={`px-2 py-0.5 rounded-full text-[0.7rem] font-medium ${def ? `${def.bgColor} ${def.color}` : 'bg-gray-100 text-gray-600'}`}>
                {def?.label || g}
              </span>
            );
          })}
        </div>
      )}
      {event.groups.length === 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-[#5A6472]">
          <Tag className="w-3 h-3" />
          <span className="italic">Sin grupos asignados</span>
        </div>
      )}

      {/* Attendee badges */}
      {attendeeNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#f0eeea]">
          {attendeeNames.slice(0, 20).map((name, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[0.7rem] text-[#1B2A6B] font-medium">
              {name}
            </span>
          ))}
          {attendeeNames.length > 20 && (
            <span className="px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[0.7rem] text-[#5A6472] font-medium">
              +{attendeeNames.length - 20} mas
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Event Modal ───
function EventModal({
  event,
  rosterData,
  onSave,
  onClose,
}: {
  event: CommunityEvent | null;
  rosterData: ReturnType<typeof useData>['rosterData'];
  onSave: (evt: CommunityEvent) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(event?.name || '');
  const [date, setDate] = useState(event?.date || new Date().toISOString().split('T')[0]);
  const [realHours, setRealHours] = useState(event?.realHours || 2);
  const [multiplier, setMultiplier] = useState(event?.multiplier || 1);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set(event?.groups || []));
  const [attendees, setAttendees] = useState<Set<string>>(new Set(event?.attendees || []));
  const [searchMember, setSearchMember] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteResult, setPasteResult] = useState<{ matched: string[]; unmatched: string[] } | null>(null);
  const [step, setStep] = useState<'details' | 'attendees'>('details');

  // Members for attendee selection: filter from roster by selected groups
  const eligibleMembers = useMemo(() => {
    if (!rosterData) return [];
    if (selectedGroups.size === 0) return rosterData.chanichim;
    return rosterData.chanichim.filter(c =>
      Array.from(selectedGroups).some(g => matchesGroup(g, c))
    );
  }, [rosterData, selectedGroups]);

  const filteredMembers = useMemo(() => {
    const q = searchMember.trim().toLowerCase();
    if (!q) return eligibleMembers;
    return eligibleMembers.filter(m =>
      m.fullName.toLowerCase().includes(q) ||
      m.accountName.toLowerCase().includes(q)
    );
  }, [eligibleMembers, searchMember]);

  const toggleGroup = (key: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleArea = (area: string) => {
    const areaKeys = GROUP_DEFS.filter(g => g.area === area).map(g => g.key);
    const allSelected = areaKeys.every(k => selectedGroups.has(k));
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (allSelected) {
        areaKeys.forEach(k => next.delete(k));
      } else {
        areaKeys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  const toggleAttendee = (id: string) => {
    setAttendees(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setAttendees(prev => {
      const next = new Set(prev);
      filteredMembers.forEach(m => next.add(m.contactId));
      return next;
    });
  };

  const clearAll = () => setAttendees(new Set());

  /** Normalize a string for fuzzy comparison */
  const norm = (s: string) => s.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ').replace(/[^a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00fc ]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();

  /** Process pasted names and match to eligible members */
  const processPaste = () => {
    const lines = pasteText
      .split(/[\n,;]+/)
      .map(l => l.trim())
      .filter(Boolean);

    const matched: string[] = [];
    const unmatched: string[] = [];
    const newIds = new Set(attendees);

    for (const line of lines) {
      const raw = norm(line);
      if (!raw) continue;

      let found = false;
      for (const m of eligibleMembers) {
        const full = norm(m.fullName);
        const parts = full.split(' ');
        // Try exact match and contains-both-parts
        if (raw === full || (parts.length >= 2 && parts.every(p => raw.includes(p)))) {
          newIds.add(m.contactId);
          matched.push(m.fullName);
          found = true;
          break;
        }
      }
      if (!found) unmatched.push(line);
    }

    setAttendees(newIds);
    setPasteResult({ matched, unmatched });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: event?.id || `evt-${Date.now()}`,
      name: name.trim(),
      date,
      realHours,
      multiplier,
      attendees: Array.from(attendees),
      groups: Array.from(selectedGroups),
    });
  };

  // Area-grouped group defs for display
  const areas = useMemo(() => {
    const map = new Map<string, GroupDef[]>();
    for (const g of GROUP_DEFS) {
      if (!map.has(g.area)) map.set(g.area, []);
      map.get(g.area)!.push(g);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E1EA]">
          <h2 className="font-serif font-bold text-lg text-[#1B2A6B]">
            {event ? 'Editar Evento' : 'Nuevo Evento Comunitario'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f4f2ee]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-[#D8E1EA]">
          <button
            onClick={() => setStep('details')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all ${step === 'details' ? 'text-[#1B2A6B] border-b-2 border-[#1B2A6B]' : 'text-[#5A6472]'}`}
          >
            1. Detalles y Grupos
          </button>
          <button
            onClick={() => setStep('attendees')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all ${step === 'attendees' ? 'text-[#1B2A6B] border-b-2 border-[#1B2A6B]' : 'text-[#5A6472]'}`}
          >
            2. Asistentes ({attendees.size})
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {step === 'details' ? (
            <>
              {/* Event details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Nombre del Evento</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Purim Fest, Machane Invierno..."
                    className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Fecha</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1">Duracion Real (horas)</label>
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
                        &times;{m}
                        <span className="block text-[0.65rem] font-normal mt-0.5">
                          {m === 1 ? '1:1' : `${m} por hora`}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#5A6472] mt-2">
                    Cada asistente recibira <strong className="text-[#1B2A6B]">{realHours * multiplier} horas comunitarias</strong> ({realHours}h &times; {multiplier})
                  </p>
                </div>
              </div>

              {/* Group selection */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-2">
                  Grupos Participantes
                </label>
                <p className="text-xs text-[#5A6472] mb-3">
                  Selecciona los grupos que participan en este evento. Los asistentes se filtraran por estos grupos.
                </p>

                <div className="space-y-3">
                  {areas.map(([area, groups]) => {
                    const areaColors = AREA_COLORS[area] || { text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
                    const allSelected = groups.every(g => selectedGroups.has(g.key));
                    const someSelected = groups.some(g => selectedGroups.has(g.key));

                    return (
                      <div key={area} className={`rounded-lg border ${areaColors.border} p-3`}>
                        <div className="flex items-center justify-between mb-2">
                          <button onClick={() => toggleArea(area)} className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              allSelected ? 'bg-[#1B2A6B] border-[#1B2A6B]' : someSelected ? 'bg-[#1B2A6B]/30 border-[#1B2A6B]' : 'border-[#D8E1EA]'
                            }`}>
                              {(allSelected || someSelected) && <Check className="w-3 h-3 text-white" />}
                            </span>
                            <span className={`text-xs font-bold uppercase tracking-wider ${areaColors.text}`}>
                              {AREA_LABELS[area] || area}
                            </span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groups.map(g => {
                            const sel = selectedGroups.has(g.key);
                            return (
                              <button key={g.key} onClick={() => toggleGroup(g.key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                  sel
                                    ? `${g.bgColor} ${g.color} ring-1 ring-current`
                                    : 'bg-[#f4f2ee] text-[#5A6472] hover:bg-[#e8e5de]'
                                }`}>
                                {g.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedGroups.size > 0 && (
                  <p className="text-xs text-[#2D8B4E] mt-2 font-medium">
                    {selectedGroups.size} grupo{selectedGroups.size !== 1 ? 's' : ''} seleccionado{selectedGroups.size !== 1 ? 's' : ''} &middot; {eligibleMembers.length} participantes elegibles
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Step 2: Attendees */
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#5A6472] uppercase tracking-wider">
                  Asistentes ({attendees.size}/{eligibleMembers.length})
                </label>
                <div className="flex gap-2">
                  <button onClick={() => { setShowPaste(!showPaste); setPasteResult(null); }}
                    className={`flex items-center gap-1 text-xs font-medium hover:underline ${showPaste ? 'text-[#E8687D]' : 'text-[#E89B3A]'}`}>
                    <ClipboardPaste className="w-3 h-3" />{showPaste ? 'Cerrar' : 'Pegar Nombres'}
                  </button>
                  <button onClick={selectAllVisible} className="text-xs text-[#1B2A6B] font-medium hover:underline">Todos</button>
                  <button onClick={clearAll} className="text-xs text-[#C0392B] font-medium hover:underline">Limpiar</button>
                </div>
              </div>

              {/* Paste names area */}
              {showPaste && (
                <div className="mb-3 p-3 rounded-lg border border-[#E89B3A]/40 bg-[#FFF8F0]">
                  <p className="text-xs text-[#5A6472] mb-2">
                    Pega nombres (uno por linea, separados por coma o punto y coma).
                  </p>
                  <textarea
                    value={pasteText}
                    onChange={e => { setPasteText(e.target.value); setPasteResult(null); }}
                    placeholder={"Juan Perez\nMaria Garcia\nLopez, Carlos"}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8E1EA] text-sm mb-2 focus:outline-none focus:border-[#E89B3A] resize-none font-mono"
                  />
                  <button onClick={processPaste} disabled={!pasteText.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#E89B3A] text-white text-xs font-semibold hover:bg-[#D08A2F] transition-all disabled:opacity-40">
                    Procesar y Seleccionar
                  </button>

                  {pasteResult && (
                    <div className="mt-2 text-xs">
                      {pasteResult.matched.length > 0 && (
                        <p className="text-[#2D8B4E]">{pasteResult.matched.length} encontrados: {pasteResult.matched.join(', ')}</p>
                      )}
                      {pasteResult.unmatched.length > 0 && (
                        <p className="text-[#C0392B] mt-1">{pasteResult.unmatched.length} no encontrados: {pasteResult.unmatched.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Search */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
                <input type="text" value={searchMember} onChange={e => setSearchMember(e.target.value)}
                  placeholder="Filtrar participantes..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
              </div>

              {!rosterData ? (
                <div className="text-center py-6 text-sm text-[#5A6472]">
                  Importa un roster primero para ver participantes.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto border border-[#D8E1EA] rounded-lg">
                  {filteredMembers.map(m => {
                    const checked = attendees.has(m.contactId);
                    const groupDef = GROUP_DEFS.find(g => matchesGroup(g.key, m));
                    return (
                      <button key={m.contactId} onClick={() => toggleAttendee(m.contactId)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left border-b border-[#f0eeea] last:border-b-0 transition-colors ${checked ? 'bg-[#E3F2FD]/50' : 'hover:bg-[#FAFAF8]'}`}>
                        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-[#1B2A6B] border-[#1B2A6B]' : 'border-[#D8E1EA]'}`}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className="flex-1">{m.fullName}</span>
                        {groupDef && (
                          <span className={`px-1.5 py-0.5 rounded text-[0.6rem] font-medium ${groupDef.bgColor} ${groupDef.color}`}>
                            {groupDef.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#D8E1EA] flex justify-between">
          <div>
            {step === 'attendees' && (
              <button onClick={() => setStep('details')} className="px-4 py-2 rounded-lg border border-[#D8E1EA] text-sm font-medium hover:bg-[#f8f7f5] transition-all">
                &larr; Volver
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-lg border border-[#D8E1EA] text-sm font-medium hover:bg-[#f8f7f5] transition-all">Cancelar</button>
            {step === 'details' ? (
              <button onClick={() => setStep('attendees')}
                className="px-5 py-2 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all">
                Siguiente &rarr;
              </button>
            ) : (
              <button onClick={handleSave} disabled={!name.trim()}
                className="px-5 py-2 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all disabled:opacity-40">
                {event ? 'Guardar Cambios' : 'Crear Evento'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
