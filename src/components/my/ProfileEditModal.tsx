"use client";

import { ReactNode, useEffect, useState } from "react";
import { useModalHistory } from "@/hooks/useModalHistory";
import { X } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import { UserProfileInput } from "@/lib/types";

interface ProfileEditModalProps {
  isOpen: boolean;
  initialProfile?: UserProfileInput | null;
  saving?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSave: (profile: UserProfileInput) => void;
}

const activityOptions = [
  ["sedentary", "거의 없음"],
  ["light", "가벼움"],
  ["moderate", "보통"],
  ["very", "높음"],
  ["extra", "매우 높음"],
] as const;

const defaultProfile: UserProfileInput = {
  gender: "male",
  age: 30,
  heightCm: 170,
  weightKg: 70,
  occupationalActivityLevel: "sedentary",
  exerciseFrequencyWeekly: 3,
  exerciseDurationMin: 45,
  exerciseIntensity: "medium",
  neatLevel: "sedentary",
  primaryGoal: "maintenance",
};

export default function ProfileEditModal({
  isOpen,
  initialProfile,
  saving = false,
  errorMessage = null,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const [form, setForm] = useState<UserProfileInput>(initialProfile ?? defaultProfile);
  const [draft, setDraft] = useState<NumericDraft>(() => toDraft(initialProfile ?? defaultProfile));
  const [initialSnapshot] = useState<UserProfileInput>(initialProfile ?? defaultProfile);

  useModalHistory(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const requiredInvalid = {
    age: draft.age.trim() === "",
    heightCm: draft.heightCm.trim() === "",
    weightKg: draft.weightKg.trim() === "",
  };

  const currentProfile = toProfile(form, draft);
  const hasChanges =
    JSON.stringify(normalizeProfile(currentProfile)) !==
    JSON.stringify(normalizeProfile(initialSnapshot));
  const isSaveBlocked =
    saving || requiredInvalid.age || requiredInvalid.heightCm || requiredInvalid.weightKg || !hasChanges;

  const handleSave = () => {
    if (isSaveBlocked) return;
    onSave(toProfile(form, draft));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col animate-in slide-in-from-bottom duration-300 bg-background">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-lg font-semibold">내 정보 등록/수정</h2>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-muted" aria-label="내 정보 편집 닫기">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <ErrorBanner message={errorMessage} />

          <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/40 p-4">
            <h3 className="col-span-2 text-sm font-semibold text-muted-foreground">기본 정보(필수)</h3>
            <Field label="성별">
              <select
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value as UserProfileInput["gender"] }))}
                className="w-full rounded-lg border border-border bg-input px-3 py-2"
              >
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </Field>
            <NumberField
              label="나이"
              unit="세"
              value={draft.age}
              required
              invalid={requiredInvalid.age}
              onChange={(value) => setDraft((prev) => ({ ...prev, age: value }))}
            />
            <NumberField
              label="키"
              unit="cm"
              value={draft.heightCm}
              required
              invalid={requiredInvalid.heightCm}
              onChange={(value) => setDraft((prev) => ({ ...prev, heightCm: value }))}
            />
            <NumberField
              label="체중"
              unit="kg"
              value={draft.weightKg}
              required
              invalid={requiredInvalid.weightKg}
              onChange={(value) => setDraft((prev) => ({ ...prev, weightKg: value }))}
            />
          </section>

          <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/40 p-4">
            <h3 className="col-span-2 text-sm font-semibold text-muted-foreground">활동 정보</h3>
            <Field label="활동 수준">
              <select
                value={form.occupationalActivityLevel ?? "sedentary"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    occupationalActivityLevel: e.target.value as UserProfileInput["occupationalActivityLevel"],
                  }))
                }
                className="w-full rounded-lg border border-border bg-input px-3 py-2"
              >
                {activityOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <NumberField
              label="운동 빈도"
              unit="회/주"
              value={draft.exerciseFrequencyWeekly}
              onChange={(value) => setDraft((prev) => ({ ...prev, exerciseFrequencyWeekly: value }))}
            />
            <NumberField
              label="운동 시간"
              unit="분"
              value={draft.exerciseDurationMin}
              onChange={(value) => setDraft((prev) => ({ ...prev, exerciseDurationMin: value }))}
            />
            <Field label="운동 강도">
              <select
                value={form.exerciseIntensity ?? "medium"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, exerciseIntensity: e.target.value as UserProfileInput["exerciseIntensity"] }))
                }
                className="w-full rounded-lg border border-border bg-input px-3 py-2"
              >
                <option value="low">저강도</option>
                <option value="medium">중강도</option>
                <option value="high">고강도</option>
              </select>
            </Field>
          </section>

          <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/40 p-4">
            <h3 className="col-span-2 text-sm font-semibold text-muted-foreground">체성분/추적(선택)</h3>
            <NumberField
              label="체지방률"
              unit="%"
              value={draft.bodyFatPct}
              onChange={(value) => setDraft((prev) => ({ ...prev, bodyFatPct: value }))}
            />
            <NumberField
              label="골격근량"
              unit="kg"
              value={draft.skeletalMuscleKg}
              onChange={(value) => setDraft((prev) => ({ ...prev, skeletalMuscleKg: value }))}
            />
            <NumberField
              label="허리둘레"
              unit="cm"
              value={draft.waistCm}
              onChange={(value) => setDraft((prev) => ({ ...prev, waistCm: value }))}
            />
            <NumberField
              label="허리-엉덩이 비율"
              unit="비율"
              value={draft.waistHipRatio}
              step={0.01}
              onChange={(value) => setDraft((prev) => ({ ...prev, waistHipRatio: value }))}
            />
          </section>

          <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/40 p-4">
            <h3 className="col-span-2 text-sm font-semibold text-muted-foreground">목표 설정</h3>
            <Field label="목표">
              <select
                value={form.primaryGoal}
                onChange={(e) => setForm((prev) => ({ ...prev, primaryGoal: e.target.value as UserProfileInput["primaryGoal"] }))}
                className="w-full rounded-lg border border-border bg-input px-3 py-2"
              >
                <option value="cutting">살 빼기</option>
                <option value="maintenance">유지하기</option>
                <option value="bulking">근육 키우기</option>
                <option value="recomposition">살 빼고 근육 키우기</option>
              </select>
            </Field>
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              시스템이 목표에 맞춰 단백질, 지방, 탄수를 자동 계산합니다. 운동 정보는 설명과 추후 보정에만 사용됩니다.
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-auto border-t border-border bg-background p-4 pb-safe">
        <div className="mx-auto w-full max-w-2xl">
          <button
            onClick={handleSave}
            disabled={isSaveBlocked}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "저장 중..." : hasChanges ? "프로필 저장" : "변경사항 없음"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChange,
  step = 1,
  required = false,
  invalid = false,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <Field label={`${label} (${unit})${required ? " *" : ""}`}>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-input px-3 py-2 ${invalid ? "border-red-500 focus:border-red-500" : "border-border"}`}
      />
    </Field>
  );
}

type NumericDraft = {
  age: string;
  heightCm: string;
  weightKg: string;
  exerciseFrequencyWeekly: string;
  exerciseDurationMin: string;
  bodyFatPct: string;
  skeletalMuscleKg: string;
  waistHipRatio: string;
  waistCm: string;
};

const toDraft = (profile: UserProfileInput): NumericDraft => ({
  age: String(profile.age),
  heightCm: String(profile.heightCm),
  weightKg: String(profile.weightKg),
  exerciseFrequencyWeekly: toOptionalString(profile.exerciseFrequencyWeekly),
  exerciseDurationMin: toOptionalString(profile.exerciseDurationMin),
  bodyFatPct: toOptionalString(profile.bodyFatPct),
  skeletalMuscleKg: toOptionalString(profile.skeletalMuscleKg),
  waistHipRatio: toOptionalString(profile.waistHipRatio),
  waistCm: toOptionalString(profile.waistCm),
});

const toOptionalString = (value: number | undefined) => (value === undefined ? "" : String(value));

const parseOptional = (value: string): number | undefined => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toProfile = (base: UserProfileInput, draft: NumericDraft): UserProfileInput => ({
  ...base,
  age: Number(draft.age),
  heightCm: Number(draft.heightCm),
  weightKg: Number(draft.weightKg),
  exerciseFrequencyWeekly: parseOptional(draft.exerciseFrequencyWeekly),
  exerciseDurationMin: parseOptional(draft.exerciseDurationMin),
  bodyFatPct: parseOptional(draft.bodyFatPct),
  skeletalMuscleKg: parseOptional(draft.skeletalMuscleKg),
  waistHipRatio: parseOptional(draft.waistHipRatio),
  waistCm: parseOptional(draft.waistCm),
});

const normalizeProfile = (profile: UserProfileInput): UserProfileInput => ({
  ...profile,
  exerciseFrequencyWeekly: profile.exerciseFrequencyWeekly ?? undefined,
  exerciseDurationMin: profile.exerciseDurationMin ?? undefined,
  bodyFatPct: profile.bodyFatPct ?? undefined,
  skeletalMuscleKg: profile.skeletalMuscleKg ?? undefined,
  waistHipRatio: profile.waistHipRatio ?? undefined,
  waistCm: profile.waistCm ?? undefined,
});
