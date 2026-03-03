'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { SOMAttendanceData, SOMAttendanceValue, SOMMember, CommunityEvent, MemberOverride, AddedMember, RosterData } from '@/types';

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
  // Enabled dates for attendance-taking
  enabledDates: string[];
  toggleEnabledDate: (date: string) => void;
  // Roster
  rosterData: RosterData | null;
  importRoster: (data: RosterData) => void;
  loading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

// Fire-and-forget save to server
function saveToServer(key: string, value: unknown) {
  fetch('/api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  }).catch(err => console.error('Failed to save', key, err));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [attendance, setAttendance] = useState<SOMAttendanceData | null>(null);
  const [isImported, setIsImported] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [memberOverrides, setMemberOverrides] = useState<Record<string, MemberOverride>>({});
  const [addedMembers, setAddedMembers] = useState<AddedMember[]>([]);
  const [enabledDates, setEnabledDates] = useState<string[]>([]);
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);

  // Track latest values for save callbacks that need current state
  const memberOverridesRef = useRef(memberOverrides);
  memberOverridesRef.current = memberOverrides;
  const addedMembersRef = useRef(addedMembers);
  addedMembersRef.current = addedMembers;

  // Load from server on mount
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        if (data.attendanceData) {
          const parsed = data.attendanceData as SOMAttendanceData;
          if (parsed.members && parsed.members.length > 0) {
            setAttendance(parsed);
            setIsImported(true);
          }
        }
        if (Array.isArray(data.events)) setEvents(data.events);
        if (data.memberOverrides && typeof data.memberOverrides === 'object') {
          setMemberOverrides(data.memberOverrides);
        }
        if (Array.isArray(data.addedMembers)) setAddedMembers(data.addedMembers);
        if (Array.isArray(data.enabledDates)) setEnabledDates(data.enabledDates);
        if (data.rosterData) setRosterData(data.rosterData as RosterData);
      })
      .catch(err => console.error('Failed to load data', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Attendance CRUD ──

  const importAttendance = useCallback((data: SOMAttendanceData) => {
    setAttendance(data);
    setIsImported(true);
    saveToServer('attendanceData', data);
  }, []);

  const clearImport = useCallback(() => {
    setAttendance(null);
    setIsImported(false);
    saveToServer('attendanceData', null);
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
      saveToServer('attendanceData', next);
      return next;
    });
  }, []);

  // ── Events CRUD ──

  const addEvent = useCallback((event: CommunityEvent) => {
    setEvents(prev => {
      const next = [...prev, event];
      saveToServer('events', next);
      return next;
    });
  }, []);

  const updateEvent = useCallback((event: CommunityEvent) => {
    setEvents(prev => {
      const next = prev.map(e => e.id === event.id ? event : e);
      saveToServer('events', next);
      return next;
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id);
      saveToServer('events', next);
      return next;
    });
  }, []);

  // ── Member management ──

  const saveOverrides = (o: Record<string, MemberOverride>) => {
    setMemberOverrides(o);
    saveToServer('memberOverrides', o);
  };

  const saveAdded = (a: AddedMember[]) => {
    setAddedMembers(a);
    saveToServer('addedMembers', a);
  };

  const getMemberStatus = useCallback((contactId: string): 'active' | 'dropped' => {
    return memberOverrides[contactId]?.status || 'active';
  }, [memberOverrides]);

  const getMemberOverride = useCallback((contactId: string) => {
    return memberOverrides[contactId];
  }, [memberOverrides]);

  const dropMember = useCallback((contactId: string, date: string) => {
    const next = { ...memberOverridesRef.current, [contactId]: { status: 'dropped' as const, statusDate: date } };
    saveOverrides(next);
  }, []);

  const reactivateMember = useCallback((contactId: string) => {
    const next = { ...memberOverridesRef.current };
    delete next[contactId];
    saveOverrides(next);
  }, []);

  const addNewMember = useCallback((firstName: string, lastName: string, joinDate: string) => {
    const contactId = `added-${Date.now()}`;
    const member: AddedMember = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      contactId,
      joinDate,
    };
    const next = [...addedMembersRef.current, member];
    saveAdded(next);
    // Also create empty attendance records for this member
    setAttendance(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        members: [...prev.members, { firstName: member.firstName, lastName: member.lastName, fullName: member.fullName, contactId }],
        records: { ...prev.records, [contactId]: {} },
      };
      saveToServer('attendanceData', updated);
      return updated;
    });
  }, []);

  const removeAddedMember = useCallback((contactId: string) => {
    const next = addedMembersRef.current.filter(m => m.contactId !== contactId);
    saveAdded(next);
    // Also remove from attendance data
    setAttendance(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        members: prev.members.filter(m => m.contactId !== contactId),
        records: Object.fromEntries(Object.entries(prev.records).filter(([k]) => k !== contactId)),
      };
      saveToServer('attendanceData', updated);
      return updated;
    });
  }, []);

  // ── Enabled dates ──

  const toggleEnabledDate = useCallback((date: string) => {
    setEnabledDates(prev => {
      const next = prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date];
      saveToServer('enabledDates', next);
      return next;
    });
  }, []);

  // ── Roster ──

  const importRoster = useCallback((data: RosterData) => {
    setRosterData(data);
    saveToServer('rosterData', data);
  }, []);

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
      enabledDates, toggleEnabledDate,
      rosterData, importRoster,
      loading,
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
