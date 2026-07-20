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

function detectActivity(summary: string): Activity {
  // Branch 1: explicit # prefix → "#dwwm - Cours" or "#dwwm Cours"
  if (summary.includes('#')) {
    const parts = summary.split(' ');
    const categoryIndex = parts.findIndex((p: string) => p.startsWith('#'));
    if (categoryIndex !== -1) {
      const category = parts[categoryIndex].toLowerCase();
      const rawType = parts.slice(categoryIndex + 1).join(' ').trim();
      // Strip leading "- " if present (e.g. "#dwwm - Cours" → type "Cours")
      const type = rawType.replace(/^-\s*/, '').trim();
      return { category, type: type || 'Rien' };
    }
  }

  // Branch 2: known category keyword (e.g. "Entretiens CDA - Camille / Julien" → #cda, Entretiens)
  // Use part before " - " to avoid noise from the rest of the title
  const summaryMain = summary.includes(' - ') ? summary.split(' - ')[0] : summary;
  const foundCategory = CATEGORIES.find(cat =>
    summaryMain.toUpperCase().includes(cat.toUpperCase()) ||
    summaryMain.toUpperCase().includes(cat.slice(1).toUpperCase())
  );
  if (foundCategory) {
    const slug = foundCategory.slice(1).toUpperCase();
    const remaining = summaryMain
      .replace(new RegExp(foundCategory, 'i'), '')
      .replace(new RegExp(slug, 'i'), '')
      .replace(/\s+/g, ' ')
      .trim();
    // Also look in the part after " - " for type hints (e.g. "formation - Cours")
    const summaryRest = summary.includes(' - ') ? summary.split(' - ').slice(1).join(' - ') : '';
    const typeContext = (remaining + ' ' + summaryRest).trim();
    const foundType = TYPES.find(t => t !== 'Autre...' && typeContext.toUpperCase().includes(t.toUpperCase()));
    return { category: foundCategory, type: foundType || remaining || 'Rien' };
  }

  // Branch 3: generic "cat - type" format
  if (summary.includes(' - ')) {
    const [cat, type] = summary.split(' - ');
    return { category: cat.trim().toLowerCase(), type: type.trim() };
  }

  // Branch 4: no pattern matched at all — surface the raw title as-is.
  return { category: summary, type: 'Rien' };
}

export function parseEventToActivity(event: any, safeFallback = false): Activity {
  if (!event) return { category: '', type: '' };
  const summary = (event.summary || '').trim();
  const result = detectActivity(summary);

  // In supervised contexts (interactive pre-fill), surface whatever was detected so the user
  // can see and adjust it. In unsupervised contexts (auto-log writing directly to the calendar),
  // only trust a recognized category — anything else falls back to a safe generic entry.
  if (safeFallback && !CATEGORIES.includes(result.category)) {
    return { category: '#divsem', type: 'Rien' };
  }
  return result;
}

/**
 * Returns unlogged weekdays from yesterday back (oldest first, max maxDays iterations).
 * Uses YYYY-MM-DD format — lexicographic order equals chronological order for this format.
 */
export function getUnloggedWeekdays(now: Date, lastLog: string | null, maxDays = 35): string[] {
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
