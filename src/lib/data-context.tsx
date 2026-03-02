'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SOMAttendanceData, CommunityEvent } from '@/types';

interface DataContextType {
  attendance: SOMAttendanceData | null;
  isImported: boolean;
  importAttendance: (data: SOMAttendanceData) => void;
  clearImport: () => void;
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
  // Community events
  events: CommunityEvent[];
  addEvent: (event: CommunityEvent) => void;
  updateEvent: (event: CommunityEvent) => void;
  deleteEvent: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEY = 'som-attendance-data';
const EVENTS_KEY = 'som-community-events';

export function DataProvider({ children }: { children: ReactNode }) {
  const [attendance, setAttendance] = useState<SOMAttendanceData | null>(null);
  const [isImported, setIsImported] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [events, setEvents] = useState<CommunityEvent[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SOMAttendanceData;
        if (parsed && parsed.members && parsed.members.length > 0) {
          setAttendance(parsed);
          setIsImported(true);
        }
      }
    } catch { /* ignore */ }

    try {
      const storedEvents = localStorage.getItem(EVENTS_KEY);
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
    } catch { /* ignore */ }
  }, []);

  const saveEvents = (evts: CommunityEvent[]) => {
    setEvents(evts);
    try { localStorage.setItem(EVENTS_KEY, JSON.stringify(evts)); } catch { /* ignore */ }
  };

  const importAttendance = useCallback((data: SOMAttendanceData) => {
    setAttendance(data);
    setIsImported(true);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, []);

  const clearImport = useCallback(() => {
    setAttendance(null);
    setIsImported(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addEvent = useCallback((event: CommunityEvent) => {
    setEvents(prev => {
      const next = [...prev, event];
      try { localStorage.setItem(EVENTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const updateEvent = useCallback((event: CommunityEvent) => {
    setEvents(prev => {
      const next = prev.map(e => e.id === event.id ? event : e);
      try { localStorage.setItem(EVENTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id);
      try { localStorage.setItem(EVENTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return (
    <DataContext.Provider value={{
      attendance, isImported, importAttendance, clearImport,
      showImportModal, setShowImportModal,
      events, addEvent, updateEvent, deleteEvent,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
