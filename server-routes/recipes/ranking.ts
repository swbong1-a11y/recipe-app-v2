import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRankedRecipes } from '../rankings.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const rankings = getRankedRecipes();
  res.status(200).json({ rankings });
}
