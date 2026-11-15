import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-[6px] border border-border-default bg-bg-surface px-3 py-2 text-body text-fg-primary placeholder:text-fg-muted shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-brand focus-visible:border-border-brand disabled:cursor-not-allowed disabled:opacity-50 resize-y',
            error && 'border-fg-error focus-visible:ring-fg-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-caption text-fg-error">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

