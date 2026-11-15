import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[6px] text-[13px] font-medium tracking-[-0.011em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d0d6e0] disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer',
  {
    variants: {
      variant: {
        // High-emphasis CTA: Acid Lime (#e4f222) with dark type (#08090a)
        default:
          'bg-[#e4f222] text-[#08090a] font-[510] hover:bg-[#d6e41b] active:scale-[0.98] shadow-[0px_1px_2px_rgba(0,0,0,0.2)]',
        // White Pill / High-contrast secondary
        secondary:
          'bg-[#ffffff] text-[#08090a] font-[510] hover:bg-[#e5e5e6] active:scale-[0.98]',
        // Ghost / Outline button (Hairline border #23252a)
        outline:
          'border border-[#23252a] bg-transparent text-[#d0d6e0] hover:bg-[#161718] hover:border-[#383b3f] hover:text-[#ffffff]',
        // Pure text nav button
        ghost:
          'text-[#d0d6e0] hover:bg-[#161718] hover:text-[#ffffff]',
        destructive:
          'bg-[#eb5757]/15 border border-[#eb5757]/30 text-[#eb5757] hover:bg-[#eb5757]/25',
        success:
          'bg-[#27a644]/15 border border-[#27a644]/30 text-[#27a644] hover:bg-[#27a644]/25',
      },
      size: {
        default: 'h-8 px-3.5 py-1.5',
        sm: 'h-7 rounded-[4px] px-2.5 text-[12px]',
        lg: 'h-10 rounded-[6px] px-5 text-[14px]',
        icon: 'h-8 w-8 p-0',
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
        {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
