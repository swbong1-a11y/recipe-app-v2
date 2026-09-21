import React, { useState } from 'react';
import { ParsedRecipe } from '../types';
import { parseServingsFromBlock } from '../utils/recipeParser';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Timer as TimerIcon,
  ChefHat,
  Flame,
  Droplets,
  Users,
  Scale,
  Utensils,
  Columns,
  Lightbulb,
  Heart,
  Award,
  Landmark,
  ShieldCheck,
  Activity,
} from 'lucide-react';

interface RecipeCardProps {
  recipe: ParsedRecipe;
  isSaved?: boolean;
  isLiked?: boolean;
  likesCount?: number;
  onToggleSave?: (recipe: ParsedRecipe) => void;
  onToggleLike?: (recipe: ParsedRecipe) => void;
  onOpenTimer?: () => void;
  onOpenRanking?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isSaved = false,
  isLiked = false,
  likesCount,
  onToggleSave,
  onToggleLike,
  onOpenTimer,
  onOpenRanking,
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [selectedServing, setSelectedServing] = useState<'one' | 'two' | 'four'>('one');
  const [showAllServings, setShowAllServings] = useState<boolean>(false);

  const servings =
    recipe.servings ||
    parseServingsFromBlock(
      recipe.rawText || '',
      recipe.dishName,
      recipe.usedIngredients && recipe.usedIngredients.length > 0
        ? recipe.usedIngredients
        : recipe.ingredients || []
    );

  const currentLikes = likesCount ?? recipe.likesCount ?? 0;

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recipe.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      id={`recipe-card-${recipe.id}`}
      className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
    >
      {/* Header Banner */}
      <div className={`border-b p-5 md:p-6 transition-colors ${
        recipe.sourceType === 'mfds_public'
          ? 'bg-gradient-to-r from-blue-600/10 via-sky-500/5 to-indigo-600/10 border-blue-100'
          : 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border-amber-100'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {recipe.sourceType === 'mfds_public' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-2xs">
                <Landmark className="w-3.5 h-3.5" />
                <span>식약처 공공 검증 (1순위)</span>
              </span>
            ) : recipe.styleTag ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-2xs">
                <ChefHat className="w-3.5 h-3.5" />
                <span>{recipe.styleTag}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI 15분 냉파 레시피</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              {recipe.cookingTime || '약 10~15분'}
            </span>

            {/* Cooking Difficulty Badge */}
            {recipe.difficulty && (
              <span
                id={`difficulty-badge-${recipe.id}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                  recipe.difficulty.level === '초간단'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : recipe.difficulty.level === '쉬움'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}
                title={recipe.difficulty.description}
              >
                <span className="tracking-tighter text-amber-500 font-black">
                  {'★'.repeat(recipe.difficulty.stars || 1)}
                  <span className="text-stone-300">
                    {'☆'.repeat(Math.max(0, 3 - (recipe.difficulty.stars || 1)))}
                  </span>
                </span>
                <span>난이도: {recipe.difficulty.level}</span>
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            {/* Like Button */}
            {onToggleLike && (
              <button
                id={`recipe-like-btn-${recipe.id}`}
                onClick={() => onToggleLike(recipe)}
                type="button"
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border shadow-xs transition-all active:scale-95 ${
                  isLiked
                    ? 'bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                }`}
                title={isLiked ? '좋아요 취소' : '이 레시피 좋아요 누르기'}
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-transform ${
                    isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-stone-400'
                  }`}
                />
                <span className="font-bold">{currentLikes}</span>
              </button>
            )}

            {onOpenTimer && (
              <button
                id="recipe-open-timer-btn"
                onClick={onOpenTimer}
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-xs transition-colors"
                title="15분 타이머 열기"
              >
                <TimerIcon className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">타이머</span>
              </button>
            )}

            <button
              id="recipe-copy-btn"
              onClick={handleCopy}
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-xs transition-colors"
              title="레시피 복사하기"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">복사됨!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span className="hidden sm:inline">복사</span>
                </>
              )}
            </button>

            {onToggleSave && (
              <button
                id="recipe-save-btn"
                onClick={() => onToggleSave(recipe)}
                type="button"
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border shadow-xs transition-colors ${
                  isSaved
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                }`}
                title={isSaved ? '저장됨' : '레시피 보관함에 저장'}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">저장됨</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-stone-500" />
                    <span className="hidden sm:inline">보관</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dish Title */}
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 mb-2.5">
          {recipe.dishName}
        </h2>

        {/* Used Ingredients tag list */}
        {(recipe.usedIngredients && recipe.usedIngredients.length > 0) ? (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
            <span className={`font-bold px-2 py-0.5 rounded ${
              recipe.sourceType === 'mfds_public'
                ? 'bg-blue-100 text-blue-900'
                : 'bg-amber-100/80 text-amber-900'
            }`}>
              🍳 이 요리에 활용한 재료:
            </span>
            {recipe.usedIngredients.map((ing, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white text-stone-800 border border-stone-200/80 font-medium shadow-2xs"
              >
                {ing}
              </span>
            ))}
          </div>
        ) : recipe.ingredients && recipe.ingredients.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
            <span className="font-semibold text-stone-500">선택 재료:</span>
            {recipe.ingredients.map((ing, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200/60 font-medium"
              >
                {ing}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="p-5 md:p-6 space-y-6">
        {/* 🏛️ 식품의약품안전처 공공데이터 검증 정보 & 영양 성분 카드 (공공 레시피인 경우) */}
        {recipe.publicMeta && (
          <div
            id={`mfds-public-meta-card-${recipe.id}`}
            className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-indigo-50/20 to-white p-4 md:p-5 space-y-4 shadow-2xs"
          >
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base font-bold text-stone-900 tracking-tight">
                      식품의약품안전처 공공 조리식품 검증 레시피
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      1순위 공식 데이터
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    공공데이터포털(식품안전나라) 표준 레시피 DB 연동
                    {recipe.publicMeta.dishCategory && ` · 분류: ${recipe.publicMeta.dishCategory}`}
                    {recipe.publicMeta.cookingMethod && ` · 조리법: ${recipe.publicMeta.cookingMethod}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Official Photo if present */}
            {recipe.publicMeta.mainImage && (
              <div className="relative rounded-xl overflow-hidden border border-blue-200/60 bg-stone-900 aspect-[16/9] max-h-64 sm:max-h-80 shadow-2xs">
                <img
                  src={recipe.publicMeta.mainImage}
                  alt={recipe.dishName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-sm text-[11px] font-semibold text-white/95 flex items-center gap-1.5 shadow-sm">
                  <Landmark className="w-3.5 h-3.5 text-sky-400" />
                  <span>식약처 공식 완성 사진</span>
                </div>
              </div>
            )}

            {/* Nutrition facts grid */}
            {recipe.publicMeta.nutrition && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>식약처 공인 1회 제공량 영양 성분</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200/70 text-center shadow-2xs">
                    <span className="text-[10px] font-semibold text-stone-500 block">열량 (칼로리)</span>
                    <span className="text-xs sm:text-sm font-bold text-blue-700">
                      {recipe.publicMeta.nutrition.calorie || '-'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200/70 text-center shadow-2xs">
                    <span className="text-[10px] font-semibold text-stone-500 block">탄수화물</span>
                    <span className="text-xs sm:text-sm font-bold text-stone-800">
                      {recipe.publicMeta.nutrition.carbohydrate || '-'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200/70 text-center shadow-2xs">
                    <span className="text-[10px] font-semibold text-stone-500 block">단백질</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-700">
                      {recipe.publicMeta.nutrition.protein || '-'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200/70 text-center shadow-2xs">
                    <span className="text-[10px] font-semibold text-stone-500 block">지방</span>
                    <span className="text-xs sm:text-sm font-bold text-stone-800">
                      {recipe.publicMeta.nutrition.fat || '-'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200/70 text-center shadow-2xs col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-semibold text-stone-500 block">나트륨</span>
                    <span className="text-xs sm:text-sm font-bold text-amber-700">
                      {recipe.publicMeta.nutrition.sodium || '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Low Sodium Tip if provided */}
            {recipe.publicMeta.lowSodiumTip && (
              <div className="p-3.5 rounded-xl bg-white border border-blue-200/80 flex items-start gap-2.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-800 leading-relaxed">
                  <span className="font-bold text-blue-900 block mb-0.5">💡 식약처 저염 조리 노하우</span>
                  <span className="whitespace-pre-line">{recipe.publicMeta.lowSodiumTip}</span>
                </div>
              </div>
            )}
          </div>
        )}
        {/* 👥 1인분, 2인분, 3인분 인분별 재료 & 물의 용량 가이드 */}
        <div
          id={`serving-capacity-guide-${recipe.id}`}
          className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/60 via-white to-amber-50/30 p-4 md:p-5 space-y-3.5 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500 text-white shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base font-bold text-stone-900 tracking-tight">
                    인분별 재료 & 물의 용량 계량 가이드
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                    💧 물 용량 필수
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  1인 혼밥부터 2인, 4인 가족까지 양 조절 실패 없는 물의 양과 재료 비율입니다.
                </p>
              </div>
            </div>

            {/* Toggle view mode */}
            <button
              type="button"
              onClick={() => setShowAllServings(!showAllServings)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 flex items-center gap-1.5 transition-colors shadow-2xs"
              title={showAllServings ? '1개 인분 집중 보기' : '1·2·4인분 한눈에 비교'}
            >
              <Columns className="w-3.5 h-3.5 text-stone-500" />
              <span>{showAllServings ? '선택 인분만 보기' : '1·2·4인분 한눈에 비교'}</span>
            </button>
          </div>

          {/* Servings Tabs: 1인분 / 2인분 / 4인분 (when not in all comparison view) */}
          {!showAllServings && (
            <div className="flex items-center p-1 bg-stone-100/90 rounded-xl gap-1 border border-stone-200/60">
              {(['one', 'two', 'four'] as const).map((key) => {
                const info = servings[key];
                const isSelected = selectedServing === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedServing(key)}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
                    }`}
                  >
                    <span>{info.serving}</span>
                    <span
                      className={`text-[10px] font-medium hidden sm:inline ${
                        isSelected ? 'text-sky-100' : 'text-stone-400'
                      }`}
                    >
                      {key === 'one' ? '(혼밥 기본)' : key === 'two' ? '(2인 넉넉)' : '(4인 푸짐)'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Serving Content */}
          {!showAllServings ? (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Water Volume Box - Prominent */}
              <div className="p-3.5 rounded-xl bg-sky-100/70 border border-sky-300/80 flex items-start gap-3 shadow-2xs">
                <div className="p-2 rounded-lg bg-sky-500 text-white shrink-0 mt-0.5 shadow-2xs">
                  <Droplets className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold text-sky-900 bg-sky-200/80 px-2 py-0.5 rounded">
                      💧 {servings[selectedServing].serving} 물/육수 권장 용량
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-sky-950">
                    {servings[selectedServing].water}
                  </div>
                  <p className="text-[11px] text-sky-800/90 mt-0.5">
                    💡 눈대중 계량 팁: 일반 종이컵 1컵 = 약 180ml, 밥숟가락 1큰술 = 약 10~15ml
                  </p>
                </div>
              </div>

              {/* Ingredients & Seasonings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ingredients Portions */}
                <div className="p-3.5 rounded-xl bg-white border border-stone-200/90 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>{servings[selectedServing].serving} 재료 분량</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    {servings[selectedServing].ingredients.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 break-keep">
                        <span className="text-amber-500 font-bold shrink-0">•</span>
                        <span className="font-medium text-stone-800 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Seasonings Guide */}
                <div className="p-3.5 rounded-xl bg-white border border-stone-200/90 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Scale className="w-3.5 h-3.5 text-orange-600" />
                    <span>{servings[selectedServing].serving} 양념 분량 (밥숟가락 기준)</span>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed font-medium break-keep">
                    {servings[selectedServing].seasonings || '기본 양념(간장/소금/설탕 등) 밥숟가락 1스푼 내외'}
                  </p>
                  <p className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                    밥숟가락 1큰술 = 약 10~15ml
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* 1, 2, 4인분 한눈에 비교 Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-200">
              {(['one', 'two', 'four'] as const).map((key) => {
                const info = servings[key];
                const isSelected = selectedServing === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedServing(key)}
                    className={`cursor-pointer rounded-xl p-3.5 border transition-all space-y-2.5 ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-300 shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/70">
                      <span className="text-sm font-bold text-stone-900 flex items-center gap-1">
                        {info.serving}
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        )}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-500">
                        {key === 'one' ? '혼밥 기준' : key === 'two' ? '2인 기준' : '4인 기준 (푸짐)'}
                      </span>
                    </div>

                    {/* Water */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-sky-600" />
                        물의 용량
                      </span>
                      <p className="text-xs font-extrabold text-sky-950 bg-sky-100/70 px-2 py-1 rounded">
                        {info.water}
                      </p>
                    </div>

                    {/* Ingredients */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-amber-600" />
                        재료 분량
                      </span>
                      <ul className="text-xs text-stone-600 space-y-1">
                        {info.ingredients.map((ing, i) => (
                          <li key={i} className="text-xs text-stone-700 leading-snug break-keep flex items-start gap-1">
                            <span className="text-amber-500 font-bold shrink-0">•</span>
                            <span>{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Seasonings */}
                    {info.seasonings && (
                      <div className="space-y-0.5 pt-1.5 border-t border-stone-100">
                        <span className="text-[10px] font-semibold text-stone-500">양념 계량</span>
                        <p className="text-[11px] text-stone-700 leading-snug break-keep">
                          {info.seasonings}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3-Step Recipe Section */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                <Flame className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-stone-900 tracking-tight">
                  🍳 상세 {recipe.steps.length > 0 ? `${recipe.steps.length}단계 ` : ''}조리 과정
                </h3>
                <p className="text-xs text-stone-500">
                  불 조절, 볶는 시간, 타이밍까지 실패 없이 따라 할 수 있는 상세 가이드입니다.
                </p>
              </div>
            </div>
            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
              (터치하여 조리 완료 체크)
            </span>
          </div>

          <div className="space-y-3">
            {recipe.steps.length > 0 ? (
              recipe.steps.map((step, idx) => {
                const isChecked = completedSteps.includes(idx);
                
                // Helper to separate step header, body, and tips if formatted
                let stepHeader = '';
                let stepBody = step;
                let stepTip = '';

                // Check for colon header e.g. "1단계: 재료 손질 - ..." or "[재료 손질] ..."
                const colonIdx = step.indexOf(':');
                if (colonIdx > 0 && colonIdx < 30) {
                  stepHeader = step.substring(0, colonIdx).replace(/^단계\s*/, '').trim();
                  stepBody = step.substring(colonIdx + 1).trim();
                }

                // Check for tips e.g. "⚠️" or "팁:" or "꿀팁:"
                const tipMatch = stepBody.match(/(?:⚠️|💡|꿀팁|TIP|주의)[\s:]*([^\n\r]+)/i);
                if (tipMatch && tipMatch[0]) {
                  stepTip = tipMatch[0].trim();
                  stepBody = stepBody.replace(tipMatch[0], '').trim();
                }

                const defaultStageNames = [
                  '1단계: 재료 손질 & 예열',
                  '2단계: 핵심 조리 & 간 맞추기',
                  '3단계: 마무리 졸이기 & 완성',
                ];

                return (
                  <div
                    key={idx}
                    id={`recipe-step-${idx + 1}`}
                    onClick={() => toggleStep(idx)}
                    className={`cursor-pointer group flex items-start gap-3.5 p-4 rounded-xl border transition-all ${
                      isChecked
                        ? 'bg-stone-50/70 border-stone-200 text-stone-400'
                        : 'bg-white hover:bg-stone-50/80 border-stone-200/90 text-stone-800 shadow-2xs'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-1 text-stone-400 group-hover:text-amber-600 transition-colors focus:outline-none shrink-0"
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                            isChecked
                              ? 'bg-stone-200 text-stone-500'
                              : 'bg-amber-100 text-amber-900 font-semibold'
                          }`}
                        >
                          {stepHeader || defaultStageNames[idx] || `${idx + 1}단계`}
                        </span>
                        {idx === 0 && (
                          <span className="text-[11px] text-stone-500 font-medium">
                            🔪 손질 & 불 예열
                          </span>
                        )}
                        {idx === 1 && (
                          <span className="text-[11px] text-orange-600 font-medium">
                            🔥 핵심 볶기 / 끓이기
                          </span>
                        )}
                        {idx === 2 && (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            ✨ 완성 & 풍미 더하기
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-sm md:text-base leading-relaxed whitespace-pre-line ${
                          isChecked ? 'line-through text-stone-400' : 'text-stone-800 font-normal'
                        }`}
                      >
                        {stepBody}
                      </p>

                      {stepTip && !isChecked && (
                        <div className="mt-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 font-medium flex items-start gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{stepTip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-stone-50 rounded-xl text-stone-600 text-sm whitespace-pre-line leading-relaxed">
                {recipe.rawText}
              </div>
            )}
          </div>
        </div>

        {/* Cheat Key Highlight Card */}
        {recipe.cheatKey && (
          <div
            id="taste-cheat-key-card"
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 border-2 border-amber-300/80 p-5 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-amber-800 uppercase bg-amber-200/70 px-2 py-0.5 rounded">
                    맛 상승 치트키
                  </span>
                </div>
                <h4 className="text-lg font-bold text-stone-900">
                  {recipe.cheatKey.name}
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed pt-0.5">
                  {recipe.cheatKey.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Community Like & Ranking Recommendation Box */}
        <div
          id={`recipe-community-box-${recipe.id}`}
          className="rounded-2xl p-4 md:p-5 bg-gradient-to-r from-rose-50/70 via-amber-50/40 to-white border border-rose-200/70 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-rose-100/80 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-rose-500'}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <span>{isLiked ? '유저 랭킹에 추천된 레시피입니다!' : '이 레시피가 마음에 드셨나요?'}</span>
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                좋아요를 누르면 유저들이 함께 볼 수 있는 <span className="font-semibold text-stone-700">인기 레시피 랭킹</span>에 즉시 반영됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            {onToggleLike && (
              <button
                type="button"
                id={`recipe-bottom-like-btn-${recipe.id}`}
                onClick={() => onToggleLike(recipe)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                  isLiked
                    ? 'bg-rose-500 text-white hover:bg-rose-600 ring-2 ring-rose-300'
                    : 'bg-white hover:bg-stone-50 text-rose-600 border border-rose-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`} />
                <span>{isLiked ? '좋아요 완료' : '좋아요 누르기'}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${isLiked ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'}`}>
                  {currentLikes}
                </span>
              </button>
            )}
            {onOpenRanking && (
              <button
                type="button"
                id={`recipe-view-ranking-btn-${recipe.id}`}
                onClick={onOpenRanking}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>랭킹 보기</span>
              </button>
            )}
          </div>
        </div>

        {/* Footnote */}
        <div className="pt-2 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <span>기본 양념(소금, 간장, 식용유 등)은 구비되어 있다고 가정합니다.</span>
        </div>
      </div>
    </div>
  );
};
