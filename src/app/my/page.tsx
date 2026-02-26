"use client";

import { useEffect, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import ProfileEditModal from "@/components/my/ProfileEditModal";
import ProfileSummarySection from "@/components/my/ProfileSummarySection";
import { UserProfileInput, UserTargetsResponse } from "@/lib/types";

export default function MyPage() {
  const [data, setData] = useState<UserTargetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      try {
        const response = await fetch("/api/sheets/user", { cache: "no-store" });
        if (!response.ok) throw new Error("내 정보를 불러오지 못했습니다.");
        const nextData = (await response.json()) as UserTargetsResponse;
        if (isActive) {
          setData(nextData);
          if (!nextData.profileRegistered) setIsEditOpen(true);
        }
        if (isActive) setErrorMessage(null);
      } catch (error) {
        if (isActive) {
          console.error(error);
          setErrorMessage("내 정보를 불러오지 못했습니다.");
        }
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
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "프로필 저장에 실패했습니다.");
      }
      const nextData = (await response.json()) as UserTargetsResponse;
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

  if (loading) {
    return <div className="p-4 text-muted-foreground">불러오는 중...</div>;
  }

  return (
    <main className="space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-bold">내정보</h1>
      <ErrorBanner message={errorMessage} />
      {successMessage && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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

      {!data?.profileRegistered && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          등록 전에는 서비스를 이용할 수 없습니다.
        </div>
      )}
    </main>
  );
}
