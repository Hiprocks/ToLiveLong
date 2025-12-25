export interface FoodItem {
    id: string;
    name: string;
    calories: number; // per 100g
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
    sodium: number;
}

export const COMMON_FOODS: FoodItem[] = [
    { id: "1", name: "White Rice (Bowl)", calories: 300, carbs: 65, protein: 6, fat: 0.5, sugar: 0, sodium: 5 },
    { id: "2", name: "Chicken Breast (100g)", calories: 165, carbs: 0, protein: 31, fat: 3.6, sugar: 0, sodium: 74 },
    { id: "3", name: "Boiled Egg (1 Large)", calories: 78, carbs: 0.6, protein: 6, fat: 5, sugar: 0.6, sodium: 62 },
    { id: "4", name: "Sweet Potato (100g)", calories: 128, carbs: 30, protein: 1.6, fat: 0.1, sugar: 4.2, sodium: 55 },
    { id: "5", name: "Banana (1 Medium)", calories: 105, carbs: 27, protein: 1.3, fat: 0.3, sugar: 14, sodium: 1 },
    { id: "6", name: "Oatmeal (100g)", calories: 389, carbs: 66, protein: 16.9, fat: 6.9, sugar: 0, sodium: 2 },
    { id: "7", name: "Greek Yogurt (100g)", calories: 59, carbs: 3.6, protein: 10, fat: 0.4, sugar: 3.2, sodium: 36 },
    { id: "8", name: "Salmon (100g)", calories: 208, carbs: 0, protein: 20, fat: 13, sugar: 0, sodium: 59 },
    { id: "9", name: "Almonds (30g)", calories: 170, carbs: 6, protein: 6, fat: 15, sugar: 1, sodium: 0 },
    { id: "10", name: "Apple (1 Medium)", calories: 95, carbs: 25, protein: 0.5, fat: 0.3, sugar: 19, sodium: 2 },
    { id: "11", name: "Kimchi (100g)", calories: 15, carbs: 2.4, protein: 1.1, fat: 0.5, sugar: 0, sodium: 670 },
    { id: "12", name: "Tofu (100g)", calories: 84, carbs: 1.9, protein: 8, fat: 4.8, sugar: 0, sodium: 7 },
    { id: "13", name: "Beef Steak (100g)", calories: 250, carbs: 0, protein: 26, fat: 17, sugar: 0, sodium: 60 },
    { id: "14", name: "Protein Shake (1 Scoop)", calories: 120, carbs: 3, protein: 24, fat: 1, sugar: 1, sodium: 150 },
    { id: "15", name: "Pizza (1 Slice)", calories: 285, carbs: 36, protein: 12, fat: 10, sugar: 3.8, sodium: 640 },
    { id: "16", name: "Pasta (Tomato, 1 Serving)", calories: 350, carbs: 60, protein: 12, fat: 5, sugar: 8, sodium: 400 },
    { id: "17", name: "Salad (Mixed Greens)", calories: 20, carbs: 3, protein: 1, fat: 0, sugar: 1, sodium: 10 },
    { id: "18", name: "Milk (200ml)", calories: 122, carbs: 9.6, protein: 6.8, fat: 6.4, sugar: 10, sodium: 100 },
    { id: "19", name: "Coke (Can)", calories: 140, carbs: 39, protein: 0, fat: 0, sugar: 39, sodium: 45 },
    { id: "20", name: "Americano", calories: 5, carbs: 1, protein: 0, fat: 0, sugar: 0, sodium: 5 },
];
