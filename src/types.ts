export type CookingDifficultyLevel = '초간단' | '쉬움' | '보통';

export interface CookingDifficulty {
  level: CookingDifficultyLevel;
  stars: number; // 1 to 3
  description?: string;
}

export interface ServingInfo {
  serving: '1인분' | '2인분' | '4인분';
  label: string;
  water: string;
  ingredients: string[];
  seasonings?: string;
}

export interface ServingsBreakdown {
  one: ServingInfo;
  two: ServingInfo;
  four: ServingInfo;
}

export interface ParsedRecipe {
  id: string;
  dishName: string;
  cookingTime: string;
  difficulty: CookingDifficulty;
  likesCount: number;
  isLiked?: boolean;
  styleTag?: string;
  usedIngredients?: string[];
  servings?: ServingsBreakdown;
  steps: string[];
  cheatKey: {
    name: string;
    reason: string;
  };
  rawText: string;
  ingredients: string[];
  createdAt: number;
}

export interface RankedRecipe extends ParsedRecipe {
  rank?: number;
}

export interface PresetCombination {
  title: string;
  tagline: string;
  ingredients: string[];
  emoji?: string;
  preference?: string;
  tool?: string;
}

export interface CheatSeasoning {
  name: string;
  category: string;
  effect: string;
  recommendedWith: string;
  emoji?: string;
}

