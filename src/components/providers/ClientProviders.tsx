'use client';

import { DataProvider, useData } from '@/lib/data-context';
import ImportModal from '@/components/import/ImportModal';

function LoadingGate({ children }: { children: React.ReactNode }) {
  const { loading } = useData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F0EC]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B2A6B]/20 border-t-[#1B2A6B] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1B2A6B]/60 font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <LoadingGate>
        {children}
        <ImportModal />
      </LoadingGate>
    </DataProvider>
  );
}
