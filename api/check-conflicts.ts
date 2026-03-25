import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { isValidDateParam } from '../shared/api-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const { calendarId, date } = req.query;
  if (!calendarId || typeof calendarId !== 'string') {
    return res.status(400).json({ error: 'Missing calendarId' });
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const parisDate = isValidDateParam(date)
    ? date
    : new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());

  const timeMin = `${parisDate}T00:00:00Z`;
  const timeMax = `${parisDate}T23:59:59Z`;

  try {
    const resp = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
    });

    const events = (resp.data.items || []).map((e) => ({
      summary: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
    }));

    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
