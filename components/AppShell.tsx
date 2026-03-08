'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import LoginGate from './LoginGate';
import { SalesProvider } from '@/lib/SalesContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <SalesProvider>
      <LoginGate>
        <div className="app-shell">
          <Navbar onToggleSidebar={toggleSidebar} />
          <div className="shell-body" onClick={sidebarOpen ? closeSidebar : undefined}>
            <Sidebar open={sidebarOpen} />
            <main className={`shell-main${sidebarOpen ? ' sidebar-pushed' : ''}`}>
              {children}
            </main>
          </div>
        </div>
      </LoginGate>
    </SalesProvider>
  );
}
