export interface UserStats {
    gender: "male" | "female";
    height: number; // cm
    weight: number; // kg
    birthYear: number;
    activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
    goal: "cut" | "maintain" | "bulk";
}

export interface DailyTargets {
    calories: number;
    carbs: number; // g
    protein: number; // g
    fat: number; // g
    sugar: number; // g
    sodium: number; // mg
}

export function calculateTargets(stats: UserStats): DailyTargets {
    const currentYear = new Date().getFullYear();
    const age = currentYear - stats.birthYear;

    // Mifflin-St Jeor Equation
    let bmr = 10 * stats.weight + 6.25 * stats.height - 5 * age;
    bmr += stats.gender === "male" ? 5 : -161;

    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
    };

    const tdee = bmr * activityMultipliers[stats.activityLevel];

    // Goal adjustments
    let targetCalories = tdee;
    if (stats.goal === "cut") targetCalories -= 500;
    else if (stats.goal === "bulk") targetCalories += 300;

    // Macro split (Protein focused)
    // Protein: 2.0g per kg of body weight (high protein for muscle retention/growth)
    // Fat: 0.8g per kg of body weight (minimum for hormonal health)
    // Carbs: Remainder

    // Adjust protein based on goal slightly? Let's stick to a solid 2.0-2.2g/kg base.
    // Let's use 2.2g/kg for cutting/bulking to be safe on protein.
    const proteinGrams = Math.round(stats.weight * 2.2);
    const fatGrams = Math.round(stats.weight * 0.9); // Slightly higher than min

    const proteinCals = proteinGrams * 4;
    const fatCals = fatGrams * 9;
    const remainingCals = targetCalories - (proteinCals + fatCals);
    const carbsGrams = Math.max(0, Math.round(remainingCals / 4));

    // Sugar & Sodium (General guidelines)
    // Sugar: < 10% of calories (WHO) -> roughly 25-50g depending on cals. Let's cap at 30g for strict diet.
    // Sodium: < 2300mg (FDA) -> Let's aim for 2000mg for clean eating.

    return {
        calories: Math.round(targetCalories),
        protein: proteinGrams,
        fat: fatGrams,
        carbs: carbsGrams,
        sugar: 30, // Recommended cap
        sodium: 2000, // Recommended cap
    };
}
