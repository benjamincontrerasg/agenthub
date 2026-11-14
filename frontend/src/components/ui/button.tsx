import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-body font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-bg-brand text-fg-primary shadow-sm hover:bg-violet-500 active:scale-[0.98]',
        secondary:
          'bg-bg-surface text-fg-primary hover:bg-slate-700 active:scale-[0.98]',
        outline:
          'border border-border-hover bg-transparent text-fg-primary hover:bg-slate-800/60 hover:text-white',
        ghost:
          'text-fg-secondary hover:bg-slate-800 hover:text-white',
        destructive:
          'bg-fg-error/90 text-fg-primary hover:bg-red-500 active:scale-[0.98]',
        success:
          'bg-fg-success text-fg-primary hover:bg-emerald-500 active:scale-[0.98]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-caption',
        lg: 'h-11 rounded-lg px-6 text-subtitle',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

