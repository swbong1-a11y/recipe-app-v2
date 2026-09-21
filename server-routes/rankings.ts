import fs from 'fs';
import path from 'path';
import { INITIAL_RANKED_RECIPES } from '../src/data/rankingRecipes.js';
import type { RankedRecipe } from '../src/types.js';

let cachedRankings: RankedRecipe[] = [...INITIAL_RANKED_RECIPES];
let isLoaded = false;

function getStoreFilePath(): string {
  // On Vercel serverless functions, only /tmp is writable
  if (process.env.VERCEL) {
    return '/tmp/rankings_store.json';
  }
  return path.join(process.cwd(), 'rankings_store.json');
}

function loadRankings() {
  if (isLoaded) return;
  const filePath = getStoreFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedRankings = parsed;
      }
    }
  } catch {
    // fallback to initial
  }
  isLoaded = true;
}

function saveRankings() {
  const filePath = getStoreFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(cachedRankings, null, 2), 'utf-8');
  } catch {
    // Ignore file write error in restricted environments
  }
}

export function getRankedRecipes(): RankedRecipe[] {
  loadRankings();
  const sorted = [...cachedRankings].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

export function likeRecipe(
  recipeId: string,
  action: 'like' | 'unlike' = 'like',
  recipe?: Partial<RankedRecipe>
): {
  success: boolean;
  recipeId: string;
  isLiked: boolean;
  likesCount: number;
} {
  loadRankings();

  let target = cachedRankings.find(
    (r) => r.id === recipeId || (recipe && r.dishName === recipe.dishName)
  );

  const isLiked = action === 'like';

  if (target) {
    if (action === 'like') {
      target.likesCount = (target.likesCount || 0) + 1;
    } else {
      target.likesCount = Math.max(0, (target.likesCount || 0) - 1);
    }
  } else if (recipe && action === 'like') {
    const newTarget: RankedRecipe = {
      id: recipeId,
      dishName: recipe.dishName || '추천 요리',
      cookingTime: recipe.cookingTime || '15분',
      styleTag: recipe.styleTag || '✨ 나만의 미식 레시피',
      difficulty: recipe.difficulty || {
        level: '쉬움',
        stars: 2,
        description: '자투리 재료로 만든 간편 요리',
      },
      likesCount: Math.max((recipe.likesCount || 0) + 1, 1),
      isLiked: false,
      usedIngredients: recipe.usedIngredients || [],
      ingredients: recipe.ingredients || [],
      servings: recipe.servings || {
        one: { serving: '1인분', label: '1인분', water: '물 적당량', ingredients: [], seasonings: '' },
        two: { serving: '2인분', label: '2인분', water: '물 적당량', ingredients: [], seasonings: '' },
        four: { serving: '4인분', label: '4인분', water: '물 적당량', ingredients: [], seasonings: '' },
      },
      steps: recipe.steps || [],
      cheatKey: recipe.cheatKey || { name: '참치액', reason: '감칠맛 상승' },
      rawText: recipe.rawText || '',
      createdAt: recipe.createdAt || Date.now(),
      rank: cachedRankings.length + 1,
    };
    cachedRankings.push(newTarget);
    target = newTarget;
  }

  cachedRankings.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  saveRankings();

  const currentLikes = target ? target.likesCount : (action === 'like' ? 1 : 0);

  return {
    success: true,
    recipeId,
    isLiked,
    likesCount: currentLikes,
  };
}
