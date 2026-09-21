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
  sourceOrg?: 'mfds' | 'korean_food'; // 'mfds': 식품의약품안전처, 'korean_food': 한식진흥원
  archiveCategory?: string; // 예: '북한 전통음식', '연변 조선족 전통음식 70선', '종가 내림음식', '전통 궁중/향토음식'
  cookingMethod?: string; // RCP_WAY2 (끓이기, 볶기, 찌기 등)
  dishCategory?: string; // RCP_PAT2 (국&찌개, 반찬, 일품 등)
  lowSodiumTip?: string; // RCP_NA_TIP (식약처 저염 조리 비법 / 한식진흥원 전통 비법)
  mainImage?: string; // ATT_FILE_NO_MK (공식 조리 완성 이미지)
  nutrition?: PublicRecipeNutrition;
  matchRate?: number; // 선택 재료 일치율 (예: 70%, 80%, 100%)
  matchedIngredients?: string[]; // 일치한 사용자 선택 재료
  missingIngredients?: string[]; // 미포함된 사용자 선택 재료
  totalSelectedCount?: number; // 전체 선택 재료 개수
}

export interface ParsedRecipe {
  id: string;
  dishName: string;
  cookingTime: string;
  difficulty: CookingDifficulty;
  likesCount: number;
  isLiked?: boolean;
  styleTag?: string;
  sourceType?: 'mfds_public' | 'korean_food_archive' | 'gemini_ai'; // 🏛️ 식약처 공식 인증 vs 🇰🇷 한식진흥원 전통 레시피 vs 🤖 Gemini AI 냉파 레시피
  matchRate?: number; // 선택 재료 일치율 (%)
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

