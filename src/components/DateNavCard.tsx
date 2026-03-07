"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type DateNavCardProps = {
  onPrev: () => void;
  onNext: () => void;
  canGoNext?: boolean;
  /** 상단 라벨 (예: "조회 날짜"). 없으면 한 줄만 표시 */
  centerLabel?: string;
  /** 중앙 표시 내용 */
  centerValue: React.ReactNode;
  /** 중앙 클릭 시 동작 (날짜 피커 등). 없으면 클릭 불가 */
  onCenterClick?: () => void;
  /** 카드 하단에 넣을 내용 (예: 숨김 date input) */
  children?: React.ReactNode;
  prevAriaLabel?: string;
  nextAriaLabel?: string;
  centerAriaLabel?: string;
};

export default function DateNavCard({
  onPrev,
  onNext,
  canGoNext = true,
  centerLabel,
  centerValue,
  onCenterClick,
  children,
  prevAriaLabel = "이전",
  nextAriaLabel = "다음",
  centerAriaLabel,
}: DateNavCardProps) {
  const buttonClass =
    "h-9 w-9 rounded-full border border-border/80 bg-background/80 text-foreground transition-colors hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center shrink-0";

  const centerContent = (
    <>
      {centerLabel && <p className="text-xs text-muted-foreground">{centerLabel}</p>}
      <p className={centerLabel ? "text-sm font-semibold" : "text-sm font-medium text-muted-foreground"}>
        {centerValue}
      </p>
    </>
  );

  return (
    <div className="space-y-2 rounded-2xl border border-border/80 bg-card/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className={buttonClass}
          aria-label={prevAriaLabel}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {onCenterClick ? (
          <button
            type="button"
            onClick={onCenterClick}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-center transition-colors hover:border-primary/60"
            aria-label={centerAriaLabel}
          >
            {centerContent}
          </button>
        ) : (
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-center">
            {centerContent}
          </div>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={buttonClass}
          aria-label={nextAriaLabel}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  );
}
