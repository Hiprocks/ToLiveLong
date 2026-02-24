import { google, sheets_v4 } from "googleapis";
import { DailyTargets, MealRecord, TemplateItem } from "@/lib/types";

const RECORDS_RANGE = "records!A:K";
const TEMPLATES_RANGE = "templates!A:I";
const USER_RANGE = "user!A:F";

type Primitive = string | number;

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const escapePrivateKey = (privateKey: string) => privateKey.replace(/\\n/g, "\n");

const buildAuth = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

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
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
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
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
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
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find((item) => item.properties?.title === sheetName);
  const sheetId = sheet?.properties?.sheetId;

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

export const parseRecord = (row: string[]): MealRecord => ({
  id: row[0] ?? "",
  date: row[1] ?? "",
  meal_type: (row[2] as MealRecord["meal_type"]) ?? "breakfast",
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

export const RANGES = {
  records: RECORDS_RANGE,
  templates: TEMPLATES_RANGE,
  user: USER_RANGE,
} as const;

