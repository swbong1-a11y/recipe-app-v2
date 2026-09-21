import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Timer, Bookmark, Sparkles, RotateCcw, AlertCircle, ArrowLeft, Layers, Check, Trophy, Landmark, BookOpen } from 'lucide-react';
import { IngredientSelector } from './components/IngredientSelector';
import { RecipeCard } from './components/RecipeCard';
import { KitchenTimer } from './components/KitchenTimer';
import { SavedRecipesModal } from './components/SavedRecipesModal';
import { RecipeRankingModal } from './components/RecipeRankingModal';
import { ParsedRecipe, RankedRecipe } from './types';
import { parseMultipleRecipesMarkdown, parseRecipeMarkdown } from './utils/recipeParser';
import { INITIAL_RANKED_RECIPES } from './data/rankingRecipes';

const STORAGE_KEY_SAVED = 'fridge_chef_saved_recipes';
const STORAGE_KEY_LAST_INGREDIENTS = 'fridge_chef_last_ingredients';
const STORAGE_KEY_LAST_SEASONINGS = 'fridge_chef_last_seasonings';
const STORAGE_KEY_LIKED_RECIPES = 'fridge_chef_liked_recipe_ids';

export default function App() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedSeasonings, setSelectedSeasonings] = useState<string[]>([]);

  const [preference, setPreference] = useState('');
  const [cookingTool, setCookingTool] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchStage, setSearchStage] = useState<'idle' | 'searching_public' | 'generating_ai'>('idle');
  const [currentRecipes, setCurrentRecipes] = useState<ParsedRecipe[]>([]);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');
  const [previousDishNames, setPreviousDishNames] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saved recipes
  const [savedRecipes, setSavedRecipes] = useState<ParsedRecipe[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  // Liked recipes
  const [likedRecipeIds, setLikedRecipeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LIKED_RECIPES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Community Rankings
  const [rankings, setRankings] = useState<RankedRecipe[]>(INITIAL_RANKED_RECIPES);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);

  // Timer widget visibility
  const [showTimer, setShowTimer] = useState(false);

  // Recipe scroll target ref
  const recipeSectionRef = useRef<HTMLDivElement>(null);

  // Fetch rankings on mount
  const fetchRankings = async () => {
    try {
      const res = await fetch('/api/recipes/ranking');
      if (res.ok) {
        const data = await res.json();
        if (data.rankings && Array.isArray(data.rankings) && data.rankings.length > 0) {
          setRankings(data.rankings);
        }
      }
    } catch (e) {
      console.warn('Rankings fetch failed, using seed data:', e);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  // Persist liked recipes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LIKED_RECIPES, JSON.stringify(likedRecipeIds));
    } catch {
      // ignore
    }
  }, [likedRecipeIds]);

  // Clean up legacy ingredient/seasoning defaults so initial state remains completely unselected
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_LAST_INGREDIENTS);
      localStorage.removeItem(STORAGE_KEY_LAST_SEASONINGS);
    } catch {
      // ignore
    }
  }, []);

  // Persist saved recipes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedRecipes));
    } catch {
      // ignore
    }
  }, [savedRecipes]);

  const handleGenerateRecipe = async (isReroll: boolean = false) => {
    if (selectedIngredients.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSearchStage('searching_public');

    // Accumulate dishes to avoid repetition
    const excludeList = isReroll
      ? Array.from(new Set([...previousDishNames, ...currentRecipes.map((r) => r.dishName)]))
      : [];

    let publicFoundRecipes: ParsedRecipe[] = [];

    // ⭐️ 1단계: '식약처 레시피' & '한식진흥원 레시피' 2대 공공 API 동시 병렬 검색 (선택 재료 최소 70% 이상 유사도) ⭐️
    try {
      const publicRes = await fetch('/api/recipe/public-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: selectedIngredients,
          preference,
          cookingTool,
          excludeDishes: excludeList,
          minMatchRate: 70,
        }),
      });

      if (publicRes.ok) {
        const publicData = await publicRes.json();
        if (publicData.found && Array.isArray(publicData.recipes) && publicData.recipes.length > 0) {
          publicFoundRecipes = publicData.recipes;
        }
      }
    } catch (publicErr) {
      console.warn('공공데이터 레시피 동시 조회 실패(AI 대체 진행):', publicErr);
    }

    // ⭐️ [경우 1]: 공공 데이터에서 70% 이상 일치 레시피가 2개 이상 발견된 경우 -> 모두 1순위로 즉시 화면에 띄움! ⭐️
    if (publicFoundRecipes.length >= 2) {
      setCurrentRecipes(publicFoundRecipes);
      setActiveRecipeIndex(0);
      setPreviousDishNames((prev) => [
        ...prev,
        ...publicFoundRecipes.map((r) => r.dishName),
      ]);
      setIsLoading(false);
      setSearchStage('idle');

      setTimeout(() => {
        recipeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    // ⭐️ [경우 2]: 공공 데이터에서 70% 이상 일치 레시피가 1개만 발견된 경우 (부족한 경우) -> 1순위 공공 1개 + Gemini AI 15분 냉파 요리 1개 보충 ⭐️
    if (publicFoundRecipes.length === 1) {
      setCurrentRecipes(publicFoundRecipes);
      setActiveRecipeIndex(0);
      setPreviousDishNames((prev) => [
        ...prev,
        ...publicFoundRecipes.map((r) => r.dishName),
      ]);

      setSearchStage('generating_ai');
      try {
        const combinedExclude = [...excludeList, publicFoundRecipes[0].dishName];
        const aiResponse = await fetch('/api/recipe/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ingredients: selectedIngredients,
            seasonings: selectedSeasonings,
            preference,
            cookingTool,
            excludeDishes: combinedExclude,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (aiData.recipeText) {
            const aiParsedList = parseMultipleRecipesMarkdown(aiData.recipeText, selectedIngredients);
            if (aiParsedList.length > 0) {
              const taggedAiList = aiParsedList.slice(0, 1).map((r) => ({
                ...r,
                sourceType: 'gemini_ai' as const,
                styleTag: '🤖 Gemini AI 15분 냉파 요리 (2순위 보충)',
              }));
              setCurrentRecipes([...publicFoundRecipes, ...taggedAiList]);
              setPreviousDishNames((prev) => [
                ...prev,
                ...taggedAiList.map((r) => r.dishName),
              ]);
            }
          }
        }
      } catch (aiErr) {
        console.warn('AI 보조 레시피 보충 실패:', aiErr);
      } finally {
        setIsLoading(false);
        setSearchStage('idle');
      }

      setTimeout(() => {
        recipeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    // ⭐️ [경우 3]: 두 공공 데이터 모두 일치하는 결과가 없거나 실패한 경우 -> Gemini AI 15분 냉파 레시피 Full Fallback ⭐️
    setSearchStage('generating_ai');
    try {
      const response = await fetch('/api/recipe/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: selectedIngredients,
          seasonings: selectedSeasonings,
          preference,
          cookingTool,
          excludeDishes: excludeList,
        }),
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('응답 스트림을 열 수 없습니다.');
      }

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              let streamPayload: {
                text?: string;
                error?: string;
                done?: boolean;
                type?: string;
              } | null = null;
              try {
                streamPayload = JSON.parse(jsonStr);
              } catch {
                // Ignore incomplete JSON chunks
              }

              if (streamPayload) {
                if (streamPayload.error) {
                  throw new Error(streamPayload.error);
                }
                if (streamPayload.text) {
                  accumulated += streamPayload.text;
                }
                if (streamPayload.done) {
                  const parsedList = parseMultipleRecipesMarkdown(accumulated, selectedIngredients);
                  if (parsedList.length > 0) {
                    const taggedList = parsedList.map((r) => ({
                      ...r,
                      sourceType: 'gemini_ai' as const,
                    }));
                    setCurrentRecipes(taggedList);
                    setActiveRecipeIndex(0);
                    setPreviousDishNames((prev) => [
                      ...prev,
                      ...taggedList.map((r) => r.dishName),
                    ]);
                  }
                }
              }
            }
          }
        }
      }

      if (accumulated) {
        const parsedList = parseMultipleRecipesMarkdown(accumulated, selectedIngredients);
        if (parsedList.length > 0) {
          const taggedList = parsedList.map((r) => ({
            ...r,
            sourceType: 'gemini_ai' as const,
          }));
          setCurrentRecipes(taggedList);
          setActiveRecipeIndex(0);
          setPreviousDishNames((prev) => [
            ...prev,
            ...taggedList.map((r) => r.dishName),
          ]);
        }
      }

      // Smooth scroll to recipe card
      setTimeout(() => {
        recipeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      console.error('Recipe generation error:', err);
      // Fallback static endpoint
      try {
        const fallbackRes = await fetch('/api/recipe/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ingredients: selectedIngredients,
            seasonings: selectedSeasonings,
            preference,
            cookingTool,
            excludeDishes: excludeList,
          }),
        });
        const data = await fallbackRes.json();
        if (data.recipeText) {
          const parsedList = parseMultipleRecipesMarkdown(data.recipeText, selectedIngredients);
          const taggedList = parsedList.map((r) => ({
            ...r,
            sourceType: 'gemini_ai' as const,
          }));
          setCurrentRecipes(taggedList);
          setActiveRecipeIndex(0);
          setPreviousDishNames((prev) => [
            ...prev,
            ...taggedList.map((r) => r.dishName),
          ]);
        }
      } catch (fallbackErr: unknown) {
        setErrorMessage((err as Error)?.message || '레시피를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
      setSearchStage('idle');
    }
  };

  const handleToggleLike = async (recipe: ParsedRecipe) => {
    const isCurrentlyLiked = likedRecipeIds.includes(recipe.id);
    const action = isCurrentlyLiked ? 'unlike' : 'like';

    // Optimistically update liked IDs
    setLikedRecipeIds((prev) =>
      isCurrentlyLiked ? prev.filter((id) => id !== recipe.id) : [...prev, recipe.id]
    );

    // Update current recipes
    setCurrentRecipes((prev) =>
      prev.map((r) => {
        if (r.id === recipe.id || r.dishName === recipe.dishName) {
          const newLikes = Math.max(0, (r.likesCount || 0) + (isCurrentlyLiked ? -1 : 1));
          return { ...r, likesCount: newLikes, isLiked: !isCurrentlyLiked };
        }
        return r;
      })
    );

    // Update saved recipes if present
    setSavedRecipes((prev) =>
      prev.map((r) => {
        if (r.id === recipe.id || r.dishName === recipe.dishName) {
          const newLikes = Math.max(0, (r.likesCount || 0) + (isCurrentlyLiked ? -1 : 1));
          return { ...r, likesCount: newLikes, isLiked: !isCurrentlyLiked };
        }
        return r;
      })
    );

    // Optimistically update rankings list
    setRankings((prev) => {
      let found = false;
      const updated = prev.map((item) => {
        if (item.id === recipe.id || item.dishName === recipe.dishName) {
          found = true;
          const newLikes = Math.max(0, (item.likesCount || 0) + (isCurrentlyLiked ? -1 : 1));
          return { ...item, likesCount: newLikes, isLiked: !isCurrentlyLiked };
        }
        return item;
      });

      if (!found && action === 'like') {
        const newItem: RankedRecipe = {
          ...recipe,
          likesCount: Math.max((recipe.likesCount || 0) + 1, 1),
          isLiked: true,
        };
        updated.push(newItem);
      }

      return updated
        .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
        .map((r, idx) => ({ ...r, rank: idx + 1 }));
    });

    // Sync with backend API
    try {
      const res = await fetch('/api/recipes/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          action,
          recipe,
        }),
      });
      if (res.ok) {
        fetchRankings();
      }
    } catch (e) {
      console.error('Like toggle sync error:', e);
    }
  };

  const handleToggleSave = (recipe: ParsedRecipe) => {
    setSavedRecipes((prev) => {
      const exists = prev.some((r) => r.id === recipe.id || r.dishName === recipe.dishName);
      if (exists) {
        return prev.filter((r) => r.id !== recipe.id && r.dishName !== recipe.dishName);
      }
      return [recipe, ...prev];
    });
  };

  const handleDeleteSaved = (id: string) => {
    setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const isRecipeSaved = (recipe: ParsedRecipe) =>
    savedRecipes.some((r) => r.id === recipe.id || r.dishName === recipe.dishName);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Global Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
                  자투리 미식회
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200/80">
                  15분 일상 미식
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                냉장고 속 자투리 재료로 15분 만에 완성하는 누구나 맛있는 일상 요리
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Community Recipe Ranking Button */}
            <button
              id="header-ranking-btn"
              type="button"
              onClick={() => setIsRankingModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition-all cursor-pointer shadow-2xs"
              title="유저들이 고른 인기 레시피 랭킹"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="hidden xs:inline font-bold">인기 랭킹</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-white">
                TOP
              </span>
            </button>

            <button
              id="header-timer-btn"
              type="button"
              onClick={() => setShowTimer(!showTimer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showTimer
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
              title="15분 키친 타이머"
            >
              <Timer className="w-4 h-4 text-amber-500" />
              <span className="hidden xs:inline">타이머</span>
            </button>

            <button
              id="header-saved-btn"
              type="button"
              onClick={() => setIsSavedModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition-all relative cursor-pointer"
              title="저장된 레시피 보기"
            >
              <Bookmark className="w-4 h-4 text-stone-500" />
              <span className="hidden xs:inline">보관함</span>
              {savedRecipes.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {savedRecipes.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Floating / Embedded Kitchen Timer if active */}
        {showTimer && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <KitchenTimer onClose={() => setShowTimer(false)} />
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="error-banner"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold mb-0.5">레시피 생성 중 문제가 발생했습니다</p>
              <p className="text-xs text-rose-700">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => handleGenerateRecipe(false)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Ingredient & Seasoning Selection Section */}
        <div id="ingredient-selection-section">
          <IngredientSelector
            selectedIngredients={selectedIngredients}
            onChangeIngredients={setSelectedIngredients}
            selectedSeasonings={selectedSeasonings}
            onChangeSeasonings={setSelectedSeasonings}
            preference={preference}
            onChangePreference={setPreference}
            cookingTool={cookingTool}
            onChangeCookingTool={setCookingTool}
            onGenerate={() => handleGenerateRecipe(false)}
            isLoading={isLoading}
          />
        </div>

        {/* Recipe Display Section */}
        <div ref={recipeSectionRef} id="recipe-display-container">
          {isLoading && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 text-center space-y-4 shadow-sm animate-pulse">
              <div className="inline-flex p-3 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white mb-1 shadow-xs">
                {searchStage === 'searching_public' ? (
                  <div className="flex items-center gap-1">
                    <Landmark className="w-6 h-6 animate-bounce" />
                    <BookOpen className="w-6 h-6 animate-bounce delay-100" />
                  </div>
                ) : (
                  <ChefHat className="w-8 h-8 animate-bounce" />
                )}
              </div>
              <h3 className="text-lg font-bold text-stone-800">
                {searchStage === 'searching_public'
                  ? '🏛️ 식약처 & 🇰🇷 한식진흥원 공공 DB 동시 탐색 중... (일치율 70% 이상)'
                  : '🤖 Gemini AI가 15분 초간단 냉파 레시피를 설계하는 중...'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                {searchStage === 'searching_public'
                  ? '선택하신 식재료와 최소 70% 이상 일치하는 식품의약품안전처 및 한식진흥원 아카이브 표준 레시피를 1순위로 동시 검색하고 있습니다.'
                  : '냉장고 자투리 재료를 가장 맛있게 살리는 15분 스피드 조리법과 맛 상승 치트키를 조합 중입니다.'}
              </p>

              {/* Gentle loading indicator */}
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <span className={`w-2 h-2 rounded-full animate-ping ${searchStage === 'searching_public' ? 'bg-emerald-600' : 'bg-amber-500'}`} />
                <span className={`w-2 h-2 rounded-full animate-pulse delay-75 ${searchStage === 'searching_public' ? 'bg-blue-600' : 'bg-amber-500'}`} />
                <span className={`w-2 h-2 rounded-full animate-bounce delay-150 ${searchStage === 'searching_public' ? 'bg-emerald-600' : 'bg-amber-500'}`} />
              </div>
            </div>
          )}

          {!isLoading && currentRecipes.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Hybrid Search Notice Banner */}
              {(() => {
                const hasMfds = currentRecipes.some((r) => r.sourceType === 'mfds_public');
                const hasKfpi = currentRecipes.some((r) => r.sourceType === 'korean_food_archive');

                if (hasMfds && hasKfpi) {
                  return (
                    <div
                      id="hybrid-search-banner"
                      className="flex items-start sm:items-center gap-3 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-50/90 via-emerald-50/60 to-white border border-emerald-200/80 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-1 p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-700 text-white shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                        <Landmark className="w-3.5 h-3.5" />
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 text-stone-700 leading-relaxed">
                        <span className="font-bold text-stone-900 block sm:inline mr-1">
                          🏛️ 식약처 공식 인증 & 🇰🇷 한식진흥원 전통 레시피 1순위 동시 매칭:
                        </span>
                        <span>
                          선택하신 재료와 70% 이상 일치하는 두 공공 기관의 공식 레시피를 모두 1순위로 우선 화면에 배치했습니다.
                        </span>
                      </div>
                    </div>
                  );
                }

                if (hasMfds) {
                  return (
                    <div
                      id="hybrid-search-banner"
                      className="flex items-start sm:items-center gap-3 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white border border-blue-200/80 text-xs shadow-2xs"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 text-stone-700 leading-relaxed">
                        <span className="font-bold text-blue-900 block sm:inline mr-1">
                          🏛️ 식약처 공공 DB 1순위 매칭 (70% 이상 유사도 충족):
                        </span>
                        <span>
                          선택하신 식재료와 최소 70% 이상 일치하는 식품의약품안전처 공식 표준 레시피를 1순위로 우선 배치했습니다.
                        </span>
                      </div>
                    </div>
                  );
                }

                if (hasKfpi) {
                  return (
                    <div
                      id="hybrid-search-banner"
                      className="flex items-start sm:items-center gap-3 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/80 text-xs shadow-2xs"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-700 text-white shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 text-stone-700 leading-relaxed">
                        <span className="font-bold text-emerald-900 block sm:inline mr-1">
                          🇰🇷 한식진흥원 전통 아카이브 1순위 매칭 (70% 이상 유사도 충족):
                        </span>
                        <span>
                          선택하신 식재료와 최소 70% 이상 일치하는 한식진흥원 공식 전통 레시피를 1순위로 우선 배치했습니다.
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    id="hybrid-search-banner"
                    className="flex items-start sm:items-center gap-3 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/30 to-white border border-amber-200/80 text-xs shadow-2xs"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 text-stone-700 leading-relaxed">
                      <span className="font-bold text-amber-900 block sm:inline mr-1">
                        🤖 하이브리드 AI 즉석 냉파 모드 (2대 공공 DB 70% 미충족 Fallback):
                      </span>
                      <span>
                        식약처 및 한식진흥원 공공 데이터 모두 선택 재료와 70% 이상 일치하는 결과가 없어, Gemini AI가 선택 재료를 100% 살리는 맞춤형 15분 냉파 요리를 생성했습니다.
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  재료 / 양념 수정하기
                </button>

                <div className="flex items-center gap-2">
                  {currentRecipes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setViewMode(viewMode === 'tabs' ? 'all' : 'tabs')}
                      className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 bg-white hover:bg-stone-100 px-2.5 py-1.5 rounded-lg border border-stone-200 transition-colors cursor-pointer"
                      title={viewMode === 'tabs' ? '2개 메뉴 한 번에 비교하기' : '탭으로 하나씩 보기'}
                    >
                      <Layers className="w-3.5 h-3.5 text-stone-500" />
                      <span>{viewMode === 'tabs' ? '2개 메뉴 동시비교' : '탭으로 보기'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleGenerateRecipe(true)}
                    className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200/80 px-3 py-1.5 rounded-lg border border-amber-300/80 transition-colors shadow-2xs cursor-pointer"
                    title="기존 추천과 다른 새로운 요리 추천받기"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>새로운 다른 메뉴 추천받기</span>
                  </button>
                </div>
              </div>

              {/* Multi-Recipe Switcher Tabs (when 2 or more recipes exist and viewMode is tabs) */}
              {currentRecipes.length > 1 && viewMode === 'tabs' && (
                <div className="flex items-center gap-2 bg-stone-200/70 p-1.5 rounded-2xl">
                  {currentRecipes.map((rec, idx) => {
                    const isActive = idx === activeRecipeIndex;
                    const isMfds = rec.sourceType === 'mfds_public';
                    const isKfpi = rec.sourceType === 'korean_food_archive';
                    return (
                      <button
                        key={rec.id || idx}
                        type="button"
                        onClick={() => setActiveRecipeIndex(idx)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white text-stone-900 shadow-sm'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full text-white text-[11px] flex items-center justify-center shrink-0 font-bold ${
                            isMfds ? 'bg-blue-600' : isKfpi ? 'bg-emerald-700' : 'bg-amber-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-[130px] sm:max-w-[200px]">
                          {rec.dishName}
                        </span>
                        {isMfds ? (
                          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold shrink-0">
                            <Landmark className="w-3 h-3 text-blue-700" />
                            <span>식약처{typeof rec.matchRate === 'number' ? ` ${rec.matchRate}%` : ''}</span>
                          </span>
                        ) : isKfpi ? (
                          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                            <BookOpen className="w-3 h-3 text-emerald-700" />
                            <span>한식진흥원{typeof rec.matchRate === 'number' ? ` ${rec.matchRate}%` : ''}</span>
                          </span>
                        ) : rec.styleTag ? (
                          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium shrink-0">
                            {rec.styleTag}
                          </span>
                        ) : (
                          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium shrink-0">
                            AI 냉파
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}


              {/* Recipe Cards Display */}
              {viewMode === 'tabs' ? (
                (() => {
                  const activeRecipe = currentRecipes[activeRecipeIndex] || currentRecipes[0];
                  const isLiked = likedRecipeIds.includes(activeRecipe.id) || !!activeRecipe.isLiked;
                  return (
                    <RecipeCard
                      recipe={activeRecipe}
                      isSaved={isRecipeSaved(activeRecipe)}
                      onToggleSave={handleToggleSave}
                      onOpenTimer={() => setShowTimer(true)}
                      isLiked={isLiked}
                      likesCount={activeRecipe.likesCount ?? 0}
                      onToggleLike={handleToggleLike}
                      onOpenRanking={() => setIsRankingModalOpen(true)}
                    />
                  );
                })()
              ) : (
                <div className="space-y-6">
                  {currentRecipes.map((rec, idx) => {
                    const isLiked = likedRecipeIds.includes(rec.id) || !!rec.isLiked;
                    return (
                      <div key={rec.id || idx} className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-stone-800">
                            추천 옵션 {idx + 1}
                          </span>
                        </div>
                        <RecipeCard
                          recipe={rec}
                          isSaved={isRecipeSaved(rec)}
                          onToggleSave={handleToggleSave}
                          onOpenTimer={() => setShowTimer(true)}
                          isLiked={isLiked}
                          likesCount={rec.likesCount ?? 0}
                          onToggleLike={handleToggleLike}
                          onOpenRanking={() => setIsRankingModalOpen(true)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-medium text-stone-600">자투리 미식회 — 냉장고 속 재료로 완성하는 15분 일상 미식</p>
          <p className="text-stone-400">
            복잡한 준비 없이 냉장고 속 자투리 재료로 15분 만에 맛있는 요리를 만듭니다.
          </p>
        </div>
      </footer>

      {/* Saved Recipes Modal */}
      <SavedRecipesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedRecipes={savedRecipes}
        onSelectRecipe={(r) => {
          setCurrentRecipes([r]);
          setActiveRecipeIndex(0);
          setSelectedIngredients(r.ingredients);
        }}
        onDeleteRecipe={handleDeleteSaved}
      />

      {/* Community Recipe Rankings Modal */}
      <RecipeRankingModal
        isOpen={isRankingModalOpen}
        onClose={() => setIsRankingModalOpen(false)}
        rankings={rankings}
        likedRecipeIds={likedRecipeIds}
        onToggleLike={handleToggleLike}
        onSelectRecipe={(r) => {
          setCurrentRecipes([r]);
          setActiveRecipeIndex(0);
          if (r.usedIngredients && r.usedIngredients.length > 0) {
            setSelectedIngredients(r.usedIngredients);
          }
          // Scroll smoothly to recipe view
          setTimeout(() => {
            recipeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
      />
    </div>
  );
}
