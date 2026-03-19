import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { google } from 'googleapis';
import session from 'express-session';
import dotenv from 'dotenv';

declare module 'express-session' {
  interface SessionData {
    tokens: any;
  }
}

dotenv.config();

const app = express();
const PORT = 3000;

app.set('trust proxy', 1); // Indispensable pour les cookies "secure" derrière un proxy

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true, // Indispensable pour les cookies "secure" derrière un proxy
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Middleware pour logger les sessions et extraire les tokens du header Authorization
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const tokenStr = authHeader.substring(7);
      const tokens = JSON.parse(tokenStr);
      req.session.tokens = tokens;
      console.log('Tokens extracted from Authorization header');
    } catch (e) {
      console.error('Failed to parse tokens from Authorization header');
    }
  }
  console.log(`[${req.method}] ${req.url} - HasTokens: ${!!req.session?.tokens}`);
  next();
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

const getRedirectUri = (req: express.Request) => {
  // En AI Studio, process.env.APP_URL est la source la plus fiable pour l'URL publique
  if (process.env.APP_URL) {
    return `${process.env.APP_URL}/auth/callback`;
  }
  
  // Fallback sur les headers si APP_URL n'est pas défini
  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  const uri = `https://${host}/auth/callback`;
  console.log('--- DEBUG OAUTH ---');
  console.log('Generated Redirect URI (fallback):', uri);
  console.log('Host Header:', req.headers['host']);
  console.log('X-Forwarded-Host:', req.headers['x-forwarded-host']);
  console.log('-------------------');
  return uri;
};

app.get('/api/auth/url', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    redirect_uri: getRedirectUri(req)
  });
  res.json({ url });
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  console.log('Auth callback received with code:', code ? 'present' : 'missing');
  try {
    const { tokens } = await oauth2Client.getToken({
      code: code as string,
      redirect_uri: getRedirectUri(req)
    });
    console.log('Tokens exchanged successfully');
    // On garde la session pour le cas hors iframe, mais on va aussi passer les tokens via postMessage
    req.session.tokens = tokens;
    console.log('Session tokens saved.');
    res.send(`
      <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS',
              tokens: ${JSON.stringify(tokens)}
            }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authentification réussie. Cette fenêtre va se fermer.</p>
      </body>
    </html>
  `);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/user', async (req, res) => {
  if (!req.session?.tokens) {
    return res.status(401).json({ authenticated: false, error: 'Not authenticated' });
  }
  res.json({ authenticated: true });
});

app.get('/api/calendars', async (req, res) => {
  console.log('--- API CALENDARS CALL ---');
  console.log('Has Tokens:', !!req.session?.tokens);
  
  if (!req.session?.tokens) {
    console.log('Session tokens missing in /api/calendars');
    return res.status(401).json({ error: 'Unauthorized', details: 'Session expirée ou manquante. Veuillez vous déconnecter et vous reconnecter.' });
  }
  
  console.log('Fetching calendars for user...');
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials(req.session.tokens);
  const calendar = google.calendar({ version: 'v3', auth: client });

  try {
    const list = await calendar.calendarList.list();
    console.log('Calendars found:', list.data.items?.length || 0);
    res.json(list.data.items || []);
  } catch (error: any) {
    const errorData = error.response?.data?.error || {};
    console.error('Calendar list error:', errorData || error.message);
    
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: 'Failed to fetch calendars', 
      details: errorData.message || error.message,
      code: errorData.code || status
    });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid'); // Nom par défaut du cookie express-session
    res.json({ success: true });
  });
});

app.get('/api/today-events', async (req, res) => {
  if (!req.session?.tokens) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { calendars } = req.query;
  if (!calendars) {
    return res.status(400).json({ error: 'Missing calendars' });
  }

  const calendarIds = (Array.isArray(calendars) ? calendars : [calendars]) as string[];

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials(req.session.tokens);
  const calendar = google.calendar({ version: 'v3', auth: client });

  // Get start and end of today in Europe/Paris
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const timeMin = `${dateStr}T00:00:00Z`;
  const timeMax = `${dateStr}T23:59:59Z`;

  try {
    const allEvents: any[] = [];
    for (const calendarId of calendarIds) {
      const resp = await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
      });
      if (resp.data.items) {
        allEvents.push(...resp.data.items.map(e => ({
          id: e.id,
          summary: e.summary,
          start: e.start?.dateTime || e.start?.date,
          calendarId
        })));
      }
    }
    res.json(allEvents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/check-conflicts', async (req, res) => {
  if (!req.session?.tokens) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { calendarId } = req.query;
  if (!calendarId || typeof calendarId !== 'string') {
    return res.status(400).json({ error: 'Missing calendarId' });
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials(req.session.tokens);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const now = new Date();
  const parisDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  // Fetch a wide range around the day to avoid UTC offset issues
  const timeMin = `${parisDate}T00:00:00Z`; 
  const timeMax = `${parisDate}T23:59:59Z`;

  console.log(`Checking conflicts for calendar: ${calendarId} on ${parisDate} (UTC range: ${timeMin} to ${timeMax})`);

  try {
    const resp = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
    });
    
    const events = (resp.data.items || []).map(e => ({
      summary: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
    }));
    
    console.log(`Found ${events.length} events in reference calendar`);
    res.json(events);
  } catch (error: any) {
    console.error('Error in /api/check-conflicts:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/log-activity', async (req, res) => {
  if (!req.session?.tokens) {
    return res.status(401).json({ error: 'Unauthorized', details: 'Session expirée' });
  }
  const { morning, afternoon, calendars } = req.body;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials(req.session.tokens);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const today = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(today);

  const startOfDay = `${dateStr}T00:00:00Z`;
  const endOfDay = `${dateStr}T23:59:59Z`;

  const results = [];

  for (const calendarId of calendars) {
    try {
      // Fetch existing events to delete them (to allow "changing")
      const existing = await calendar.events.list({
        calendarId,
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
      });

      const createEvent = async (period: 'Matin' | 'Après-midi', activity: any) => {
        const startTimeStr = period === 'Matin' ? '08:30:00' : '13:00:00';
        const endTimeStr = period === 'Matin' ? '12:00:00' : '17:00:00';
        
        // Delete existing events for this specific time slot if they exist
        const toDelete = existing.data.items?.filter(e => 
          e.start?.dateTime?.includes(startTimeStr)
        );

        if (toDelete) {
          for (const e of toDelete) {
            if (e.id) {
              await calendar.events.delete({ calendarId, eventId: e.id });
            }
          }
        }

        if (activity.type === 'Rien') {
          // If type is "Rien", we only put the category
          const summary = activity.category;
          await calendar.events.insert({
            calendarId,
            requestBody: {
              summary,
              start: { dateTime: `${dateStr}T${startTimeStr}`, timeZone: 'Europe/Paris' },
              end: { dateTime: `${dateStr}T${endTimeStr}`, timeZone: 'Europe/Paris' },
            },
          });
        } else {
          const summary = `${activity.category} ${activity.type}`;
          await calendar.events.insert({
            calendarId,
            requestBody: {
              summary,
              start: { dateTime: `${dateStr}T${startTimeStr}`, timeZone: 'Europe/Paris' },
              end: { dateTime: `${dateStr}T${endTimeStr}`, timeZone: 'Europe/Paris' },
            },
          });
        }
      };

      await createEvent('Matin', morning);
      await createEvent('Après-midi', afternoon);
      results.push({ calendarId, success: true });
    } catch (error) {
      console.error(`Error for calendar ${calendarId}:`, error);
      results.push({ calendarId, success: false, error: (error as any).message });
    }
  }

  res.json(results);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
