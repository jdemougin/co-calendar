export function getParisParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
  const h = get('hour') === '24' ? '00' : get('hour');
  return {
    time: `${h.padStart(2, '0')}:${get('minute').padStart(2, '0')}`,
    date: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

/** Validates that a value is a YYYY-MM-DD date string */
export function isValidDateParam(date: unknown): date is string {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
}
