import { NutritionTargets } from "@/lib/types";

interface NutritionResultCardProps {
  computed: NutritionTargets | null;
}

export default function NutritionResultCard({ computed }: NutritionResultCardProps) {
  const bmr = computed?.bmr ?? 0;
  const tdee = computed?.tdee ?? 0;
  const targetCalories = computed?.targetCalories ?? 0;
  const carbs = computed?.carbs ?? 0;
  const protein = computed?.protein ?? 0;
  const fat = computed?.fat ?? 0;
  const sugar = computed?.sugar ?? 0;
  const sodium = computed?.sodium ?? 0;
  const sourceLabel = computed?.aiSource === "ai" ? "AI 분석" : "기본 계산";
  const feedback = computed?.aiFeedback;
  const fallbackNote = sanitizeLegacyAiNote(computed?.aiNotes);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-muted-foreground">목표 수치(AI)</h2>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        <Metric label="BMR" value={`${bmr} kcal`} />
        <Metric label="TDEE" value={`${tdee} kcal`} />
        <Metric label="목표 칼로리" value={`${targetCalories} kcal`} />
        <Metric label="탄수화물" value={`${carbs} g`} />
        <Metric label="단백질" value={`${protein} g`} />
        <Metric label="지방" value={`${fat} g`} />
        <Metric label="당류" value={`${sugar} g`} />
        <Metric label="나트륨" value={`${sodium} mg`} />
      </div>

      {computed?.aiNotes && (
        <div className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-foreground">
          <p className="font-semibold">{sourceLabel} 피드백</p>
          {feedback ? (
            <div className="mt-1 space-y-1 leading-relaxed">
              <p>체형/목표: {feedback.analysis}</p>
              <p>운동: {feedback.exercisePlan}</p>
              <p>식단: {feedback.dietPlan}</p>
            </div>
          ) : (
            <p className="mt-1 leading-relaxed">{fallbackNote}</p>
          )}
        </div>
      )}
    </div>
  );
}

function sanitizeLegacyAiNote(note: string | undefined) {
  if (!note) return "";
  const stripped = note
    .replace(/BMR\s*\d+[^\s,]*/gi, "")
    .replace(/TDEE\s*\d+[^\s,]*/gi, "")
    .replace(/목표\s*\d+\s*kcal/gi, "")
    .replace(/탄\s*\d+\s*\/\s*단\s*\d+\s*\/\s*지\s*\d+\s*g/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return stripped || note;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
