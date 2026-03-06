"use client";

import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  active: boolean;
  label?: string;
  fixed?: boolean;
  className?: string;
}

export default function LoadingOverlay({
  active,
  label = "로딩 중입니다...",
  fixed = true,
  className = "",
}: LoadingOverlayProps) {
  if (!active) return null;

  const baseClass = fixed
    ? "fixed inset-0 z-[120] flex items-center justify-center pointer-events-none"
    : "absolute inset-0 z-30 flex items-center justify-center pointer-events-none";

  return (
    <div className={`${baseClass} ${className}`} aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border border-cyan-300/35" />
          <div className="absolute inset-0 rounded-full border-4 border-cyan-300/20 border-t-cyan-300 animate-spin" />
          <div className="absolute inset-2 rounded-full bg-cyan-300/10 blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
          </div>
        </div>
        <p className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          {label}
        </p>
      </div>
    </div>
  );
}
