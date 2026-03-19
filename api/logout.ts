import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  // Stateless — tokens are stored client-side in localStorage
  res.json({ success: true });
}
