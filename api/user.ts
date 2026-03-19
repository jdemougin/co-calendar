import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    JSON.parse(authHeader.substring(7));
    res.json({ authenticated: true });
  } catch {
    res.status(401).json({ authenticated: false });
  }
}
