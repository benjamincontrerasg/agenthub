import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/ui/toast';
import { AlertCircle } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#090d16] text-fg-primary">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header onOpenMobile={() => setMobileOpen(true)} />

        {/* Demo Mode Sub-banner */}
        <div className="bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-950 px-4 py-1.5 border-b border-border-brand/30 flex items-center justify-between text-caption text-fg-secondary">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-fg-brand shrink-0" />
            <span className="truncate">
              <strong className="text-fg-brand font-medium">Modo Simulación Activo:</strong> Operaciones de agentes, MCP y workflows se ejecutan en entorno seguro frontend con persistencia de sesión.
            </span>
          </div>
          <span className="hidden md:inline-block text-caption font-mono text-fg-secondary bg-bg-card px-2 py-0.5 rounded border border-border-default">
            Zero-Trust Security
          </span>
        </div>

        {/* Page View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Global Toast Notifications */}
        <ToastContainer />
      </div>
    </div>
  );
};

