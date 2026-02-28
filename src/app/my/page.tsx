"use client";

import { useEffect, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import ProfileEditModal from "@/components/my/ProfileEditModal";
import ProfileSummarySection from "@/components/my/ProfileSummarySection";
import { UserProfileInput, UserTargetsResponse } from "@/lib/types";

const USER_CACHE_TTL_MS = 30_000;
let userPageCache: { fetchedAt: number; data: UserTargetsResponse } | null = null;

export default function MyPage() {
  const [data, setData] = useState<UserTargetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [aiTestMessage, setAiTestMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        const now = Date.now();
        if (userPageCache && now - userPageCache.fetchedAt < USER_CACHE_TTL_MS) {
          if (!isActive) return;
          setData(userPageCache.data);
          setErrorMessage(null);
          if (!userPageCache.data.profileRegistered) setIsEditOpen(true);
          return;
        }

        const response = await fetch("/api/sheets/user", { cache: "no-store" });
        if (!response.ok) throw new Error("내 정보를 불러오지 못했습니다.");

        const nextData = (await response.json()) as UserTargetsResponse;
        if (!isActive) return;

        userPageCache = { fetchedAt: Date.now(), data: nextData };
        setData(nextData);
        setErrorMessage(null);
        if (!nextData.profileRegistered) setIsEditOpen(true);
      } catch (error) {
        if (!isActive) return;
        console.error(error);
        setErrorMessage("내 정보를 불러오지 못했습니다.");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadData();
    return () => {
      isActive = false;
    };
  }, []);

  const handleSave = async (profile: UserProfileInput) => {
    setSaveState("saving");
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/sheets/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const raw = await response.text();
        let message = "";
        try {
          const result = JSON.parse(raw) as { error?: string };
          message = result?.error ?? "";
        } catch {
          message = raw;
        }
        throw new Error(message || `프로필 저장에 실패했습니다. (HTTP ${response.status})`);
      }

      const nextData = (await response.json()) as UserTargetsResponse;
      userPageCache = { fetchedAt: Date.now(), data: nextData };
      setData(nextData);
      setSaveState("success");
      setIsEditOpen(false);
      setErrorMessage(null);
      setSuccessMessage("내 정보가 저장되었습니다.");
      window.setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      console.error(error);
      setSaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "프로필 저장에 실패했습니다.");
    } finally {
      setSaveState((prev) => (prev === "saving" ? "idle" : prev));
    }
  };

  const handleAiTest = async () => {
    setAiTestMessage(null);
    try {
      const response = await fetch("/api/sheets/user?refreshAi=1", { cache: "no-store" });
      if (!response.ok) throw new Error("AI 테스트 요청에 실패했습니다.");

      const result = (await response.json()) as UserTargetsResponse;
      userPageCache = { fetchedAt: Date.now(), data: result };
      setData(result);
      const note = result.computed?.aiNotes?.trim();
      if (!note) {
        setAiTestMessage("AI 메모가 비어 있습니다.");
        return;
      }

      const source = result.computed?.aiSource === "ai" ? "AI" : "기본 계산";
      const debug = result.computed?.aiDebug ? ` (${result.computed.aiDebug})` : "";
      setAiTestMessage(`${source}: ${note}${debug}`);
    } catch (error) {
      console.error(error);
      setAiTestMessage("AI 응답 테스트에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="p-4 text-muted-foreground">불러오는 중...</div>;
  }

  return (
    <main className="space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-bold">내 정보</h1>
      <ErrorBanner message={errorMessage} />

      {successMessage && (
        <div className="rounded-lg border border-emerald-300/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      {!data?.profileRegistered || !data.profile ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            내 정보를 등록하면 개인 맞춤 목표 칼로리와 매크로를 자동 계산합니다.
          </p>
          <button
            onClick={() => setIsEditOpen(true)}
            className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
          >
            등록하기
          </button>
        </div>
      ) : (
        <>
          <ProfileSummarySection profile={data.profile} computed={data.computed ?? null} />
          <button
            onClick={() => setIsEditOpen(true)}
            className="fixed bottom-20 left-4 right-4 rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-lg md:left-auto md:right-6 md:w-52"
          >
            수정
          </button>
        </>
      )}

      {!data?.profileRegistered && (
        <div className="rounded-lg border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          등록 전에는 서비스 이용이 제한됩니다.
        </div>
      )}

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">AI 응답 테스트</p>
            <p className="text-xs text-muted-foreground">Gemini 응답 메모와 디버그 정보를 확인합니다.</p>
          </div>
          <button
            onClick={handleAiTest}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            테스트 실행
          </button>
        </div>

        {aiTestMessage && (
          <div className="mt-3 rounded-lg border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {aiTestMessage}
          </div>
        )}
      </div>

      {isEditOpen && (
        <ProfileEditModal
          key={data?.profileRegistered ? "edit-existing" : "edit-new"}
          isOpen={isEditOpen}
          initialProfile={data?.profile}
          saving={saveState === "saving"}
          errorMessage={saveState === "error" ? errorMessage : null}
          onClose={() => {
            if (!data?.profileRegistered) return;
            setIsEditOpen(false);
          }}
          onSave={handleSave}
        />
      )}

    </main>
  );
}
