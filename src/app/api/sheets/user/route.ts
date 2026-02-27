import { NextRequest, NextResponse } from "next/server";
import { DailyTargets, UserProfileInput } from "@/lib/types";
import {
  appendRow,
  listRows,
  parseUserAi,
  parseUserProfile,
  parseUserTargets,
  RANGES,
  serializeUserRow,
  updateRow,
} from "@/lib/sheets";
import { parseNonNegativeNumber, ValidationError } from "@/lib/apiValidation";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";
import { calculateNutritionTargets, toDailyTargets } from "@/lib/nutrition/calculateTargets";
import { calculateNutritionTargetsWithAi } from "@/lib/nutrition/aiTargets";

const defaultTargets: DailyTargets = {
  calories: 2300,
  carbs: 320,
  protein: 120,
  fat: 60,
  sugar: 30,
  sodium: 2000,
};

export async function GET() {
  try {
    const rows = await listRows(RANGES.user);
    const row = rows[0] ?? null;
    const targets = parseUserTargets(row) ?? defaultTargets;
    const profile = parseUserProfile(row);
    const storedAi = parseUserAi(row);
    const computed = profile ? storedAi ?? calculateNutritionTargets(profile) : null;
    return NextResponse.json({
      ...targets,
      profileRegistered: Boolean(profile),
      profile,
      computed,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch user targets" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = (await req.json()) as Partial<DailyTargets> & {
      profile?: Partial<UserProfileInput>;
      gender?: UserProfileInput["gender"];
      age?: number;
      heightCm?: number;
      weightKg?: number;
      primaryGoal?: UserProfileInput["primaryGoal"];
      macroPreference?: UserProfileInput["macroPreference"];
    };

    const rows = await listRows(RANGES.user);
    const existingRow = rows[0] ?? null;
    const existingProfile = parseUserProfile(existingRow);
    const existingAi = parseUserAi(existingRow);

    const rawProfile = (body.profile ?? body) as Partial<UserProfileInput>;
    const hasProfilePayload = rawProfile.gender !== undefined || rawProfile.age !== undefined;

    let profile: UserProfileInput | null = existingProfile;
    let targets: DailyTargets;

    if (hasProfilePayload) {
      profile = parseProfile(rawProfile);
      const computed = await calculateNutritionTargetsWithAi(profile);
      const nowIso = new Date().toISOString();
      computed.aiUpdatedAt = nowIso;
      targets = toDailyTargets(computed);
      const rowValues = serializeUserRow(targets, profile, computed);
      if (rows.length === 0) {
        await appendRow(RANGES.user, rowValues);
      } else {
        await updateRow(RANGES.user, 2, rowValues);
      }
      return NextResponse.json({
        ...targets,
        profileRegistered: Boolean(profile),
        profile,
        computed,
      });
    } else {
      targets = {
        calories: parseNonNegativeNumber(body.calories ?? defaultTargets.calories, "calories", {
          max: 20000,
        }),
        carbs: parseNonNegativeNumber(body.carbs ?? defaultTargets.carbs, "carbs", { max: 5000 }),
        protein: parseNonNegativeNumber(body.protein ?? defaultTargets.protein, "protein", {
          max: 5000,
        }),
        fat: parseNonNegativeNumber(body.fat ?? defaultTargets.fat, "fat", { max: 5000 }),
        sugar: parseNonNegativeNumber(body.sugar ?? defaultTargets.sugar, "sugar", { max: 5000 }),
        sodium: parseNonNegativeNumber(body.sodium ?? defaultTargets.sodium, "sodium", {
          max: 100000,
        }),
      };
    }

    const rowValues = serializeUserRow(targets, profile, existingAi);

    if (rows.length === 0) {
      await appendRow(RANGES.user, rowValues);
    } else {
      await updateRow(RANGES.user, 2, rowValues);
    }

    return NextResponse.json({
      ...targets,
      profileRegistered: Boolean(profile),
      profile,
      computed: profile ? existingAi ?? calculateNutritionTargets(profile) : null,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update user targets: ${detail}` },
      { status: 500 }
    );
  }
}

const parseEnum = <T extends string>(
  value: unknown,
  fieldName: string,
  allowed: readonly T[],
  fallback?: T
): T => {
  if (value === undefined || value === null || value === "") {
    if (fallback) return fallback;
    throw new ValidationError(`${fieldName} is required`);
  }

  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
};

const parseOptionalNumber = (
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number }
): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  return parseNonNegativeNumber(value, fieldName, options);
};

const normalizePrimaryGoal = (value: unknown): unknown => {
  if (value === "overfat" || value === "obese" || value === "severe_obese") return "cutting";
  return value;
};

const normalizeMacroPreference = (value: unknown): unknown => {
  if (value === "high_fat") return "keto";
  return value;
};

const normalizeWaistHipRatio = (value: unknown): unknown => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  if (parsed < 0.5) return undefined;
  return value;
};

const parseProfile = (payload: Partial<UserProfileInput>): UserProfileInput => {
  return {
    gender: parseEnum(payload.gender, "gender", ["male", "female"] as const),
    age: parseNonNegativeNumber(payload.age, "age", { min: 10, max: 120 }),
    heightCm: parseNonNegativeNumber(payload.heightCm, "heightCm", { min: 100, max: 250 }),
    weightKg: parseNonNegativeNumber(payload.weightKg, "weightKg", { min: 20, max: 400 }),
    primaryGoal: parseEnum(normalizePrimaryGoal(payload.primaryGoal), "primaryGoal", [
      "cutting",
      "maintenance",
      "bulking",
      "recomposition",
    ] as const),
    macroPreference: parseEnum(normalizeMacroPreference(payload.macroPreference), "macroPreference", [
      "balanced",
      "low_carb",
      "high_protein",
      "keto",
    ] as const),
    occupationalActivityLevel: parseEnum(
      payload.occupationalActivityLevel,
      "occupationalActivityLevel",
      ["sedentary", "light", "moderate", "very", "extra"] as const,
      "sedentary"
    ),
    neatLevel: parseEnum(payload.neatLevel, "neatLevel", [
      "sedentary",
      "light",
      "moderate",
      "very",
      "extra",
    ] as const, "sedentary"),
    exerciseIntensity: parseEnum(payload.exerciseIntensity, "exerciseIntensity", [
      "low",
      "medium",
      "high",
    ] as const, "medium"),
    exerciseFrequencyWeekly: parseOptionalNumber(payload.exerciseFrequencyWeekly, "exerciseFrequencyWeekly", {
      min: 0,
      max: 14,
    }),
    exerciseDurationMin: parseOptionalNumber(payload.exerciseDurationMin, "exerciseDurationMin", {
      min: 0,
      max: 600,
    }),
    bodyFatPct: parseOptionalNumber(payload.bodyFatPct, "bodyFatPct", { min: 2, max: 70 }),
    skeletalMuscleKg: parseOptionalNumber(payload.skeletalMuscleKg, "skeletalMuscleKg", {
      min: 1,
      max: 200,
    }),
    waistHipRatio: parseOptionalNumber(
      normalizeWaistHipRatio(payload.waistHipRatio),
      "waistHipRatio",
      { min: 0.5, max: 2 }
    ),
  };
};
