import { createBrowserRouter, Navigate } from 'react-router-dom';
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
import { AuditPage } from '@/features/audit/AuditPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
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

