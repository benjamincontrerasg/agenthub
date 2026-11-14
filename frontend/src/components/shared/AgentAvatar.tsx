import React from 'react';
import { ProviderLogo } from './ProviderLogo';
import { Bot } from 'lucide-react';

interface AgentAvatarProps {
  agentName?: string;
  role?: string;
  providerId?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'active' | 'idle' | 'running' | 'paused' | 'error';
}

const roleColors: Record<string, { bg: string; border: string; text: string }> = {
  Architect: { bg: 'from-emerald-950/80 to-slate-900', border: 'border-fg-success/60', text: 'text-fg-success' },
  Developer: { bg: 'from-violet-950/80 to-slate-900', border: 'border-border-brand/60', text: 'text-fg-brand' },
  Reviewer: { bg: 'from-amber-950/80 to-slate-900', border: 'border-fg-warning/60', text: 'text-fg-warning' },
  Research: { bg: 'from-sky-950/80 to-slate-900', border: 'border-sky-700/60', text: 'text-sky-300' },
  Coordinator: { bg: 'from-fuchsia-950/80 to-slate-900', border: 'border-fuchsia-700/60', text: 'text-fuchsia-300' },
};

const avatarSizes = {
  xs: 'h-6 w-6 text-caption',
  sm: 'h-8 w-8 text-caption',
  md: 'h-10 w-10 text-body',
  lg: 'h-12 w-12 text-subtitle',
  xl: 'h-14 w-14 text-lg',
};

const providerBadgeSizes = {
  xs: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5',
  sm: 'h-3.5 w-3.5 -bottom-1 -right-1',
  md: 'h-4 w-4 -bottom-1 -right-1',
  lg: 'h-5 w-5 -bottom-1.5 -right-1.5',
  xl: 'h-6 w-6 -bottom-1.5 -right-1.5',
};

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agentName = '',
  role = 'Developer',
  providerId,
  avatarUrl,
  size = 'md',
  className = '',
  status,
}) => {
  const theme = roleColors[role] || {
    bg: 'from-slate-800 to-slate-900',
    border: 'border-border-hover',
    text: 'text-fg-primary',
  };

  const resolvedProviderId =
    providerId ||
    (agentName.toLowerCase().includes('architect')
      ? 'openai'
      : agentName.toLowerCase().includes('developer')
      ? 'anthropic'
      : agentName.toLowerCase().includes('reviewer')
      ? 'openai'
      : agentName.toLowerCase().includes('research')
      ? 'gemini'
      : agentName.toLowerCase().includes('coordinator')
      ? 'anthropic'
      : 'ollama');

  const initials = agentName
    ? agentName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AI';

  return (
    <div className={`relative shrink-0 inline-flex items-center justify-center ${className}`}>
      {/* Main Agent Avatar Circle/Square */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={agentName}
          className={`${avatarSizes[size]} rounded-xl object-cover border ${theme.border} shadow-md`}
        />
      ) : (
        <div
          className={`${avatarSizes[size]} rounded-xl bg-gradient-to-br ${theme.bg} border ${theme.border} ${theme.text} font-bold flex items-center justify-center shadow-md relative overflow-hidden`}
        >
          {initials || <Bot className="h-4 w-4" />}
        </div>
      )}

      {/* Floating Provider Logo Badge (Claude, OpenAI, Gemini, Ollama) */}
      {resolvedProviderId && (
        <div
          className={`absolute ${providerBadgeSizes[size]} rounded-full bg-bg-card p-0.5 shadow-lg ring-1 ring-slate-800 flex items-center justify-center z-10`}
          title={`Proveedor: ${resolvedProviderId}`}
        >
          <ProviderLogo providerId={resolvedProviderId} size="xs" rounded="full" showBackground={false} />
        </div>
      )}

      {/* Status Dot */}
      {status === 'running' && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-fg-warning ring-2 ring-slate-950 animate-ping" />
      )}
      {status === 'active' && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-fg-success ring-2 ring-slate-950" />
      )}
    </div>
  );
};
