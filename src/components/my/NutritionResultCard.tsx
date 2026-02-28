import { NutritionTargets } from "@/lib/types";

interface NutritionResultCardProps {
  computed: NutritionTargets | null;
}

export default function NutritionResultCard({ computed }: NutritionResultCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-muted-foreground">계산 결과</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Metric label="기초대사량" value={`${computed?.bmr ?? 0} kcal`} />
        <Metric label="활동대사량" value={`${computed?.tdee ?? 0} kcal`} />
        <Metric label="목표 칼로리" value={`${computed?.targetCalories ?? 0} kcal`} />
        <Metric
          label="권장 매크로"
          value={`${computed?.carbs ?? 0} / ${computed?.protein ?? 0} / ${computed?.fat ?? 0} g`}
        />
      </div>
      {computed?.aiNotes && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="font-semibold">{computed.aiSource === "ai" ? "AI" : "기본 계산"}:</span>{" "}
          {computed.aiNotes}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
