import React, { useState } from 'react';
import { RankedRecipe, ParsedRecipe, CookingDifficultyLevel } from '../types';
import {
  Trophy,
  X,
  Heart,
  Clock,
  ChefHat,
  Eye,
  Flame,
  Sparkles,
  TrendingUp,
  Filter,
} from 'lucide-react';

interface RecipeRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankings: RankedRecipe[];
  likedRecipeIds: string[];
  onToggleLike: (recipe: ParsedRecipe) => void;
  onSelectRecipe: (recipe: RankedRecipe) => void;
}

export const RecipeRankingModal: React.FC<RecipeRankingModalProps> = ({
  isOpen,
  onClose,
  rankings,
  likedRecipeIds,
  onToggleLike,
  onSelectRecipe,
}) => {
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | CookingDifficultyLevel>('all');

  if (!isOpen) return null;

  const filteredRankings = rankings.filter((recipe) => {
    if (filterDifficulty === 'all') return true;
    return recipe.difficulty?.level === filterDifficulty;
  });

  return (
    <div
      id="recipe-ranking-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="recipe-ranking-modal-container"
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/10 border-b border-stone-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  유저들이 고른 레시피 랭킹
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  실시간 집계
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                유저들이 직접 좋아요를 누른 인기 만점 15분 일상 레시피 순위입니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-ranking-modal-btn"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 bg-stone-50/90 border-b border-stone-200/70 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span>난이도 필터:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: '전체' },
              { id: '초간단', label: '⭐ 초간단' },
              { id: '쉬움', label: '⭐⭐ 쉬움' },
              { id: '보통', label: '⭐⭐⭐ 보통' },
            ].map((tab) => {
              const isActive = filterDifficulty === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterDifficulty(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 divide-y divide-stone-100">
          {filteredRankings.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-sm space-y-2">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="font-semibold">해당 조건의 랭킹 레시피가 없습니다.</p>
            </div>
          ) : (
            filteredRankings.map((recipe, index) => {
              const rankNum = recipe.rank || index + 1;
              const isLiked = likedRecipeIds.includes(recipe.id) || !!recipe.isLiked;

              // Rank styling
              let rankBadgeBg = 'bg-stone-100 text-stone-600 border-stone-200';
              let rankIcon = `#${rankNum}`;
              if (rankNum === 1) {
                rankBadgeBg = 'bg-amber-400 text-amber-950 font-black shadow-xs border-amber-300 ring-2 ring-amber-300/60';
                rankIcon = '🥇 1위';
              } else if (rankNum === 2) {
                rankBadgeBg = 'bg-slate-200 text-slate-900 font-bold border-slate-300';
                rankIcon = '🥈 2위';
              } else if (rankNum === 3) {
                rankBadgeBg = 'bg-orange-200 text-orange-950 font-bold border-orange-300';
                rankIcon = '🥉 3위';
              }

              return (
                <div
                  key={recipe.id}
                  id={`ranking-item-${recipe.id}`}
                  className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Rank Number Tag */}
                    <div
                      className={`shrink-0 px-2.5 py-1 rounded-xl text-xs flex items-center justify-center font-black border ${rankBadgeBg}`}
                    >
                      {rankIcon}
                    </div>

                    {/* Recipe Information */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-amber-600 transition-colors">
                          {recipe.dishName}
                        </h3>

                        {/* Difficulty Badge */}
                        {recipe.difficulty && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              recipe.difficulty.level === '초간단'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : recipe.difficulty.level === '쉬움'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-sky-50 text-sky-800 border-sky-200'
                            }`}
                            title={recipe.difficulty.description}
                          >
                            <span className="text-amber-500 font-black tracking-tighter">
                              {'★'.repeat(recipe.difficulty.stars || 1)}
                            </span>
                            <span>{recipe.difficulty.level}</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-xs text-stone-500 font-medium">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {recipe.cookingTime || '15분'}
                        </span>
                      </div>

                      {/* Ingredients used */}
                      {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs text-stone-500">
                          <span className="font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded">
                            재료:
                          </span>
                          <span>{recipe.usedIngredients.slice(0, 4).join(', ')}</span>
                          {recipe.usedIngredients.length > 4 && <span>외 {recipe.usedIngredients.length - 4}개</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Likes & View Recipe */}
                  <div className="flex items-center gap-2 sm:self-center justify-end pl-11 sm:pl-0">
                    {/* Like button */}
                    <button
                      type="button"
                      id={`ranking-like-btn-${recipe.id}`}
                      onClick={() => onToggleLike(recipe)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                        isLiked
                          ? 'bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200'
                          : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                      }`}
                      title={isLiked ? '좋아요 취소' : '좋아요 누르기'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isLiked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'
                        }`}
                      />
                      <span>{recipe.likesCount ?? 0}</span>
                    </button>

                    {/* View full recipe */}
                    <button
                      type="button"
                      id={`ranking-view-recipe-${recipe.id}`}
                      onClick={() => {
                        onSelectRecipe(recipe);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>레시피 보기</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-500 flex items-center justify-between">
          <span>❤️ 여러분이 생성한 레시피도 좋아요를 누르면 랭킹에 등록됩니다!</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-stone-200 text-stone-600 rounded-lg text-xs font-semibold hover:bg-stone-100"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
