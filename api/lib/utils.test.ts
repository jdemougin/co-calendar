import { describe, it, expect } from 'vitest';
import { getParisParts, isValidDateParam } from './utils';

describe('getParisParts', () => {
  it('returns time and date in YYYY-MM-DD / HH:MM format', () => {
    // 2026-03-25T08:00:00Z = 09:00 Paris time (UTC+1 in March)
    const date = new Date('2026-03-25T08:00:00Z');
    const { time, date: d } = getParisParts(date);
    expect(d).toBe('2026-03-25');
    expect(time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('pads single-digit hours and minutes', () => {
    // 2026-03-25T05:03:00Z = 06:03 Paris time
    const date = new Date('2026-03-25T05:03:00Z');
    const { time } = getParisParts(date);
    expect(time).toMatch(/^\d{2}:0[0-9]$/);
  });

  it('handles hour=24 edge case as 00', () => {
    // Midnight Paris: 2026-03-25T23:00:00Z = 00:00 Paris (UTC+1)
    const date = new Date('2026-03-24T23:00:00Z');
    const { time } = getParisParts(date);
    expect(time).toBe('00:00');
  });
});

describe('isValidDateParam', () => {
  it('accepts valid YYYY-MM-DD', () => {
    expect(isValidDateParam('2026-03-25')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidDateParam('25-03-2026')).toBe(false);
    expect(isValidDateParam('2026/03/25')).toBe(false);
    expect(isValidDateParam('not-a-date')).toBe(false);
    expect(isValidDateParam('')).toBe(false);
    expect(isValidDateParam(null)).toBe(false);
    expect(isValidDateParam(undefined)).toBe(false);
    expect(isValidDateParam(20260325)).toBe(false);
  });

  it('rejects partial matches', () => {
    expect(isValidDateParam('2026-03-2')).toBe(false);
    expect(isValidDateParam('2026-3-25')).toBe(false);
  });
});
