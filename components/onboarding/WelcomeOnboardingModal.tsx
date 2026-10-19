"use client";

import { useState, useEffect, useRef } from "react";
import { AppUser } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { setCurrentUser } from "@/lib/auth-pin";
import { useLanguage } from "@/lib/i18n";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Dumbbell,
  Target,
  User,
  Scale,
  Flame,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldAlert,
  HeartPulse
} from "lucide-react";

interface WelcomeOnboardingModalProps {
  user: AppUser;
  isOpen: boolean;
  onComplete: (updatedUser: AppUser) => void;
}

export default function WelcomeOnboardingModal({
  user,
  isOpen,
  onComplete,
}: WelcomeOnboardingModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Gender state (male | female | other) - Asked right at the start!
  const [gender, setGender] = useState<string>(user.gender || "male");

  // Form String States for fluid typing & deletion
  const [ageStr, setAgeStr] = useState<string>(user.age ? String(user.age) : "28");
  const [heightStr, setHeightStr] = useState<string>(
    user.height_cm ? String(user.height_cm) : (user.gender === "female" ? "165" : "180")
  );
  const [currentWeightStr, setCurrentWeightStr] = useState<string>(
    user.current_weight_kg ? String(user.current_weight_kg) : (user.gender === "female" ? "68.0" : "100.0")
  );
  const [targetWeightStr, setTargetWeightStr] = useState<string>(
    user.target_weight_kg ? String(user.target_weight_kg) : (user.gender === "female" ? "58.0" : "85.0")
  );

  const [experienceLevel, setExperienceLevel] = useState<string>(user.experience_level || "muscle_memory");
  const [fitnessGoal, setFitnessGoal] = useState<string>(
    user.fitness_goal || (user.gender === "female" ? "recomp" : "recomp")
  );
  const [workoutDays, setWorkoutDays] = useState<number>(user.workout_days_per_week || 4);

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    user.equipment || ["Dumbbell", "Bodyweight", "Ab-Wheel", "Pull-up Bar"]
  );
  const [maxDumbbellWeightStr, setMaxDumbbellWeightStr] = useState<string>(
    user.max_dumbbell_weight_kg
      ? String(user.max_dumbbell_weight_kg)
      : (user.gender === "female" ? "15" : "24.5")
  );

  // Injury & Limitation State
  const [selectedInjuries, setSelectedInjuries] = useState<string[]>([]);
  const [customInjuryNotes, setCustomInjuryNotes] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Lock page scroll while the onboarding flow is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Each step starts at the top
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  if (!isOpen) return null;

  const handleGenderSelect = (selectedG: string) => {
    setGender(selectedG);
    // If switching gender and user currently has the opposite default presets, intelligently switch presets
    if (selectedG === "female") {
      if (heightStr === "180") setHeightStr("165");
      if (currentWeightStr === "100.0" || currentWeightStr === "100") setCurrentWeightStr("68.0");
      if (targetWeightStr === "85.0" || targetWeightStr === "85") setTargetWeightStr("58.0");
      if (maxDumbbellWeightStr === "24.5") setMaxDumbbellWeightStr("15");
    } else if (selectedG === "male") {
      if (heightStr === "165") setHeightStr("180");
      if (currentWeightStr === "68.0" || currentWeightStr === "68") setCurrentWeightStr("100.0");
      if (targetWeightStr === "58.0" || targetWeightStr === "58") setTargetWeightStr("85.0");
      if (maxDumbbellWeightStr === "15") setMaxDumbbellWeightStr("24.5");
    }
  };

  const toggleEquipment = (item: string) => {
    if (selectedEquipment.includes(item)) {
      setSelectedEquipment(selectedEquipment.filter((e) => e !== item));
    } else {
      setSelectedEquipment([...selectedEquipment, item]);
    }
  };

  const toggleInjuryChip = (chip: string) => {
    if (chip === "none") {
      setSelectedInjuries(["none"]);
      return;
    }
    const filtered = selectedInjuries.filter((i) => i !== "none");
    if (filtered.includes(chip)) {
      setSelectedInjuries(filtered.filter((i) => i !== chip));
    } else {
      setSelectedInjuries([...filtered, chip]);
    }
  };

  const parsedAge = parseInt(ageStr, 10) || 28;
  const parsedHeight = parseFloat(heightStr) || (gender === "female" ? 165 : 180);
  const parsedCurrentWeight = parseFloat(currentWeightStr) || (gender === "female" ? 68 : 100);
  const parsedTargetWeight = parseFloat(targetWeightStr) || (gender === "female" ? 58 : 85);
  const parsedMaxDumbbell = parseFloat(maxDumbbellWeightStr) || (gender === "female" ? 15 : 24.5);

  const compiledLimitations = [
    ...selectedInjuries.filter((i) => i !== "none"),
    customInjuryNotes.trim(),
  ]
    .filter(Boolean)
    .join(" | ");

  const handleFinishOnboarding = async () => {
    setIsSaving(true);
    const supabase = createClient();

    try {
      // 1. Update user record in Supabase
      const { error: userErr } = await supabase
        .from("app_users")
        .update({
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
          injuries_or_limitations: compiledLimitations || "Sakatlık yok",
          health_notes: customInjuryNotes || null,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (userErr) {
        console.warn("User update error:", userErr);
      }

      // 2. Insert initial baseline body metric
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("body_metrics").insert({
        user_id: user.id,
        recorded_at: today,
        weight_kg: parsedCurrentWeight,
        waist_cm: gender === "female" ? 75.0 : 100.0,
        arm_cm: gender === "female" ? 28.0 : 40.0,
        chest_cm: gender === "female" ? 90.0 : 112.0,
        notes: "Antrenör Harun ile profil kurulum tartımı",
      });

      const updatedUser: AppUser = {
        ...user,
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
        injuries_or_limitations: compiledLimitations || "Sakatlık yok",
        health_notes: customInjuryNotes || undefined,
        onboarding_completed: true,
      };

      setCurrentUser(updatedUser);
      onComplete(updatedUser);
    } catch (err) {
      console.error("Onboarding finish error:", err);
      const fallbackUser: AppUser = {
        ...user,
        gender: gender,
        onboarding_completed: true,
      };
      setCurrentUser(fallbackUser);
      onComplete(fallbackUser);
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

  const injuryChips = [
    { id: "none", label: "Sakatlığım yok", desc: "Tam sağlıklıyım" },
    { id: "Omuz Ağrısı / Impingement", label: "Omuz ağrısı", desc: "Ağır overhead yapamam" },
    { id: "Bel Ağrısı / Fıtık", label: "Bel ağrısı / fıtık", desc: "Omurga baskısı istemem" },
    { id: "Diz / Menisküs Hassasiyeti", label: "Diz / menisküs", desc: "Diz hassasiyeti" },
    { id: "Bilek / Dirsek Ağrısı", label: "Bilek / dirsek", desc: "Bilek veya dirsek hassasiyeti" },
    { id: "Masa Başı Postür / Kifoz", label: "Masa başı postür", desc: "Kifoz / kambur duruş" },
  ];

  const genderOptions = [
    {
      id: "male",
      title: "Erkek",
      badge: "Üst vücut & kuvvet",
      desc: "Omuz & göğüs kuvveti, hipertrofi dinamikleri.",
    },
    {
      id: "female",
      title: "Kadın",
      badge: "Alt vücut & sıkılaşma",
      desc: "Glute toparlanma avantajı, yağsız sıkılaşma.",
    },
  ];

  const experienceOptions = [
    {
      id: "muscle_memory",
      title: "Eski sporcu / kas hafızası var",
      desc: "Daha önce düzenli ağırlık çalıştım, kas temelim var.",
      icon: Flame,
    },
    {
      id: "intermediate",
      title: "Orta seviye",
      desc: "Temel hareketleri ve formları biliyorum, düzenli çalışmak istiyorum.",
      icon: Zap,
    },
    {
      id: "beginner",
      title: "Yeni başlayan",
      desc: "Sıfırdan başlıyorum, form rehberleri ve yönlendirme istiyorum.",
      icon: Sparkles,
    },
  ];

  const goalOptions = [
    {
      id: "recomp",
      title: "Body Recomposition",
      badge: "Önerilen",
      desc: "Kas koru + yağ yak: kilon dengede kalırken bel çevren daralır, kas doluluğun artar.",
      icon: Scale,
    },
    {
      id: "lean_cut",
      title: "Lean Cut / Hızlı Definasyon",
      badge: "Yağ yakımı",
      desc: "Kalori açığı ve yüksek tempolu döngüyle hızlı yağ kaybı.",
      icon: Flame,
    },
    {
      id: "hypertrophy",
      title: "Kas Kazanımı & Hipertrofi",
      badge: "Hacim & güç",
      desc: "Dambıllarla progressive overload ve maksimum kas kütlesi.",
      icon: Dumbbell,
    },
  ];

  const equipmentOptions = [
    { id: "Dumbbell", title: "Dambıllar", desc: "Ayarlanabilir / sabit set — presler, row, goblet squat." },
    { id: "Bench", title: "Sehpa / Bench", desc: "Incline & flat bench press ve izole hareketler." },
    { id: "Pull-up Bar", title: "Barfiks barı", desc: "Geniş sırt, kanat ve biceps çekişleri." },
    { id: "Ab-Wheel", title: "Ab-Wheel (karın tekeri)", desc: "Core ve karın stabilitesi." },
    { id: "Bands", title: "Direnç lastikleri", desc: "Isınma, omuz ve eklem destek egzersizleri." },
    { id: "FullGym", title: "Tam donanımlı salon", desc: "Barbell, cable ve tüm salon makineleri." },
    { id: "Bodyweight", title: "Vücut ağırlığı & mat", desc: "Şınav, plank, floor press ve esneme." },
  ];

  const stepTitles: Record<1 | 2 | 3 | 4, string> = {
    1: "Fiziksel ölçüler",
    2: "Hedef & sağlık",
    3: "Ekipmanlar",
    4: "Harun Hoca ile tanış",
  };

  const userName = user.display_name || user.username;

  /** Selectable row used for radio/checkbox style lists */
  const optionClass = (active: boolean) =>
    `w-full p-3.5 rounded-2xl border text-left tap-effect flex items-start gap-3 ${
      active ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500" : "bg-white border-slate-200 md:hover:bg-slate-50"
    }`;

  const RadioDot = ({ active }: { active: boolean }) => (
    <span
      className={`w-5 h-5 shrink-0 mt-0.5 rounded-full border-2 inline-flex items-center justify-center ${
        active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
      }`}
      aria-hidden
    >
      {active && <Check className="w-3 h-3" strokeWidth={3.5} />}
    </span>
  );

  const CheckBox = ({ active }: { active: boolean }) => (
    <span
      className={`w-5 h-5 shrink-0 mt-0.5 rounded-md border inline-flex items-center justify-center ${
        active ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
      }`}
      aria-hidden
    >
      {active && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4 select-none">
      <div className="hidden sm:block absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] animate-fade-in" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-lg bg-white sm:rounded-3xl sm:shadow-2xl flex flex-col animate-fade-in-up"
      >
        {/* ── Sticky header + progress ── */}
        <div className="shrink-0 px-4 sm:px-6 pt-safe border-b border-slate-100">
          <div className="flex items-center gap-3 pt-3 sm:pt-5">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-600 text-white inline-flex items-center justify-center font-bold text-sm">
              H
            </span>
            <div className="flex-1 min-w-0">
              <p className="eyebrow tabular-nums">Kurulum · {step}/4</p>
              <h3 id="onboarding-title" className="text-base font-extrabold text-slate-900 truncate">
                {stepTitles[step]}
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 py-3" aria-hidden>
            {[1, 2, 3, 4].map((s) => (
              <span key={s} className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <span
                  className="block h-full w-full rounded-full bg-emerald-500 origin-left"
                  style={{
                    transform: `scaleX(${s <= step ? 1 : 0})`,
                    transition: "transform 300ms var(--ease-out)",
                  }}
                />
              </span>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5">
          {/* ── STEP 1: PHYSICAL MEASUREMENTS ── */}
          {step === 1 && (
            <div key="s1" className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Hoş geldin, {userName}!</h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Antrenör Harun&apos;un sizin için en doğru kalori, hacim, toparlanma ve ağırlık periyodizasyonunu
                  çıkarabilmesi için temel bilgilerinizi girin.
                </p>
              </div>

              {/* Gender selector (biological profile) */}
              <div>
                <p className="field-label flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> Biyolojik cinsiyet *
                </p>
                <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Biyolojik cinsiyet">
                  {genderOptions.map((g) => {
                    const active = gender === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => handleGenderSelect(g.id)}
                        className={`${optionClass(active)} !flex-col !gap-1.5 h-full`}
                      >
                        <span className="w-full flex items-center justify-between gap-2">
                          <span className="text-[15px] font-bold text-slate-900">{g.title}</span>
                          <RadioDot active={active} />
                        </span>
                        <span className={active ? "chip-primary" : "chip"}>{g.badge}</span>
                        <span className="text-xs text-slate-500 leading-snug">{g.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">Fizyolojiye özel BMR ve kas dinamiği için.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ob-age" className="field-label">
                    Yaş
                  </label>
                  <input
                    id="ob-age"
                    type="text"
                    inputMode="numeric"
                    value={ageStr}
                    onChange={(e) => setAgeStr(e.target.value)}
                    placeholder="28"
                    className="input font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="ob-height" className="field-label">
                    Boy (cm)
                  </label>
                  <input
                    id="ob-height"
                    type="text"
                    inputMode="decimal"
                    value={heightStr}
                    onChange={(e) => setHeightStr(e.target.value)}
                    placeholder="180"
                    className="input font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="ob-weight" className="field-label">
                    Güncel kilo (kg) *
                  </label>
                  <input
                    id="ob-weight"
                    type="text"
                    inputMode="decimal"
                    value={currentWeightStr}
                    onChange={(e) => setCurrentWeightStr(e.target.value)}
                    placeholder="100.0"
                    className="input font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="ob-target" className="field-label">
                    Hedef kilo (kg) *
                  </label>
                  <input
                    id="ob-target"
                    type="text"
                    inputMode="decimal"
                    value={targetWeightStr}
                    onChange={(e) => setTargetWeightStr(e.target.value)}
                    placeholder="85.0"
                    className="input font-bold tabular-nums text-emerald-700"
                  />
                </div>
              </div>

              {/* Experience Level Selector */}
              <div>
                <p className="field-label">Spor geçmişin & kas hafızan</p>
                <div className="space-y-2" role="radiogroup" aria-label="Spor geçmişi">
                  {experienceOptions.map((item) => {
                    const active = experienceLevel === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setExperienceLevel(item.id)}
                        className={optionClass(active)}
                      >
                        <span
                          className={`w-9 h-9 shrink-0 rounded-xl inline-flex items-center justify-center ${
                            active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px]" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-slate-900">{item.title}</span>
                          <span className="block text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</span>
                        </span>
                        <RadioDot active={active} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: GOALS & INJURIES / LIMITATIONS ── */}
          {step === 2 && (
            <div key="s2" className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Hedef ve sağlık durumu</h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Antrenör Harun, sakatlıklarınızı ve hedefinizi hafızasına alarak riskli hareketleri programdan
                  otomatik çıkaracaktır.
                </p>
              </div>

              {/* Goal Selector */}
              <div>
                <p className="field-label flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600" /> Ana hedef
                </p>
                <div className="space-y-2" role="radiogroup" aria-label="Ana hedef">
                  {goalOptions.map((item) => {
                    const active = fitnessGoal === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setFitnessGoal(item.id)}
                        className={optionClass(active)}
                      >
                        <span
                          className={`w-9 h-9 shrink-0 rounded-xl inline-flex items-center justify-center ${
                            active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px]" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-slate-900">{item.title}</span>
                          <span className={`${active ? "chip-primary" : "chip"} mt-1`}>{item.badge}</span>
                          <span className="block text-xs text-slate-500 mt-1 leading-snug">{item.desc}</span>
                        </span>
                        <RadioDot active={active} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Injuries & Limitations Section */}
              <div>
                <p className="field-label flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Sakatlık & özel durum
                </p>
                <p className="text-xs text-slate-500 -mt-0.5 mb-2">Harun Hoca bunları hafızasına alır.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {injuryChips.map((chip) => {
                    const isSel =
                      chip.id === "none"
                        ? selectedInjuries.includes("none") || selectedInjuries.length === 0
                        : selectedInjuries.includes(chip.id);
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        role="checkbox"
                        aria-checked={isSel}
                        onClick={() => toggleInjuryChip(chip.id)}
                        className={`min-h-[52px] px-3 py-2 rounded-xl border text-left tap-effect flex items-center gap-2.5 ${
                          isSel
                            ? chip.id === "none"
                              ? "bg-emerald-50 border-emerald-500"
                              : "bg-amber-50 border-amber-400"
                            : "bg-white border-slate-200 md:hover:bg-slate-50"
                        }`}
                      >
                        {chip.id === "none" ? (
                          <ShieldAlert
                            className={`w-4 h-4 shrink-0 ${isSel ? "text-emerald-600" : "text-slate-400"}`}
                          />
                        ) : (
                          <HeartPulse className={`w-4 h-4 shrink-0 ${isSel ? "text-amber-600" : "text-slate-400"}`} />
                        )}
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] font-semibold text-slate-900 truncate">{chip.label}</span>
                          <span className="block text-xs text-slate-500 truncate">{chip.desc}</span>
                        </span>
                        <CheckBox active={isSel} />
                      </button>
                    );
                  })}
                </div>

                <label htmlFor="ob-injury-notes" className="sr-only">
                  Ekstra detay
                </label>
                <input
                  id="ob-injury-notes"
                  type="text"
                  value={customInjuryNotes}
                  onChange={(e) => setCustomInjuryNotes(e.target.value)}
                  placeholder="Ekstra detay (örn: Sol omzumda çıtlama var)..."
                  className="input mt-2"
                />
              </div>

              {/* Weekly Workout Days */}
              <div>
                <p className="field-label flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Haftada kaç gün?
                </p>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Haftalık gün">
                  {[3, 4, 5].map((days) => {
                    const active = workoutDays === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setWorkoutDays(days)}
                        className={`min-h-[60px] rounded-2xl border tap-effect flex flex-col items-center justify-center ${
                          active
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white border-slate-200 text-slate-700 md:hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-base font-extrabold tabular-nums">{days} gün</span>
                        <span className={`text-xs ${active ? "text-emerald-50" : "text-slate-400"}`}>Döngüsel split</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: EQUIPMENT & MAX DUMBBELL WEIGHT ── */}
          {step === 3 && (
            <div key="s3" className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Mevcut ekipmanların</h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Antrenör Harun, egzersizlerinizi ve ağırlık hedeflerinizi sahip olduğunuz ekipmana göre
                  ayarlayacaktır.
                </p>
              </div>

              <div className="space-y-2">
                {equipmentOptions.map((item) => {
                  const isSelected = selectedEquipment.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggleEquipment(item.id)}
                      className={optionClass(isSelected)}
                    >
                      <CheckBox active={isSelected} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-slate-900">{item.title}</span>
                        <span className="block text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Max Dumbbell Weight Dropdown/Input if Dumbbells selected */}
              {selectedEquipment.includes("Dumbbell") && (
                <div className="card-muted space-y-2 animate-fade-in-up">
                  <label htmlFor="ob-dumbbell" className="field-label !mb-0 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-600" /> Tek elde maksimum dambıl (kg)
                  </label>
                  <div className="grid grid-cols-[1fr_6rem] gap-2">
                    <select
                      id="ob-dumbbell"
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
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Antrenör Harun, program yazarken ağırlıklarınızı asla bu sınırın (
                    <span className="tabular-nums font-semibold text-slate-700">{parsedMaxDumbbell} kg</span>) üzerine
                    çıkarmayacaktır.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: MEET COACH HARUN & FINISH ── */}
          {step === 4 && (
            <div key="s4" className="space-y-5 animate-fade-in-up">
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-700/20">
                  <Dumbbell className="w-8 h-8" />
                </div>
                <p className="eyebrow text-emerald-600 mt-4">Kişisel baş antrenörün</p>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Merhaba {userName}, ben Harun!
                </h2>
              </div>

              {/* Quick Profile Summary */}
              <dl className="grid grid-cols-2 gap-px rounded-2xl overflow-hidden bg-slate-200/70 border border-slate-200/70">
                {[
                  { label: "Fizyoloji", value: gender === "female" ? "Kadın" : "Erkek" },
                  { label: "Kilo → hedef", value: `${parsedCurrentWeight} → ${parsedTargetWeight} kg` },
                  { label: "Haftalık döngü", value: `${workoutDays} gün / hafta` },
                  { label: "Dambıl sınırı", value: `${parsedMaxDumbbell} kg max` },
                ].map((s) => (
                  <div key={s.label} className="bg-white p-3 min-w-0">
                    <dt className="eyebrow">{s.label}</dt>
                    <dd className="text-sm font-bold text-slate-900 tabular-nums mt-0.5 truncate">{s.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <p>
                  <strong className="text-slate-900">Fizyolojik profilini analiz ettim:</strong>{" "}
                  {gender === "female" ? "Kadın" : "Erkek"} metabolizmana özel bazal kalori (BMR), kas toparlanma
                  dinamikleri, <span className="tabular-nums">{parsedCurrentWeight}</span> kg başlangıç ve{" "}
                  <span className="tabular-nums">{parsedTargetWeight}</span> kg hedefin için tüm döngüyü hazırladım.
                </p>

                <div className="flex gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-900 text-[13px]">
                  <Zap className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  {gender === "female" ? (
                    <p>
                      <strong>Kadın fizyolojisi optimizasyonu:</strong> Alt vücut & glute toparlanma avantajını
                      maksimize edip, üst vücutta hassas dambıl artışlarıyla yağsız sıkılaşma sağlayacağız.
                    </p>
                  ) : (
                    <p>
                      <strong>Erkek fizyolojisi optimizasyonu:</strong> Üst vücut hipertrofisi ve progressive overload
                      ağırlık artışlarıyla maksimum kuvvet ve V-taper formu hedefleyeceğiz.
                    </p>
                  )}
                </div>

                {compiledLimitations && compiledLimitations !== "Sakatlık yok" && (
                  <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-900 text-[13px]">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <p className="min-w-0 break-words">
                      <strong>Sakatlık kısıtlaması hafızama alındı:</strong> {compiledLimitations}. Bu bölgeleri
                      zorlayacak riskli varyasyonlar yerine güvenli hareketler planlayacağım.
                    </p>
                  </div>
                )}

                <p className="flex gap-2.5">
                  <Layers className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                  <span>
                    {selectedEquipment.includes("Dumbbell")
                      ? `Maksimum ${parsedMaxDumbbell} kg dambıl kapasitene ve mevcut ekipmanlarına göre programını hazırlayacağım.`
                      : "Mevcut ekipmanlarına göre tamamen kişiselleştirilmiş bir program uygulayacağız."}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky footer: Back / Next ── */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 sm:px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4 sm:rounded-b-3xl">
          <div className={`grid gap-2 ${step > 1 ? "grid-cols-[auto_1fr]" : "grid-cols-1"}`}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                className="btn-secondary btn-lg"
                aria-label="Geri"
              >
                <ArrowLeft />
                <span className="hidden min-[400px]:inline">Geri</span>
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as 2 | 3 | 4)}
                className="btn-primary btn-lg"
              >
                {step === 3 ? "Harun ile Tanış" : "Devam Et"}
                <ArrowRight />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinishOnboarding}
                className="btn-primary btn-lg"
              >
                {isSaving ? (
                  <span className="spinner !w-4 !h-4 !border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle2 />
                )}
                {isSaving ? "Kaydediliyor..." : "Kurulumu Tamamla"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
