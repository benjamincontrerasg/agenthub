import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-8 w-full rounded-[6px] border border-border-default bg-bg-surface px-3 py-1.5 text-[14px] text-fg-primary placeholder:text-fg-muted transition-colors focus-visible:outline-none focus-visible:border-border-brand focus-visible:ring-1 focus-visible:ring-border-brand disabled:cursor-not-allowed disabled:opacity-40',
            error && 'border-fg-error focus-visible:ring-fg-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-[12px] text-[#eb5757]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
