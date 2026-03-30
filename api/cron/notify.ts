import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
function getParisParts(date: Date) {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  webpush.setVapidDetails(
    'mailto:contact@co-calendar.app',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const { time: currentTime, date: today } = getParisParts(new Date());

  // Skip weekends (Saturday=6, Sunday=0) in Paris timezone
  const parisDay = new Date(today + 'T12:00:00').getDay();
  if (parisDay === 0 || parisDay === 6) {
    return res.status(200).json({ skipped: 'weekend' });
  }

  // Fetch users whose notif_time matches now and haven't been sent today
  const { data: users, error } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription')
    .eq('notif_time', currentTime)
    .or(`last_sent_date.is.null,last_sent_date.neq.${today}`);

  if (error) return res.status(500).json({ error: error.message });
  if (!users || users.length === 0) {
    return res.status(200).json({ skipped: `no users at ${currentTime}` });
  }

  const results: any[] = [];

  for (const user of users) {
    try {
      await webpush.sendNotification(
        user.subscription,
        JSON.stringify({ title: 'co-calendar', body: 'Valide ta journée pour Marina stp !' }),
      );
      await supabase
        .from('push_subscriptions')
        .update({ last_sent_date: today })
        .eq('user_id', user.user_id);
      results.push({ user_id: user.user_id, sent: true });
    } catch (e: any) {
      // Subscription expirée → supprimer
      if (e.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('user_id', user.user_id);
      }
      results.push({ user_id: user.user_id, error: e.message });
    }
  }

  res.status(200).json({ time: currentTime, results });
  } catch (e: any) {
    res.status(500).json({ crashed: true, error: e?.message, stack: e?.stack?.split('\n').slice(0, 5) });
  }
}
