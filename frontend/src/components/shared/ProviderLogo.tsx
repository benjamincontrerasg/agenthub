import React from 'react';

export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'ollama' | string;

interface ProviderLogoProps {
  providerId?: ProviderId;
  name?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** true: logo dentro de una ficha con fondo; false: logo suelto (para insignias y listas). */
  showBackground?: boolean;
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

/**
 * Logos oficiales de cada proveedor, guardados como archivos en /public/logos.
 * (Origen: paquete @lobehub/icons-static-svg. Las marcas pertenecen a sus dueños.)
 *
 * `mono: true` indica que el archivo es de un solo color (negro por defecto).
 * Sobre el tema oscuro se invierte a blanco; los logos a color se muestran tal cual.
 */
interface LogoDef {
  file: string;
  label: string;
  mono: boolean;
}

const LOGOS: Record<'anthropic' | 'openai' | 'gemini' | 'ollama', LogoDef> = {
  anthropic: { file: 'claude.svg', label: 'Claude (Anthropic)', mono: false },
  openai: { file: 'openai.svg', label: 'OpenAI', mono: true },
  gemini: { file: 'gemini.svg', label: 'Google Gemini', mono: false },
  ollama: { file: 'ollama.svg', label: 'Ollama', mono: true },
};

function resolveLogo(normId: string): LogoDef | null {
  if (normId.includes('anthropic') || normId.includes('claude')) return LOGOS.anthropic;
  if (normId.includes('openai') || normId.includes('opencode') || normId.includes('gpt') || normId.includes('o3')) {
    return LOGOS.openai;
  }
  if (normId.includes('gemini') || normId.includes('google')) return LOGOS.gemini;
  if (normId.includes('ollama') || normId.includes('llama') || normId.includes('local')) return LOGOS.ollama;
  return null;
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  providerId,
  name,
  className = '',
  size = 'md',
  rounded = 'lg',
  showBackground = true,
}) => {
  const normId = (providerId || name || '').toLowerCase();
  const isCustomSize = typeof size === 'number';
  const dimensionClass = isCustomSize ? '' : sizeMap[size];
  const sizeStyle = isCustomSize ? { height: size, width: size } : undefined;
  const roundedClass = roundedMap[rounded];
  const logo = resolveLogo(normId);

  if (logo) {
    const src = `${import.meta.env.BASE_URL}logos/${logo.file}`;
    return (
      <div
        style={sizeStyle}
        className={`relative shrink-0 flex items-center justify-center ${dimensionClass} ${roundedClass} ${
          showBackground ? 'bg-bg-surface ring-1 ring-border-hover' : ''
        } ${className}`}
      >
        {/* Con ficha, el logo ocupa el 60% para dejar margen; suelto ocupa todo el espacio.
            (No usar padding en %: se calcula sobre el ancho del padre y rompe el tamaño.) */}
        <img
          src={src}
          alt={logo.label}
          draggable={false}
          className={`object-contain select-none ${showBackground ? 'h-3/5 w-3/5' : 'h-full w-full'} ${
            logo.mono ? 'brightness-0 invert' : ''
          }`}
        />
      </div>
    );
  }

  // Proveedor desconocido: ficha con las iniciales
  const initial = (name || providerId || 'AI').substring(0, 2).toUpperCase();
  return (
    <div
      style={sizeStyle}
      className={`shrink-0 flex items-center justify-center font-bold text-caption ${dimensionClass} ${roundedClass} ${
        showBackground ? 'bg-bg-surface border border-border-hover text-fg-secondary' : ''
      } ${className}`}
    >
      {initial}
    </div>
  );
};
