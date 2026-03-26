export interface Activity {
  category: string;
  type: string;
}

export const CATEGORY_GROUPS = [
  { label: 'Formations', items: ['#cda', '#daq', '#dwwm', '#formation'] },
  { label: 'Divers', items: ['#divsem'] },
];

export const CATEGORIES = CATEGORY_GROUPS.flatMap(g => g.items);
export const TYPES = ['Cours', 'Prépa', 'Rien', 'Autre...'];

export function parseEventToActivity(event: any): Activity {
  if (!event) return { category: '', type: '' };
  const summary = (event.summary || '').trim();

  if (summary.includes('#')) {
    const parts = summary.split(' ');
    const categoryIndex = parts.findIndex((p: string) => p.startsWith('#'));
    if (categoryIndex !== -1) {
      const category = parts[categoryIndex].toLowerCase();
      const type = parts.slice(categoryIndex + 1).join(' ').trim();
      return { category, type: type || 'Rien' };
    }
  }

  if (summary.includes(' - ')) {
    const [cat, type] = summary.split(' - ');
    return { category: cat.trim().toLowerCase(), type: type.trim() };
  }

  const foundCategory = CATEGORIES.find(cat =>
    summary.toUpperCase().includes(cat.toUpperCase()) ||
    summary.toUpperCase().includes(cat.slice(1).toUpperCase())
  );
  if (foundCategory) {
    const slug = foundCategory.slice(1).toUpperCase();
    const remaining = summary.toUpperCase().replace(foundCategory.toUpperCase(), '').replace(slug, '').trim();
    const foundType = TYPES.find(t => t !== 'Autre...' && remaining.includes(t.toUpperCase()));
    return { category: foundCategory, type: foundType || remaining || 'Rien' };
  }

  return { category: '#divsem', type: 'Rien' };
}

/**
 * Returns unlogged weekdays from yesterday back (oldest first, max maxDays iterations).
 * Uses YYYY-MM-DD format — lexicographic order equals chronological order for this format.
 */
export function getUnloggedWeekdays(now: Date, lastLog: string | null, maxDays = 21): string[] {
  const toLog: string[] = [];
  const candidate = new Date(now);
  for (let i = 0; i < maxDays; i++) {
    candidate.setDate(candidate.getDate() - 1);
    const day = candidate.getDay(); // 0=Sun, 6=Sat
    if (day === 0 || day === 6) continue;
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(candidate);
    if (lastLog && lastLog >= dateStr) break;
    toLog.push(dateStr);
  }
  return toLog.reverse(); // oldest first
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
