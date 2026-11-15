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
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
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
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="gemini-react-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1BA1E3" />
        <stop offset="50%" stopColor="#7976FB" />
        <stop offset="100%" stopColor="#C665F6" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="5" fill="url(#gemini-react-grad)" fillOpacity="0.2" />
    <path
      d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
      fill="url(#gemini-react-grad)"
    />
  </svg>
);

export const OllamaLogo: React.FC<{ className?: string }> = ({ className = 'h-full w-full' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="24" height="24" rx="5" fill="#3B82F6" fillOpacity="0.2" />
    <path
      d="M7 3C6.45 3 6 3.45 6 4V7.5C6 7.78 5.89 8.04 5.71 8.24L4.85 9.17C4.31 9.75 4 10.51 4 11.3V18C4 19.66 5.34 21 7 21H17C18.66 21 20 19.66 20 18V11.3C20 10.51 19.69 9.75 19.15 9.17L18.29 8.24C18.11 8.04 18 7.78 18 7.5V4C18 3.45 17.55 3 17 3H15C14.45 3 14 3.45 14 4V6H10V4C10 3.45 9.55 3 9 3H7ZM8.5 11C9.33 11 10 11.67 10 12.5C10 13.33 9.33 14 8.5 14C7.67 14 7 13.33 7 12.5C7 11.67 7.67 11 8.5 11ZM15.5 11C16.33 11 17 11.67 17 12.5C17 13.33 16.33 14 15.5 14C14.67 14 14 13.33 14 12.5C14 11.67 14.67 11 15.5 11ZM12 15C13.1 15 14 15.9 14 17H10C10 15.9 10.9 15 12 15Z"
      fill="#60A5FA"
    />
  </svg>
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

  // Fallback generic AI badge
  const initial = (name || providerId || 'AI').substring(0, 2).toUpperCase();
  return (
    <div
      className={`shrink-0 flex items-center justify-center font-bold text-caption ${dimensionClass} ${roundedClass} ${
        showBackground ? 'bg-bg-surface border border-border-hover text-fg-secondary' : ''
      } ${className}`}
    >
      {initial}
    </div>
  );
};
