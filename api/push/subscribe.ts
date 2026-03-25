import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  // Just verify the token is valid JSON (app-level auth check)
  try {
    JSON.parse(authHeader.substring(7));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { subscription, notifTime } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'No subscription' });

  // Use the push subscription endpoint as unique user_id per device
  const userId = subscription.endpoint;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription,
    notif_time: notifTime ?? '16:30',
    last_sent_date: null,
    updated_at: new Date().toISOString(),
  });

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ ok: true });
}
