"use client";

import { useState, useEffect } from "react";
import { AppUser } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { setCurrentUser, getCurrentUser } from "@/lib/auth-pin";
import { useLanguage } from "@/lib/i18n";
import {
  Settings,
  User,
  Dumbbell,
  Target,
  Check,
  X,
  Scale,
  Save,
  CheckCircle2,
  Sliders,
  Layers,
  HeartPulse
} from "lucide-react";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (updated: AppUser) => void;
}

export default function UserSettingsModal({
  isOpen,
  onClose,
  onUserUpdated,
}: UserSettingsModalProps) {
  const { t, language } = useLanguage();
  const [currentUser, setLocalUser] = useState<AppUser | null>(null);

  // Form String States for fluid typing & deletion
  const [displayName, setDisplayName] = useState("");
  const [ageStr, setAgeStr] = useState("28");
  const [heightStr, setHeightStr] = useState("180");
  const [currentWeightStr, setCurrentWeightStr] = useState("100.0");
  const [targetWeightStr, setTargetWeightStr] = useState("85.0");
  const [fitnessGoal, setFitnessGoal] = useState("recomp");
  const [experienceLevel, setExperienceLevel] = useState("muscle_memory");
  const [workoutDays, setWorkoutDays] = useState(4);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    "Dumbbell",
    "Bodyweight",
    "Ab-Wheel",
    "Pull-up Bar",
  ]);
  const [maxDumbbellWeightStr, setMaxDumbbellWeightStr] = useState("24.5");
  const [injuriesLimitations, setInjuriesLimitations] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const u = getCurrentUser();
      if (u) {
        setLocalUser(u);
        setDisplayName(u.display_name || u.username || "");
        setAgeStr(u.age ? String(u.age) : "28");
        setHeightStr(u.height_cm ? String(u.height_cm) : "180");
        setCurrentWeightStr(u.current_weight_kg ? String(u.current_weight_kg) : "100.0");
        setTargetWeightStr(u.target_weight_kg ? String(u.target_weight_kg) : "85.0");
        setFitnessGoal(u.fitness_goal || "recomp");
        setExperienceLevel(u.experience_level || "muscle_memory");
        setWorkoutDays(u.workout_days_per_week || 4);
        setSelectedEquipment(u.equipment || ["Dumbbell", "Bodyweight", "Ab-Wheel", "Pull-up Bar"]);
        setMaxDumbbellWeightStr(u.max_dumbbell_weight_kg ? String(u.max_dumbbell_weight_kg) : "24.5");
        setInjuriesLimitations(u.injuries_or_limitations || "");
      }
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleEquipment = (item: string) => {
    if (selectedEquipment.includes(item)) {
      setSelectedEquipment(selectedEquipment.filter((e) => e !== item));
    } else {
      setSelectedEquipment([...selectedEquipment, item]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setSaveSuccess(false);
    const supabase = createClient();

    const parsedAge = parseInt(ageStr, 10) || 28;
    const parsedHeight = parseFloat(heightStr) || 180;
    const parsedCurrentWeight = parseFloat(currentWeightStr) || 100;
    const parsedTargetWeight = parseFloat(targetWeightStr) || 85;
    const parsedMaxDumbbell = parseFloat(maxDumbbellWeightStr) || 24.5;

    try {
      const { error } = await supabase
        .from("app_users")
        .update({
          display_name: displayName,
          age: parsedAge,
          height_cm: parsedHeight,
          current_weight_kg: parsedCurrentWeight,
          target_weight_kg: parsedTargetWeight,
          fitness_goal: fitnessGoal,
          experience_level: experienceLevel,
          workout_days_per_week: workoutDays,
          equipment: selectedEquipment,
          max_dumbbell_weight_kg: parsedMaxDumbbell,
          injuries_or_limitations: injuriesLimitations.trim() || "Sakatlık yok",
          onboarding_completed: true,
        })
        .eq("id", currentUser.id);

      if (error) {
        console.warn("Supabase update error:", error);
      }

      const updatedUser: AppUser = {
        ...currentUser,
        display_name: displayName,
        age: parsedAge,
        height_cm: parsedHeight,
        current_weight_kg: parsedCurrentWeight,
        target_weight_kg: parsedTargetWeight,
        fitness_goal: fitnessGoal,
        experience_level: experienceLevel,
        workout_days_per_week: workoutDays,
        equipment: selectedEquipment,
        max_dumbbell_weight_kg: parsedMaxDumbbell,
        injuries_or_limitations: injuriesLimitations.trim() || "Sakatlık yok",
        onboarding_completed: true,
      };

      setCurrentUser(updatedUser);
      setLocalUser(updatedUser);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lumino_user_updated", { detail: updatedUser }));
      }
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Ayarlar kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const dumbbellOptions = [
    { val: "5", label: "5 kg" },
    { val: "10", label: "10 kg" },
    { val: "15", label: "15 kg" },
    { val: "20", label: "20 kg" },
    { val: "24.5", label: "24.5 kg (Standart Ayarlanabilir)" },
    { val: "30", label: "30 kg" },
    { val: "35", label: "35 kg" },
    { val: "40", label: "40+ kg (Ağır Dambıllar)" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-slide-up relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Profil, Ekipman & Sakatlık Ayarları
              </h3>
              <p className="text-[11px] text-slate-400">
                Antrenör Harun antrenmanları bu bilgilere göre düzenler
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl tap-effect"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              İsim / Görünen Ad
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Adınız"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Measurements Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Yaş
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={ageStr}
                onChange={(e) => setAgeStr(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Boy (cm)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={heightStr}
                onChange={(e) => setHeightStr(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Güncel Kilo (kg)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={currentWeightStr}
                onChange={(e) => setCurrentWeightStr(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hedef Kilo (kg)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={targetWeightStr}
                onChange={(e) => setTargetWeightStr(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Goal Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ana Hedef
            </label>
            <select
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="recomp">Body Recomposition (Kas Koru & Yağ Yak) ⚖️</option>
              <option value="lean_cut">Lean Cut / Hızlı Definasyon ✂️</option>
              <option value="hypertrophy">Hipertrofi & Kas Kazanımı 🦍</option>
              <option value="strength">Güç & Kuvvet Gelişimi ⚡</option>
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Spor Geçmişi & Deneyim
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="muscle_memory">Eski Sporcu / Kas Hafızası Var 🔥</option>
              <option value="intermediate">Orta Seviye ⚡</option>
              <option value="beginner">Yeni Başlayan 🌱</option>
            </select>
          </div>

          {/* Special Injury & Health Limitations */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>Sakatlık & Özel Sağlık Durumu (Harun Hoca Hafızası)</span>
            </label>
            <textarea
              rows={2}
              value={injuriesLimitations}
              onChange={(e) => setInjuriesLimitations(e.target.value)}
              placeholder="Örn: Sol omuzda sıkışma var ağır overhead yapamam / Bel fıtığım var / Diz hassasiyetim var..."
              className="w-full px-3.5 py-2 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-400 placeholder-slate-400"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Harun Hoca program oluştururken ve ağırlık önerirken bu kısıtlamaları öncelikli gözetir.
            </p>
          </div>

          {/* Weekly Days */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Haftalık Antrenman Sıklığı
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 4, 5, 6].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setWorkoutDays(days)}
                  className={`py-2 rounded-xl border text-xs font-extrabold transition-all tap-effect ${
                    workoutDays === days
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {days} Gün
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mevcut Ekipmanlarınız
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "Dumbbell", title: "Dambıllar 🏋️‍♂️" },
                { id: "Bench", title: "Sehpa / Bench 🪑" },
                { id: "Pull-up Bar", title: "Barfiks Barı 🚪" },
                { id: "Ab-Wheel", title: "Ab-Wheel ⚙️" },
                { id: "Bands", title: "Direnç Lastikleri 🤸" },
                { id: "FullGym", title: "Tam Spor Salonu 🏢" },
                { id: "Bodyweight", title: "Vücut Ağırlığı 🧘" },
              ].map((item) => {
                const isSelected = selectedEquipment.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleEquipment(item.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer tap-effect flex items-center justify-between text-xs ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Max Dumbbell Weight */}
          {selectedEquipment.includes("Dumbbell") && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5 animate-slide-up">
              <label className="block text-xs font-bold text-emerald-900">
                Maksimum Dambıl Ağırlığınız (kg / tek el)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={maxDumbbellWeightStr}
                  onChange={(e) => setMaxDumbbellWeightStr(e.target.value)}
                  className="px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {dumbbellOptions.map((opt) => (
                    <option key={opt.val} value={opt.val}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  inputMode="decimal"
                  value={maxDumbbellWeightStr}
                  onChange={(e) => setMaxDumbbellWeightStr(e.target.value)}
                  placeholder="24.5"
                  className="px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Ayarlar başarıyla kaydedildi!
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 tap-effect"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm tap-effect flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Kaydediliyor..." : t("save")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
