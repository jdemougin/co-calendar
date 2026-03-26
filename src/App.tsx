import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, LogIn, Settings, Clock, AlertCircle, ChevronRight, Copy, ArrowDown, ChevronDown, Check, Zap, RefreshCw, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, CATEGORY_GROUPS, CATEGORIES, TYPES, parseEventToActivity, getUnloggedWeekdays, urlBase64ToUint8Array } from './lib/utils';
function CustomSelect({ 
  value, 
  onChange, 
  groups, 
  placeholder = "Autre (saisie libre)...",
  title = "Choisir une option",
  prefix = "#"
}: { 
  value: string, 
  onChange: (val: string) => void, 
  groups: { label: string, items: string[] }[],
  placeholder?: string,
  title?: string,
  prefix?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allItems = groups.flatMap(g => g.items);
  const isCustom = value && !allItems.includes(value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between hover:border-indigo-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
      >
        <span className="truncate mr-2">
          {isCustom ? `${prefix}${value.replace(new RegExp(`^${prefix}`), '')}` : value}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <ChevronDown size={20} className="text-slate-400" />
                  </button>
                </div>
                
                <div className="p-3 space-y-3 shrink-0">
                  {groups.map((group) => (
                    <div key={group.label} className="space-y-2">
                      {group.label && (
                        <div className="px-3 py-1 text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50/50 rounded-lg w-fit">
                          {group.label}
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-1">
                        {group.items.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              onChange(item);
                              setIsOpen(false);
                            }}
                            className={`w-full px-4 py-3 rounded-2xl text-base font-bold flex items-center justify-between transition-all ${
                              value === item
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-transparent hover:border-slate-200 dark:hover:border-slate-500'
                            }`}
                          >
                            <span>{item}</span>
                            {value === item && <Check size={20} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 space-y-3 shrink-0 border-t border-slate-100 dark:border-slate-700">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={isCustom ? value : ''}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full py-4 pl-12 pr-4 bg-white dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                    />
                    <Settings size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [morning, setMorning] = useState<Activity>({ category: '#divsem', type: 'Rien' });
  const [afternoon, setAfternoon] = useState<Activity>({ category: '#divsem', type: 'Rien' });
  const [loading, setLoading] = useState(false);
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isTimeToShow, setIsTimeToShow] = useState(false);
  const [isSessionError, setIsSessionError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(() => localStorage.getItem('calendarsLocked') === 'true');
  const [isMorningPreFilled, setIsMorningPreFilled] = useState(false);
  const [isAfternoonPreFilled, setIsAfternoonPreFilled] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [targetCalName, setTargetCalName] = useState('');
  const [refCalName, setRefCalName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('notifEnabled') === 'true');
  const [notifTime, setNotifTime] = useState(() => localStorage.getItem('notifTime') || '16:30');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  const getAuthHeader = useCallback(() => {
    const tokens = localStorage.getItem('google_tokens');
    return tokens ? { 'Authorization': `Bearer ${tokens}` } : {};
  }, []);

  useEffect(() => {
    const tokens = localStorage.getItem('google_tokens');
    if (tokens) {
      setIsAuthenticated(true);
      fetchCalendars();
    } else {
      checkAuth();
    }
    const interval = setInterval(checkTime, 60000);
    checkTime();
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.error('SW registration failed:', err));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const subscribeToPush = useCallback(async (time: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'granted') return;
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ subscription: sub.toJSON(), notifTime: time }),
      });
    } catch (e) {
      console.error('Push subscription failed:', e);
    }
  }, [getAuthHeader]);

  // Abonnement push serveur — l'unique source de vérité pour les notifications
  useEffect(() => {
    if (!notifEnabled) return;
    subscribeToPush(notifTime);
  }, [notifEnabled, notifTime, subscribeToPush]);

  // Auto-log à l'ouverture : remonte au dernier jour ouvré non logué (max 7 jours)
  useEffect(() => {
    const autoLogYesterday = async () => {
      if (!isAuthenticated || selectedCalendars.length < 2) return;
      const lastLog = localStorage.getItem('lastLogDate');
      const toLog = getUnloggedWeekdays(new Date(), lastLog);
      if (toLog.length === 0) return;

      setStatus({ type: 'success', message: `Auto-remplissage de ${toLog.length} jour(s) en cours…` });

      const refId = selectedCalendars[1];
      let logged = 0;

      for (const dateStr of toLog) {
        let m: Activity = { category: '#divsem', type: 'Rien' };
        let a: Activity = { category: '#divsem', type: 'Rien' };

        try {
          const res = await fetch(`/api/check-conflicts?calendarId=${refId}&date=${dateStr}`, {
            headers: getAuthHeader()
          });
          if (res.ok) {
            const refData = await res.json();
            const morningEvent = refData.find((e: any) => e.start?.includes('08:30'));
            const afternoonEvent = refData.find((e: any) => e.start?.includes('13:00'));
            // All-day event (e.g. #ABS RTT): start is a date string with no time
            const allDayEvent = refData.find((e: any) => e.start && !e.start.includes('T'));
            if (morningEvent) m = parseEventToActivity(morningEvent);
            else if (allDayEvent) m = parseEventToActivity(allDayEvent);
            if (afternoonEvent) a = parseEventToActivity(afternoonEvent);
            else if (allDayEvent) a = parseEventToActivity(allDayEvent);
          }
        } catch (e) {
          console.warn(`Auto-log: could not fetch ref calendar for ${dateStr}`, e);
        }

        try {
          const logRes = await fetch('/api/log-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ morning: m, afternoon: a, calendars: [selectedCalendars[0]], date: dateStr }),
          });
          if (!logRes.ok) {
            if (logRes.status === 401 || logRes.status === 403) {
              setStatus({ type: 'error', message: `Auto-remplissage interrompu : session expirée (${dateStr})` });
              break;
            }
            setStatus({ type: 'error', message: `Auto-remplissage : erreur ${logRes.status} pour ${dateStr}` });
            continue;
          }
          localStorage.setItem('lastLogDate', dateStr);
          logged++;
        } catch (e: any) {
          setStatus({ type: 'error', message: `Auto-remplissage : erreur réseau pour ${dateStr}` });
          break;
        }
      }

      if (logged > 0) setStatus({ type: 'success', message: `${logged} jour(s) rempli(s) automatiquement ✓` });
    };

    autoLogYesterday();
  }, [isAuthenticated, selectedCalendars, getAuthHeader]);

  useEffect(() => {
    localStorage.setItem('notifEnabled', String(notifEnabled));
    localStorage.setItem('notifTime', notifTime);
  }, [notifEnabled, notifTime]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (isAuthenticated && selectedCalendars.length === 2) {
      fetchTodayEvents();
    }
  }, [isAuthenticated, selectedCalendars]);

  useEffect(() => {
    if (calendars.length > 0 && selectedCalendars.length === 2) {
      const target = calendars.find(c => c.id === selectedCalendars[0]);
      const ref = calendars.find(c => c.id === selectedCalendars[1]);
      setTargetCalName(target?.summary || 'Inconnu');
      setRefCalName(ref?.summary || 'Inconnu');
    }
  }, [calendars, selectedCalendars]);

  const fetchTodayEvents = async (isSilent = false) => {
    if (selectedCalendars.length < 2) return;
    try {
      const targetId = selectedCalendars[0];
      const refId = selectedCalendars[1];
      
      // 1. Check Target (TPS) for existing entries
      const resTarget = await fetch(`/api/today-events?calendars=${targetId}`, {
        headers: getAuthHeader()
      });
      
      if (resTarget.ok) {
        const targetData = await resTarget.json();
        if (targetData.length > 0) {
          setTodayEvents(targetData);
          setIsEditing(false);
          // Pre-fill from TPS so "Modifier" works
          const morningEvent = targetData.find((e: any) => e.start?.includes('08:30'));
          const afternoonEvent = targetData.find((e: any) => e.start?.includes('13:00'));
          if (morningEvent) setMorning(parseEventToActivity(morningEvent));
          if (afternoonEvent) setAfternoon(parseEventToActivity(afternoonEvent));
          return;
        }
      }

      // 2. If TPS is empty, check Reference (Main) to pre-fill the form
      // This is the "interface like at the start" the user wants
      const resRef = await fetch(`/api/check-conflicts?calendarId=${refId}`, {
        headers: getAuthHeader()
      });
      
      if (resRef.ok) {
        const refData = await resRef.json();
        const morningEvent = refData.find((e: any) => e.start?.includes('08:30'));
        const afternoonEvent = refData.find((e: any) => e.start?.includes('13:00'));
        
        if (morningEvent || afternoonEvent) {
          const mAct = morningEvent ? parseEventToActivity(morningEvent) : undefined;
          const aAct = afternoonEvent ? parseEventToActivity(afternoonEvent) : undefined;
          
          if (mAct) {
            setMorning(mAct);
            setIsMorningPreFilled(true);
          }
          if (aAct) {
            setAfternoon(aAct);
            setIsAfternoonPreFilled(true);
          }
          
          console.log('Auto-filled form from reference calendar');
        }
      }
      
      if (!isSilent) {
        setTodayEvents([]);
        setIsEditing(true);
      }
    } catch (e) {
      console.error('Error fetching today events:', e);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/user', {
        headers: getAuthHeader()
      });
      const data = await res.json();
      setDebugInfo(`Auth check: ${res.status} - ${JSON.stringify(data)}`);
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        fetchCalendars();
      } else {
        setIsAuthenticated(false);
      }
    } catch (e: any) {
      setDebugInfo(`Auth check error: ${e.message}`);
      setIsAuthenticated(false);
    }
  };

  const checkTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Prompt after 16:30
    if (hours > 16 || (hours === 16 && minutes >= 30)) {
      setIsTimeToShow(true);
    } else {
      setIsTimeToShow(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/logout', { 
        method: 'POST',
        headers: getAuthHeader()
      });
      localStorage.removeItem('google_tokens');
      localStorage.removeItem('calendarsLocked');
      setIsAuthenticated(false);
      setIsLocked(false);
      setCalendars([]);
      setSelectedCalendars([]);
      setStatus(null);
      setIsSessionError(false);
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoading(false);
    }
  };

  const lockCalendars = () => {
    setIsLocked(true);
    localStorage.setItem('calendarsLocked', 'true');
  };

  const fetchCalendars = async () => {
    setCalendarLoading(true);
    try {
      const res = await fetch('/api/calendars', {
        headers: getAuthHeader()
      });
      const text = await res.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Réponse non-JSON du serveur: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        if (res.status === 401) setIsSessionError(true);
        if (res.status === 403) {
          throw new Error("Accès refusé (403). Veuillez réinitialiser la session pour mettre à jour les permissions.");
        }
        setDebugInfo(`Calendars fetch error: ${res.status} - ${text.substring(0, 50)}`);
        throw new Error(data.details || data.error || 'Erreur API');
      }
      setIsSessionError(false);
      setDebugInfo(`Calendars fetched: ${data?.length || 0} items`);
      const fetchedCalendars = data || [];
      setCalendars(fetchedCalendars);
      
      // Smart auto-selection for Julien: Target (TPS) and Reference (Main)
      // Target: must contain "tps"
      const tpsCal = fetchedCalendars.find((c: any) => c.summary.toLowerCase().includes('tps'));
      
      // Reference: prioritize exact name "julien demougin", then partial, then primary
      // BUT it must NOT be the same as tpsCal
      const mainCal = fetchedCalendars.find((c: any) => 
        c.summary.toLowerCase() === 'julien demougin' && c.id !== tpsCal?.id
      ) || fetchedCalendars.find((c: any) => 
        c.summary.toLowerCase().includes('julien demougin') && 
        !c.summary.toLowerCase().includes('tps') && 
        c.id !== tpsCal?.id
      ) || fetchedCalendars.find((c: any) => c.primary && c.id !== tpsCal?.id);

      if (tpsCal && mainCal) {
        console.log('Auto-detected calendars:', { target: tpsCal.summary, reference: mainCal.summary });
        const ids = [tpsCal.id, mainCal.id];
        setSelectedCalendars(ids);
        localStorage.setItem('selectedCalendars', JSON.stringify(ids));
        setIsLocked(true);
        localStorage.setItem('calendarsLocked', 'true');
        setTargetCalName(tpsCal.summary);
        setRefCalName(mainCal.summary);
      } else {
        const saved = localStorage.getItem('selectedCalendars');
        if (saved) {
          setSelectedCalendars(JSON.parse(saved));
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch calendars', e);
      const isIframe = window.self !== window.top;
      const message = isIframe 
        ? `Erreur : ${e.message}. Les cookies tiers ou les permissions semblent bloqués. Cliquez sur "Réinitialiser la session" ci-dessous.`
        : `Erreur : ${e.message}. Assurez-vous d'avoir accepté les permissions Google Calendar lors de la connexion.`;
      
      setStatus({ 
        type: 'error', 
        message 
      });
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleLogin = async () => {
    const res = await fetch('/api/auth/url', {
      headers: getAuthHeader()
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  // Récupère les tokens depuis le hash après redirect OAuth
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#tokens=')) {
      try {
        const encoded = hash.slice('#tokens='.length);
        const tokens = JSON.parse(atob(encoded));
        localStorage.setItem('google_tokens', JSON.stringify(tokens));
        window.history.replaceState(null, '', '/');
        setIsAuthenticated(true);
        fetchCalendars();
      } catch (e) {
        console.error('Failed to parse tokens from hash', e);
      }
    }
  }, []);

  const saveCalendars = (ids: string[]) => {
    setSelectedCalendars(ids);
    localStorage.setItem('selectedCalendars', JSON.stringify(ids));
  };

  const handleSubmit = async (force = false, overrideMorning?: Activity, overrideAfternoon?: Activity) => {
    if (selectedCalendars.length !== 2) {
      setStatus({ type: 'error', message: 'Veuillez sélectionner exactement 2 agendas.' });
      return;
    }

    const m = { ...(overrideMorning || morning) };
    const a = { ...(overrideAfternoon || afternoon) };

    // Add # prefix to custom categories if missing and lowercase them
    const allPredefined = CATEGORY_GROUPS.flatMap(g => g.items);
    if (m.category && !allPredefined.includes(m.category)) {
      m.category = `#${m.category.replace(/^#/, '').toLowerCase()}`;
    }
    if (a.category && !allPredefined.includes(a.category)) {
      a.category = `#${a.category.replace(/^#/, '').toLowerCase()}`;
    }

    console.log('Submitting activities:', { morning: m, afternoon: a });

    if (!m.category || !m.type || !a.category || !a.type) {
      setStatus({ type: 'error', message: 'Veuillez remplir toutes les activités (Matin et Après-midi).' });
      return;
    }

    // Check for conflicts in the reference calendar (second one) if not forced
    if (!force) {
      const referenceId = selectedCalendars[1];
      console.log('Checking conflicts in reference calendar ID:', referenceId);
      try {
        const res = await fetch(`/api/check-conflicts?calendarId=${referenceId}`, {
          headers: getAuthHeader()
        });
        if (res.ok) {
          const events = await res.json();
          console.log('Events found in reference calendar:', events);
          
          // Helper to check if an event overlaps a specific time slot
          const checkOverlap = (event: any, slotStartStr: string, slotEndStr: string) => {
            if (!event.start || !event.end) return false;
            
            // Use "wall clock" time from the string to avoid browser timezone shifts
            const getMinutes = (dateStr: string) => {
              // If it's an all-day event (YYYY-MM-DD)
              if (!dateStr.includes('T')) return { start: 0, end: 1440 };
              
              // Extract time part: YYYY-MM-DDTHH:mm:ss...
              try {
                const timePart = dateStr.split('T')[1];
                const [h, m] = timePart.split(':').map(Number);
                return h * 60 + m;
              } catch (e) {
                console.error('Error parsing time from:', dateStr);
                return 0;
              }
            };

            const eStartMin = getMinutes(event.start);
            const eEndMin = getMinutes(event.end);
            
            const [sh, sm] = slotStartStr.split(':').map(Number);
            const sStartMin = sh * 60 + sm;
            
            const [eh, em] = slotEndStr.split(':').map(Number);
            const sEndMin = eh * 60 + em;
            
            // Handle all-day events vs timed events
            const actualEStart = typeof eStartMin === 'number' ? eStartMin : eStartMin.start;
            const actualEEnd = typeof eEndMin === 'number' ? eEndMin : eEndMin.end;

            const overlap = actualEStart < sEndMin && actualEEnd > sStartMin;
            if (overlap) {
              console.log(`Overlap detected for event "${event.summary}":`, {
                event: `${actualEStart}-${actualEEnd}`,
                slot: `${sStartMin}-${sEndMin}`,
                rawStart: event.start,
                rawEnd: event.end
              });
            }
            return overlap;
          };

          const morningConflicts = events.filter((e: any) => checkOverlap(e, '08:30', '12:00'));
          const afternoonConflicts = events.filter((e: any) => checkOverlap(e, '13:00', '17:00'));
          
          if (morningConflicts.length > 0 || afternoonConflicts.length > 0) {
            console.log('Conflicts detected!', { morningConflicts, afternoonConflicts });
            setConflicts([...morningConflicts, ...afternoonConflicts]);
            setShowConflictModal(true);
            return;
          } else {
            console.log('No significant overlap found in reference calendar.');
          }
        }
      } catch (e) {
        console.error('Error checking conflicts:', e);
      }
    }

    setLoading(true);
    setStatus(null);
    setShowConflictModal(false);
    try {
      // We only log to the target calendar (first one)
      const targetCalendars = [selectedCalendars[0]];
      const res = await fetch('/api/log-activity', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ morning: m, afternoon: a, calendars: targetCalendars }),
      });
      const data = await res.json();
      const allSuccess = data.every((r: any) => r.success);
      if (allSuccess) {
        setStatus({ type: 'success', message: 'Activités enregistrées avec succès !' });
        const todayStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());
        localStorage.setItem('lastLogDate', todayStr);
        
        // Update state with prefixed values
        setMorning(m);
        setAfternoon(a);
        
        // Update local state immediately so UI switches to summary view
        const now = new Date();
        const dateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Paris',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(now);
        
        const localEvents = [
          { 
            summary: m.type === 'Rien' ? m.category : `${m.category} - ${m.type}`, 
            start: `${dateStr}T08:30:00Z`,
            calendarId: selectedCalendars[0]
          },
          { 
            summary: a.type === 'Rien' ? a.category : `${a.category} - ${a.type}`, 
            start: `${dateStr}T13:00:00Z`,
            calendarId: selectedCalendars[0]
          }
        ];
        
        setTodayEvents(localEvents);
        setIsEditing(false);
        
        // Fetch real data in background after a longer delay to get actual IDs
        // We use isSilent=true so it doesn't reset UI if Google is slow
        setTimeout(() => fetchTodayEvents(true), 5000);
      } else {
        setStatus({ type: 'error', message: 'Certains agendas n\'ont pas pu être mis à jour.' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null) return null;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-[#f8fafc] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans p-4 md:p-8">
      {/* Conflict Modal */}
      <AnimatePresence>
        {showConflictModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertCircle size={24} />
                <h3 className="text-lg font-semibold">Événement détecté</h3>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Des événements existent déjà dans votre agenda principal (<b>{refCalName}</b>) pour aujourd'hui :
              </p>
              
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                {conflicts.map((e, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 text-sm">
                    <div className="font-medium">{e.summary}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {new Date(e.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Voulez-vous tout de même ajouter vos activités à l'agenda <b>{targetCalName}</b> ?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConflictModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Zap size={24} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">co-calendar</h1>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors shadow-sm"
              >
                <LogIn size={16} />
                Se connecter
              </button>
            ) : (
              <>
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                  title="Rafraîchir"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                  title="Thème sombre"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                  title="Paramètres"
                >
                  <Settings size={20} />
                </button>
              </>
            )}
          </div>
        </header>

        {!isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm text-center"
          >
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="text-indigo-600" size={32} />
            </div>
            <h2 className="text-lg font-medium mb-2">Bienvenue</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Connectez votre compte Google pour synchroniser vos activités avec vos agendas.</p>
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Commencer avec Google
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Calendar Selection (Hidden when locked) */}
            {!isLocked && (
              <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm dark:shadow-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Settings size={18} />
                    <h2 className="font-medium">Configuration des Agendas</h2>
                  </div>
                  <button 
                    onClick={fetchCalendars}
                    className="text-xs text-indigo-600 hover:underline"
                    disabled={calendarLoading}
                  >
                    {calendarLoading ? 'Chargement...' : 'Actualiser'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Sélectionnez les 2 agendas où enregistrer vos activités.</p>
                
                {calendarLoading ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                    Chargement de vos agendas...
                  </div>
                ) : calendars.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-700 rounded-xl border border-dashed border-slate-200 dark:border-slate-600">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Aucun agenda trouvé.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 px-4">Assurez-vous d'avoir accepté les permissions Google Calendar lors de la connexion.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {calendars
                        .filter(cal => selectedCalendars.length < 2 || selectedCalendars.includes(cal.id))
                        .map(cal => (
                          <button
                            key={cal.id}
                            onClick={() => {
                              if (selectedCalendars.includes(cal.id)) {
                                saveCalendars(selectedCalendars.filter(id => id !== cal.id));
                              } else if (selectedCalendars.length < 2) {
                                saveCalendars([...selectedCalendars, cal.id]);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left text-sm transition-all ${
                              selectedCalendars.includes(cal.id)
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 dark:text-slate-300'
                            }`}
                          >
                            <div className="font-medium truncate">{cal.summary}</div>
                          </button>
                        ))}
                    </div>
                    
                    {selectedCalendars.length === 2 && (
                      <div className="mt-4 flex justify-between items-center">
                        <button 
                          onClick={() => setSelectedCalendars([])}
                          className="text-xs text-slate-400 hover:text-indigo-600 underline"
                        >
                          Modifier la sélection
                        </button>
                        <button
                          onClick={lockCalendars}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition-colors shadow-sm"
                        >
                          <CheckCircle2 size={14} />
                          Verrouiller ces agendas
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                {selectedCalendars.length !== 2 && !calendarLoading && calendars.length > 0 && (
                  <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Sélectionnez encore {2 - selectedCalendars.length} agenda(s).
                  </p>
                )}
              </section>
            )}

            {/* Status Messages */}
            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-xl flex items-start gap-3 ${
                    status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border border-rose-100 dark:border-rose-800'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{status.message}</p>
                      <button onClick={() => setStatus(null)} className="text-xs opacity-50 hover:opacity-100 ml-2">Fermer</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Activity Form or Summary */}
            <section className="space-y-4">
              {todayEvents.length > 0 && !isEditing ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm dark:shadow-slate-900 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/30 rounded-full -mr-16 -mt-16 opacity-50" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">Journée déjà enregistrée</h3>
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full uppercase tracking-wider">Terminé</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1.5 border border-slate-100 dark:border-slate-600"
                      >
                        <Settings size={14} />
                        Modifier
                      </button>
                    </div>
  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['08:30', '13:00'].map((time, idx) => {
                        const event = todayEvents.find(e => e.start?.includes(time));
                        return (
                          <div key={time} className="p-4 rounded-xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 shadow-sm dark:shadow-slate-900">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock size={12} className="text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {idx === 0 ? 'Matinée (08:30)' : 'Après-midi (13:00)'}
                              </span>
                            </div>
                            {event ? (
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {event.summary}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm italic text-slate-400">
                                Aucune activité trouvée
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      {/* Rien ici, juste l'espace pour les boutons */}
                    </div>
                    {isEditing && todayEvents.length > 0 && (
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>

                  <div className="relative space-y-8 pb-4">
                    {/* Morning Slot */}
                    <div className="relative flex gap-6">
                      <div className="flex-1 space-y-4">
                        <div className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 ${isMorningPreFilled ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-600'} shadow-sm dark:shadow-slate-900 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matinée</span>
                              {isMorningPreFilled && (
                                <motion.span 
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1"
                                >
                                  <Zap size={10} />
                                  Détecté
                                </motion.span>
                              )}
                            </div>
                            {morning.category && (
                              <button 
                                onClick={() => {
                                  setAfternoon({ ...morning });
                                  setIsAfternoonPreFilled(false);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-bold uppercase hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                title="Copier vers l'après-midi"
                              >
                                <Copy size={10} />
                                Copier en bas
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div className="relative">
                              <CustomSelect 
                                value={morning.category}
                                onChange={(val) => {
                                  const lowerVal = val.toLowerCase();
                                  setMorning({ ...morning, category: lowerVal, type: lowerVal === '#divsem' ? 'Rien' : morning.type });
                                  setIsMorningPreFilled(false);
                                }}
                                groups={CATEGORY_GROUPS}
                                title="Choisir une catégorie"
                                prefix="#"
                              />
                            </div>

                            <AnimatePresence>
                              {morning.category && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="pt-3 border-t border-slate-50 dark:border-slate-700 overflow-hidden"
                                >
                                  <CustomSelect
                                    value={morning.type}
                                    onChange={(val) => {
                                      setMorning({ ...morning, type: val });
                                      setIsMorningPreFilled(false);
                                    }}
                                    groups={morning.category.toLowerCase() === '#divsem' ? [] : [{ label: '', items: TYPES.filter(t => t !== 'Autre...') }]}
                                    title={morning.category.toLowerCase() === '#divsem' ? "Saisir un texte" : "Choisir un type"}
                                    placeholder={morning.category.toLowerCase() === '#divsem' ? "Saisir un texte..." : "Type personnalisé..."}
                                    prefix=""
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Afternoon Slot */}
                    <div className="relative flex gap-6">
                      <div className="flex-1 space-y-4">
                        <div className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 ${isAfternoonPreFilled ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-600'} shadow-sm dark:shadow-slate-900 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Après-midi</span>
                              {isAfternoonPreFilled && (
                                <motion.span 
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1"
                                >
                                  <Zap size={10} />
                                  Détecté
                                </motion.span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="relative">
                              <CustomSelect 
                                value={afternoon.category}
                                onChange={(val) => {
                                  const lowerVal = val.toLowerCase();
                                  setAfternoon({ ...afternoon, category: lowerVal, type: lowerVal === '#divsem' ? 'Rien' : afternoon.type });
                                  setIsAfternoonPreFilled(false);
                                }}
                                groups={CATEGORY_GROUPS}
                                title="Choisir une catégorie"
                                prefix="#"
                              />
                            </div>

                            <AnimatePresence>
                              {afternoon.category && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="pt-3 border-t border-slate-50 dark:border-slate-700 overflow-hidden"
                                >
                                  <CustomSelect
                                    value={afternoon.type}
                                    onChange={(val) => {
                                      setAfternoon({ ...afternoon, type: val });
                                      setIsAfternoonPreFilled(false);
                                    }}
                                    groups={afternoon.category.toLowerCase() === '#divsem' ? [] : [{ label: '', items: TYPES.filter(t => t !== 'Autre...') }]}
                                    title={afternoon.category.toLowerCase() === '#divsem' ? "Saisir un texte" : "Choisir un type"}
                                    placeholder={afternoon.category.toLowerCase() === '#divsem' ? "Saisir un texte..." : "Type personnalisé..."}
                                    prefix=""
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading || selectedCalendars.length !== 2 || !morning.category || !afternoon.category}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-3 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {loading ? 'Traitement en cours...' : 'VALIDER LA JOURNÉE'}
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}

            </section>
          </div>
        )}
        
        {/* Le debug info a été déplacé dans le modal Settings, rien à afficher ici */}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden p-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Paramètres</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <ChevronDown size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6 max-h-[70vh] overflow-y-auto overflow-x-hidden no-scrollbar">
                {/* Déconnexion */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Compte connecté</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Vous êtes authentifié</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full py-2 bg-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Déconnexion...' : 'Se déconnecter'}
                  </button>
                </div>

                {/* Changer les agendas */}
                {isLocked && calendars.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Modifier les agendas</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agenda cible (TPS)</label>
                        <select
                          value={selectedCalendars[0] || ''}
                          onChange={(e) => {
                            const newIds = [e.target.value, selectedCalendars[1]];
                            saveCalendars(newIds);
                          }}
                          className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        >
                          <option value="">Choisir...</option>
                          {calendars.map(cal => (
                            <option key={cal.id} value={cal.id}>{cal.summary}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agenda référence (Vérif)</label>
                        <select
                          value={selectedCalendars[1] || ''}
                          onChange={(e) => {
                            const newIds = [selectedCalendars[0], e.target.value];
                            saveCalendars(newIds);
                          }}
                          className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        >
                          <option value="">Choisir...</option>
                          {calendars.map(cal => (
                            <option key={cal.id} value={cal.id}>{cal.summary}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Notifications</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Rappel quotidien</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!notifEnabled && Notification.permission !== 'granted') {
                        const perm = await Notification.requestPermission();
                        if (perm === 'granted') {
                          setNotifEnabled(true);
                          subscribeToPush(notifTime);
                        }
                      } else {
                        setNotifEnabled(!notifEnabled);
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-all relative ${notifEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <motion.div
                      animate={{ x: notifEnabled ? 26 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                {notifEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Heure du rappel</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">Sauvegardé automatiquement</p>
                        </div>
                      </div>
                      <input
                        type="time"
                        value={notifTime}
                        onChange={(e) => setNotifTime(e.target.value)}
                        className="w-28 p-2 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-center"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const iconUrl = `${window.location.origin}/icon-192.png`;
                        if (Notification.permission === 'granted') {
                          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                            navigator.serviceWorker.ready.then(reg => {
                              reg.showNotification('co-calendar', {
                                body: 'Valide ta journée pour Marina stp !',
                                icon: iconUrl,
                                badge: iconUrl,
                                tag: 'test-notif'
                              } as any);
                            });
                          } else {
                            new Notification('co-calendar', { body: 'Valide ta journée pour Marina stp !', icon: iconUrl });
                          }
                        } else {
                          Notification.requestPermission();
                        }
                      }}
                      className="w-full py-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      Tester la notification
                    </button>
                  </motion.div>
                )}

                {/* Debug Info */}
                {debugInfo && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed space-y-1">
                      <div>Debug: {debugInfo}</div>
                      <div className="text-indigo-500">Cible (TPS): {targetCalName || 'Non défini'}</div>
                      <div className="text-amber-500">Référence (Vérif): {refCalName || 'Non défini'}</div>
                    </p>
                  </div>
                )}

                <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-2xl border border-amber-100 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                    <AlertCircle size={16} />
                    <p className="text-xs font-bold">Installation mobile</p>
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed mb-4">
                    Pour installer l'app sur votre téléphone : 
                    <br /><b>iOS :</b> Partager {'>'} Sur l'écran d'accueil
                    <br /><b>Android :</b> Menu (⋮) {'>'} Installer l'application
                  </p>
                  {deferredPrompt && (
                    <button
                      onClick={() => {
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then((choiceResult: any) => {
                          if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the install prompt');
                          }
                          setDeferredPrompt(null);
                        });
                      }}
                      className="w-full py-2 bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors shadow-sm"
                    >
                      Installer maintenant
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    localStorage.removeItem('lastLogDate');
                    setShowSettings(false);
                    window.location.reload();
                  }}
                  className="w-full py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline text-xs font-medium"
                >
                  Rejouer les jours manquants
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem('selectedCalendars');
                    localStorage.removeItem('calendarsLocked');
                    setShowSettings(false);
                    window.location.reload();
                  }}
                  className="w-full py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline text-xs font-medium"
                >
                  Réinitialiser la configuration des agendas
                </button>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-all"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
