import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-caption font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'bg-bg-brand-subtle/70 text-fg-brand border border-border-brand/50',
        secondary:
          'bg-bg-surface text-fg-secondary border border-border-hover/60',
        success:
          'bg-bg-success/70 text-fg-success border border-fg-success/50',
        warning:
          'bg-bg-warning/70 text-fg-warning border border-fg-warning/50',
        destructive:
          'bg-bg-error/70 text-fg-error border border-fg-error/50',
        info:
          'bg-bg-brand-subtle/70 text-fg-brand border border-border-brand/50',
        outline:
          'text-fg-secondary border border-border-hover',
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

