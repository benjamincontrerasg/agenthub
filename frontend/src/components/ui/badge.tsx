import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[4px] px-1.5 py-0 text-[12px] font-normal tracking-[-0.010em] transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[rgba(255,255,255,0.05)] text-[#d0d6e0] border border-border-default',
        secondary:
          'bg-[rgba(255,255,255,0.03)] text-[#8a8f98] border border-border-default',
        success:
          'bg-[rgba(39,166,68,0.12)] text-[#27a644] border border-[#27a644]/40',
        warning:
          'bg-[rgba(251,191,36,0.12)] text-[#fbbf24] border border-[#fbbf24]/40',
        destructive:
          'bg-[rgba(235,87,87,0.12)] text-[#eb5757] border border-[#eb5757]/40',
        info:
          'bg-[rgba(2,184,204,0.12)] text-[#02b8cc] border border-[#02b8cc]/40',
        outline:
          'bg-transparent text-[#8a8f98] border border-border-default',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
