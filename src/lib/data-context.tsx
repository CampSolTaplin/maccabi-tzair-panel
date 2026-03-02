'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { SOMAttendanceData, SOMAttendanceValue, SOMMember, CommunityEvent, MemberOverride, AddedMember } from '@/types';

interface DataContextType {
  attendance: SOMAttendanceData | null;
  isImported: boolean;
  importAttendance: (data: SOMAttendanceData) => void;
  clearImport: () => void;
  updateAttendanceCell: (contactId: string, date: string, value: SOMAttendanceValue) => void;
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
  // Community events
  events: CommunityEvent[];
  addEvent: (event: CommunityEvent) => void;
  updateEvent: (event: CommunityEvent) => void;
  deleteEvent: (id: string) => void;
  // Member management
  memberOverrides: Record<string, MemberOverride>;
  addedMembers: AddedMember[];
  /** All members (parsed + added), with overrides applied */
  allMembers: (SOMMember & { isAdded?: boolean })[];
  /** Only active members */
  activeMembers: (SOMMember & { isAdded?: boolean })[];
  /** Only dropped members */
  droppedMembers: (SOMMember & { isAdded?: boolean; dropDate?: string })[];
  getMemberStatus: (contactId: string) => 'active' | 'dropped';
  getMemberOverride: (contactId: string) => MemberOverride | undefined;
  dropMember: (contactId: string, date: string) => void;
  reactivateMember: (contactId: string) => void;
  addNewMember: (firstName: string, lastName: string, joinDate: string) => void;
  removeAddedMember: (contactId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEY = 'som-attendance-data';
const EVENTS_KEY = 'som-community-events';
const OVERRIDES_KEY = 'som-member-overrides';
const ADDED_KEY = 'som-added-members';

export function DataProvider({ children }: { children: ReactNode }) {
  const [attendance, setAttendance] = useState<SOMAttendanceData | null>(null);
  const [isImported, setIsImported] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [memberOverrides, setMemberOverrides] = useState<Record<string, MemberOverride>>({});
  const [addedMembers, setAddedMembers] = useState<AddedMember[]>([]);

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
      if (storedEvents) setEvents(JSON.parse(storedEvents));
    } catch { /* ignore */ }

    try {
      const storedOverrides = localStorage.getItem(OVERRIDES_KEY);
      if (storedOverrides) setMemberOverrides(JSON.parse(storedOverrides));
    } catch { /* ignore */ }

    try {
      const storedAdded = localStorage.getItem(ADDED_KEY);
      if (storedAdded) setAddedMembers(JSON.parse(storedAdded));
    } catch { /* ignore */ }
  }, []);

  // ── Attendance CRUD ──

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

  const updateAttendanceCell = useCallback((contactId: string, date: string, value: SOMAttendanceValue) => {
    setAttendance(prev => {
      if (!prev) return prev;
      const next = {
        ...prev,
        records: {
          ...prev.records,
          [contactId]: { ...prev.records[contactId], [date]: value },
        },
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── Events CRUD ──

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

  // ── Member management ──

  const saveOverrides = (o: Record<string, MemberOverride>) => {
    setMemberOverrides(o);
    try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o)); } catch { /* ignore */ }
  };

  const saveAdded = (a: AddedMember[]) => {
    setAddedMembers(a);
    try { localStorage.setItem(ADDED_KEY, JSON.stringify(a)); } catch { /* ignore */ }
  };

  const getMemberStatus = useCallback((contactId: string): 'active' | 'dropped' => {
    return memberOverrides[contactId]?.status || 'active';
  }, [memberOverrides]);

  const getMemberOverride = useCallback((contactId: string) => {
    return memberOverrides[contactId];
  }, [memberOverrides]);

  const dropMember = useCallback((contactId: string, date: string) => {
    const next = { ...memberOverrides, [contactId]: { status: 'dropped' as const, statusDate: date } };
    saveOverrides(next);
  }, [memberOverrides]);

  const reactivateMember = useCallback((contactId: string) => {
    const next = { ...memberOverrides };
    delete next[contactId];
    saveOverrides(next);
  }, [memberOverrides]);

  const addNewMember = useCallback((firstName: string, lastName: string, joinDate: string) => {
    const contactId = `added-${Date.now()}`;
    const member: AddedMember = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      contactId,
      joinDate,
    };
    const next = [...addedMembers, member];
    saveAdded(next);
    // Also create empty attendance records for this member
    setAttendance(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        members: [...prev.members, { firstName: member.firstName, lastName: member.lastName, fullName: member.fullName, contactId }],
        records: { ...prev.records, [contactId]: {} },
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, [addedMembers]);

  const removeAddedMember = useCallback((contactId: string) => {
    const next = addedMembers.filter(m => m.contactId !== contactId);
    saveAdded(next);
    // Also remove from attendance data
    setAttendance(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        members: prev.members.filter(m => m.contactId !== contactId),
        records: Object.fromEntries(Object.entries(prev.records).filter(([k]) => k !== contactId)),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, [addedMembers]);

  // ── Computed member lists ──

  const allMembers = useMemo(() => {
    if (!attendance) return [];
    const addedIds = new Set(addedMembers.map(m => m.contactId));
    return attendance.members.map(m => ({
      ...m,
      isAdded: addedIds.has(m.contactId),
    }));
  }, [attendance, addedMembers]);

  const activeMembers = useMemo(() => {
    return allMembers.filter(m => getMemberStatus(m.contactId) === 'active');
  }, [allMembers, getMemberStatus]);

  const droppedMembers = useMemo(() => {
    return allMembers
      .filter(m => getMemberStatus(m.contactId) === 'dropped')
      .map(m => ({ ...m, dropDate: memberOverrides[m.contactId]?.statusDate }));
  }, [allMembers, getMemberStatus, memberOverrides]);

  return (
    <DataContext.Provider value={{
      attendance, isImported, importAttendance, clearImport, updateAttendanceCell,
      showImportModal, setShowImportModal,
      events, addEvent, updateEvent, deleteEvent,
      memberOverrides, addedMembers, allMembers, activeMembers, droppedMembers,
      getMemberStatus, getMemberOverride,
      dropMember, reactivateMember, addNewMember, removeAddedMember,
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
