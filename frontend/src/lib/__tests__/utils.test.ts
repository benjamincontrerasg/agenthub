import { describe, it, expect } from 'vitest';
import { formatNumber, formatCurrency, formatDuration, generateId } from '../utils';

describe('Utility Formatters', () => {
  it('formats numbers with k and M abbreviations', () => {
    expect(formatNumber(500)).toBe('500');
    expect(formatNumber(1500)).toBe('1.5k');
    expect(formatNumber(2500000)).toBe('2.5M');
  });

  it('formats currency in USD', () => {
    const formatted = formatCurrency(12.5);
    expect(formatted).toContain('12.50');
  });

  it('formats durations in ms, s and m', () => {
    expect(formatDuration(450)).toBe('450ms');
    expect(formatDuration(5000)).toBe('5s');
    expect(formatDuration(65000)).toBe('1m 5s');
  });

  it('generates unique ids with prefix', () => {
    const id = generateId('agent');
    expect(id).toMatch(/^agent-/);
  });
});
