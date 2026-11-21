import React from 'react';

export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'ollama' | string;

interface ProviderLogoProps {
  providerId?: ProviderId;
  name?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showBackground?: boolean;
  active?: boolean;
}

const sizeMap = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

const roundedMap = {
  sm: 'rounded',
  md: 'rounded-[6px]',
  lg: 'rounded-[12px]',
  xl: 'rounded-[12px]',
  full: 'rounded-full',
};

export const ClaudeLogo: React.FC<{ className?: string; active?: boolean }> = ({
  className = 'h-full w-full',
  active = false,
}) => (
  <img
    src={active ? '/logos/claude-active.png' : '/logos/claude-base.png'}
    alt="Claude"
    className={`object-contain transition-transform duration-200 select-none ${className}`}
  />
);

export const OpenAILogo: React.FC<{ className?: string }> = ({ className = 'h-full w-full' }) => (
  <img
    src="/logos/openai-filled.png"
    alt="OpenAI"
    className={`object-contain select-none transition-transform duration-200 ${className}`}
  />
);

export const GeminiLogo: React.FC<{ className?: string }> = ({ className = 'h-full w-full' }) => (
  <img
    src="/logos/gemini-filled.png"
    alt="Gemini"
    className={`object-contain select-none transition-transform duration-200 ${className}`}
  />
);

export const OllamaLogo: React.FC<{ className?: string }> = ({ className = 'h-full w-full' }) => (
  <img
    src="/logos/ollama-filled.png"
    alt="Ollama"
    className={`object-contain select-none transition-transform duration-200 ${className}`}
  />
);

export const DeepSeekLogo: React.FC<{ className?: string }> = ({ className = 'h-full w-full' }) => (
  <img
    src="/logos/deepseek-filled.png"
    alt="DeepSeek"
    className={`object-contain select-none transition-transform duration-200 ${className}`}
  />
);

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  providerId,
  name,
  className = '',
  size = 'md',
  rounded = 'lg',
  showBackground = true,
  active = false,
}) => {
  const normId = (providerId || name || '').toLowerCase();
  const dimensionClass = typeof size === 'number' ? `h-[${size}px] w-[${size}px]` : sizeMap[size];
  const roundedClass = roundedMap[rounded];

  // Specific Providers
  if (normId.includes('anthropic') || normId.includes('claude')) {
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${dimensionClass} ${roundedClass} ${className}`}>
        <ClaudeLogo className="h-full w-full" active={active} />
      </div>
    );
  }

  if (normId.includes('openai') || normId.includes('opencode') || normId.includes('gpt') || normId.includes('o3')) {
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${dimensionClass} ${roundedClass} ${className}`}>
        <OpenAILogo className="h-full w-full" />
      </div>
    );
  }

  if (normId.includes('gemini') || normId.includes('google')) {
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${dimensionClass} ${roundedClass} ${className}`}>
        <GeminiLogo className="h-full w-full" />
      </div>
    );
  }

  if (normId.includes('ollama') || normId.includes('llama') || normId.includes('local')) {
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${dimensionClass} ${roundedClass} ${className}`}>
        <OllamaLogo className="h-full w-full" />
      </div>
    );
  }

  if (normId.includes('deepseek') || normId.includes('r1') || normId.includes('v3')) {
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${dimensionClass} ${roundedClass} ${className}`}>
        <DeepSeekLogo className="h-full w-full" />
      </div>
    );
  }

  // Fallback generic AI badge
  const initial = (name || providerId || 'AI').substring(0, 2).toUpperCase();
  return (
    <div
      className={`shrink-0 flex items-center justify-center font-[510] text-caption ${dimensionClass} ${roundedClass} ${
        showBackground ? 'bg-bg-surface border border-border-hover text-fg-secondary' : ''
      } ${className}`}
    >
      {initial}
    </div>
  );
};
