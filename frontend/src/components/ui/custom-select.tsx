import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  value?: string;
  defaultValue?: string;
  options: CustomSelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value: controlledValue,
  defaultValue,
  options,
  onChange,
  placeholder = 'Selecciona una opción...',
  error,
  disabled = false,
  className,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || options[0]?.value || '');
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative w-full text-left', className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-[6px] border bg-bg-surface px-3 py-1.5 text-[13px] text-fg-primary transition-all cursor-pointer',
          isOpen
            ? 'border-border-brand ring-1 ring-border-brand/40 shadow-xs bg-bg-surface'
            : 'border-border-default hover:border-border-hover hover:bg-bg-card',
          disabled && 'opacity-40 cursor-not-allowed',
          error && 'border-fg-error'
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          <span className={selectedOption ? 'text-fg-primary' : 'text-fg-muted'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-fg-muted transition-transform duration-150',
            isOpen && 'rotate-180 text-fg-brand'
          )}
        />
      </button>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-[8px] border border-border-default bg-bg-card p-1 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === selectedValue;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-[5px] px-2.5 py-2 text-[13px] transition-colors cursor-pointer group',
                  isSelected
                    ? 'bg-bg-surface text-fg-primary font-[510]'
                    : 'text-fg-secondary hover:bg-bg-surface/80 hover:text-fg-primary'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon}
                  <div className="flex flex-col truncate">
                    <span className="truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="text-[11px] text-fg-muted font-normal truncate">
                        {opt.description}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-fg-brand" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-1 text-[12px] text-[#eb5757]">{error}</p>}
    </div>
  );
};
