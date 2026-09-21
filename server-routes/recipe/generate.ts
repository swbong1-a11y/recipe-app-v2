import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateAiRecipeText } from '../gemini.js';

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

  const { ingredients } = body || {};

  if (!ingredients || (typeof ingredients === 'string' && !ingredients.trim()) || (Array.isArray(ingredients) && ingredients.length === 0)) {
    res.status(400).json({ error: '식재료를 1개 이상 입력해주세요.' });
    return;
  }

  try {
    const aiResult = await generateAiRecipeText(body);
    res.status(200).json({
      recipeText: aiResult.text,
      aiModel: aiResult.model,
    });
  } catch (err: unknown) {
    const errText = (err as Error)?.message || '';
    const friendlyMsg = errText.includes('429') || errText.includes('RESOURCE_EXHAUSTED')
      ? 'API 요청 한도(Quota)가 일시적으로 초과되었습니다. 10~20초 뒤 다시 시도해주세요.'
      : errText || '레시피 생성 중 오류가 발생했습니다.';
    res.status(500).json({ error: friendlyMsg });
  }
}
