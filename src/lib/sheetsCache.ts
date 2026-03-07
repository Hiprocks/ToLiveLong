import { revalidateTag as _revalidateTag, unstable_cache } from "next/cache";

/**
 * Next.js 16 changed revalidateTag to require a second `profile` argument for the new
 * `use cache` directive. For `unstable_cache`-based invalidation the tag-only form still
 * works at runtime, so we cast away the extra argument.
 */
export const revalidateCacheTag = _revalidateTag as (tag: string) => void;
import {
  getRowsByIndexes,
  listRecordDateColumn,
  listRows,
  parseRecord,
  parseTemplate,
  RANGES,
} from "@/lib/sheets";
import { MealRecord, TemplateItem } from "@/lib/types";

export type DailySummary = {
  date: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

export const CACHE_TAGS = {
  records: "records",
  templates: "templates",
  user: "user",
} as const;

const RECORDS_TTL = 30;
const TEMPLATES_TTL = 300;
const USER_TTL = 300;

const sortRecentFirst = (records: MealRecord[]): MealRecord[] =>
  [...records].reverse();

const _fetchRecordsByDate = async (date: string): Promise<MealRecord[]> => {
  const dateColumn = await listRecordDateColumn();
  const rowIndexes = dateColumn
    .map((value, index) => (value === date ? index + 2 : null))
    .filter((rowIndex): rowIndex is number => rowIndex !== null);

  if (rowIndexes.length === 0) return [];

  const rows = await getRowsByIndexes("records", "K", rowIndexes);
  return sortRecentFirst(
    rows.map(parseRecord).filter((row) => row.id && row.food_name)
  );
};

const _fetchAllRecords = async (): Promise<MealRecord[]> => {
  const rows = await listRows(RANGES.records);
  return sortRecentFirst(
    rows.map(parseRecord).filter((row) => row.id && row.food_name)
  );
};

const _fetchTemplates = async (): Promise<TemplateItem[]> => {
  const rows = await listRows(RANGES.templates);
  return rows
    .map(parseTemplate)
    .filter((row) => row.id && row.food_name)
    .reverse();
};

const _fetchUserRows = async (): Promise<string[][]> => {
  return listRows(RANGES.user);
};

const _fetchSummary = async (from: string, to: string): Promise<DailySummary[]> => {
  const rows = await listRows(RANGES.records);
  const records = rows.map(parseRecord).filter((r) => r.id && r.food_name && r.date >= from && r.date <= to);

  const map = new Map<string, DailySummary>();
  for (const r of records) {
    const existing = map.get(r.date);
    if (existing) {
      existing.calories += r.calories;
      existing.carbs += r.carbs;
      existing.protein += r.protein;
      existing.fat += r.fat;
    } else {
      map.set(r.date, {
        date: r.date,
        calories: r.calories,
        carbs: r.carbs,
        protein: r.protein,
        fat: r.fat,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const getCachedRecordsByDate = unstable_cache(
  _fetchRecordsByDate,
  ["sheets-records-by-date"],
  { tags: [CACHE_TAGS.records], revalidate: RECORDS_TTL }
);

export const getCachedAllRecords = unstable_cache(
  _fetchAllRecords,
  ["sheets-records-all"],
  { tags: [CACHE_TAGS.records], revalidate: RECORDS_TTL }
);

export const getCachedTemplates = unstable_cache(
  _fetchTemplates,
  ["sheets-templates"],
  { tags: [CACHE_TAGS.templates], revalidate: TEMPLATES_TTL }
);

export const getCachedUserRows = unstable_cache(
  _fetchUserRows,
  ["sheets-user"],
  { tags: [CACHE_TAGS.user], revalidate: USER_TTL }
);

export const getCachedSummary = unstable_cache(
  _fetchSummary,
  ["sheets-records-summary"],
  { tags: [CACHE_TAGS.records], revalidate: RECORDS_TTL }
);
