import React from 'react';
import { ParsedRecipe } from '../types';
import { X, Clock, Trash2, ArrowRight, BookOpen } from 'lucide-react';

interface SavedRecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRecipes: ParsedRecipe[];
  onSelectRecipe: (recipe: ParsedRecipe) => void;
  onDeleteRecipe: (id: string) => void;
}

export const SavedRecipesModal: React.FC<SavedRecipesModalProps> = ({
  isOpen,
  onClose,
  savedRecipes,
  onSelectRecipe,
  onDeleteRecipe,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="saved-recipes-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="saved-recipes-modal"
        className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-stone-900">
              저장된 냉파 레시피 ({savedRecipes.length})
            </h3>
          </div>
          <button
            id="close-saved-modal-btn"
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {savedRecipes.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-2">
              <p className="text-sm font-medium">아직 보관된 레시피가 없습니다.</p>
              <p className="text-xs text-stone-400">
                마음에 드는 15분 레시피가 나오면 상단의 [보관] 버튼을 눌러 저장해보세요!
              </p>
            </div>
          ) : (
            savedRecipes.map((r) => (
              <div
                key={r.id}
                id={`saved-item-${r.id}`}
                className="group p-4 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all flex items-center justify-between gap-3"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    onSelectRecipe(r);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {r.cookingTime}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                    {r.dishName}
                  </h4>
                  {r.cheatKey?.name && (
                    <p className="text-xs text-stone-500 mt-1">
                      치트키: <span className="font-semibold text-amber-700">{r.cheatKey.name}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRecipe(r);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-white border border-stone-200 text-stone-700 hover:text-amber-600 hover:border-amber-300 transition-colors"
                    title="레시피 보기"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecipe(r.id);
                    }}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
