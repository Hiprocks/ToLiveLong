"use client";

import { useEffect, useState } from "react";
import { useModalHistory } from "@/hooks/useModalHistory";
import { Bot, Camera, PencilLine, Plus, Shapes } from "lucide-react";
import FoodSearchModal from "@/components/FoodSearchModal";
import PhotoAnalysisModal, { PhotoAnalysisPrefill } from "@/components/PhotoAnalysisModal";
import TextAnalysisModal, { TextAnalysisPrefill } from "@/components/TextAnalysisModal";

type MealEntryFabProps = {
  selectedDate: string;
  onSuccess?: () => void | Promise<void>;
};

type MealPrefill =
  | (PhotoAnalysisPrefill & { ai_summary?: string; date?: string })
  | (TextAnalysisPrefill & { date?: string })
  | null;

export default function MealEntryFab({ selectedDate, onSuccess }: MealEntryFabProps) {
  const [isEntrySheetOpen, setIsEntrySheetOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isAiTextModalOpen, setIsAiTextModalOpen] = useState(false);
  const [foodModalMode, setFoodModalMode] = useState<"manual" | "template">("manual");
  const [mealPrefill, setMealPrefill] = useState<MealPrefill>(null);

  useModalHistory(isEntrySheetOpen, () => setIsEntrySheetOpen(false));

  useEffect(() => {
    if (!isEntrySheetOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsEntrySheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEntrySheetOpen]);

  const openFoodModal = (mode: "manual" | "template") => {
    setFoodModalMode(mode);
    if (mode !== "manual") setMealPrefill(null);
    setIsEntrySheetOpen(false);
    setIsCreateOpen(true);
  };
  const handleSuccess = onSuccess ?? (() => undefined);

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsEntrySheetOpen((prev) => !prev)}
          className="flex items-center justify-center rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-transform hover:bg-primary/90 active:scale-95"
          aria-label="식단 등록 열기"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {isEntrySheetOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsEntrySheetOpen(false)}>
          <div
            className="absolute bottom-24 right-4 w-64 rounded-2xl border border-border/80 bg-card p-4 shadow-sm backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="pb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">식단 등록</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => openFoodModal("template")}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-muted"
              >
                <Shapes className="h-4 w-4" />
                <span className="text-sm">즐겨찾기/식품DB 사용</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEntrySheetOpen(false);
                  setIsAiTextModalOpen(true);
                }}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-muted"
              >
                <Bot className="h-4 w-4" />
                <span className="text-sm">AI 등록</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEntrySheetOpen(false);
                  setIsPhotoModalOpen(true);
                }}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-muted"
              >
                <Camera className="h-4 w-4" />
                <span className="text-sm">사진 등록</span>
              </button>
              <button
                type="button"
                onClick={() => openFoodModal("manual")}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-muted"
              >
                <PencilLine className="h-4 w-4" />
                <span className="text-sm">직접 입력</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <FoodSearchModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setMealPrefill(null);
        }}
        initialMode={foodModalMode}
        initialDate={selectedDate}
        initialPrefill={foodModalMode === "manual" ? mealPrefill : null}
        onSuccess={handleSuccess}
      />
      <PhotoAnalysisModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onAnalyzed={(prefill) => {
          setMealPrefill({ ...prefill, date: selectedDate });
          setFoodModalMode("manual");
          setIsPhotoModalOpen(false);
          setIsCreateOpen(true);
        }}
      />
      <TextAnalysisModal
        isOpen={isAiTextModalOpen}
        onClose={() => setIsAiTextModalOpen(false)}
        onAnalyzed={(prefill) => {
          setMealPrefill({ ...prefill, date: selectedDate });
          setFoodModalMode("manual");
          setIsAiTextModalOpen(false);
          setIsCreateOpen(true);
        }}
      />
    </>
  );
}
