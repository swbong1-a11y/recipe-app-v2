import React, { useState } from 'react';
import { Plus, X, Sparkles, RefreshCw, Wand2, Trash2, ChevronDown, ChevronUp, Check, Info } from 'lucide-react';
import { COMMON_INGREDIENTS, PRESET_COMBOS, CHEAT_SEASONINGS } from '../data/ingredients';
import { PresetCombination } from '../types';

interface IngredientSelectorProps {
  selectedIngredients: string[];
  onChangeIngredients: (ingredients: string[]) => void;
  selectedSeasonings: string[];
  onChangeSeasonings: (seasonings: string[]) => void;
  preference: string;
  onChangePreference: (pref: string) => void;
  cookingTool: string;
  onChangeCookingTool: (tool: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const TASTE_OPTIONS = [
  '상관없음',
  '담백하고 고소하게',
  '매콤하고 칼칼하게',
  '단짠단짠 밥도둑',
  '따끈하고 시원한 국물',
];

const TOOL_OPTIONS = [
  '상관없음',
  '후라이팬 하나로',
  '냄비 하나로',
  '전자레인지/초간단',
];

export const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  selectedIngredients,
  onChangeIngredients,
  selectedSeasonings,
  onChangeSeasonings,
  preference,
  onChangePreference,
  cookingTool,
  onChangeCookingTool,
  onGenerate,
  isLoading,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [showSeasoningGuide, setShowSeasoningGuide] = useState(false);

  const addIngredient = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (!selectedIngredients.includes(trimmed)) {
      onChangeIngredients([...selectedIngredients, trimmed]);
    }
  };

  const removeIngredient = (item: string) => {
    onChangeIngredients(selectedIngredients.filter((i) => i !== item));
  };

  const toggleSeasoning = (name: string) => {
    if (selectedSeasonings.includes(name)) {
      onChangeSeasonings(selectedSeasonings.filter((s) => s !== name));
    } else {
      onChangeSeasonings([...selectedSeasonings, name]);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const items = customInput
      .split(/[,+]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const newItems = items.filter((i) => !selectedIngredients.includes(i));
    if (newItems.length > 0) {
      onChangeIngredients([...selectedIngredients, ...newItems]);
    }
    setCustomInput('');
  };

  const applyPreset = (preset: PresetCombination) => {
    onChangeIngredients(preset.ingredients);
    if (preset.preference) onChangePreference(preset.preference);
    if (preset.tool) onChangeCookingTool(preset.tool);
  };

  const clearAll = () => {
    onChangeIngredients([]);
  };

  return (
    <div className="space-y-5">
      {/* Smart Tip Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-950 flex items-start gap-2.5 shadow-2xs">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-amber-900">
            선택한 재료를 모두 쓰지 않아도 괜찮아요! (기본 2가지 이상 메뉴 제안)
          </p>
          <p className="text-amber-800/90 text-[11px] mt-0.5">
            자투리 미식회 셰프가 냉장고 속 재료 중 최적의 꿀조합 1~3가지를 골라 <strong>서로 스타일이 완전히 다른 최소 2가지 15분 레시피</strong>를 제안합니다.
          </p>
        </div>
      </div>

      {/* Presets Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-stone-500 tracking-wider uppercase">
            ⚡ 1초 세팅 꿀조합 프리셋
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_COMBOS.map((combo, idx) => (
            <button
              key={idx}
              id={`preset-btn-${idx}`}
              type="button"
              onClick={() => applyPreset(combo)}
              className="group text-left p-2.5 rounded-xl bg-white hover:bg-amber-50/50 border border-stone-200/80 hover:border-amber-300 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{combo.emoji}</span>
                <span className="text-xs font-bold text-stone-900 group-hover:text-amber-700 truncate">
                  {combo.title}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 line-clamp-1 leading-snug">
                {combo.tagline}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Ingredient Input Box */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-stone-900">
              내 냉장고 속 식재료
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              {selectedIngredients.length}개 선택됨
            </span>
          </div>

          {selectedIngredients.length > 0 && (
            <button
              id="clear-ingredients-btn"
              type="button"
              onClick={clearAll}
              className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              전체 비우기
            </button>
          )}
        </div>

        {/* Selected Ingredients Badges */}
        <div className="min-h-[46px] p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 mb-3 flex flex-wrap items-center gap-1.5">
          {selectedIngredients.length === 0 ? (
            <span className="text-xs text-stone-400 pl-1">
              아래 자주 쓰는 재료를 클릭하거나 직접 입력하세요. 넉넉히 넣어도 셰프가 쏙쏙 골라 씁니다!
            </span>
          ) : (
            selectedIngredients.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-lg text-xs font-semibold bg-stone-900 text-white shadow-2xs animate-in fade-in zoom-in-95 duration-150"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeIngredient(item)}
                  className="hover:bg-stone-700 rounded-md p-0.5 text-stone-300 hover:text-white transition-colors"
                  title={`${item} 삭제`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              id="custom-ingredient-input"
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="직접 입력 (예: 비엔나 3개, 양배추 조금... 쉼표로 다중 입력)"
              className="w-full text-sm bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>
          <button
            id="add-ingredient-btn"
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </form>

        {/* Quick Click Ingredients by Category */}
        <div className="space-y-3 pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">
              냉장고 단골 자투리 재료 (터치하여 담기):
            </span>
          </div>

          <div className="space-y-2.5">
            {COMMON_INGREDIENTS.map((cat, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-stone-500 w-full sm:w-auto sm:mr-1">
                  {cat.category}
                </span>
                {cat.items.map((ing) => {
                  const isSelected = selectedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() =>
                        isSelected ? removeIngredient(ing) : addIngredient(ing)
                      }
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 font-semibold shadow-2xs'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200/80 font-normal'
                      }`}
                    >
                      {isSelected ? `✓ ${ing}` : `+ ${ing}`}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seasonings Cheat Sheet & Pantry Selector */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                주방 치트키 조미료 도감 & 보유 양념
              </h3>
              <p className="text-[11px] text-stone-500">
                완성도를 폭발시킬 시판 조미료 예시를 확인하고, 집에 있는 것을 골라보세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSeasoningGuide(!showSeasoningGuide)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <span>{showSeasoningGuide ? '접기' : '도감 전체보기'}</span>
            {showSeasoningGuide ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Selected Seasonings summary badge bar */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-stone-500 mr-1">
            내 주방 치트키 ({selectedSeasonings.length}개):
          </span>
          {selectedSeasonings.length === 0 ? (
            <span className="text-xs text-stone-400">
              선택 시 셰프가 내 조미료를 최우선 치트키로 적용합니다.
            </span>
          ) : (
            selectedSeasonings.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-white shadow-2xs"
              >
                <Check className="w-3 h-3" />
                {s}
                <button
                  type="button"
                  onClick={() => toggleSeasoning(s)}
                  className="hover:text-amber-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Quick Seasonings Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CHEAT_SEASONINGS.slice(0, showSeasoningGuide ? CHEAT_SEASONINGS.length : 6).map((item) => {
            const isOwned = selectedSeasonings.includes(item.name);
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => toggleSeasoning(item.name)}
                className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                  isOwned
                    ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-2xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200/90'
                }`}
                title={`${item.name}: ${item.effect}`}
              >
                <span>{item.emoji}</span>
                <span>{item.name}</span>
                {isOwned && <span className="text-[10px] bg-white/20 px-1 rounded">보유</span>}
              </button>
            );
          })}
        </div>

        {/* Expanded Seasoning Guide details */}
        {showSeasoningGuide && (
          <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-200">
            {CHEAT_SEASONINGS.map((seasoning) => {
              const isOwned = selectedSeasonings.includes(seasoning.name);
              return (
                <div
                  key={seasoning.name}
                  onClick={() => toggleSeasoning(seasoning.name)}
                  className={`cursor-pointer p-3 rounded-xl border transition-all text-left ${
                    isOwned
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/50'
                      : 'bg-stone-50/50 hover:bg-stone-50 border-stone-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{seasoning.emoji}</span>
                      <span className="text-xs font-bold text-stone-900">
                        {seasoning.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200/80 text-stone-600 font-medium">
                        {seasoning.category}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOwned
                          ? 'bg-amber-500 text-white'
                          : 'bg-stone-100 text-stone-400 group-hover:text-stone-600'
                      }`}
                    >
                      {isOwned ? '✓ 보유중' : '+ 선택'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-snug mb-1">
                    {seasoning.effect}
                  </p>
                  <p className="text-[10px] text-amber-800 font-medium">
                    추천: {seasoning.recommendedWith}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Optional Customization: Taste & Tool */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Taste Preference */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-3.5">
          <label htmlFor="taste-pref-select" className="block text-xs font-bold text-stone-700 mb-2">
            🌶️ 선호 맛 / 분위기
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TASTE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChangePreference(opt === '상관없음' ? '' : opt)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  (opt === '상관없음' && !preference) || preference === opt
                    ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Tool Option */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-3.5">
          <label htmlFor="tool-pref-select" className="block text-xs font-bold text-stone-700 mb-2">
            🍳 사용 조리 도구
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TOOL_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChangeCookingTool(opt === '상관없음' ? '' : opt)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  (opt === '상관없음' && !cookingTool) || cookingTool === opt
                    ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate CTA Button */}
      <div className="pt-2">
        <button
          id="generate-recipe-btn"
          type="button"
          onClick={onGenerate}
          disabled={isLoading || selectedIngredients.length === 0}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-2.5 shadow-md transition-all ${
            isLoading || selectedIngredients.length === 0
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-200'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25 hover:shadow-lg active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>15분 셰프가 최소 2가지 최적 레시피를 조합 중입니다...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>
                {selectedIngredients.length === 0
                  ? '재료를 먼저 1개 이상 골라주세요'
                  : `선택한 재료로 2가지 15분 추천 레시피 받기`}
              </span>
            </>
          )}
        </button>
        {selectedIngredients.length > 0 && (
          <p className="text-center text-xs text-stone-500 mt-2">
            직관적인 3단계 레시피 최소 2가지와 맛을 폭발시킬 시판 치트키 소스가 추천됩니다.
          </p>
        )}
      </div>
    </div>
  );
};
