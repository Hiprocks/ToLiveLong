import NutritionResultCard from "@/components/my/NutritionResultCard";
import { NutritionTargets, UserProfileInput } from "@/lib/types";

interface ProfileSummarySectionProps {
  profile: UserProfileInput;
  computed: NutritionTargets | null;
}

const activityLabels: Record<NonNullable<UserProfileInput["occupationalActivityLevel"]>, string> = {
  sedentary: "거의 없음",
  light: "가벼움",
  moderate: "보통",
  very: "높음",
  extra: "매우 높음",
};

const goalLabels: Record<UserProfileInput["primaryGoal"], string> = {
  cutting: "살 빼기",
  maintenance: "유지하기",
  bulking: "근육 키우기",
  recomposition: "살 빼고 근육 키우기",
};

export default function ProfileSummarySection({ profile, computed }: ProfileSummarySectionProps) {
  return (
    <section className="space-y-4">
      <NutritionResultCard computed={computed} />

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground">기본 정보</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <SummaryItem label="성별" value={profile.gender === "male" ? "남성" : "여성"} />
          <SummaryItem label="나이" value={`${profile.age}세`} />
          <SummaryItem label="키" value={`${profile.heightCm} cm`} />
          <SummaryItem label="체중" value={`${profile.weightKg} kg`} />
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground">목표/활동</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <SummaryItem label="목표" value={goalLabels[profile.primaryGoal]} />
          <SummaryItem
            label="활동 수준"
            value={activityLabels[profile.occupationalActivityLevel ?? "sedentary"]}
          />
          <SummaryItem
            label="운동 습관"
            value={`${profile.exerciseFrequencyWeekly ?? 0}회 / ${profile.exerciseDurationMin ?? 0}분`}
          />
          <SummaryItem
            label="체지방률"
            value={profile.bodyFatPct === undefined ? "미입력" : `${profile.bodyFatPct}%`}
          />
          <SummaryItem
            label="골격근량"
            value={profile.skeletalMuscleKg === undefined ? "미입력" : `${profile.skeletalMuscleKg} kg`}
          />
          <SummaryItem
            label="허리둘레"
            value={profile.waistCm === undefined ? "미입력" : `${profile.waistCm} cm`}
          />
          <SummaryItem
            label="허리-엉덩이 비율"
            value={profile.waistHipRatio === undefined ? "미입력" : profile.waistHipRatio.toFixed(2)}
          />
        </div>
      </div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
