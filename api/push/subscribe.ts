import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  let tokens: any;
  try {
    tokens = JSON.parse(authHeader.substring(7));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { subscription, notifTime } = req.body;
  if (!subscription) return res.status(400).json({ error: 'No subscription' });

  // Identify user via Google
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  const userId = data.email;
  if (!userId) return res.status(401).json({ error: 'Cannot identify user' });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription,
    notif_time: notifTime ?? '16:30',
    updated_at: new Date().toISOString(),
  });

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ ok: true });
}
