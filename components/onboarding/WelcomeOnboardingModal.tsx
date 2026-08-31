"use client";

import { useState } from "react";
import { AppUser } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { setCurrentUser } from "@/lib/auth-pin";
import { useLanguage } from "@/lib/i18n";
import {
  Sparkles,
  ArrowRight,
  Check,
  Dumbbell,
  Target,
  User,
  Scale,
  Flame,
  Zap,
  CheckCircle2,
  Calendar,
  Layers
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

  // Form State
  const [age, setAge] = useState<number>(28);
  const [heightCm, setHeightCm] = useState<number>(user.height_cm || 182);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(100.0);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(user.target_weight_kg || 85.0);
  const [experienceLevel, setExperienceLevel] = useState<string>("muscle_memory");
  const [fitnessGoal, setFitnessGoal] = useState<string>("recomp");
  const [workoutDays, setWorkoutDays] = useState<number>(4);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    "Dumbbell",
    "Bodyweight",
    "Ab-Wheel",
    "Pull-up Bar",
  ]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleEquipment = (item: string) => {
    if (selectedEquipment.includes(item)) {
      setSelectedEquipment(selectedEquipment.filter((e) => e !== item));
    } else {
      setSelectedEquipment([...selectedEquipment, item]);
    }
  };

  const handleFinishOnboarding = async () => {
    setIsSaving(true);
    const supabase = createClient();

    try {
      // 1. Update user record in Supabase
      const { data: updatedUserData, error: userErr } = await supabase
        .from("app_users")
        .update({
          age,
          height_cm: heightCm,
          current_weight_kg: currentWeightKg,
          target_weight_kg: targetWeightKg,
          fitness_goal: fitnessGoal,
          experience_level: experienceLevel,
          workout_days_per_week: workoutDays,
          equipment: selectedEquipment,
          onboarding_completed: true,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (userErr) {
        console.warn("User update error:", userErr);
      }

      // 2. Insert initial baseline body metric
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("body_metrics").insert({
        user_id: user.id,
        recorded_at: today,
        weight_kg: currentWeightKg,
        waist_cm: 101.0,
        arm_cm: 40.0,
        chest_cm: 113.0,
        notes: "Antrenör Harun ile başlangıç kurulum tartımı",
      });

      const updatedUser: AppUser = {
        ...user,
        age,
        height_cm: heightCm,
        current_weight_kg: currentWeightKg,
        target_weight_kg: targetWeightKg,
        fitness_goal: fitnessGoal,
        experience_level: experienceLevel,
        workout_days_per_week: workoutDays,
        equipment: selectedEquipment,
        onboarding_completed: true,
      };

      setCurrentUser(updatedUser);
      onComplete(updatedUser);
    } catch (err) {
      console.error("Onboarding finish error:", err);
      // Fallback
      const fallbackUser: AppUser = {
        ...user,
        onboarding_completed: true,
      };
      setCurrentUser(fallbackUser);
      onComplete(fallbackUser);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 animate-slide-up relative max-h-[92vh] overflow-y-auto">
        {/* Top Progress Dots */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              H
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Baş Antrenör Harun • Kurulum
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">
                {step === 1 && "Fiziksel Ölçüleriniz"}
                {step === 2 && "Hedef ve Antrenman Düzeni"}
                {step === 3 && "Mevcut Ekipmanlarınız"}
                {step === 4 && "Antrenör Harun ile Tanışın"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-6 bg-emerald-600"
                    : s < step
                    ? "w-2 bg-emerald-400"
                    : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── STEP 1: PHYSICAL MEASUREMENTS ── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Hoş Geldiniz, {user.display_name || user.username}! 👋
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Antrenör Harun&apos;un sizin için en doğru kalori, hacim ve ağırlık periyodizasyonunu çıkarabilmesi için temel bilgilerinizi girin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yaş
                </label>
                <input
                  type="number"
                  min={14}
                  max={90}
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 28)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Boy (cm)
                </label>
                <input
                  type="number"
                  min={120}
                  max={240}
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 180)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Güncel Kilo (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(parseFloat(e.target.value) || 100)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hedef Kilo (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 85)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Experience Level Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Spor Geçmişiniz & Kas Hafızası
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: "muscle_memory",
                    title: "Eski Sporcu / Kas Hafızası Var 🔥",
                    desc: "Daha önce düzenli ağırlık çalıştım, kas temelim var.",
                  },
                  {
                    id: "intermediate",
                    title: "Orta Seviye ⚡",
                    desc: "Temel hareketleri ve formları biliyorum, düzenli çalışmak istiyorum.",
                  },
                  {
                    id: "beginner",
                    title: "Yeni Başlayan 🌱",
                    desc: "Sıfırdan başlıyorum, form rehberleri ve yönlendirme istiyorum.",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setExperienceLevel(item.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer tap-effect flex items-start justify-between ${
                      experienceLevel === item.id
                        ? "bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    {experienceLevel === item.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm tap-effect flex items-center gap-2"
              >
                <span>Devam Et</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: GOALS & FREQUENCY ── */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Hedefinizi Belirleyin
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Antrenör Harun, antrenman splitinizi ve kalori hedefinizi bu tercihe göre programlayacak.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {[
                {
                  id: "recomp",
                  title: "Body Recomposition (Önerilen) ⚖️",
                  badge: "KAS KORU + YAĞ YAK",
                  desc: "Kilonuz dengeli kalırken bel çevrenizi daraltın, kas doluluğunuzu artırın.",
                },
                {
                  id: "lean_cut",
                  title: "Lean Cut / Hızlı Definasyon ✂️",
                  badge: "YAĞ YAKIMI",
                  desc: "Kalori açığı ve yüksek tempolu döngüyle hızlı yağ kaybı.",
                },
                {
                  id: "hypertrophy",
                  title: "Kas Kazanımı & Hipertrofi 🦍",
                  badge: "HACİM VE GÜÇ",
                  desc: "24.5 kg dambıllarla progressive overload ve maksimum kas kütlesi.",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setFitnessGoal(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer tap-effect flex items-start justify-between ${
                    fitnessGoal === item.id
                      ? "bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold">{item.title}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                  </div>
                  {fitnessGoal === item.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>

            {/* Weekly Workout Days */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Haftada Kaç Gün Antrenman Yapabilirsiniz?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setWorkoutDays(days)}
                    className={`py-3 rounded-2xl border text-xs font-extrabold transition-all tap-effect flex flex-col items-center justify-center ${
                      workoutDays === days
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{days} Gün</span>
                    <span className="text-[10px] font-normal opacity-80 mt-0.5">Döngüsel Split</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm tap-effect flex items-center gap-2"
              >
                <span>Devam Et</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: EQUIPMENT ── */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Mevcut Ekipmanlarınız
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Antrenör Harun, egzersizlerinizi sahip olduğunuz ekipmanlara göre seçecek.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {[
                {
                  id: "Dumbbell",
                  title: "Ayarlanabilir Dambıllar (2x 24.5 kg) 🏋️‍♂️",
                  desc: "Tüm pres, row, goblet squat ve kol hareketleri için temel ağırlık.",
                },
                {
                  id: "Ab-Wheel",
                  title: "Ab-Wheel (Karın Tekeri) ⚙️",
                  desc: "Core ve karın stabilitesi için en etkili ekipman.",
                },
                {
                  id: "Pull-up Bar",
                  title: "Barfiks Barı 🚪",
                  desc: "Geniş sırt, kanat ve biceps gelişimi için çekiş hareketleri.",
                },
                {
                  id: "Bodyweight",
                  title: "Vücut Ağırlığı & Zemin / Mat 🧘",
                  desc: "Şınav, plank, floor press ve esneme hareketleri.",
                },
              ].map((item) => {
                const isSelected = selectedEquipment.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleEquipment(item.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer tap-effect flex items-start justify-between ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? "bg-emerald-600 text-white" : "border border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm tap-effect flex items-center gap-2"
              >
                <span>Antrenör Harun ile Tanış</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: MEET COACH HARUN & FINISH ── */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
              <Dumbbell className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider">
                Kişisel Baş Antrenörün
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-2">
                Merhaba {user.display_name || user.username}, Ben Antrenörün Harun! 🤝
              </h2>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-left text-xs text-slate-700 leading-relaxed space-y-2">
              <p>
                <strong className="text-slate-900">Profilini analiz ettim:</strong> {currentWeightKg} kg başlangıç kilon, {targetWeightKg} kg hedef kilon ve {workoutDays} günlük döngüsel antrenman hedefin için tüm hazırlıkları yaptım.
              </p>
              <p>
                24.5 kg ayarlanabilir dambılların ve barfiks barınla kas hafızanı çok hızlı tetikleyeceğiz. Her hafta ölçümlerini ve fotoğraflarını inceleyip ağırlıklarını optimize edeceğim.
              </p>
            </div>

            {/* Quick Profile Summary Badge */}
            <div className="grid grid-cols-3 gap-2 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/70 text-left">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">KİLO / HEDEF</span>
                <span className="text-xs font-black text-slate-900">{currentWeightKg}kg ➔ {targetWeightKg}kg</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">HAFTALIK DÖNGÜ</span>
                <span className="text-xs font-black text-emerald-800">{workoutDays} Gün / Hafta</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">STRATEJİ</span>
                <span className="text-xs font-black text-slate-900 uppercase">{fitnessGoal}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinishOnboarding}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/25 tap-effect flex items-center justify-center gap-2 transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isSaving ? "Profil Kaydediliyor..." : "Kurulumu Tamamla & Antrenmana Başla"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
