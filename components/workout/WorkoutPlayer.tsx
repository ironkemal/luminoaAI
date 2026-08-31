"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { WorkoutRoutine, RoutineExercise, Exercise, SetLog } from "@/types";
import { playRestCompleteSound, playTimerTick, triggerVibration } from "@/lib/sound-haptic";
import ExerciseGuideModal from "@/components/workout/ExerciseGuideModal";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Minus,
  Timer,
  X,
  Trophy,
  Dumbbell,
  BookOpen,
  Play
} from "lucide-react";

interface WorkoutPlayerProps {
  routine: WorkoutRoutine;
  routineExercises: (RoutineExercise & { exercise: Exercise })[];
}

export default function WorkoutPlayer({
  routine,
  routineExercises,
}: WorkoutPlayerProps) {
  const router = useRouter();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);

  // Active set deviation state
  const [activeWeight, setActiveWeight] = useState<number>(0);
  const [activeReps, setActiveReps] = useState<number>(10);

  // Completed sets dictionary: exerciseId -> SetLog[]
  const [completedSets, setCompletedSets] = useState<Record<string, SetLog[]>>({});

  // Visual Guide Modal state
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Rest Timer State
  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(90);
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Session Finish Modal State
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rpeScore, setRpeScore] = useState<number>(8);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStartedAt] = useState<string>(new Date().toISOString());

  const currentRoutineExercise = routineExercises[currentExerciseIndex];
  const currentExercise = currentRoutineExercise?.exercise;

  useEffect(() => {
    if (currentRoutineExercise) {
      const targetWeight = Number(currentRoutineExercise.target_weight_kg) || 0;
      setActiveWeight(targetWeight);

      const repsMatch = currentRoutineExercise.target_reps.match(/(\d+)/g);
      const parsedReps = repsMatch ? parseInt(repsMatch[repsMatch.length - 1], 10) : 10;
      setActiveReps(parsedReps);

      const exId = currentRoutineExercise.exercise_id;
      const logged = completedSets[exId] || [];
      setCurrentSetNumber(logged.length + 1);
    }
  }, [currentExerciseIndex, currentRoutineExercise]);

  useEffect(() => {
    if (isResting) {
      timerIntervalRef.current = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsResting(false);
            playRestCompleteSound();
            return 0;
          }
          if (prev <= 3) {
            playTimerTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isResting]);

  const startRestTimer = (seconds?: number) => {
    const duration = seconds || currentExercise?.default_rest_seconds || 90;
    setRestTotalSeconds(duration);
    setRestSecondsRemaining(duration);
    setIsResting(true);
    triggerVibration(100);
  };

  const stopRestTimer = () => {
    setIsResting(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const addRestTime = (seconds: number) => {
    setRestSecondsRemaining((prev) => Math.max(5, prev + seconds));
    setRestTotalSeconds((prev) => Math.max(5, prev + seconds));
  };

  const handleCompleteSet = () => {
    if (!currentRoutineExercise || !currentExercise) return;

    const newLog: SetLog = {
      session_id: "",
      exercise_id: currentExercise.id,
      set_number: currentSetNumber,
      actual_reps: activeReps,
      actual_weight_kg: activeWeight,
      completed: true,
      exercise: currentExercise,
    };

    const exId = currentExercise.id;
    const existing = completedSets[exId] || [];
    const updated = [...existing, newLog];

    setCompletedSets((prev) => ({
      ...prev,
      [exId]: updated,
    }));

    const nextSet = currentSetNumber + 1;
    setCurrentSetNumber(nextSet);

    if (nextSet > currentRoutineExercise.target_sets) {
      if (currentExerciseIndex < routineExercises.length - 1) {
        startRestTimer(currentExercise.default_rest_seconds || 90);
        setTimeout(() => {
          setCurrentExerciseIndex((prev) => prev + 1);
        }, 300);
      } else {
        startRestTimer(60);
        setShowFinishModal(true);
      }
    } else {
      startRestTimer(currentExercise.default_rest_seconds || 90);
    }
  };

  const handleFinishWorkout = async () => {
    setIsSaving(true);
    const supabase = createClient();
    const currentUser = getCurrentUser();

    try {
      const { data: sessionData, error: sessionErr } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: currentUser?.id || null,
          routine_id: routine.id,
          started_at: sessionStartedAt,
          completed_at: new Date().toISOString(),
          notes: sessionNotes || null,
          rpe_score: rpeScore,
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      const sessionId = sessionData.id;

      const logsToInsert: {
        session_id: string;
        exercise_id: string;
        set_number: number;
        actual_reps: number;
        actual_weight_kg: number;
        completed: boolean;
      }[] = [];

      Object.values(completedSets).forEach((sets) => {
        sets.forEach((s) => {
          logsToInsert.push({
            session_id: sessionId,
            exercise_id: s.exercise_id,
            set_number: s.set_number,
            actual_reps: s.actual_reps,
            actual_weight_kg: s.actual_weight_kg,
            completed: true,
          });
        });
      });

      if (logsToInsert.length > 0) {
        await supabase.from("set_logs").insert(logsToInsert);
      }

      router.push("/workout?completed=true");
    } catch (err) {
      console.error("Error saving workout session:", err);
      alert("Antrenman kaydedilirken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalSetsTarget = routineExercises.reduce((acc, curr) => acc + curr.target_sets, 0);
  const totalSetsCompleted = Object.values(completedSets).reduce((acc, curr) => acc + curr.length, 0);
  const progressPercent = Math.min(100, Math.round((totalSetsCompleted / (totalSetsTarget || 1)) * 100));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm("Antrenmandan çıkmak istediğinize emin misiniz?")) {
                router.push("/workout");
              }
            }}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 tap-effect"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-sm font-bold text-slate-800 truncate">
              {routine.name}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                %{progressPercent}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowFinishModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 tap-effect"
          >
            Bitir
          </button>
        </div>
      </header>

      {/* Exercise Pill Tabs */}
      <div className="bg-white border-b border-slate-200/60 overflow-x-auto py-2.5 px-4 scrollbar-none">
        <div className="flex items-center gap-2 max-w-xl mx-auto">
          {routineExercises.map((re, index) => {
            const isCurrent = index === currentExerciseIndex;
            const completedCount = completedSets[re.exercise_id]?.length || 0;
            const isFinished = completedCount >= re.target_sets;

            return (
              <button
                key={re.id}
                onClick={() => setCurrentExerciseIndex(index)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all tap-effect ${
                  isCurrent
                    ? "bg-slate-900 text-white shadow-sm"
                    : isFinished
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {isFinished && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{index + 1}. {re.exercise?.name.slice(0, 14)}...</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Focus Area */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4 flex flex-col justify-center animate-fade-in">
        {/* Rest Timer Bar */}
        {isResting && (
          <div className="mb-4 bg-emerald-600 text-white rounded-3xl p-5 shadow-card flex flex-col items-center animate-slide-up relative overflow-hidden">
            <div className="flex items-center justify-between w-full mb-2 text-xs text-emerald-100">
              <span className="font-semibold flex items-center gap-1.5">
                <Timer className="w-4 h-4 animate-spin" /> Dinlenme Sayacı
              </span>
              <button
                onClick={stopRestTimer}
                className="text-xs underline text-emerald-200 hover:text-white font-medium"
              >
                Dinlenmeyi Atla
              </button>
            </div>

            <div className="text-4xl sm:text-5xl font-black tracking-tight my-1">
              {Math.floor(restSecondsRemaining / 60)}:
              {(restSecondsRemaining % 60).toString().padStart(2, "0")}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => addRestTime(-15)}
                className="px-3 py-1 bg-emerald-700/60 hover:bg-emerald-700 rounded-lg text-xs font-semibold tap-effect"
              >
                -15s
              </button>
              <button
                onClick={() => addRestTime(30)}
                className="px-3 py-1 bg-emerald-700/60 hover:bg-emerald-700 rounded-lg text-xs font-semibold tap-effect"
              >
                +30s
              </button>
              <button
                onClick={stopRestTimer}
                className="px-4 py-1 bg-white text-emerald-800 rounded-lg text-xs font-bold tap-effect"
              >
                Sonraki Sete Geç
              </button>
            </div>
          </div>
        )}

        {/* Current Exercise Card */}
        <div className="surface-card p-6 md:p-8 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                {currentExercise?.target_muscle} • {currentExercise?.equipment}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {currentExercise?.name}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              Set {currentSetNumber} / {currentRoutineExercise?.target_sets}
            </span>
          </div>

          {/* Visual Guide Button & Instruction */}
          <div className="flex items-center gap-2 mb-5">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 tap-effect flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Nasıl Yapılır? (Görsel & Video Rehberi)
            </button>
          </div>

          {/* Target Values Indicator */}
          <div className="flex items-center justify-around bg-slate-50 rounded-2xl p-3.5 mb-6 border border-slate-100">
            <div className="text-center">
              <p className="text-[11px] text-slate-400 font-medium">Hedef Ağırlık</p>
              <p className="text-base font-bold text-slate-800">
                {currentRoutineExercise?.target_weight_kg} kg
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <p className="text-[11px] text-slate-400 font-medium">Hedef Tekrar</p>
              <p className="text-base font-bold text-slate-800">
                {currentRoutineExercise?.target_reps}
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <p className="text-[11px] text-slate-400 font-medium">Dinlenme</p>
              <p className="text-base font-bold text-slate-800">
                {currentExercise?.default_rest_seconds} sn
              </p>
            </div>
          </div>

          {/* Deviation Adjusters */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-500 mb-1">
                Ağırlık (kg)
              </span>
              <div className="text-3xl font-extrabold text-slate-900 my-1">
                {activeWeight}
              </div>
              <div className="flex items-center gap-2 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setActiveWeight((prev) => Math.max(0, Number((prev - 1.25).toFixed(1))))}
                  className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 tap-effect flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWeight((prev) => Math.min(24.5, Number((prev + 1.25).toFixed(1))))}
                  className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 tap-effect flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-500 mb-1">
                Tekrar (Reps)
              </span>
              <div className="text-3xl font-extrabold text-slate-900 my-1">
                {activeReps}
              </div>
              <div className="flex items-center gap-2 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setActiveReps((prev) => Math.max(1, prev - 1))}
                  className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 tap-effect flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReps((prev) => prev + 1)}
                  className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 tap-effect flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCompleteSet}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg shadow-sm hover:shadow-md tap-effect flex items-center justify-center gap-3 transition-all"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            Seti Tamamla ve Sayacı Başlat
          </button>
        </div>

        {/* Previous Completed Sets */}
        {currentExercise && (completedSets[currentExercise.id]?.length || 0) > 0 && (
          <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tamamlanan Setler
            </h4>
            <div className="flex flex-wrap gap-2">
              {completedSets[currentExercise.id].map((set) => (
                <div
                  key={set.set_number}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Set {set.set_number}: {set.actual_weight_kg}kg x {set.actual_reps} tekrar</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex((prev) => prev - 1)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 tap-effect flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Önceki Egzersiz
          </button>

          <button
            type="button"
            disabled={currentExerciseIndex === routineExercises.length - 1}
            onClick={() => setCurrentExerciseIndex((prev) => prev + 1)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 tap-effect flex items-center gap-1"
          >
            Sonraki Egzersiz <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Exercise Visual Guide Modal */}
      <ExerciseGuideModal
        exercise={currentExercise || null}
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      {/* Finish Workout Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-slide-up border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 mx-auto">
              <Trophy className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 text-center tracking-tight">
              Harika İş! Antrenmanı Tamamla
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1 mb-6">
              Toplam {totalSetsCompleted} set başarıyla tamamlandı.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Genel Zorluk Derecesi (RPE: 1 - 10)
              </label>
              <div className="flex items-center justify-between gap-1">
                {[5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRpeScore(score)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold tap-effect transition-all ${
                      rpeScore === score
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Antrenman Notu (İsteğe Bağlı)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Örn: Shoulder press çok güçlü hissettirdi..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs tap-effect"
              >
                Geri Dön
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinishWorkout}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tap-effect flex items-center justify-center gap-2 shadow-sm"
              >
                {isSaving ? "Kaydediliyor..." : "Kaydet ve Bitir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
