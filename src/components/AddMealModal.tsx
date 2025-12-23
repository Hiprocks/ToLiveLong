"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";

interface AddMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddMealModal({ isOpen, onClose, onSuccess }: AddMealModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        meal_type: "breakfast",
        menu_name: "",
        calories: "",
        carbs: "",
        protein: "",
        fat: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from("daily_logs").insert({
            meal_type: formData.meal_type,
            menu_name: formData.menu_name,
            calories: parseInt(formData.calories) || 0,
            carbs: parseInt(formData.carbs) || 0,
            protein: parseInt(formData.protein) || 0,
            fat: parseInt(formData.fat) || 0,
        });

        setLoading(false);

        if (error) {
            console.error("Error inserting meal:", error);
            alert("Failed to save meal. Check console for details.");
        } else {
            setFormData({
                meal_type: "breakfast",
                menu_name: "",
                calories: "",
                carbs: "",
                protein: "",
                fat: "",
            });
            onSuccess();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Add Meal</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Meal Type */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Meal Type</label>
                        <select
                            value={formData.meal_type}
                            onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                        </select>
                    </div>

                    {/* Menu Name */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Menu Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Chicken Salad"
                            value={formData.menu_name}
                            onChange={(e) => setFormData({ ...formData, menu_name: e.target.value })}
                            required
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Nutrition Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Calories</label>
                            <input
                                type="number"
                                placeholder="kcal"
                                value={formData.calories}
                                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Carbs (g)</label>
                            <input
                                type="number"
                                placeholder="g"
                                value={formData.carbs}
                                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Protein (g)</label>
                            <input
                                type="number"
                                placeholder="g"
                                value={formData.protein}
                                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Fat (g)</label>
                            <input
                                type="number"
                                placeholder="g"
                                value={formData.fat}
                                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Meal"}
                    </button>
                </form>
            </div>
        </div>
    );
}
