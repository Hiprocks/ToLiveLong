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
  cutting: "감량",
  maintenance: "유지",
  bulking: "증량",
  recomposition: "린매스업",
};

const macroLabels: Record<UserProfileInput["macroPreference"], string> = {
  balanced: "균형형",
  low_carb: "저탄수형",
  high_protein: "고단백형",
  keto: "저탄고지",
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
          <SummaryItem label="선호 식단" value={macroLabels[profile.macroPreference]} />
          <SummaryItem
            label="직업 활동량"
            value={activityLabels[profile.occupationalActivityLevel ?? "sedentary"]}
          />
          <SummaryItem label="일상 활동량(NEAT)" value={activityLabels[profile.neatLevel ?? "sedentary"]} />
          <SummaryItem
            label="체지방률"
            value={profile.bodyFatPct === undefined ? "미입력" : `${profile.bodyFatPct}%`}
          />
          <SummaryItem
            label="골격근량"
            value={profile.skeletalMuscleKg === undefined ? "미입력" : `${profile.skeletalMuscleKg} kg`}
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
