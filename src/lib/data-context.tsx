'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SOMAttendanceData } from '@/types';

interface DataContextType {
  attendance: SOMAttendanceData | null;
  isImported: boolean;
  importAttendance: (data: SOMAttendanceData) => void;
  clearImport: () => void;
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEY = 'som-attendance-data';

export function DataProvider({ children }: { children: ReactNode }) {
  const [attendance, setAttendance] = useState<SOMAttendanceData | null>(null);
  const [isImported, setIsImported] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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
    } catch {
      // Ignore parsing errors
    }
  }, []);

  const importAttendance = useCallback((data: SOMAttendanceData) => {
    setAttendance(data);
    setIsImported(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage might be full
    }
  }, []);

  const clearImport = useCallback(() => {
    setAttendance(null);
    setIsImported(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <DataContext.Provider value={{
      attendance,
      isImported,
      importAttendance,
      clearImport,
      showImportModal,
      setShowImportModal,
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
