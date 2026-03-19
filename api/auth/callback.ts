import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing code');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/auth/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
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
}
