"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Search, Star, ChevronUp, Check, Plus } from "lucide-react";
import { COMMON_FOODS, FoodItem } from "@/lib/food-data";

interface FoodSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FoodSearchModal({ isOpen, onClose, onSuccess }: FoodSearchModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [servingSize, setServingSize] = useState(100); // grams or ratio %
    const [isFavorite, setIsFavorite] = useState(false);
    const [mealType, setMealType] = useState("breakfast");
    const [favorites, setFavorites] = useState<string[]>([]);

    // Load favorites from local storage
    useEffect(() => {
        const savedFavs = localStorage.getItem("favorites");
        if (savedFavs) {
            setFavorites(JSON.parse(savedFavs));
        }
    }, []);

    const toggleFavorite = (foodId: string) => {
        let newFavs;
        if (favorites.includes(foodId)) {
            newFavs = favorites.filter(id => id !== foodId);
        } else {
            newFavs = [...favorites, foodId];
        }
        setFavorites(newFavs);
        localStorage.setItem("favorites", JSON.stringify(newFavs));
        if (selectedFood?.id === foodId) {
            setIsFavorite(!isFavorite);
        }
    };

    const filteredFoods = COMMON_FOODS.filter((food) =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        // Sort favorites to top
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
    });

    const handleSelectFood = (food: FoodItem) => {
        setSelectedFood(food);
        setServingSize(100); // Default to 100g/1 serving
        setIsFavorite(favorites.includes(food.id));
    };

    const handleSave = async () => {
        if (!selectedFood) return;

        // Calculate nutrition based on serving size (assuming base data is per 100g or 1 serving unit which we treat as 100 'units' for simplicity in this MVP logic, 
        // but for items like "1 Apple", 100 means 100% of that item. For "Chicken 100g", 100 means 100g.
        // Let's simplify: The ratio is servingSize / 100.
        const ratio = servingSize / 100;

        const { error } = await supabase.from("daily_logs").insert({
            meal_type: mealType,
            menu_name: selectedFood.name,
            calories: Math.round(selectedFood.calories * ratio),
            carbs: Math.round(selectedFood.carbs * ratio),
            protein: Math.round(selectedFood.protein * ratio),
            fat: Math.round(selectedFood.fat * ratio),
            sugar: Math.round(selectedFood.sugar * ratio),
            sodium: Math.round(selectedFood.sodium * ratio),
        });

        if (error) {
            console.error("Error saving log:", error);
            alert("Failed to save.");
        } else {
            onSuccess();
            handleClose();
        }
    };

    const handleClose = () => {
        setSearchTerm("");
        setSelectedFood(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
                <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search food (e.g. Chicken)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-muted/50 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-32">
                {filteredFoods.map((food) => (
                    <div
                        key={food.id}
                        onClick={() => handleSelectFood(food)}
                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <div>
                            <div className="font-medium flex items-center gap-2">
                                {food.name}
                                {favorites.includes(food.id) && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {food.calories} kcal / 100g (or 1 serving)
                            </div>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            + Add
                        </div>
                    </div>
                ))}
                {filteredFoods.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                        No foods found.
                    </div>
                )}
            </div>

            {/* Bottom Drawer for Selected Food */}
            {selectedFood && (
                <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] p-6 z-50 animate-in slide-in-from-bottom duration-300">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="flex justify-center -mt-2 mb-2">
                            <div className="w-12 h-1.5 bg-muted rounded-full" />
                        </div>

                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">{selectedFood.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {Math.round(selectedFood.calories * (servingSize / 100))} kcal
                                </p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedFood.id); }}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <Star className={`w-6 h-6 ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Meal Type Selector */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {["breakfast", "lunch", "dinner", "snack"].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setMealType(type)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${mealType === type
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {/* Serving Size Slider */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="font-bold">{servingSize}% (approx. {servingSize}g)</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    step="10"
                                    value={servingSize}
                                    onChange={(e) => setServingSize(Number(e.target.value))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0.1x</span>
                                    <span>1.0x</span>
                                    <span>5.0x</span>
                                </div>
                            </div>

                            {/* Macro Preview */}
                            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-muted/30 p-3 rounded-xl">
                                <div>
                                    <div className="text-muted-foreground">Carbs</div>
                                    <div className="font-semibold">{Math.round(selectedFood.carbs * (servingSize / 100))}g</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Protein</div>
                                    <div className="font-semibold text-emerald-600">{Math.round(selectedFood.protein * (servingSize / 100))}g</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Fat</div>
                                    <div className="font-semibold">{Math.round(selectedFood.fat * (servingSize / 100))}g</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" /> Add to Log
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
