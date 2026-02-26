'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F2F0EC]">
      <Sidebar />
      <main className="ml-[260px] min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
