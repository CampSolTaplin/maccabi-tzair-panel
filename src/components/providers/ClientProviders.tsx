'use client';

import { DataProvider } from '@/lib/data-context';
import ImportModal from '@/components/import/ImportModal';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      {children}
      <ImportModal />
    </DataProvider>
  );
}
