import { writeFileSync } from "node:fs";

const ENDPOINT = "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02";

const TARGETS = [
  { id: "mfds-003", name: "닭가슴살", local: { calories: 120, carbs: 0, protein: 23, fat: 2, sugar: 0, sodium: 65 } },
  { id: "mfds-096", name: "돼지목살", local: { calories: 242, carbs: 0, protein: 18, fat: 19, sugar: 0, sodium: 62 } },
  { id: "mfds-097", name: "돼지등심", local: { calories: 210, carbs: 0, protein: 21, fat: 13, sugar: 0, sodium: 58 } },
  { id: "mfds-098", name: "돼지안심", local: { calories: 143, carbs: 0, protein: 22, fat: 5, sugar: 0, sodium: 52 } },
  { id: "mfds-101", name: "돼지갈비", local: { calories: 295, carbs: 0, protein: 17, fat: 25, sugar: 0, sodium: 72 } },
  { id: "mfds-102", name: "소등심", local: { calories: 226, carbs: 0, protein: 20, fat: 16, sugar: 0, sodium: 55 } },
  { id: "mfds-103", name: "소안심", local: { calories: 166, carbs: 0, protein: 22, fat: 8, sugar: 0, sodium: 50 } },
  { id: "mfds-104", name: "소채끝살", local: { calories: 210, carbs: 0, protein: 21, fat: 14, sugar: 0, sodium: 53 } },
  { id: "mfds-108", name: "소갈비", local: { calories: 288, carbs: 0, protein: 18, fat: 24, sugar: 0, sodium: 66 } },
  { id: "mfds-109", name: "차돌박이", local: { calories: 374, carbs: 0, protein: 14, fat: 35, sugar: 0, sodium: 64 } },
  { id: "mfds-111", name: "닭다리살", local: { calories: 182, carbs: 0, protein: 18, fat: 12, sugar: 0, sodium: 75 } },
  { id: "mfds-112", name: "닭안심", local: { calories: 110, carbs: 0, protein: 23, fat: 2, sugar: 0, sodium: 62 } },
  { id: "mfds-117", name: "고등어", local: { calories: 205, carbs: 0, protein: 19, fat: 14, sugar: 0, sodium: 95 } },
  { id: "mfds-118", name: "연어", local: { calories: 208, carbs: 0, protein: 20, fat: 13, sugar: 0, sodium: 55 } },
  { id: "mfds-119", name: "참치", local: { calories: 132, carbs: 0, protein: 29, fat: 1, sugar: 0, sodium: 46 } },
];

const normalize = (v) => v.toLowerCase().replace(/\s+/g, "").trim();

const getString = (row, keys) => {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};

const getNumber = (row, keys) => {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v.replace(/,/g, "").trim());
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
};

const collectRows = (obj) => {
  if (!obj || typeof obj !== "object") return [];
  const cur = obj;

  for (const key of ["item", "items", "row"]) {
    const candidate = cur[key];
    if (Array.isArray(candidate)) return candidate.filter((v) => typeof v === "object" && v !== null);
  }

  for (const value of Object.values(cur)) {
    if (value && typeof value === "object") {
      const nested = collectRows(value);
      if (nested.length > 0) return nested;
    }
  }
  return [];
};

const pickBestMatch = (rows, foodName) => {
  if (!rows.length) return null;
  const keyword = normalize(foodName);
  let best = null;

  for (const row of rows) {
    const name = getString(row, ["FOOD_NM", "foodNm", "DESC_KOR", "desc_kor", "food_name"]);
    if (!name) continue;
    const n = normalize(name);
    let score = 0;
    if (n === keyword) score = 120;
    else if (n.startsWith(keyword)) score = 100;
    else if (n.includes(keyword)) score = 80;
    if (!best || score > best.score) best = { score, row };
  }

  return best?.row ?? null;
};

const fetchOfficialRows = async (serviceKey, foodName) => {
  const base = new URL(ENDPOINT);
  base.searchParams.set("serviceKey", serviceKey);
  base.searchParams.set("type", "json");
  base.searchParams.set("pageNo", "1");
  base.searchParams.set("numOfRows", "50");

  const params = [
    ["foodNm", foodName],
    ["FOOD_NM", foodName],
  ];

  for (const [k, v] of params) {
    const url = new URL(base);
    url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    if (!res.ok) continue;
    const text = await res.text();
    if (!text) continue;
    try {
      const parsed = JSON.parse(text);
      const rows = collectRows(parsed);
      if (rows.length > 0) return rows;
    } catch {
      // ignore parse error and try next param key
    }
  }
  return [];
};

const main = async () => {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("DATA_GO_KR_SERVICE_KEY is required");
  }

  const report = [];
  for (const target of TARGETS) {
    const rows = await fetchOfficialRows(serviceKey, target.name);
    const picked = pickBestMatch(rows, target.name);
    const official = picked
      ? {
          name: getString(picked, ["FOOD_NM", "foodNm", "DESC_KOR", "desc_kor", "food_name"]),
          calories: getNumber(picked, ["NUTR_CONT1", "ENERC", "kcal", "KCAL"]),
          carbs: getNumber(picked, ["NUTR_CONT2", "CHOCDF", "CHOAVL", "carbs"]),
          protein: getNumber(picked, ["NUTR_CONT3", "PROCNT", "protein"]),
          fat: getNumber(picked, ["NUTR_CONT4", "FATCE", "fat"]),
          sugar: getNumber(picked, ["NUTR_CONT5", "SUGAR", "sugar"]),
          sodium: getNumber(picked, ["NUTR_CONT6", "NA", "sodium"]),
        }
      : null;

    report.push({
      id: target.id,
      foodName: target.name,
      local: target.local,
      official,
      status: official ? "FOUND" : "NOT_FOUND",
    });
  }

  const outputPath = "docs/official-protein-verification.json";
  writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");

  const found = report.filter((item) => item.status === "FOUND").length;
  console.log(`Saved ${report.length} rows to ${outputPath}`);
  console.log(`FOUND=${found}, NOT_FOUND=${report.length - found}`);
};

main();
