import { FoodIndexItem } from "@/lib/types";

type RawFood = FoodIndexItem & { aliases?: string[] };
type IndexedFood = {
  normalizedFields: string[];
  item: FoodIndexItem;
};

const FOODS_INDEX: RawFood[] = [
  { id: "mfds-001", name: "현미밥", source: "mfds", baseAmount: 100, defaultAmount: 210, defaultAmountSource: "official_serving", calories: 149, carbs: 31, protein: 3, fat: 1, sugar: 0, sodium: 3, aliases: ["잡곡밥"] },
  { id: "mfds-002", name: "흰쌀밥", source: "mfds", baseAmount: 100, defaultAmount: 210, defaultAmountSource: "official_serving", calories: 130, carbs: 28, protein: 2, fat: 0, sugar: 0, sodium: 1, aliases: ["쌀밥", "공깃밥", "공기밥"] },
  { id: "mfds-003", name: "닭가슴살", source: "mfds", baseAmount: 100, defaultAmount: 150, defaultAmountSource: "official_serving", calories: 106, carbs: 0, protein: 23, fat: 1, sugar: 0, sodium: 45, aliases: ["닭가슴"] },
  { id: "mfds-004", name: "계란", source: "mfds", baseAmount: 100, defaultAmount: 60, defaultAmountSource: "official_serving", calories: 155, carbs: 1, protein: 13, fat: 11, sugar: 1, sodium: 124, aliases: ["달걀", "삶은계란"] },
  { id: "mfds-005", name: "고구마", source: "mfds", baseAmount: 100, defaultAmount: 150, defaultAmountSource: "official_serving", calories: 128, carbs: 30, protein: 1, fat: 0, sugar: 6, sodium: 15 },
  { id: "mfds-006", name: "감자", source: "mfds", baseAmount: 100, defaultAmount: 140, defaultAmountSource: "official_serving", calories: 77, carbs: 17, protein: 2, fat: 0, sugar: 1, sodium: 6 },
  { id: "mfds-007", name: "바나나", source: "mfds", baseAmount: 100, defaultAmount: 120, defaultAmountSource: "official_serving", calories: 93, carbs: 24, protein: 1, fat: 0, sugar: 12, sodium: 1 },
  { id: "mfds-008", name: "사과", source: "mfds", baseAmount: 100, defaultAmount: 180, defaultAmountSource: "official_serving", calories: 57, carbs: 15, protein: 0, fat: 0, sugar: 11, sodium: 1 },
  { id: "mfds-009", name: "두부", source: "mfds", baseAmount: 100, defaultAmount: 130, defaultAmountSource: "official_serving", calories: 79, carbs: 2, protein: 8, fat: 5, sugar: 0, sodium: 7 },
  { id: "mfds-010", name: "오트밀", source: "mfds", baseAmount: 100, defaultAmount: 80, defaultAmountSource: "official_serving", calories: 380, carbs: 67, protein: 13, fat: 7, sugar: 1, sodium: 3 },
  { id: "mfds-011", name: "우유", source: "mfds", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "official_serving", calories: 65, carbs: 5, protein: 3, fat: 4, sugar: 5, sodium: 50 },
  { id: "mfds-012", name: "그릭요거트", source: "mfds", baseAmount: 100, defaultAmount: 120, defaultAmountSource: "official_serving", calories: 96, carbs: 4, protein: 9, fat: 5, sugar: 4, sodium: 36, aliases: ["요거트"] },
  { id: "mfds-013", name: "연어구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 180, defaultAmountSource: "official_serving", calories: 208, carbs: 0, protein: 22, fat: 13, sugar: 0, sodium: 59, aliases: ["연어"] },
  { id: "mfds-014", name: "김치찌개", source: "korean_standard_food", baseAmount: 100, defaultAmount: 350, defaultAmountSource: "official_serving", calories: 58, carbs: 4, protein: 4, fat: 3, sugar: 2, sodium: 490 },
  { id: "mfds-015", name: "된장찌개", source: "korean_standard_food", baseAmount: 100, defaultAmount: 350, defaultAmountSource: "official_serving", calories: 52, carbs: 4, protein: 4, fat: 2, sugar: 1, sodium: 480 },
  { id: "mfds-016", name: "비빔밥", source: "korean_standard_food", baseAmount: 100, defaultAmount: 500, defaultAmountSource: "official_serving", calories: 140, carbs: 23, protein: 4, fat: 3, sugar: 2, sodium: 220 },
  { id: "mfds-017", name: "불고기", source: "korean_standard_food", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "official_serving", calories: 190, carbs: 7, protein: 14, fat: 11, sugar: 6, sodium: 420 },
  { id: "mfds-018", name: "잡채", source: "korean_standard_food", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "official_serving", calories: 145, carbs: 20, protein: 3, fat: 6, sugar: 5, sodium: 260 },
  { id: "mfds-019", name: "김밥", source: "korean_standard_food", baseAmount: 100, defaultAmount: 250, defaultAmountSource: "official_serving", calories: 170, carbs: 28, protein: 5, fat: 4, sugar: 2, sodium: 310 },
  { id: "mfds-020", name: "라면", source: "korean_standard_food", baseAmount: 100, defaultAmount: 500, defaultAmountSource: "official_serving", calories: 114, carbs: 17, protein: 3, fat: 4, sugar: 2, sodium: 620 },
  { id: "mfds-021", name: "삼겹살", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 180, defaultAmountSource: "official_serving", calories: 363, carbs: 0, protein: 15, fat: 33, sugar: 0, sodium: 56, aliases: ["돼지고기삼겹"] },
  { id: "mfds-022", name: "제육볶음", source: "korean_standard_food", baseAmount: 100, defaultAmount: 250, defaultAmountSource: "official_serving", calories: 195, carbs: 8, protein: 13, fat: 12, sugar: 5, sodium: 430 },
  { id: "mfds-023", name: "김치볶음밥", source: "korean_standard_food", baseAmount: 100, defaultAmount: 350, defaultAmountSource: "official_serving", calories: 180, carbs: 28, protein: 4, fat: 6, sugar: 2, sodium: 390 },
  { id: "mfds-024", name: "짜장면", source: "korean_standard_food", baseAmount: 100, defaultAmount: 650, defaultAmountSource: "official_serving", calories: 123, carbs: 19, protein: 4, fat: 3, sugar: 3, sodium: 410 },
  { id: "mfds-025", name: "짬뽕", source: "korean_standard_food", baseAmount: 100, defaultAmount: 650, defaultAmountSource: "official_serving", calories: 83, carbs: 11, protein: 4, fat: 2, sugar: 2, sodium: 360 },
  { id: "mfds-026", name: "떡볶이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "official_serving", calories: 170, carbs: 31, protein: 3, fat: 4, sugar: 7, sodium: 320 },
  { id: "mfds-027", name: "순두부찌개", source: "korean_standard_food", baseAmount: 100, defaultAmount: 400, defaultAmountSource: "official_serving", calories: 65, carbs: 3, protein: 5, fat: 4, sugar: 1, sodium: 430 },
  { id: "mfds-028", name: "닭볶음탕", source: "korean_standard_food", baseAmount: 100, defaultAmount: 350, defaultAmountSource: "official_serving", calories: 140, carbs: 6, protein: 12, fat: 7, sugar: 2, sodium: 350 },
  { id: "mfds-029", name: "갈비탕", source: "korean_standard_food", baseAmount: 100, defaultAmount: 500, defaultAmountSource: "official_serving", calories: 75, carbs: 3, protein: 7, fat: 4, sugar: 1, sodium: 250 },
  { id: "mfds-030", name: "미역국", source: "korean_standard_food", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "official_serving", calories: 31, carbs: 2, protein: 3, fat: 1, sugar: 0, sodium: 190 },
  { id: "mfds-031", name: "된장국", source: "korean_standard_food", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "official_serving", calories: 24, carbs: 2, protein: 2, fat: 1, sugar: 0, sodium: 280 },
  { id: "mfds-032", name: "콩나물국", source: "korean_standard_food", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "official_serving", calories: 18, carbs: 2, protein: 2, fat: 0, sugar: 0, sodium: 180 },
  { id: "mfds-033", name: "샐러드", source: "fallback", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "estimated_serving", calories: 70, carbs: 8, protein: 2, fat: 3, sugar: 3, sodium: 120, aliases: ["야채샐러드"] },
  { id: "mfds-034", name: "닭가슴살샐러드", source: "fallback", baseAmount: 100, defaultAmount: 250, defaultAmountSource: "estimated_serving", calories: 110, carbs: 7, protein: 11, fat: 4, sugar: 2, sodium: 180 },
  { id: "mfds-035", name: "치킨", source: "fallback", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "estimated_serving", calories: 250, carbs: 10, protein: 18, fat: 15, sugar: 1, sodium: 520, aliases: ["후라이드치킨"] },
  { id: "mfds-036", name: "피자", source: "fallback", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "estimated_serving", calories: 266, carbs: 33, protein: 11, fat: 10, sugar: 3, sodium: 620 },
  { id: "mfds-037", name: "햄버거", source: "fallback", baseAmount: 100, defaultAmount: 190, defaultAmountSource: "estimated_serving", calories: 295, carbs: 30, protein: 13, fat: 13, sugar: 5, sodium: 540 },
  { id: "mfds-038", name: "돈까스", source: "korean_standard_food", baseAmount: 100, defaultAmount: 240, defaultAmountSource: "official_serving", calories: 270, carbs: 17, protein: 13, fat: 16, sugar: 2, sodium: 430 },
  { id: "mfds-039", name: "냉면", source: "korean_standard_food", baseAmount: 100, defaultAmount: 650, defaultAmountSource: "official_serving", calories: 115, carbs: 22, protein: 3, fat: 1, sugar: 3, sodium: 290 },
  { id: "mfds-040", name: "우동", source: "korean_standard_food", baseAmount: 100, defaultAmount: 650, defaultAmountSource: "official_serving", calories: 105, carbs: 20, protein: 3, fat: 1, sugar: 1, sodium: 300 },

  { id: "mfds-041", name: "김치", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 40, defaultAmountSource: "official_serving", calories: 29, carbs: 4, protein: 2, fat: 1, sugar: 1, sodium: 650, aliases: ["배추김치"] },
  { id: "mfds-042", name: "깍두기", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 40, defaultAmountSource: "official_serving", calories: 33, carbs: 6, protein: 1, fat: 0, sugar: 3, sodium: 620 },
  { id: "mfds-043", name: "멸치볶음", source: "korean_standard_food", baseAmount: 100, defaultAmount: 40, defaultAmountSource: "official_serving", calories: 320, carbs: 20, protein: 31, fat: 13, sugar: 8, sodium: 980 },
  { id: "mfds-044", name: "시금치나물", source: "korean_standard_food", baseAmount: 100, defaultAmount: 70, defaultAmountSource: "official_serving", calories: 69, carbs: 5, protein: 4, fat: 3, sugar: 1, sodium: 320 },
  { id: "mfds-045", name: "콩자반", source: "korean_standard_food", baseAmount: 100, defaultAmount: 50, defaultAmountSource: "official_serving", calories: 266, carbs: 33, protein: 13, fat: 9, sugar: 12, sodium: 530 },
  { id: "mfds-046", name: "어묵볶음", source: "korean_standard_food", baseAmount: 100, defaultAmount: 80, defaultAmountSource: "official_serving", calories: 171, carbs: 15, protein: 10, fat: 8, sugar: 5, sodium: 720 },
  { id: "mfds-047", name: "계란말이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 120, defaultAmountSource: "official_serving", calories: 180, carbs: 2, protein: 12, fat: 14, sugar: 1, sodium: 300 },
  { id: "mfds-048", name: "계란찜", source: "korean_standard_food", baseAmount: 100, defaultAmount: 180, defaultAmountSource: "official_serving", calories: 92, carbs: 2, protein: 7, fat: 6, sugar: 1, sodium: 220 },
  { id: "mfds-049", name: "고등어구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 180, defaultAmountSource: "official_serving", calories: 226, carbs: 0, protein: 20, fat: 16, sugar: 0, sodium: 90 },
  { id: "mfds-050", name: "갈치구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 180, defaultAmountSource: "official_serving", calories: 180, carbs: 0, protein: 22, fat: 9, sugar: 0, sodium: 110 },
  { id: "mfds-051", name: "고등어조림", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "official_serving", calories: 177, carbs: 6, protein: 17, fat: 9, sugar: 4, sodium: 500 },
  { id: "mfds-052", name: "코다리조림", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "official_serving", calories: 145, carbs: 7, protein: 18, fat: 5, sugar: 3, sodium: 540 },
  { id: "mfds-053", name: "닭갈비", source: "korean_standard_food", baseAmount: 100, defaultAmount: 250, defaultAmountSource: "official_serving", calories: 190, carbs: 9, protein: 14, fat: 11, sugar: 5, sodium: 430 },
  { id: "mfds-054", name: "닭강정", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "estimated_serving", calories: 305, carbs: 27, protein: 16, fat: 15, sugar: 11, sodium: 560 },
  { id: "mfds-055", name: "오징어볶음", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "official_serving", calories: 132, carbs: 9, protein: 13, fat: 5, sugar: 4, sodium: 510 },
  { id: "mfds-056", name: "낙지볶음", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "official_serving", calories: 119, carbs: 8, protein: 14, fat: 4, sugar: 3, sodium: 520 },
  { id: "mfds-057", name: "오삼불고기", source: "korean_standard_food", baseAmount: 100, defaultAmount: 250, defaultAmountSource: "estimated_serving", calories: 182, carbs: 7, protein: 14, fat: 11, sugar: 4, sodium: 470 },
  { id: "mfds-058", name: "보쌈", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "official_serving", calories: 266, carbs: 1, protein: 20, fat: 20, sugar: 0, sodium: 95 },
  { id: "mfds-059", name: "족발", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "official_serving", calories: 247, carbs: 2, protein: 20, fat: 17, sugar: 0, sodium: 160 },
  { id: "mfds-060", name: "수육", source: "korean_standard_food", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "official_serving", calories: 240, carbs: 0, protein: 21, fat: 17, sugar: 0, sodium: 85 },

  { id: "mfds-061", name: "삼계탕", source: "korean_standard_food", baseAmount: 100, defaultAmount: 900, defaultAmountSource: "official_serving", calories: 85, carbs: 2, protein: 9, fat: 4, sugar: 0, sodium: 180 },
  { id: "mfds-062", name: "설렁탕", source: "korean_standard_food", baseAmount: 100, defaultAmount: 600, defaultAmountSource: "official_serving", calories: 45, carbs: 2, protein: 4, fat: 2, sugar: 0, sodium: 260 },
  { id: "mfds-063", name: "곰탕", source: "korean_standard_food", baseAmount: 100, defaultAmount: 600, defaultAmountSource: "official_serving", calories: 58, carbs: 2, protein: 6, fat: 3, sugar: 0, sodium: 280 },
  { id: "mfds-064", name: "육개장", source: "korean_standard_food", baseAmount: 100, defaultAmount: 500, defaultAmountSource: "official_serving", calories: 64, carbs: 4, protein: 5, fat: 3, sugar: 1, sodium: 320 },
  { id: "mfds-065", name: "순대국", source: "korean_standard_food", baseAmount: 100, defaultAmount: 550, defaultAmountSource: "official_serving", calories: 95, carbs: 5, protein: 6, fat: 6, sugar: 1, sodium: 350 },
  { id: "mfds-066", name: "부대찌개", source: "korean_standard_food", baseAmount: 100, defaultAmount: 500, defaultAmountSource: "official_serving", calories: 125, carbs: 7, protein: 6, fat: 8, sugar: 2, sodium: 580 },
  { id: "mfds-067", name: "청국장", source: "korean_standard_food", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "official_serving", calories: 92, carbs: 5, protein: 8, fat: 4, sugar: 2, sodium: 440 },
  { id: "mfds-068", name: "북엇국", source: "korean_standard_food", baseAmount: 100, defaultAmount: 350, defaultAmountSource: "official_serving", calories: 37, carbs: 3, protein: 4, fat: 1, sugar: 0, sodium: 260 },
  { id: "mfds-069", name: "떡국", source: "korean_standard_food", baseAmount: 100, defaultAmount: 450, defaultAmountSource: "official_serving", calories: 110, carbs: 18, protein: 4, fat: 2, sugar: 1, sodium: 300 },
  { id: "mfds-070", name: "만둣국", source: "korean_standard_food", baseAmount: 100, defaultAmount: 500, defaultAmountSource: "official_serving", calories: 98, carbs: 14, protein: 4, fat: 3, sugar: 1, sodium: 340 },

  { id: "mfds-071", name: "칼국수", source: "korean_standard_food", baseAmount: 100, defaultAmount: 650, defaultAmountSource: "official_serving", calories: 110, carbs: 21, protein: 4, fat: 1, sugar: 1, sodium: 290 },
  { id: "mfds-072", name: "잔치국수", source: "korean_standard_food", baseAmount: 100, defaultAmount: 600, defaultAmountSource: "official_serving", calories: 102, carbs: 20, protein: 4, fat: 1, sugar: 1, sodium: 300 },
  { id: "mfds-073", name: "비빔국수", source: "korean_standard_food", baseAmount: 100, defaultAmount: 420, defaultAmountSource: "official_serving", calories: 156, carbs: 29, protein: 4, fat: 2, sugar: 5, sodium: 380 },
  { id: "mfds-074", name: "쫄면", source: "korean_standard_food", baseAmount: 100, defaultAmount: 420, defaultAmountSource: "official_serving", calories: 153, carbs: 30, protein: 4, fat: 2, sugar: 4, sodium: 360 },
  { id: "mfds-075", name: "메밀국수", source: "korean_standard_food", baseAmount: 100, defaultAmount: 500, defaultAmountSource: "official_serving", calories: 99, carbs: 20, protein: 4, fat: 1, sugar: 1, sodium: 250 },
  { id: "mfds-076", name: "파스타", source: "fallback", baseAmount: 100, defaultAmount: 280, defaultAmountSource: "estimated_serving", calories: 157, carbs: 25, protein: 6, fat: 3, sugar: 3, sodium: 240, aliases: ["스파게티"] },
  { id: "mfds-077", name: "크림파스타", source: "fallback", baseAmount: 100, defaultAmount: 320, defaultAmountSource: "estimated_serving", calories: 212, carbs: 23, protein: 6, fat: 10, sugar: 4, sodium: 300 },
  { id: "mfds-078", name: "토마토파스타", source: "fallback", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "estimated_serving", calories: 168, carbs: 25, protein: 6, fat: 4, sugar: 5, sodium: 260 },
  { id: "mfds-079", name: "볶음우동", source: "fallback", baseAmount: 100, defaultAmount: 350, defaultAmountSource: "estimated_serving", calories: 168, carbs: 24, protein: 5, fat: 5, sugar: 4, sodium: 380 },
  { id: "mfds-080", name: "볶음밥", source: "korean_standard_food", baseAmount: 100, defaultAmount: 320, defaultAmountSource: "official_serving", calories: 185, carbs: 29, protein: 4, fat: 6, sugar: 2, sodium: 370 },

  { id: "mfds-081", name: "김치전", source: "korean_standard_food", baseAmount: 100, defaultAmount: 180, defaultAmountSource: "official_serving", calories: 210, carbs: 21, protein: 5, fat: 11, sugar: 3, sodium: 450 },
  { id: "mfds-082", name: "파전", source: "korean_standard_food", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "official_serving", calories: 222, carbs: 22, protein: 6, fat: 12, sugar: 3, sodium: 430 },
  { id: "mfds-083", name: "해물파전", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "official_serving", calories: 205, carbs: 17, protein: 9, fat: 11, sugar: 2, sodium: 420 },
  { id: "mfds-084", name: "만두", source: "korean_standard_food", baseAmount: 100, defaultAmount: 180, defaultAmountSource: "official_serving", calories: 220, carbs: 30, protein: 8, fat: 7, sugar: 2, sodium: 420, aliases: ["군만두", "찐만두"] },
  { id: "mfds-085", name: "순대", source: "korean_standard_food", baseAmount: 100, defaultAmount: 170, defaultAmountSource: "official_serving", calories: 182, carbs: 18, protein: 9, fat: 8, sugar: 1, sodium: 330 },
  { id: "mfds-086", name: "어묵탕", source: "korean_standard_food", baseAmount: 100, defaultAmount: 350, defaultAmountSource: "official_serving", calories: 63, carbs: 6, protein: 6, fat: 2, sugar: 2, sodium: 490 },
  { id: "mfds-087", name: "핫도그", source: "fallback", baseAmount: 100, defaultAmount: 120, defaultAmountSource: "estimated_serving", calories: 290, carbs: 25, protein: 10, fat: 17, sugar: 4, sodium: 620 },
  { id: "mfds-088", name: "토스트", source: "fallback", baseAmount: 100, defaultAmount: 140, defaultAmountSource: "estimated_serving", calories: 260, carbs: 34, protein: 8, fat: 9, sugar: 7, sodium: 420 },
  { id: "mfds-089", name: "샌드위치", source: "fallback", baseAmount: 100, defaultAmount: 210, defaultAmountSource: "estimated_serving", calories: 248, carbs: 27, protein: 11, fat: 10, sugar: 5, sodium: 520 },
  { id: "mfds-090", name: "주먹밥", source: "fallback", baseAmount: 100, defaultAmount: 170, defaultAmountSource: "estimated_serving", calories: 184, carbs: 33, protein: 4, fat: 3, sugar: 1, sodium: 320 },

  { id: "mfds-091", name: "아메리카노", source: "fallback", baseAmount: 100, defaultAmount: 355, defaultAmountSource: "estimated_serving", calories: 2, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 5 },
  { id: "mfds-092", name: "카페라떼", source: "fallback", baseAmount: 100, defaultAmount: 355, defaultAmountSource: "estimated_serving", calories: 53, carbs: 5, protein: 3, fat: 2, sugar: 5, sodium: 50 },
  { id: "mfds-093", name: "프로틴쉐이크", source: "fallback", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "estimated_serving", calories: 85, carbs: 6, protein: 12, fat: 1, sugar: 4, sodium: 80 },
  { id: "mfds-094", name: "두유", source: "fallback", baseAmount: 100, defaultAmount: 190, defaultAmountSource: "estimated_serving", calories: 62, carbs: 5, protein: 4, fat: 3, sugar: 3, sodium: 60 },
  { id: "mfds-095", name: "고구마라떼", source: "fallback", baseAmount: 100, defaultAmount: 300, defaultAmountSource: "estimated_serving", calories: 98, carbs: 16, protein: 3, fat: 2, sugar: 10, sodium: 45 },
  { id: "mfds-096", name: "돼지목살", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 227, carbs: 0, protein: 17, fat: 16, sugar: 0, sodium: 60, aliases: ["목살"] },
  { id: "mfds-097", name: "돼지등심", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 142, carbs: 0, protein: 23, fat: 5, sugar: 0, sodium: 55 },
  { id: "mfds-098", name: "돼지안심", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 123, carbs: 0, protein: 22, fat: 3, sugar: 0, sodium: 50 },
  { id: "mfds-099", name: "돼지앞다리살", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 201, carbs: 0, protein: 20, fat: 13, sugar: 0, sodium: 60 },
  { id: "mfds-100", name: "돼지뒷다리살", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 135, carbs: 0, protein: 21, fat: 5, sugar: 0, sodium: 55 },
  { id: "mfds-101", name: "돼지갈비", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 236, carbs: 0, protein: 18, fat: 17, sugar: 0, sodium: 65, aliases: ["생갈비"] },
  { id: "mfds-102", name: "소등심", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 214, carbs: 0, protein: 20, fat: 14, sugar: 0, sodium: 55 },
  { id: "mfds-103", name: "소안심", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 145, carbs: 0, protein: 22, fat: 6, sugar: 0, sodium: 50 },
  { id: "mfds-104", name: "소채끝살", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 170, carbs: 0, protein: 22, fat: 8, sugar: 0, sodium: 53, aliases: ["채끝"] },
  { id: "mfds-105", name: "소부채살", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 198, carbs: 0, protein: 22, fat: 12, sugar: 0, sodium: 54 },
  { id: "mfds-106", name: "소우둔살", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 180, carbs: 0, protein: 21, fat: 10, sugar: 0, sodium: 52 },
  { id: "mfds-107", name: "소홍두깨살", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 176, carbs: 0, protein: 22, fat: 9, sugar: 0, sodium: 50 },
  { id: "mfds-108", name: "소갈비", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 288, carbs: 0, protein: 18, fat: 24, sugar: 0, sodium: 66, aliases: ["LA갈비"] },
  { id: "mfds-109", name: "차돌박이", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 374, carbs: 0, protein: 14, fat: 35, sugar: 0, sodium: 64 },
  { id: "mfds-110", name: "우삼겹", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 329, carbs: 0, protein: 16, fat: 29, sugar: 0, sodium: 61 },
  { id: "mfds-111", name: "닭다리살", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 211, carbs: 0, protein: 20, fat: 14, sugar: 0, sodium: 80 },
  { id: "mfds-112", name: "닭안심", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 110, carbs: 0, protein: 23, fat: 1, sugar: 0, sodium: 62 },
  { id: "mfds-113", name: "닭봉", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 203, carbs: 0, protein: 17, fat: 15, sugar: 0, sodium: 82, aliases: ["윙봉"] },
  { id: "mfds-114", name: "닭날개", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 231, carbs: 0, protein: 18, fat: 17, sugar: 0, sodium: 84, aliases: ["윙"] },
  { id: "mfds-115", name: "오리고기", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 247, carbs: 0, protein: 16, fat: 20, sugar: 0, sodium: 58 },
  { id: "mfds-116", name: "훈제오리", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 315, carbs: 2, protein: 16, fat: 27, sugar: 1, sodium: 720 },
  { id: "mfds-117", name: "고등어", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 175, carbs: 0, protein: 20, fat: 10, sugar: 0, sodium: 78 },
  { id: "mfds-118", name: "연어", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 208, carbs: 0, protein: 20, fat: 13, sugar: 0, sodium: 59 },
  { id: "mfds-119", name: "참치", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 132, carbs: 0, protein: 27, fat: 2, sugar: 0, sodium: 46, aliases: ["참다랑어"] },
  { id: "mfds-120", name: "대구", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 82, carbs: 0, protein: 18, fat: 1, sugar: 0, sodium: 54 },
  { id: "mfds-121", name: "명태", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 88, carbs: 0, protein: 19, fat: 1, sugar: 0, sodium: 60 },
  { id: "mfds-122", name: "새우", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 93, carbs: 0, protein: 20, fat: 1, sugar: 0, sodium: 148 },
  { id: "mfds-123", name: "오징어", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 92, carbs: 3, protein: 16, fat: 1, sugar: 0, sodium: 130 },
  { id: "mfds-124", name: "문어", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 82, carbs: 2, protein: 15, fat: 1, sugar: 0, sodium: 230 },
  { id: "mfds-125", name: "가리비", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 88, carbs: 4, protein: 16, fat: 1, sugar: 0, sodium: 190 },
  { id: "mfds-126", name: "장어", source: "korean_standard_ingredient", baseAmount: 100, defaultAmount: 100, defaultAmountSource: "reference_100g", calories: 255, carbs: 0, protein: 17, fat: 20, sugar: 0, sodium: 58 },
  { id: "mfds-127", name: "돼지갈비찜", source: "korean_standard_food", baseAmount: 100, defaultAmount: 280, defaultAmountSource: "official_serving", calories: 243, carbs: 10, protein: 15, fat: 16, sugar: 6, sodium: 420, aliases: ["갈비찜"] },
  { id: "mfds-128", name: "돼지갈비구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 250, defaultAmountSource: "official_serving", calories: 288, carbs: 6, protein: 17, fat: 22, sugar: 4, sodium: 380, aliases: ["돼지갈비"] },
  { id: "mfds-129", name: "양념갈비", source: "korean_standard_food", baseAmount: 100, defaultAmount: 250, defaultAmountSource: "official_serving", calories: 296, carbs: 8, protein: 17, fat: 22, sugar: 5, sodium: 410 },
  { id: "mfds-130", name: "LA갈비구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 230, defaultAmountSource: "official_serving", calories: 301, carbs: 7, protein: 18, fat: 23, sugar: 5, sodium: 430 },
  { id: "mfds-131", name: "삼겹살구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "official_serving", calories: 345, carbs: 1, protein: 16, fat: 31, sugar: 0, sodium: 96 },
  { id: "mfds-132", name: "목살구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "official_serving", calories: 265, carbs: 1, protein: 19, fat: 21, sugar: 0, sodium: 88 },
  { id: "mfds-133", name: "항정살구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "estimated_serving", calories: 368, carbs: 0, protein: 14, fat: 35, sugar: 0, sodium: 86, aliases: ["항정살"] },
  { id: "mfds-134", name: "가브리살구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "estimated_serving", calories: 322, carbs: 0, protein: 16, fat: 28, sugar: 0, sodium: 84, aliases: ["가브리살"] },
  { id: "mfds-135", name: "소고기구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "official_serving", calories: 255, carbs: 1, protein: 21, fat: 19, sugar: 0, sodium: 92, aliases: ["한우구이"] },
  { id: "mfds-136", name: "소불고기전골", source: "korean_standard_food", baseAmount: 100, defaultAmount: 420, defaultAmountSource: "official_serving", calories: 138, carbs: 6, protein: 10, fat: 8, sugar: 3, sodium: 350, aliases: ["불고기전골"] },
  { id: "mfds-137", name: "소갈비찜", source: "korean_standard_food", baseAmount: 100, defaultAmount: 280, defaultAmountSource: "official_serving", calories: 265, carbs: 9, protein: 16, fat: 18, sugar: 5, sodium: 390 },
  { id: "mfds-138", name: "닭꼬치", source: "korean_standard_food", baseAmount: 100, defaultAmount: 150, defaultAmountSource: "estimated_serving", calories: 218, carbs: 8, protein: 17, fat: 13, sugar: 4, sodium: 420 },
  { id: "mfds-139", name: "닭발", source: "korean_standard_food", baseAmount: 100, defaultAmount: 180, defaultAmountSource: "estimated_serving", calories: 218, carbs: 7, protein: 19, fat: 12, sugar: 3, sodium: 510 },
  { id: "mfds-140", name: "치킨가라아게", source: "korean_standard_food", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "estimated_serving", calories: 282, carbs: 14, protein: 17, fat: 18, sugar: 2, sodium: 480 },
  { id: "mfds-141", name: "오리주물럭", source: "korean_standard_food", baseAmount: 100, defaultAmount: 250, defaultAmountSource: "official_serving", calories: 236, carbs: 6, protein: 15, fat: 17, sugar: 3, sodium: 410 },
  { id: "mfds-142", name: "훈제오리구이", source: "korean_standard_food", baseAmount: 100, defaultAmount: 220, defaultAmountSource: "estimated_serving", calories: 318, carbs: 2, protein: 16, fat: 27, sugar: 1, sodium: 730 },
  { id: "mfds-143", name: "연어스테이크", source: "korean_standard_food", baseAmount: 100, defaultAmount: 200, defaultAmountSource: "official_serving", calories: 218, carbs: 2, protein: 21, fat: 14, sugar: 0, sodium: 120 },
  { id: "mfds-144", name: "연어덮밥", source: "korean_standard_food", baseAmount: 100, defaultAmount: 420, defaultAmountSource: "official_serving", calories: 176, carbs: 21, protein: 9, fat: 6, sugar: 2, sodium: 320, aliases: ["사케동"] },
  { id: "mfds-145", name: "고등어정식", source: "korean_standard_food", baseAmount: 100, defaultAmount: 500, defaultAmountSource: "estimated_serving", calories: 132, carbs: 11, protein: 9, fat: 6, sugar: 1, sodium: 290, aliases: ["고등어구이정식"] },
  { id: "mfds-146", name: "생선구이정식", source: "korean_standard_food", baseAmount: 100, defaultAmount: 500, defaultAmountSource: "estimated_serving", calories: 126, carbs: 11, protein: 8, fat: 6, sugar: 1, sodium: 280 },
  { id: "mfds-147", name: "회덮밥", source: "korean_standard_food", baseAmount: 100, defaultAmount: 450, defaultAmountSource: "official_serving", calories: 154, carbs: 24, protein: 8, fat: 3, sugar: 3, sodium: 340 },
  { id: "mfds-148", name: "육회비빔밥", source: "korean_standard_food", baseAmount: 100, defaultAmount: 450, defaultAmountSource: "estimated_serving", calories: 182, carbs: 23, protein: 10, fat: 6, sugar: 3, sodium: 330 },
  { id: "mfds-149", name: "쭈꾸미볶음", source: "korean_standard_food", baseAmount: 100, defaultAmount: 230, defaultAmountSource: "official_serving", calories: 128, carbs: 8, protein: 14, fat: 4, sugar: 3, sodium: 520, aliases: ["주꾸미볶음"] },
  { id: "mfds-150", name: "차돌된장찌개", source: "korean_standard_food", baseAmount: 100, defaultAmount: 350, defaultAmountSource: "estimated_serving", calories: 96, carbs: 5, protein: 7, fat: 5, sugar: 1, sodium: 430 },
];

const normalizeForMatch = (value: string) =>
  value.normalize("NFC").toLowerCase().replace(/[\s\-_()/[\],.]+/g, "").trim();

const tokenizeQuery = (value: string): string[] =>
  value
    .normalize("NFC")
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .map(normalizeForMatch)
    .filter(Boolean);

const isSubsequence = (field: string, keyword: string): boolean => {
  if (!keyword) return false;
  let cursor = 0;
  for (const ch of field) {
    if (ch === keyword[cursor]) cursor += 1;
    if (cursor >= keyword.length) return true;
  }
  return false;
};

const SEARCHABLE_FOODS: IndexedFood[] = FOODS_INDEX.map((entry) => ({
  normalizedFields: [entry.name, ...(entry.aliases ?? [])].map(normalizeForMatch),
  item: {
    id: entry.id,
    name: entry.name,
    source: entry.source,
    nutritionSourceQuality: entry.source === "fallback" ? "estimated_db" : "official_db",
    baseAmount: entry.baseAmount,
    defaultAmount: entry.defaultAmount ?? entry.baseAmount,
    defaultAmountSource: entry.defaultAmountSource ?? "estimated_serving",
    calories: entry.calories,
    carbs: entry.carbs,
    protein: entry.protein,
    fat: entry.fat,
    sugar: entry.sugar,
    sodium: entry.sodium,
  },
}));

const scoreEntry = (entry: IndexedFood, keyword: string, tokens: string[]): number => {
  const fields = entry.normalizedFields;
  let score = 0;

  for (const field of fields) {
    if (field === keyword) score = Math.max(score, 120);
    else if (field.startsWith(keyword)) score = Math.max(score, 100);
    else if (field.includes(keyword)) score = Math.max(score, 80);
    else if (keyword.includes(field)) score = Math.max(score, 65);
    else if (isSubsequence(field, keyword)) score = Math.max(score, 55);
  }

  if (tokens.length > 1) {
    const tokenMatches = tokens.filter((token) => fields.some((field) => field.includes(token))).length;
    if (tokenMatches === tokens.length) score = Math.max(score, 70);
    else if (tokenMatches > 0) score = Math.max(score, 60);
  }

  return score;
};

export const searchFoodsIndex = (query: string, limit = 20): FoodIndexItem[] => {
  const keyword = normalizeForMatch(query);
  if (!keyword) return [];
  const limited = Math.min(Math.max(limit, 1), 50);
  const tokens = tokenizeQuery(query);

  return SEARCHABLE_FOODS.map((entry) => ({ entry, score: scoreEntry(entry, keyword, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.item.name.localeCompare(b.entry.item.name, "ko"))
    .slice(0, limited)
    .map((item) => item.entry.item);
};
