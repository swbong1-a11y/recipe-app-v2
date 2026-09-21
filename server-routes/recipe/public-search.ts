import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchMfdsRecipes } from '../mfds.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const { ingredients, preference, cookingTool, excludeDishes } = body || {};

  if (!ingredients || (Array.isArray(ingredients) && ingredients.length === 0)) {
    res.status(400).json({ error: '식재료를 1개 이상 입력해주세요.' });
    return;
  }

  const normalizedIngredients = Array.isArray(ingredients)
    ? ingredients
    : String(ingredients).split(',').map((s) => s.trim()).filter(Boolean);

  try {
    const publicRecipes = await searchMfdsRecipes({
      ingredients: normalizedIngredients,
      preference,
      cookingTool,
      excludeDishes,
      limit: 2,
    });

    if (publicRecipes && publicRecipes.length > 0) {
      res.status(200).json({
        found: true,
        source: 'mfds_public',
        count: publicRecipes.length,
        recipes: publicRecipes,
      });
    } else {
      res.status(200).json({
        found: false,
        source: 'none',
        count: 0,
        recipes: [],
      });
    }
  } catch (err: unknown) {
    console.error('MFDS public recipe search failed:', err);
    // Graceful fallback response so the client can continue to Gemini seamlessly
    res.status(200).json({
      found: false,
      source: 'none',
      count: 0,
      recipes: [],
      error: (err as Error)?.message,
    });
  }
}
