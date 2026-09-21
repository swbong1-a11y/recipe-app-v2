import type { VercelRequest, VercelResponse } from '@vercel/node';
import { likeRecipe } from '../rankings.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { recipeId, action = 'like', recipe } = body || {};

  if (!recipeId) {
    res.status(400).json({ error: 'recipeId is required' });
    return;
  }

  const result = likeRecipe(recipeId, action, recipe);
  res.status(200).json(result);
}
