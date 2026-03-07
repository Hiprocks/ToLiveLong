import { google, sheets_v4 } from "googleapis";
import { DailyTargets, MealRecord, NutritionTargets, TemplateItem, UserProfileInput } from "@/lib/types";

const RECORDS_RANGE = "records!A:K";
const RECORDS_ID_RANGE = "records!A:A";
const RECORDS_DATE_RANGE = "records!B:B";
const TEMPLATES_RANGE = "templates!A:I";
const USER_RANGE = "user!A:AB";

type Primitive = string | number;
const SHEET_NAME_RE = /^[A-Za-z0-9_]+$/;
const COLUMN_RE = /^[A-Z]+$/;
const MAX_BATCH_RANGES = 100;
const sheetIdCache = new Map<string, number>();

const normalizeEnv = (name: string): string => {
  const raw = process.env[name];
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const escapePrivateKey = (privateKey: string) => {
  const trimmed = privateKey.trim();
  const unquoted =
    trimmed.startsWith("\"") && trimmed.endsWith("\"") ? trimmed.slice(1, -1).trim() : trimmed;
  return unquoted.replace(/\\n/g, "\n");
};

const buildAuth = () => {
  const clientEmail = normalizeEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = normalizeEnv("GOOGLE_PRIVATE_KEY");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google service account credentials");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: escapePrivateKey(privateKey),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

export const getSheets = async (): Promise<sheets_v4.Sheets> => {
  const auth = buildAuth();
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
};

export const getSheetId = (): string => {
  const spreadsheetId = normalizeEnv("GOOGLE_SHEETS_ID");
  if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEETS_ID");
  return spreadsheetId;
};

export const listRows = async (range: string): Promise<string[][]> => {
  const sheets = await getSheets();
  const spreadsheetId = getSheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = (response.data.values ?? []) as string[][];
  if (rows.length <= 1) return [];
  return rows.slice(1);
};

export const appendRow = async (range: string, row: Primitive[]) => {
  const sheets = await getSheets();
  const spreadsheetId = getSheetId();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  const updatedRange = response.data.updates?.updatedRange;
  const rowIndex = updatedRange ? parseUpdatedRangeRowIndex(updatedRange) : null;
  return { rowIndex };
};

export const updateRow = async (
  range: string,
  rowIndex: number,
  rowValues: Primitive[]
) => {
  const sheets = await getSheets();
  const spreadsheetId = getSheetId();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${range.split("!")[0]}!A${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [rowValues] },
  });
};

export const deleteRowByIndex = async (sheetName: string, rowIndex: number) => {
  const sheets = await getSheets();
  const spreadsheetId = getSheetId();
  const sheetId = await resolveSheetId(sheets, spreadsheetId, sheetName);

  if (sheetId === undefined) throw new Error(`Sheet not found: ${sheetName}`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
};

export const listColumn = async (range: string): Promise<string[]> => {
  const rows = await listRows(range);
  return rows.map((row) => row[0] ?? "");
};

export const listRecordIdColumn = async () => listColumn(RECORDS_ID_RANGE);
export const listRecordDateColumn = async () => listColumn(RECORDS_DATE_RANGE);

export const getRowsByIndexes = async (
  sheetName: string,
  lastColumn: string,
  rowIndexes: number[]
): Promise<string[][]> => {
  if (!SHEET_NAME_RE.test(sheetName)) throw new Error("Invalid sheet name");
  if (!COLUMN_RE.test(lastColumn)) throw new Error("Invalid column reference");

  const sortedIndexes = Array.from(new Set(rowIndexes))
    .filter((rowIndex) => Number.isInteger(rowIndex) && rowIndex >= 2)
    .sort((a, b) => a - b);

  if (sortedIndexes.length === 0) return [];

  const sheets = await getSheets();
  const spreadsheetId = getSheetId();
  const rows: string[][] = [];

  for (let i = 0; i < sortedIndexes.length; i += MAX_BATCH_RANGES) {
    const slice = sortedIndexes.slice(i, i + MAX_BATCH_RANGES);
    const ranges = slice.map((rowIndex) => `${sheetName}!A${rowIndex}:${lastColumn}${rowIndex}`);
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });
    const values = response.data.valueRanges ?? [];
    values.forEach((valueRange) => {
      const row = valueRange.values?.[0] as string[] | undefined;
      if (row) rows.push(row);
    });
  }

  return rows;
};

export const parseRecord = (row: string[]): MealRecord => ({
  id: row[0] ?? "",
  date: row[1] ?? "",
  food_name: row[3] ?? "",
  amount: toNumber(row[4]),
  calories: toNumber(row[5]),
  carbs: toNumber(row[6]),
  protein: toNumber(row[7]),
  fat: toNumber(row[8]),
  sugar: toNumber(row[9]),
  sodium: toNumber(row[10]),
});

export const parseTemplate = (row: string[]): TemplateItem => ({
  id: row[0] ?? "",
  food_name: row[1] ?? "",
  base_amount: toNumber(row[2]),
  calories: toNumber(row[3]),
  carbs: toNumber(row[4]),
  protein: toNumber(row[5]),
  fat: toNumber(row[6]),
  sugar: toNumber(row[7]),
  sodium: toNumber(row[8]),
});

export const parseUserTargets = (row: string[] | null): DailyTargets | null => {
  if (!row) return null;
  return {
    calories: toNumber(row[0]),
    carbs: toNumber(row[1]),
    protein: toNumber(row[2]),
    fat: toNumber(row[3]),
    sugar: toNumber(row[4]),
    sodium: toNumber(row[5]),
  };
};

const parseOptionalText = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const parseOptionalNumber = (value: string | undefined): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseOptionalString = <T extends string>(
  value: string | undefined,
  allowed: readonly T[]
): T | undefined => {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
};

export const parseUserProfile = (row: string[] | null): UserProfileInput | null => {
  if (!row) return null;
  const gender = parseOptionalString(row[6], ["male", "female"] as const);
  const age = parseOptionalNumber(row[7]);
  const heightCm = parseOptionalNumber(row[8]);
  const weightKg = parseOptionalNumber(row[9]);
  const rawGoal = row[10];
  const normalizedGoal =
    rawGoal === "overfat" || rawGoal === "obese" || rawGoal === "severe_obese" ? "cutting" : rawGoal;
  const primaryGoal = parseOptionalString(
    normalizedGoal,
    ["cutting", "maintenance", "bulking", "recomposition"] as const
  );

  if (!gender || !age || !heightCm || !weightKg || !primaryGoal) {
    return null;
  }

  return {
    gender,
    age,
    heightCm,
    weightKg,
    primaryGoal,
    occupationalActivityLevel: parseOptionalString(row[12], [
      "sedentary",
      "light",
      "moderate",
      "very",
      "extra",
    ] as const),
    exerciseFrequencyWeekly: parseOptionalNumber(row[13]),
    exerciseDurationMin: parseOptionalNumber(row[14]),
    exerciseIntensity: parseOptionalString(row[15], ["low", "medium", "high"] as const),
    neatLevel: parseOptionalString(row[16], ["sedentary", "light", "moderate", "very", "extra"] as const),
    bodyFatPct: parseOptionalNumber(row[17]),
    skeletalMuscleKg: parseOptionalNumber(row[18]),
    waistHipRatio: parseOptionalNumber(row[19]),
    waistCm: parseOptionalNumber(row[26]),
  };
};

export const parseUserAi = (row: string[] | null): NutritionTargets | null => {
  if (!row) return null;
  const bmr = parseOptionalNumber(row[20]);
  const tdee = parseOptionalNumber(row[21]);
  const targetCalories = parseOptionalNumber(row[22]);
  const notes = parseOptionalText(row[23]);
  const source = parseOptionalString(row[24], ["ai", "fallback"] as const);
  const updatedAt = parseOptionalText(row[25]);

  if (bmr === undefined || tdee === undefined || targetCalories === undefined) return null;

  return {
    bmr,
    tdee,
    targetCalories,
    calories: toNumber(row[0]),
    carbs: toNumber(row[1]),
    protein: toNumber(row[2]),
    fat: toNumber(row[3]),
    sugar: toNumber(row[4]),
    sodium: toNumber(row[5]),
    aiNotes: notes,
    aiSource: source,
    aiUpdatedAt: updatedAt,
  };
};

export const parseUserDietReview = (
  row: string[] | null
): { text: string; generatedAt: string; from: string; to: string } | null => {
  if (!row) return null;
  const raw = row[27];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<{
      text: string;
      generatedAt: string;
      from: string;
      to: string;
    }>;
    if (!parsed.text || !parsed.generatedAt || !parsed.from || !parsed.to) return null;
    return {
      text: parsed.text,
      generatedAt: parsed.generatedAt,
      from: parsed.from,
      to: parsed.to,
    };
  } catch {
    return null;
  }
};

export const serializeUserRow = (
  targets: DailyTargets,
  profile: UserProfileInput | null | undefined,
  ai?: NutritionTargets | null,
  dietReview?: { text: string; generatedAt: string; from: string; to: string } | null
): Array<string | number> => [
  targets.calories,
  targets.carbs,
  targets.protein,
  targets.fat,
  targets.sugar,
  targets.sodium,
  profile?.gender ?? "",
  profile?.age ?? "",
  profile?.heightCm ?? "",
  profile?.weightKg ?? "",
  profile?.primaryGoal ?? "",
  "",
  profile?.occupationalActivityLevel ?? "",
  profile?.exerciseFrequencyWeekly ?? "",
  profile?.exerciseDurationMin ?? "",
  profile?.exerciseIntensity ?? "",
  profile?.neatLevel ?? "",
  profile?.bodyFatPct ?? "",
  profile?.skeletalMuscleKg ?? "",
  profile?.waistHipRatio ?? "",
  ai?.bmr ?? "",
  ai?.tdee ?? "",
  ai?.targetCalories ?? "",
  ai?.aiNotes ?? "",
  ai?.aiSource ?? "",
  ai?.aiUpdatedAt ?? "",
  profile?.waistCm ?? "",
  dietReview ? JSON.stringify(dietReview) : "",
];

export const RANGES = {
  records: RECORDS_RANGE,
  recordIds: RECORDS_ID_RANGE,
  recordDates: RECORDS_DATE_RANGE,
  templates: TEMPLATES_RANGE,
  user: USER_RANGE,
} as const;


const parseUpdatedRangeRowIndex = (updatedRange: string): number | null => {
  const match = /![A-Z]+(\d+):/.exec(updatedRange);
  if (!match) return null;
  const rowIndex = Number(match[1]);
  return Number.isInteger(rowIndex) ? rowIndex : null;
};

const resolveSheetId = async (
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string
): Promise<number | undefined> => {
  if (sheetIdCache.has(sheetName)) return sheetIdCache.get(sheetName);

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find((item) => item.properties?.title === sheetName);
  const rawSheetId = sheet?.properties?.sheetId;
  const sheetId = typeof rawSheetId === "number" ? rawSheetId : undefined;
  if (sheetId !== undefined) sheetIdCache.set(sheetName, sheetId);
  return sheetId;
};
