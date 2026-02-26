'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Chanich, GradeGroup } from '@/types';
import { mockChanichim, gradeGroups as defaultGradeGroups } from './mock-data';

interface DataContextType {
  chanichim: Chanich[];
  gradeGroups: GradeGroup[];
  isImported: boolean;
  importCount: number;
  importData: (chanichim: Chanich[]) => void;
  clearImport: () => void;
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEY = 'maccabi-tzair-imported-data';

export function DataProvider({ children }: { children: ReactNode }) {
  const [chanichim, setChanichim] = useState<Chanich[]>(mockChanichim);
  const [isImported, setIsImported] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChanichim(parsed);
          setIsImported(true);
        }
      }
    } catch {
      // Ignore parsing errors
    }
    setHydrated(true);
  }, []);

  const importData = useCallback((data: Chanich[]) => {
    setChanichim(data);
    setIsImported(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage might be full
    }
  }, []);

  const clearImport = useCallback(() => {
    setChanichim(mockChanichim);
    setIsImported(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Compute grade groups with real counts from current data
  const gradeGroups: GradeGroup[] = defaultGradeGroups.map(g => ({
    ...g,
    realCount: hydrated ? chanichim.filter(c => c.gradeLevel === g.id).length : g.realCount,
  }));

  return (
    <DataContext.Provider value={{
      chanichim,
      gradeGroups,
      isImported,
      importCount: chanichim.length,
      importData,
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
