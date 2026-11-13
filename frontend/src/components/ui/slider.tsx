import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export function Slider({ value, min, max, step = 1, onChange, className, disabled }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={cn(
        'w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    />
  );
}
