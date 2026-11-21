import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProvidersPage } from '@/features/providers/ProvidersPage';
import { AgentsPage } from '@/features/agents/AgentsPage';
import { AgentDetailPage } from '@/features/agents/AgentDetailPage';
import { MCPPage } from '@/features/mcp/MCPPage';
import { WorkflowBuilderPage } from '@/features/workflows/WorkflowBuilderPage';
import { ChatPage } from '@/features/chat/ChatPage';
import { ExecutionsPage } from '@/features/executions/ExecutionsPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { AuditPage } from '@/features/audit/AuditPage';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Route guard: Protege las rutas internas.
 * Si el visitante no está autenticado y visita la raíz '/',
 * muestra la Landing Page pública comercial de NEXORA.
 * Si intenta acceder a rutas profundas protegidas, lo redirige a /login.
 */
function ProtectedRoute() {
  const { isAuthenticated, token } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !token) {
    if (location.pathname === '/' || location.pathname === '') {
      return <LandingPage />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <AppLayout />;
}

/**
 * Evita mostrar la pantalla de login si el usuario ya está autenticado.
 */
function PublicOnlyRoute() {
  const { isAuthenticated, token } = useAuthStore();
  if (isAuthenticated && token) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

export const router = createBrowserRouter([
  {
    path: '/landing',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <PublicOnlyRoute />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'providers',
        element: <ProvidersPage />,
      },
      {
        path: 'agents',
        element: <AgentsPage />,
      },
      {
        path: 'agents/:id',
        element: <AgentDetailPage />,
      },
      {
        path: 'mcp',
        element: <MCPPage />,
      },
      {
        path: 'workflows',
        element: <WorkflowBuilderPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'executions',
        element: <ExecutionsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'audit',
        element: <AuditPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
