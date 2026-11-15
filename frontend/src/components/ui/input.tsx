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
            'flex h-8 w-full rounded-[6px] border border-[#23252a] bg-[rgba(255,255,255,0.02)] px-3 py-1.5 text-[14px] text-[#ffffff] placeholder:text-[#8a8f98] transition-colors focus-visible:outline-none focus-visible:border-[#d0d6e0] focus-visible:ring-1 focus-visible:ring-[#d0d6e0] disabled:cursor-not-allowed disabled:opacity-40',
            error && 'border-[#eb5757] focus-visible:ring-[#eb5757]',
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
