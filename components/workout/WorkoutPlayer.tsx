"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { WorkoutRoutine, RoutineExercise, Exercise, SetLog } from "@/types";
import { playRestCompleteSound, playTimerTick, triggerVibration } from "@/lib/sound-haptic";
import { getExerciseVisual } from "@/lib/exercise-visuals";
import { useLanguage } from "@/lib/i18n";
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
  Eye,
  EyeOff,
  Maximize2
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
  const { t } = useLanguage();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);

  const [activeWeight, setActiveWeight] = useState<number>(0);
  const [activeReps, setActiveReps] = useState<number>(10);
  const [completedSets, setCompletedSets] = useState<Record<string, SetLog[]>>({});
  const [showAnimation, setShowAnimation] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Rest Timer State
  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(90);
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Session Finish Modal
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rpeScore, setRpeScore] = useState<number>(8);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStartedAt] = useState<string>(new Date().toISOString());

  const currentRoutineExercise = routineExercises[currentExerciseIndex];
  const currentExercise = currentRoutineExercise?.exercise;
  const currentVisual = currentExercise ? getExerciseVisual(currentExercise.name) : null;

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
      alert("Antrenman kaydedilirken hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalSetsTarget = routineExercises.reduce((acc, curr) => acc + curr.target_sets, 0);
  const totalSetsCompleted = Object.values(completedSets).reduce((acc, curr) => acc + curr.length, 0);
  const progressPercent = Math.min(100, Math.round((totalSetsCompleted / (totalSetsTarget || 1)) * 100));

  return (
    <div className="min-h-screen bg-[#090B0E] text-white flex flex-col justify-between select-none">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-[#0C0F15] border-b border-white/[0.08] px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm(t("exitConfirm"))) {
                router.push("/workout");
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] tap-effect"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate">
              {routine.name}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-24 bg-[#141822] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#E2F952] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[#E2F952]">
                %{progressPercent}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowFinishModal(true)}
            className="px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold text-xs border border-white/[0.08] tap-effect"
          >
            {t("finish")}
          </button>
        </div>
      </header>

      {/* Exercise Tabs */}
      <div className="bg-[#0E121A] border-b border-white/[0.06] overflow-x-auto py-2 px-4 scrollbar-none">
        <div className="flex items-center gap-1.5 max-w-xl mx-auto">
          {routineExercises.map((re, index) => {
            const isCurrent = index === currentExerciseIndex;
            const completedCount = completedSets[re.exercise_id]?.length || 0;
            const isFinished = completedCount >= re.target_sets;

            return (
              <button
                key={re.id}
                onClick={() => setCurrentExerciseIndex(index)}
                className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all tap-effect ${
                  isCurrent
                    ? "bg-[#E2F952] text-black"
                    : isFinished
                    ? "bg-white/[0.06] text-[#E2F952]"
                    : "bg-[#141822] text-slate-400 hover:text-white"
                }`}
              >
                {isFinished && <Check className="w-3 h-3 stroke-[2.5]" />}
                <span>{index + 1}. {re.exercise?.name.slice(0, 12)}...</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Focus Area */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4 flex flex-col justify-center animate-fade-in">
        {/* Rest Timer */}
        {isResting && (
          <div className="mb-4 bg-[#141822] text-white rounded-2xl p-5 border border-white/[0.1] shadow-xl flex flex-col items-center animate-slide-up">
            <div className="flex items-center justify-between w-full mb-1 text-xs text-slate-400">
              <span className="font-bold flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-[#E2F952]" /> {t("restTimer")}
              </span>
              <button
                onClick={stopRestTimer}
                className="text-xs text-[#E2F952] hover:underline font-bold tap-effect"
              >
                {t("skipRest")}
              </button>
            </div>

            <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight my-1 text-white">
              {Math.floor(restSecondsRemaining / 60)}:
              {(restSecondsRemaining % 60).toString().padStart(2, "0")}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => addRestTime(-15)}
                className="px-3 py-1 bg-[#1A202C] hover:bg-[#252D3D] rounded-lg text-xs font-bold tap-effect border border-white/5"
              >
                -15s
              </button>
              <button
                onClick={() => addRestTime(30)}
                className="px-3 py-1 bg-[#1A202C] hover:bg-[#252D3D] rounded-lg text-xs font-bold tap-effect border border-white/5"
              >
                +30s
              </button>
              <button
                onClick={stopRestTimer}
                className="px-4 py-1 btn-primary rounded-lg text-xs font-black tap-effect"
              >
                {t("nextSet")}
              </button>
            </div>
          </div>
        )}

        {/* Current Exercise Card */}
        <div className="surface-card p-5 md:p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#171C26] px-2 py-0.5 rounded-md">
                {currentExercise?.target_muscle} • {currentExercise?.equipment}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                {currentExercise?.name}
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-[#171C26] text-white font-bold text-xs">
              {t("set")} {currentSetNumber} / {currentRoutineExercise?.target_sets}
            </span>
          </div>

          {/* Animated GIF Frame */}
          {showAnimation && currentVisual?.gifUrl && (
            <div className="relative w-full h-44 sm:h-50 bg-black rounded-xl mb-3 overflow-hidden flex items-center justify-center border border-white/[0.08] group">
              <img
                src={currentVisual.gifUrl}
                alt={currentExercise?.name}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentVisual.thumbnailUrl || "";
                }}
              />
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-[10px] font-bold text-white tap-effect flex items-center gap-1 border border-white/10"
              >
                <Maximize2 className="w-3 h-3 text-[#E2F952]" /> {t("maximize")}
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-medium text-xs tap-effect flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#E2F952]" />
              {t("formGuideBtn")}
            </button>

            <button
              type="button"
              onClick={() => setShowAnimation(!showAnimation)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white text-xs font-medium tap-effect flex items-center gap-1"
            >
              {showAnimation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#E2F952]" />}
              {showAnimation ? t("hideAnimation") : t("showAnimation")}
            </button>
          </div>

          {/* Targets */}
          <div className="flex items-center justify-around bg-[#090B0E] rounded-xl p-2.5 mb-4 border border-white/[0.06]">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{t("targetWeight")}</p>
              <p className="text-sm font-black text-white mt-0.5">
                {currentRoutineExercise?.target_weight_kg} kg
              </p>
            </div>
            <div className="w-px h-6 bg-white/[0.08]" />
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{t("targetReps")}</p>
              <p className="text-sm font-black text-white mt-0.5">
                {currentRoutineExercise?.target_reps}
              </p>
            </div>
            <div className="w-px h-6 bg-white/[0.08]" />
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{t("restTime")}</p>
              <p className="text-sm font-black text-white mt-0.5">
                {currentExercise?.default_rest_seconds}s
              </p>
            </div>
          </div>

          {/* Stepper Values */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-[#090B0E] border border-white/[0.06] rounded-xl p-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                {t("weightKg")}
              </span>
              <div className="text-2xl font-black text-white font-mono my-0.5">
                {activeWeight}
              </div>
              <div className="flex items-center gap-1.5 w-full mt-1">
                <button
                  type="button"
                  onClick={() => setActiveWeight((prev) => Math.max(0, Number((prev - 1.25).toFixed(1))))}
                  className="flex-1 py-1.5 bg-[#171C26] hover:bg-[#202634] rounded-lg font-bold text-slate-200 tap-effect flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWeight((prev) => Math.min(24.5, Number((prev + 1.25).toFixed(1))))}
                  className="flex-1 py-1.5 bg-[#171C26] hover:bg-[#202634] rounded-lg font-bold text-slate-200 tap-effect flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-[#090B0E] border border-white/[0.06] rounded-xl p-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                {t("reps")}
              </span>
              <div className="text-2xl font-black text-white font-mono my-0.5">
                {activeReps}
              </div>
              <div className="flex items-center gap-1.5 w-full mt-1">
                <button
                  type="button"
                  onClick={() => setActiveReps((prev) => Math.max(1, prev - 1))}
                  className="flex-1 py-1.5 bg-[#171C26] hover:bg-[#202634] rounded-lg font-bold text-slate-200 tap-effect flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReps((prev) => prev + 1)}
                  className="flex-1 py-1.5 bg-[#171C26] hover:bg-[#202634] rounded-lg font-bold text-slate-200 tap-effect flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCompleteSet}
            className="w-full py-3.5 rounded-xl btn-primary text-sm font-black tap-effect flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            {t("completeSet")}
          </button>
        </div>

        {/* Completed Sets */}
        {currentExercise && (completedSets[currentExercise.id]?.length || 0) > 0 && (
          <div className="mt-3 p-3 surface-card">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">
              {t("completedSets")}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {completedSets[currentExercise.id].map((set) => (
                <div
                  key={set.set_number}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-white text-xs font-bold flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-[#E2F952]" />
                  <span>Set {set.set_number}: {set.actual_weight_kg}kg × {set.actual_reps}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0C0F15] border-t border-white/[0.08] px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex((prev) => prev - 1)}
            className="px-3.5 py-2 rounded-lg bg-[#141822] hover:bg-[#1A202C] disabled:opacity-30 text-xs font-bold text-slate-300 tap-effect flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> {t("prevExercise")}
          </button>

          <button
            type="button"
            disabled={currentExerciseIndex === routineExercises.length - 1}
            onClick={() => setCurrentExerciseIndex((prev) => prev + 1)}
            className="px-3.5 py-2 rounded-lg bg-[#141822] hover:bg-[#1A202C] disabled:opacity-30 text-xs font-bold text-slate-300 tap-effect flex items-center gap-1"
          >
            {t("nextExercise")} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Guide Modal */}
      <ExerciseGuideModal
        exercise={currentExercise || null}
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      {/* Finish Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11151D] rounded-2xl p-6 border border-white/[0.1] animate-slide-up">
            <div className="w-12 h-12 rounded-xl bg-white/[0.08] text-[#E2F952] flex items-center justify-center mb-3 mx-auto">
              <Trophy className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white text-center">
              {t("finishWorkoutTitle")}
            </h3>
            <p className="text-xs text-slate-400 text-center mt-0.5 mb-5">
              Toplam {totalSetsCompleted} set başarıyla tamamlandı.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {t("rpeLabel")}
              </label>
              <div className="flex items-center gap-1">
                {[5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRpeScore(score)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold tap-effect transition-all ${
                      rpeScore === score
                        ? "bg-[#E2F952] text-black font-black"
                        : "bg-[#090B0E] text-slate-400 hover:text-white"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t("sessionNotesLabel")}
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder={t("sessionNotesPlaceholder")}
                rows={2}
                className="w-full px-3 py-2 text-xs bg-[#090B0E] border border-white/[0.08] rounded-xl focus:outline-none focus:border-[#E2F952] text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-2.5 rounded-xl btn-secondary text-xs font-bold tap-effect"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinishWorkout}
                className="flex-1 py-2.5 rounded-xl btn-primary text-xs tap-effect flex items-center justify-center gap-1.5"
              >
                {isSaving ? t("saving") : t("saveAndFinish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
