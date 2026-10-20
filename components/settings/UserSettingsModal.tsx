"use client";

import { useState, useEffect } from "react";
import { AppUser } from "@/types";
import { setCurrentUser, getCurrentUser, updateUserProfile } from "@/lib/auth-pin";
import { useLanguage } from "@/lib/i18n";
import {

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
  const [gender, setGender] = useState("male");
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
        setGender(u.gender || "male");
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

  // Lock body scroll + close on Escape while the sheet is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

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

    const parsedAge = parseInt(ageStr, 10) || 28;
    const parsedHeight = parseFloat(heightStr) || 180;
    const parsedCurrentWeight = parseFloat(currentWeightStr) || 100;
    const parsedTargetWeight = parseFloat(targetWeightStr) || 85;
    const parsedMaxDumbbell = parseFloat(maxDumbbellWeightStr) || 24.5;

    try {
      const { error } = await updateUserProfile(currentUser.id, {
        display_name: displayName,
        gender: gender,
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
      });

      if (error) {
        console.warn("Supabase update error:", error);
      }

      const updatedUser: AppUser = {
        ...currentUser,
        display_name: displayName,
        gender: gender,
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
    { val: "24.5", label: "24.5 kg (Ayarlanabilir)" },
    { val: "30", label: "30 kg" },
    { val: "35", label: "35 kg" },
    { val: "40", label: "40+ kg (Ağır)" },
  ];

  const equipmentOptions = [
    { id: "Dumbbell", title: "Dambıllar" },
    { id: "Bench", title: "Sehpa / Bench" },
    { id: "Pull-up Bar", title: "Barfiks Barı" },
    { id: "Ab-Wheel", title: "Ab-Wheel" },
    { id: "Bands", title: "Direnç Lastiği" },
    { id: "FullGym", title: "Tam Spor Salonu" },
    { id: "Bodyweight", title: "Vücut Ağırlığı" },
  ];

  const genderOptions = [
    { id: "male", title: "Erkek", sub: "Üst vücut & kuvvet" },
    { id: "female", title: "Kadın", sub: "Alt vücut & sıkılaşma" },
  ];

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden />
      <form
        onSubmit={handleSave}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="sheet sm:max-h-[88dvh]"
      >
        {/* Grab handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Sticky header */}
        <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 pt-1 sm:pt-5 pb-3 border-b border-slate-100">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-700 inline-flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 id="settings-title" className="text-base font-extrabold text-slate-900 truncate">
              Profil & Ayarlar
            </h3>
            <p className="text-xs text-slate-500 truncate">Harun Hoca planı buna göre kurar</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="icon-btn -mr-1">
            <X />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-7">
          {/* ── Profile ── */}
          <section className="space-y-4">
            <p className="eyebrow flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Profil
            </p>

            <div>
              <label htmlFor="settings-name" className="field-label">
                İsim / Görünen Ad
              </label>
              <input
                id="settings-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Adınız"
                className="input font-semibold"
              />
            </div>

            <div>
              <span className="field-label">Biyolojik cinsiyet</span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Biyolojik cinsiyet">
                {genderOptions.map((g) => {
                  const active = gender === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setGender(g.id)}
                      className={`min-h-[56px] px-3 py-2 rounded-xl border text-left tap-effect flex items-center gap-2 ${
                        active
                          ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500"
                          : "bg-white border-slate-200 md:hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-slate-900">{g.title}</span>
                        <span className="block text-xs text-slate-500 truncate">{g.sub}</span>
                      </span>
                      {active && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">BMR ve kas dinamiği hesabı için kullanılır.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="settings-age" className="field-label">
                  Yaş
                </label>
                <input
                  id="settings-age"
                  type="text"
                  inputMode="numeric"
                  value={ageStr}
                  onChange={(e) => setAgeStr(e.target.value)}
                  className="input font-semibold tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="settings-height" className="field-label">
                  Boy (cm)
                </label>
                <input
                  id="settings-height"
                  type="text"
                  inputMode="decimal"
                  value={heightStr}
                  onChange={(e) => setHeightStr(e.target.value)}
                  className="input font-semibold tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="settings-weight" className="field-label flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-slate-400" /> Güncel kilo (kg)
                </label>
                <input
                  id="settings-weight"
                  type="text"
                  inputMode="decimal"
                  value={currentWeightStr}
                  onChange={(e) => setCurrentWeightStr(e.target.value)}
                  className="input font-bold tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="settings-target" className="field-label flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-slate-400" /> Hedef kilo (kg)
                </label>
                <input
                  id="settings-target"
                  type="text"
                  inputMode="decimal"
                  value={targetWeightStr}
                  onChange={(e) => setTargetWeightStr(e.target.value)}
                  className="input font-bold tabular-nums text-emerald-700"
                />
              </div>
            </div>
          </section>

          {/* ── Training ── */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <p className="eyebrow flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Antrenman
            </p>

            <div>
              <label htmlFor="settings-goal" className="field-label">
                Ana hedef
              </label>
              <select
                id="settings-goal"
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
                className="input font-semibold"
              >
                <option value="recomp">Recomp (Kas Koru & Yağ Yak)</option>
                <option value="lean_cut">Lean Cut / Hızlı Definasyon</option>
                <option value="hypertrophy">Hipertrofi & Kas Kazanımı</option>
                <option value="strength">Güç & Kuvvet Gelişimi</option>
              </select>
            </div>

            <div>
              <label htmlFor="settings-exp" className="field-label">
                Spor geçmişi & deneyim
              </label>
              <select
                id="settings-exp"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="input font-semibold"
              >
                <option value="muscle_memory">Eski Sporcu / Kas Hafızası Var</option>
                <option value="intermediate">Orta Seviye</option>
                <option value="beginner">Yeni Başlayan</option>
              </select>
            </div>

            <div>
              <span className="field-label">Haftalık antrenman sıklığı</span>
              <div className="segmented" role="radiogroup" aria-label="Haftalık antrenman sıklığı">
                {[3, 4, 5, 6].map((days) => (
                  <button
                    key={days}
                    type="button"
                    role="radio"
                    aria-checked={workoutDays === days}
                    data-active={workoutDays === days}
                    onClick={() => setWorkoutDays(days)}
                    className="segmented-item min-h-[40px] text-[13px] tabular-nums"
                  >
                    {days} gün
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Health ── */}
          <section className="space-y-2 pt-6 border-t border-slate-100">
            <label htmlFor="settings-injuries" className="eyebrow flex items-center gap-1.5 mb-2">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Sakatlık & sağlık
            </label>
            <textarea
              id="settings-injuries"
              rows={3}
              value={injuriesLimitations}
              onChange={(e) => setInjuriesLimitations(e.target.value)}
              placeholder="Örn: Sol omuzda sıkışma var ağır overhead yapamam / Bel fıtığım var / Diz hassasiyetim var..."
              className="input py-2.5 leading-relaxed resize-none"
            />
            <p className="text-xs text-slate-500 leading-relaxed">
              Harun Hoca program oluştururken ve ağırlık önerirken bu kısıtlamaları öncelikli gözetir.
            </p>
          </section>

          {/* ── Equipment ── */}
          <section className="space-y-3 pt-6 border-t border-slate-100">
            <p className="eyebrow flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" /> Ekipmanlar
            </p>
            <div className="grid grid-cols-2 gap-2">
              {equipmentOptions.map((item) => {
                const isSelected = selectedEquipment.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => toggleEquipment(item.id)}
                    className={`min-h-[44px] px-3 rounded-xl border text-left tap-effect flex items-center gap-2 text-[13px] ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-700 md:hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 shrink-0 rounded-md border inline-flex items-center justify-center ${
                        isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 truncate">{item.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Max Dumbbell Weight */}
            {selectedEquipment.includes("Dumbbell") && (
              <div className="card-muted space-y-2 animate-fade-in-up">
                <label htmlFor="settings-dumbbell" className="field-label !mb-0">
                  Maksimum dambıl ağırlığı (kg / tek el)
                </label>
                <div className="grid grid-cols-[1fr_6rem] gap-2">
                  <select
                    id="settings-dumbbell"
                    value={maxDumbbellWeightStr}
                    onChange={(e) => setMaxDumbbellWeightStr(e.target.value)}
                    className="input font-semibold min-w-0"
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
                    aria-label="Özel ağırlık (kg)"
                    value={maxDumbbellWeightStr}
                    onChange={(e) => setMaxDumbbellWeightStr(e.target.value)}
                    placeholder="24.5"
                    className="input font-bold tabular-nums text-center min-w-0"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-slate-100 px-4 sm:px-6 py-3 bg-white sm:rounded-b-3xl">
          {saveSuccess ? (
            <div
              role="status"
              className="min-h-[44px] rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center justify-center gap-2 animate-fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Ayarlar kaydedildi
            </div>
          ) : (
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                {t("cancel")}
              </button>
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? (
                  <span className="spinner !w-4 !h-4 !border-2 border-white border-t-transparent" />
                ) : (
                  <Save />
                )}
                {isSaving ? "Kaydediliyor..." : t("save")}
              </button>
            </div>
          )}
        </div>
      </form>
    </>
  );
}
