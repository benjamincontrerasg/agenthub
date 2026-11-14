import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            'flex h-9 w-full appearance-none rounded-lg border border-border-hover/80 bg-bg-card/90 px-3 py-1.5 pr-8 text-body text-fg-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
            error && 'border-fg-error',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-fg-secondary" />
        {error && <p className="mt-1 text-caption text-fg-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

