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
            'flex min-h-[80px] w-full rounded-[6px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-body text-[#d0d6e0] placeholder:text-[#62666d] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d0d6e0] focus-visible:border-[#d0d6e0] disabled:cursor-not-allowed disabled:opacity-50 resize-y',
            error && 'border-fg-error focus-visible:ring-red-500',
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

