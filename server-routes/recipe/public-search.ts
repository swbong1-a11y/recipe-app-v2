import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchMfdsRecipes } from '../mfds.js';
import { searchKoreanFoodRecipes } from '../korean-food.js';
import type { ParsedRecipe } from '../../src/types.js';

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

  const { ingredients, preference, cookingTool, excludeDishes, minMatchRate = 50 } = body || {};

  if (!ingredients || (Array.isArray(ingredients) && ingredients.length === 0)) {
    res.status(400).json({ error: '식재료를 1개 이상 입력해주세요.' });
    return;
  }

  const normalizedIngredients = Array.isArray(ingredients)
    ? ingredients
    : String(ingredients).split(',').map((s) => s.trim()).filter(Boolean);

  const parsedMinRate = typeof minMatchRate === 'number' ? minMatchRate : 50;

  try {
    // ⭐️ 1단계: '식약처 레시피'와 '한식진흥원 레시피' 두 공공 API 동시 병렬 검색 ⭐️
    const [mfdsResults, kfpiResults] = await Promise.all([
      searchMfdsRecipes({
        ingredients: normalizedIngredients,
        preference,
        cookingTool,
        excludeDishes,
        minMatchRate: parsedMinRate,
        limit: 2,
      }).catch((e) => {
        console.error('MFDS search error:', e);
        return [] as ParsedRecipe[];
      }),
      searchKoreanFoodRecipes({
        ingredients: normalizedIngredients,
        preference,
        cookingTool,
        excludeDishes,
        minMatchRate: parsedMinRate,
        limit: 2,
      }).catch((e) => {
        console.error('KFPI search error:', e);
        return [] as ParsedRecipe[];
      }),
    ]);

    const combinedCandidates: ParsedRecipe[] = [];

    // 두 출처에서 일치율 50% 이상인 결과들을 취합
    const validMfds = (mfdsResults || []).filter((r) => (r.matchRate || 0) >= parsedMinRate);
    const validKfpi = (kfpiResults || []).filter((r) => (r.matchRate || 0) >= parsedMinRate);

    // 다양성을 고려하여 양쪽에 결과가 있을 경우 각 1개씩 최우선 배치, 한쪽만 있으면 일치율 높은 순으로 최대 2개 선정
    if (validMfds.length > 0 && validKfpi.length > 0) {
      // 둘 다 있는 경우: 가장 일치율 높은 식약처 1개 + 한식진흥원 1개 조합
      combinedCandidates.push(validMfds[0]);
      combinedCandidates.push(validKfpi[0]);
      // 만약 정렬이 필요하다면 일치율 순으로 정렬
      combinedCandidates.sort((a, b) => (b.matchRate || 0) - (a.matchRate || 0));
    } else if (validMfds.length > 0) {
      combinedCandidates.push(...validMfds.slice(0, 2));
    } else if (validKfpi.length > 0) {
      combinedCandidates.push(...validKfpi.slice(0, 2));
    }

    if (combinedCandidates.length > 0) {
      const activeSources = Array.from(new Set(combinedCandidates.map((c) => c.sourceType || 'mfds_public')));
      res.status(200).json({
        found: true,
        source: activeSources.length > 1 ? 'dual_public' : activeSources[0],
        sources: activeSources,
        mfdsCount: validMfds.length,
        kfpiCount: validKfpi.length,
        count: combinedCandidates.length,
        recipes: combinedCandidates,
      });
    } else {
      res.status(200).json({
        found: false,
        source: 'none',
        count: 0,
        mfdsCount: 0,
        kfpiCount: 0,
        recipes: [],
      });
    }
  } catch (err: unknown) {
    console.error('Public recipe dual search failed:', err);
    res.status(200).json({
      found: false,
      source: 'none',
      count: 0,
      recipes: [],
      error: (err as Error)?.message,
    });
  }
}

