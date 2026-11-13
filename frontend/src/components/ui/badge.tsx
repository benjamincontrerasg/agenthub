import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'bg-violet-950/70 text-violet-300 border border-violet-700/50',
        secondary:
          'bg-slate-800 text-slate-300 border border-slate-700/60',
        success:
          'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50',
        warning:
          'bg-amber-950/70 text-amber-300 border border-amber-700/50',
        destructive:
          'bg-red-950/70 text-red-300 border border-red-700/50',
        info:
          'bg-blue-950/70 text-blue-300 border border-blue-700/50',
        outline:
          'text-slate-300 border border-slate-700',
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

