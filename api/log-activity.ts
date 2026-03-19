import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let tokens: any;
  try {
    tokens = JSON.parse(authHeader.substring(7));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { morning, afternoon, calendars } = req.body;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const today = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(today);

  const startOfDay = `${dateStr}T00:00:00Z`;
  const endOfDay = `${dateStr}T23:59:59Z`;

  const results = [];

  for (const calendarId of calendars) {
    try {
      const existing = await calendar.events.list({
        calendarId,
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
      });

      const createEvent = async (period: 'Matin' | 'Après-midi', activity: any) => {
        const startTimeStr = period === 'Matin' ? '08:30:00' : '13:00:00';
        const endTimeStr = period === 'Matin' ? '12:00:00' : '17:00:00';

        const toDelete = existing.data.items?.filter((e) =>
          e.start?.dateTime?.includes(startTimeStr)
        );
        if (toDelete) {
          for (const e of toDelete) {
            if (e.id) await calendar.events.delete({ calendarId, eventId: e.id });
          }
        }

        const summary =
          activity.type === 'Rien'
            ? activity.category
            : `${activity.category} ${activity.type}`;

        await calendar.events.insert({
          calendarId,
          requestBody: {
            summary,
            start: { dateTime: `${dateStr}T${startTimeStr}`, timeZone: 'Europe/Paris' },
            end: { dateTime: `${dateStr}T${endTimeStr}`, timeZone: 'Europe/Paris' },
          },
        });
      };

      await createEvent('Matin', morning);
      await createEvent('Après-midi', afternoon);
      results.push({ calendarId, success: true });
    } catch (error) {
      results.push({ calendarId, success: false, error: (error as any).message });
    }
  }

  res.json(results);
}
