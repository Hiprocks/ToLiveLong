import { FoodIndexItem } from "@/lib/types";

type RawFood = FoodIndexItem & { aliases?: string[] };

const FOODS_INDEX: RawFood[] = [
  { id: "mfds-001", name: "현미밥", source: "mfds", baseAmount: 100, calories: 149, carbs: 31, protein: 3, fat: 1, sugar: 0, sodium: 3, aliases: ["잡곡밥"] },
  { id: "mfds-002", name: "흰쌀밥", source: "mfds", baseAmount: 100, calories: 130, carbs: 28, protein: 2, fat: 0, sugar: 0, sodium: 1, aliases: ["쌀밥", "공깃밥", "공기밥"] },
  { id: "mfds-003", name: "닭가슴살", source: "mfds", baseAmount: 100, calories: 120, carbs: 0, protein: 23, fat: 2, sugar: 0, sodium: 65, aliases: ["닭가슴"] },
  { id: "mfds-004", name: "계란", source: "mfds", baseAmount: 100, calories: 155, carbs: 1, protein: 13, fat: 11, sugar: 1, sodium: 124, aliases: ["달걀", "삶은계란"] },
  { id: "mfds-005", name: "고구마", source: "mfds", baseAmount: 100, calories: 128, carbs: 30, protein: 1, fat: 0, sugar: 6, sodium: 15 },
  { id: "mfds-006", name: "감자", source: "mfds", baseAmount: 100, calories: 77, carbs: 17, protein: 2, fat: 0, sugar: 1, sodium: 6 },
  { id: "mfds-007", name: "바나나", source: "mfds", baseAmount: 100, calories: 93, carbs: 24, protein: 1, fat: 0, sugar: 12, sodium: 1 },
  { id: "mfds-008", name: "사과", source: "mfds", baseAmount: 100, calories: 57, carbs: 15, protein: 0, fat: 0, sugar: 11, sodium: 1 },
  { id: "mfds-009", name: "두부", source: "mfds", baseAmount: 100, calories: 79, carbs: 2, protein: 8, fat: 5, sugar: 0, sodium: 7 },
  { id: "mfds-010", name: "오트밀", source: "mfds", baseAmount: 100, calories: 380, carbs: 67, protein: 13, fat: 7, sugar: 1, sodium: 3 },
  { id: "mfds-011", name: "우유", source: "mfds", baseAmount: 100, calories: 65, carbs: 5, protein: 3, fat: 4, sugar: 5, sodium: 50 },
  { id: "mfds-012", name: "그릭요거트", source: "mfds", baseAmount: 100, calories: 96, carbs: 4, protein: 9, fat: 5, sugar: 4, sodium: 36, aliases: ["요거트"] },
  { id: "mfds-013", name: "연어구이", source: "korean_standard_food", baseAmount: 100, calories: 208, carbs: 0, protein: 22, fat: 13, sugar: 0, sodium: 59, aliases: ["연어"] },
  { id: "mfds-014", name: "김치찌개", source: "korean_standard_food", baseAmount: 100, calories: 58, carbs: 4, protein: 4, fat: 3, sugar: 2, sodium: 420 },
  { id: "mfds-015", name: "된장찌개", source: "korean_standard_food", baseAmount: 100, calories: 52, carbs: 4, protein: 4, fat: 2, sugar: 1, sodium: 480 },
  { id: "mfds-016", name: "비빔밥", source: "korean_standard_food", baseAmount: 100, calories: 140, carbs: 23, protein: 4, fat: 3, sugar: 2, sodium: 220 },
  { id: "mfds-017", name: "불고기", source: "korean_standard_food", baseAmount: 100, calories: 190, carbs: 7, protein: 14, fat: 11, sugar: 6, sodium: 420 },
  { id: "mfds-018", name: "잡채", source: "korean_standard_food", baseAmount: 100, calories: 145, carbs: 20, protein: 3, fat: 6, sugar: 5, sodium: 260 },
  { id: "mfds-019", name: "김밥", source: "korean_standard_food", baseAmount: 100, calories: 170, carbs: 28, protein: 5, fat: 4, sugar: 2, sodium: 310 },
  { id: "mfds-020", name: "라면", source: "korean_standard_food", baseAmount: 100, calories: 114, carbs: 17, protein: 3, fat: 4, sugar: 2, sodium: 620 },
  { id: "mfds-021", name: "삼겹살", source: "korean_standard_ingredient", baseAmount: 100, calories: 331, carbs: 0, protein: 15, fat: 30, sugar: 0, sodium: 45, aliases: ["돼지고기삼겹"] },
  { id: "mfds-022", name: "제육볶음", source: "korean_standard_food", baseAmount: 100, calories: 195, carbs: 8, protein: 13, fat: 12, sugar: 5, sodium: 430 },
  { id: "mfds-023", name: "김치볶음밥", source: "korean_standard_food", baseAmount: 100, calories: 180, carbs: 28, protein: 4, fat: 6, sugar: 2, sodium: 390 },
  { id: "mfds-024", name: "짜장면", source: "korean_standard_food", baseAmount: 100, calories: 155, carbs: 24, protein: 5, fat: 4, sugar: 3, sodium: 410 },
  { id: "mfds-025", name: "짬뽕", source: "korean_standard_food", baseAmount: 100, calories: 83, carbs: 11, protein: 4, fat: 2, sugar: 2, sodium: 360 },
  { id: "mfds-026", name: "떡볶이", source: "korean_standard_food", baseAmount: 100, calories: 170, carbs: 31, protein: 3, fat: 4, sugar: 7, sodium: 320 },
  { id: "mfds-027", name: "순두부찌개", source: "korean_standard_food", baseAmount: 100, calories: 65, carbs: 3, protein: 5, fat: 4, sugar: 1, sodium: 430 },
  { id: "mfds-028", name: "닭볶음탕", source: "korean_standard_food", baseAmount: 100, calories: 140, carbs: 6, protein: 12, fat: 7, sugar: 2, sodium: 350 },
  { id: "mfds-029", name: "갈비탕", source: "korean_standard_food", baseAmount: 100, calories: 75, carbs: 3, protein: 7, fat: 4, sugar: 1, sodium: 250 },
  { id: "mfds-030", name: "미역국", source: "korean_standard_food", baseAmount: 100, calories: 31, carbs: 2, protein: 3, fat: 1, sugar: 0, sodium: 190 },
  { id: "mfds-031", name: "된장국", source: "korean_standard_food", baseAmount: 100, calories: 24, carbs: 2, protein: 2, fat: 1, sugar: 0, sodium: 280 },
  { id: "mfds-032", name: "콩나물국", source: "korean_standard_food", baseAmount: 100, calories: 18, carbs: 2, protein: 2, fat: 0, sugar: 0, sodium: 180 },
  { id: "mfds-033", name: "샐러드", source: "fallback", baseAmount: 100, calories: 70, carbs: 8, protein: 2, fat: 3, sugar: 3, sodium: 120, aliases: ["야채샐러드"] },
  { id: "mfds-034", name: "닭가슴살샐러드", source: "fallback", baseAmount: 100, calories: 110, carbs: 7, protein: 11, fat: 4, sugar: 2, sodium: 180 },
  { id: "mfds-035", name: "치킨", source: "fallback", baseAmount: 100, calories: 250, carbs: 10, protein: 18, fat: 15, sugar: 1, sodium: 520, aliases: ["후라이드치킨"] },
  { id: "mfds-036", name: "피자", source: "fallback", baseAmount: 100, calories: 266, carbs: 33, protein: 11, fat: 10, sugar: 3, sodium: 620 },
  { id: "mfds-037", name: "햄버거", source: "fallback", baseAmount: 100, calories: 295, carbs: 30, protein: 13, fat: 13, sugar: 5, sodium: 540 },
  { id: "mfds-038", name: "돈까스", source: "korean_standard_food", baseAmount: 100, calories: 270, carbs: 17, protein: 13, fat: 16, sugar: 2, sodium: 430 },
  { id: "mfds-039", name: "냉면", source: "korean_standard_food", baseAmount: 100, calories: 115, carbs: 22, protein: 3, fat: 1, sugar: 3, sodium: 290 },
  { id: "mfds-040", name: "우동", source: "korean_standard_food", baseAmount: 100, calories: 105, carbs: 20, protein: 3, fat: 1, sugar: 1, sodium: 300 },
];

const DEFAULT_DB_SERVINGS: Record<string, number> = {
  "mfds-001": 210,
  "mfds-002": 210,
  "mfds-003": 150,
  "mfds-004": 60,
  "mfds-005": 150,
  "mfds-006": 140,
  "mfds-007": 120,
  "mfds-008": 130,
  "mfds-009": 130,
  "mfds-010": 80,
  "mfds-011": 200,
  "mfds-012": 120,
  "mfds-013": 180,
  "mfds-014": 220,
  "mfds-015": 220,
  "mfds-016": 450,
  "mfds-017": 200,
  "mfds-018": 300,
  "mfds-019": 250,
  "mfds-020": 500,
  "mfds-022": 250,
  "mfds-023": 350,
  "mfds-024": 700,
  "mfds-025": 260,
  "mfds-026": 300,
  "mfds-027": 220,
  "mfds-028": 220,
  "mfds-029": 250,
  "mfds-030": 300,
  "mfds-031": 300,
  "mfds-032": 220,
  "mfds-033": 220,
  "mfds-034": 250,
  "mfds-035": 300,
  "mfds-036": 200,
  "mfds-037": 190,
  "mfds-038": 240,
  "mfds-039": 650,
  "mfds-040": 650,
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "").trim();

const scoreEntry = (entry: RawFood, keyword: string): number => {
  const fields = [entry.name, ...(entry.aliases ?? [])].map(normalize);
  let score = 0;

  for (const field of fields) {
    if (field === keyword) score = Math.max(score, 120);
    else if (field.startsWith(keyword)) score = Math.max(score, 100);
    else if (field.includes(keyword)) score = Math.max(score, 80);
  }

  const tokens = keyword.split(/[^a-z0-9가-힣]+/).filter(Boolean);
  if (tokens.length > 1) {
    const tokenMatches = tokens.filter((token) => fields.some((field) => field.includes(token))).length;
    if (tokenMatches === tokens.length) score = Math.max(score, 70);
    else if (tokenMatches > 0) score = Math.max(score, 60);
  }

  return score;
};

export const searchFoodsIndex = (query: string, limit = 20): FoodIndexItem[] => {
  const keyword = normalize(query);
  if (!keyword) return [];
  const limited = Math.min(Math.max(limit, 1), 50);

  const scored = FOODS_INDEX.map((entry) => ({ entry, score: scoreEntry(entry, keyword) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, limited)
    .map((item) => ({
      id: item.entry.id,
      name: item.entry.name,
      source: item.entry.source,
      baseAmount: item.entry.baseAmount,
      defaultAmount: DEFAULT_DB_SERVINGS[item.entry.id],
      calories: item.entry.calories,
      carbs: item.entry.carbs,
      protein: item.entry.protein,
      fat: item.entry.fat,
      sugar: item.entry.sugar,
      sodium: item.entry.sodium,
    }));

  return scored;
};
