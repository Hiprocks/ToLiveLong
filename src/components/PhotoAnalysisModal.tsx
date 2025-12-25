"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { X, Upload, Camera, Loader2, Check } from "lucide-react";
import Image from "next/image";

interface PhotoAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PhotoAnalysisModal({ isOpen, onClose, onSuccess }: PhotoAnalysisModalProps) {
    const [step, setStep] = useState<"upload" | "analyzing" | "confirm">("upload");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        meal_type: "breakfast",
        menu_name: "",
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        sugar: 0,
        sodium: 0,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                analyzeImage(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async (file: File) => {
        setStep("analyzing");
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();
            setFormData((prev) => ({
                ...prev,
                menu_name: data.menu_name || "",
                calories: data.calories || 0,
                carbs: data.carbs || 0,
                protein: data.protein || 0,
                fat: data.fat || 0,
                sugar: data.sugar || 0,
                sodium: data.sodium || 0,
            }));
            setStep("confirm");
        } catch (error) {
            console.error(error);
            alert("Failed to analyze image. Please try again.");
            setStep("upload");
            setImagePreview(null);
            setImageFile(null);
        }
    };

    const handleSave = async () => {
        const { error } = await supabase.from("daily_logs").insert({
            meal_type: formData.meal_type,
            menu_name: formData.menu_name,
            calories: formData.calories,
            carbs: formData.carbs,
            protein: formData.protein,
            fat: formData.fat,
            sugar: formData.sugar,
            sodium: formData.sodium,
            // In a real app, we might upload the image to Supabase Storage here and save the URL
        });

        if (error) {
            console.error("Error saving log:", error);
            alert("Failed to save. Check console.");
        } else {
            onSuccess();
            handleClose();
        }
    };

    const handleClose = () => {
        setStep("upload");
        setImagePreview(null);
        setImageFile(null);
        setFormData({
            meal_type: "breakfast",
            menu_name: "",
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            sugar: 0,
            sodium: 0,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                    <h2 className="text-lg font-semibold">AI Food Analysis</h2>
                    <button onClick={handleClose} className="p-1 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-6">
                    {step === "upload" && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Camera className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium">Tap to take photo</p>
                                <p className="text-sm text-muted-foreground">or upload from gallery</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}

                    {step === "analyzing" && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-lg">
                                {imagePreview && <Image src={imagePreview} alt="Preview" fill className="object-cover" />}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            </div>
                            <p className="text-muted-foreground animate-pulse">Analyzing food...</p>
                        </div>
                    )}

                    {step === "confirm" && (
                        <div className="space-y-6">
                            <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-sm">
                                {imagePreview && <Image src={imagePreview} alt="Preview" fill className="object-cover" />}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Meal Type</label>
                                    <select
                                        value={formData.meal_type}
                                        onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                                        className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                                    >
                                        <option value="breakfast">Breakfast</option>
                                        <option value="lunch">Lunch</option>
                                        <option value="dinner">Dinner</option>
                                        <option value="snack">Snack</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Food Name</label>
                                    <input
                                        type="text"
                                        value={formData.menu_name}
                                        onChange={(e) => setFormData({ ...formData, menu_name: e.target.value })}
                                        className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1 font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Calories</label>
                                        <input
                                            type="number"
                                            value={formData.calories}
                                            onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Carbs (g)</label>
                                        <input
                                            type="number"
                                            value={formData.carbs}
                                            onChange={(e) => setFormData({ ...formData, carbs: Number(e.target.value) })}
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Protein (g)</label>
                                        <input
                                            type="number"
                                            value={formData.protein}
                                            onChange={(e) => setFormData({ ...formData, protein: Number(e.target.value) })}
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1 text-emerald-500 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Fat (g)</label>
                                        <input
                                            type="number"
                                            value={formData.fat}
                                            onChange={(e) => setFormData({ ...formData, fat: Number(e.target.value) })}
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Sugar (g)</label>
                                        <input
                                            type="number"
                                            value={formData.sugar}
                                            onChange={(e) => setFormData({ ...formData, sugar: Number(e.target.value) })}
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Sodium (mg)</label>
                                        <input
                                            type="number"
                                            value={formData.sodium}
                                            onChange={(e) => setFormData({ ...formData, sodium: Number(e.target.value) })}
                                            className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" /> Save Log
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
