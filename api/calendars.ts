import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

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

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: client });

  try {
    const list = await calendar.calendarList.list();
    res.json(list.data.items || []);
  } catch (error: any) {
    const status = error.response?.status || 500;
    res.status(status).json({ error: error.message });
  }
}
