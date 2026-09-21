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

export interface PublicRecipeNutrition {
  calorie?: string; // 열량 (kcal)
  carbohydrate?: string; // 탄수화물 (g)
  protein?: string; // 단백질 (g)
  fat?: string; // 지방 (g)
  sodium?: string; // 나트륨 (mg)
}

export interface PublicRecipeMeta {
  rcpSeq?: string;
  cookingMethod?: string; // RCP_WAY2 (끓이기, 볶기, 찌기 등)
  dishCategory?: string; // RCP_PAT2 (국&찌개, 반찬, 일품 등)
  lowSodiumTip?: string; // RCP_NA_TIP (식약처 저염 조리 비법)
  mainImage?: string; // ATT_FILE_NO_MK (공식 조리 완성 이미지)
  nutrition?: PublicRecipeNutrition;
}

export interface ParsedRecipe {
  id: string;
  dishName: string;
  cookingTime: string;
  difficulty: CookingDifficulty;
  likesCount: number;
  isLiked?: boolean;
  styleTag?: string;
  sourceType?: 'mfds_public' | 'gemini_ai'; // 🏛️ 식약처 공공데이터 레시피 vs 🤖 Gemini AI 냉파 레시피
  publicMeta?: PublicRecipeMeta;
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

