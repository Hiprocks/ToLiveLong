import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";
import { DailySummary } from "@/lib/sheetsCache";
import { DailyTargets, UserProfileInput } from "@/lib/types";

const DEFAULT_MODEL_CANDIDATES = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;

const getModelCandidates = (): string[] => {
  const fromEnv = (process.env.GEMINI_MODEL ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return Array.from(new Set([...fromEnv, ...DEFAULT_MODEL_CANDIDATES]));
};

const GOAL_LABEL: Record<string, string> = {
  lose_weight: "체중 감량",
  gain_muscle: "근육 증가",
  maintain: "체중 유지",
  recomposition: "체지방 감량 + 근육 증가",
};

const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: "좌식 (거의 안 움직임)",
  light: "가벼운 활동",
  moderate: "보통 활동",
  active: "활동적",
  very_active: "매우 활동적",
};

type RequestBody = {
  summaries: DailySummary[];
  targets: DailyTargets;
  profile?: Partial<UserProfileInput> | null;
};

function buildPrompt(summaries: DailySummary[], targets: DailyTargets, profile?: Partial<UserProfileInput> | null): string {
  const profileLines: string[] = [];
  if (profile) {
    if (profile.age) profileLines.push(`- 나이: ${profile.age}세`);
    if (profile.gender) profileLines.push(`- 성별: ${profile.gender === "male" ? "남성" : "여성"}`);
    if (profile.weightKg) profileLines.push(`- 체중: ${profile.weightKg}kg`);
    if (profile.primaryGoal) profileLines.push(`- 목표: ${GOAL_LABEL[profile.primaryGoal] ?? profile.primaryGoal}`);
    if (profile.occupationalActivityLevel) profileLines.push(`- 활동 수준: ${ACTIVITY_LABEL[profile.occupationalActivityLevel] ?? profile.occupationalActivityLevel}`);
    if (profile.exerciseFrequencyWeekly) profileLines.push(`- 운동 빈도: 주 ${profile.exerciseFrequencyWeekly}회`);
    if (profile.exerciseDurationMin) profileLines.push(`- 운동 시간: ${profile.exerciseDurationMin}분`);
    if (profile.bodyFatPct) profileLines.push(`- 체지방률: ${profile.bodyFatPct}%`);
  }

  const tableRows = summaries
    .map((s) => `| ${s.date} | ${Math.round(s.calories)} | ${Math.round(s.carbs)} | ${Math.round(s.protein)} | ${Math.round(s.fat)} |`)
    .join("\n");

  const dataCount = summaries.length;

  return `당신은 공인 영양사이자 퍼스널 트레이너입니다. 아래 사용자의 최근 식단 데이터를 분석하고 가감없이 평가해주세요.

${profileLines.length > 0 ? `[사용자 프로필]\n${profileLines.join("\n")}\n` : ""}
[최근 ${dataCount}일 영양 섭취 데이터]
| 날짜 | 칼로리(kcal) | 탄수화물(g) | 단백질(g) | 지방(g) |
|------|------------|------------|---------|--------|
${tableRows}

[일일 목표]
| 칼로리: ${targets.calories}kcal | 탄수화물: ${targets.carbs}g | 단백질: ${targets.protein}g | 지방: ${targets.fat}g |

아래 3개 섹션으로 평가해주세요. 각 섹션 제목을 정확히 지켜주세요. 전문 용어는 쉽게 풀어서 설명해주세요. 수치를 언급할 때는 구체적으로 표현해주세요.
출력은 순수 텍스트만 사용하고 마크다운 기호(샵, 별표, 백틱)는 절대 사용하지 마세요.

✅ 잘한 점
목표를 잘 지킨 영양소, 일관성 있게 유지한 부분을 구체적으로 칭찬해주세요. 데이터가 없는 날이 많더라도 입력한 날 기준으로 평가해주세요.

⚠️ 부족하거나 과한 점
목표 대비 차이가 큰 영양소를 지적하고, 그로 인해 신체에 어떤 영향이 생기는지 설명해주세요. 특히 사용자의 목표(${profile?.primaryGoal ? (GOAL_LABEL[profile.primaryGoal] ?? profile.primaryGoal) : "건강 유지"})와 연결지어 설명해주세요.

🎯 이번 주 개선 행동 제안
구체적이고 실천 가능한 행동을 1~3가지 제안해주세요. "단백질을 더 먹어라" 같은 추상적 조언이 아닌, "점심에 닭가슴살 100g 추가" 같은 식의 구체적인 제안을 해주세요.`.trim();
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);

    if (!process.env.GEMINI_API_KEY) {
      return new Response("GEMINI_API_KEY is not configured", { status: 500 });
    }

    const body = (await req.json()) as RequestBody;
    const { summaries, targets, profile } = body;

    if (!Array.isArray(summaries) || summaries.length === 0) {
      return new Response("summaries is required", { status: 400 });
    }

    const prompt = buildPrompt(summaries, targets, profile);
    const modelCandidates = getModelCandidates();

    for (const modelName of modelCandidates) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContentStream([prompt]);

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            try {
              for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) controller.enqueue(encoder.encode(text));
              }
            } catch (err) {
              console.error("[diet-review] stream error", err);
              controller.enqueue(encoder.encode("\n\n(응답 중 오류가 발생했습니다.)"));
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch (error) {
        console.warn(`[diet-review] model failed: ${modelName}`, error);
      }
    }

    return new Response("모든 Gemini 모델 호출에 실패했습니다.", { status: 503 });
  } catch (error) {
    console.error("[diet-review] error:", error);
    if (error instanceof AuthorizationError) {
      return new Response(error.message, { status: error.status });
    }
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}
