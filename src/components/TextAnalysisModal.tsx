"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

export interface TextAnalysisPrefill {
  food_name: string;
  ai_summary: string;
  amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}

interface TextAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzed: (prefill: TextAnalysisPrefill) => void;
}

const DEFAULT_EXAMPLE = "예: 빅맥 세트 먹었어, 감자튀김은 50% 남겼어";
const DEFAULT_FOOD_NAME = "AI 추정 식품";

export default function TextAnalysisModal({ isOpen, onClose, onAnalyzed }: TextAnalysisModalProps) {
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isAnalyzing) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAnalyzing, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setInput("");
    setErrorMessage(null);
    setIsAnalyzing(false);
  }, [isOpen]);

  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    if (!input.trim()) {
      setErrorMessage("섭취한 음식 내용을 입력해 주세요.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });
      const body = (await response.json().catch(() => null)) as
        | (Partial<TextAnalysisPrefill> & { menu_name?: string; error?: string; intake_summary?: string })
        | null;

      if (!response.ok) {
        throw new Error(body?.error || "AI 텍스트 분석에 실패했습니다.");
      }

      const parsedAmount = Number(body?.amount ?? 100);
      const safeAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 100;
      const foodName =
        (typeof body?.food_name === "string" && body.food_name.trim()) ||
        (typeof body?.menu_name === "string" && body.menu_name.trim()) ||
        DEFAULT_FOOD_NAME;
      const intakeSummary =
        (typeof body?.intake_summary === "string" && body.intake_summary.trim()) ||
        input.trim();

      onAnalyzed({
        food_name: foodName,
        ai_summary: intakeSummary,
        amount: safeAmount,
        calories: Number(body?.calories ?? 0),
        carbs: Number(body?.carbs ?? 0),
        protein: Number(body?.protein ?? 0),
        fat: Number(body?.fat ?? 0),
        sugar: Number(body?.sugar ?? 0),
        sodium: Number(body?.sodium ?? 0),
      });
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "AI 텍스트 분석에 실패했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">AI 등록</h2>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="rounded-full p-2 hover:bg-muted disabled:opacity-40"
            aria-label="AI 등록 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          먹은 음식과 섭취량/남긴 양을 자연어로 입력해 주세요.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{DEFAULT_EXAMPLE}</p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnalyzing}
          placeholder="예: 빅맥 세트 먹었어, 감자튀김은 50% 남겼어"
          className="mt-3 h-36 w-full resize-none rounded-xl border border-border bg-input px-3 py-2 text-sm disabled:opacity-60"
        />

        {errorMessage && (
          <div className="mt-3 rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {errorMessage}
          </div>
        )}

        {isAnalyzing && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-3 py-2 text-xs text-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI 처리 중입니다. 완료될 때까지 입력이 잠깁니다.
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="w-full rounded-xl border border-border bg-muted py-2 text-sm font-semibold disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={() => void handleAnalyze()}
            disabled={isAnalyzing}
            className="w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isAnalyzing ? "AI 처리 중..." : "AI 분석"}
          </button>
        </div>
      </div>
    </div>
  );
}
