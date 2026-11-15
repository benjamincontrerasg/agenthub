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
            'flex h-8 w-full appearance-none rounded-[6px] border border-border-default bg-bg-surface px-3 py-1 pr-8 text-[13px] text-fg-primary transition-colors focus-visible:outline-none focus-visible:border-border-brand focus-visible:ring-1 focus-visible:ring-border-brand disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer',
            error && 'border-fg-error',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-2 h-4 w-4 text-fg-muted" />
        {error && <p className="mt-1 text-[12px] text-fg-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
