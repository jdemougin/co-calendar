import { describe, it, expect } from 'vitest';
import { parseEventToActivity, getUnloggedWeekdays } from './utils';

describe('parseEventToActivity', () => {
  it('returns empty activity for null input', () => {
    expect(parseEventToActivity(null)).toEqual({ category: '', type: '' });
  });

  it('parses "#cda Cours" correctly', () => {
    expect(parseEventToActivity({ summary: '#cda Cours' })).toEqual({ category: '#cda', type: 'Cours' });
  });

  it('parses "#divsem" (no type) as Rien', () => {
    expect(parseEventToActivity({ summary: '#divsem' })).toEqual({ category: '#divsem', type: 'Rien' });
  });

  it('parses "#daq Prépa cours" with multi-word type', () => {
    expect(parseEventToActivity({ summary: '#daq Prépa cours' })).toEqual({ category: '#daq', type: 'Prépa cours' });
  });

  it('detects known category "formation" without # prefix, reads type after dash', () => {
    expect(parseEventToActivity({ summary: 'formation - Cours' })).toEqual({ category: '#formation', type: 'Cours' });
  });

  it('parses generic "cat - type" format for unknown categories', () => {
    expect(parseEventToActivity({ summary: 'réunion - hebdo' })).toEqual({ category: 'réunion', type: 'hebdo' });
  });

  it('parses "#dwwm - Cours" via # branch, strips leading dash', () => {
    expect(parseEventToActivity({ summary: '#dwwm - Cours' })).toEqual({ category: '#dwwm', type: 'Cours' });
  });

  it('extracts category from free-form title like "Entretiens CDA - Camille / Julien"', () => {
    const result = parseEventToActivity({ summary: 'Entretiens CDA - Camille / Julien' });
    expect(result.category).toBe('#cda');
    expect(result.type).toBe('Entretiens');
  });

  it('smart-matches known category when # is present in summary', () => {
    // Smart match requires the full "#cda" token to be in the summary
    const result = parseEventToActivity({ summary: '#cda cours' });
    expect(result.category).toBe('#cda');
  });

  it('falls back to #divsem if no match', () => {
    expect(parseEventToActivity({ summary: 'Réunion équipe' })).toEqual({ category: '#divsem', type: 'Rien' });
  });

  it('lowercases the category', () => {
    expect(parseEventToActivity({ summary: '#CDA Cours' })).toEqual({ category: '#cda', type: 'Cours' });
  });
});

describe('getUnloggedWeekdays', () => {
  // Fixed reference: Wednesday 2026-03-25
  const wednesday = new Date('2026-03-25T10:00:00Z');

  it('returns yesterday (Tuesday) when nothing logged', () => {
    const result = getUnloggedWeekdays(wednesday, null, 7);
    // Should include Tuesday 2026-03-24 at minimum
    expect(result).toContain('2026-03-24');
  });

  it('returns empty array when yesterday is already logged', () => {
    const result = getUnloggedWeekdays(wednesday, '2026-03-24', 7);
    expect(result).toHaveLength(0);
  });

  it('skips weekends and returns Friday when opening on Monday', () => {
    // Monday 2026-03-23 10:00 UTC
    const monday = new Date('2026-03-23T10:00:00Z');
    const result = getUnloggedWeekdays(monday, null, 7);
    expect(result).toContain('2026-03-20'); // Friday
    expect(result).not.toContain('2026-03-21'); // Saturday
    expect(result).not.toContain('2026-03-22'); // Sunday
  });

  it('returns multiple missed days oldest-first', () => {
    // Wednesday, last logged Monday → should return Tue
    const result = getUnloggedWeekdays(wednesday, '2026-03-23', 7);
    expect(result).toEqual(['2026-03-24']); // only Tuesday
  });

  it('returns multiple days when several are missed', () => {
    // Wednesday 2026-03-25, last logged Thursday 2026-03-19
    // Should return: Fri 20, Mon 23, Tue 24 (skipping weekend)
    const result = getUnloggedWeekdays(wednesday, '2026-03-19', 7);
    expect(result).toContain('2026-03-20'); // Friday
    expect(result).toContain('2026-03-23'); // Monday
    expect(result).toContain('2026-03-24'); // Tuesday
    expect(result).not.toContain('2026-03-21'); // Saturday
    expect(result).not.toContain('2026-03-22'); // Sunday
  });

  it('result is ordered oldest to newest', () => {
    const result = getUnloggedWeekdays(wednesday, null, 7);
    for (let i = 1; i < result.length; i++) {
      expect(result[i] > result[i - 1]).toBe(true);
    }
  });

  it('respects maxDays limit', () => {
    const result = getUnloggedWeekdays(wednesday, null, 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
