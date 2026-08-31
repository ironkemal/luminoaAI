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
  Maximize2,
  Zap
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

  // Active set deviation state
  const [activeWeight, setActiveWeight] = useState<number>(0);
  const [activeReps, setActiveReps] = useState<number>(10);

  // Completed sets dictionary: exerciseId -> SetLog[]
  const [completedSets, setCompletedSets] = useState<Record<string, SetLog[]>>({});

  // Inline GIF animation toggle
  const [showAnimation, setShowAnimation] = useState(true);

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
    <div className="min-h-screen bg-[#080C14] text-white flex flex-col justify-between select-none">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 shadow-xl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm(t("exitConfirm"))) {
                router.push("/workout");
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] tap-effect"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-sm font-black text-white truncate tracking-tight">
              {routine.name}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-32 bg-slate-900 border border-white/[0.06] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-emerald-400">
                %{progressPercent}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowFinishModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-extrabold text-xs border border-emerald-500/30 tap-effect transition-all"
          >
            {t("finish")}
          </button>
        </div>
      </header>

      {/* Exercise Pill Tabs */}
      <div className="bg-slate-950/90 border-b border-white/[0.08] overflow-x-auto py-2.5 px-4 scrollbar-none">
        <div className="flex items-center gap-2 max-w-xl mx-auto">
          {routineExercises.map((re, index) => {
            const isCurrent = index === currentExerciseIndex;
            const completedCount = completedSets[re.exercise_id]?.length || 0;
            const isFinished = completedCount >= re.target_sets;

            return (
              <button
                key={re.id}
                onClick={() => setCurrentExerciseIndex(index)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all tap-effect ${
                  isCurrent
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-500/30 scale-105"
                    : isFinished
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                {isFinished && <Check className="w-3.5 h-3.5 text-emerald-400" />}
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
          <div className="mb-4 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-5 shadow-2xl flex flex-col items-center animate-slide-up relative overflow-hidden border border-emerald-400/30">
            <div className="flex items-center justify-between w-full mb-2 text-xs text-emerald-100">
              <span className="font-extrabold flex items-center gap-1.5">
                <Timer className="w-4 h-4 animate-spin text-emerald-200" /> {t("restTimer")}
              </span>
              <button
                onClick={stopRestTimer}
                className="text-xs underline text-emerald-200 hover:text-white font-bold tap-effect"
              >
                {t("skipRest")}
              </button>
            </div>

            <div className="text-5xl sm:text-6xl font-black tracking-tight my-1 text-white drop-shadow-md">
              {Math.floor(restSecondsRemaining / 60)}:
              {(restSecondsRemaining % 60).toString().padStart(2, "0")}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => addRestTime(-15)}
                className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/60 rounded-xl text-xs font-bold tap-effect border border-white/10"
              >
                -15s
              </button>
              <button
                onClick={() => addRestTime(30)}
                className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/60 rounded-xl text-xs font-bold tap-effect border border-white/10"
              >
                +30s
              </button>
              <button
                onClick={stopRestTimer}
                className="px-4 py-1.5 bg-white text-emerald-950 rounded-xl text-xs font-black shadow-md tap-effect"
              >
                {t("nextSet")}
              </button>
            </div>
          </div>
        )}

        {/* Current Exercise Card */}
        <div className="surface-card p-5 md:p-7 flex flex-col overflow-hidden border-emerald-500/20">
          {/* Header & Badges */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {currentExercise?.target_muscle} • {currentExercise?.equipment}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
                {currentExercise?.name}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/[0.08] text-emerald-300 font-extrabold text-xs">
              {t("set")} {currentSetNumber} / {currentRoutineExercise?.target_sets}
            </span>
          </div>

          {/* ── LIVE ANIMATED MOTION GIF CONTAINER ── */}
          {showAnimation && currentVisual?.gifUrl && (
            <div className="relative w-full h-44 sm:h-52 bg-slate-950 rounded-2xl mb-4 overflow-hidden flex items-center justify-center border border-white/[0.1] shadow-2xl group">
              <img
                src={currentVisual.gifUrl}
                alt={currentExercise?.name}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentVisual.thumbnailUrl || "";
                }}
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[10px] font-black text-white flex items-center gap-1.5 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t("liveAnimation")}
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-[10px] font-black text-white tap-effect flex items-center gap-1 border border-white/10"
              >
                <Maximize2 className="w-3 h-3 text-emerald-400" /> {t("maximize")}
              </button>
            </div>
          )}

          {/* Guide / Animation Toggle Buttons */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/20 tap-effect flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              {t("formGuideBtn")}
            </button>

            <button
              type="button"
              onClick={() => setShowAnimation(!showAnimation)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-300 text-xs font-semibold tap-effect flex items-center gap-1 transition-colors"
            >
              {showAnimation ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
              {showAnimation ? t("hideAnimation") : t("showAnimation")}
            </button>
          </div>

          {/* Target Values Indicator */}
          <div className="flex items-center justify-around bg-slate-900/90 rounded-2xl p-3 mb-5 border border-white/[0.08]">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("targetWeight")}</p>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                {currentRoutineExercise?.target_weight_kg} kg
              </p>
            </div>
            <div className="w-px h-7 bg-white/[0.08]" />
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("targetReps")}</p>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                {currentRoutineExercise?.target_reps}
              </p>
            </div>
            <div className="w-px h-7 bg-white/[0.08]" />
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("restTime")}</p>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                {currentExercise?.default_rest_seconds} sn
              </p>
            </div>
          </div>

          {/* Deviation Adjusters */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                {t("weightKg")}
              </span>
              <div className="text-3xl font-black text-white my-0.5">
                {activeWeight}
              </div>
              <div className="flex items-center gap-1.5 w-full mt-1.5">
                <button
                  type="button"
                  onClick={() => setActiveWeight((prev) => Math.max(0, Number((prev - 1.25).toFixed(1))))}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-white/[0.08] rounded-xl font-black text-slate-200 tap-effect flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWeight((prev) => Math.min(24.5, Number((prev + 1.25).toFixed(1))))}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-white/[0.08] rounded-xl font-black text-slate-200 tap-effect flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                {t("reps")}
              </span>
              <div className="text-3xl font-black text-white my-0.5">
                {activeReps}
              </div>
              <div className="flex items-center gap-1.5 w-full mt-1.5">
                <button
                  type="button"
                  onClick={() => setActiveReps((prev) => Math.max(1, prev - 1))}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-white/[0.08] rounded-xl font-black text-slate-200 tap-effect flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReps((prev) => prev + 1)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-white/[0.08] rounded-xl font-black text-slate-200 tap-effect flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCompleteSet}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/30 tap-effect flex items-center justify-center gap-2.5 transition-all"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            {t("completeSet")}
          </button>
        </div>

        {/* Previous Completed Sets */}
        {currentExercise && (completedSets[currentExercise.id]?.length || 0) > 0 && (
          <div className="mt-3.5 p-4 surface-card">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
              {t("completedSets")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {completedSets[currentExercise.id].map((set) => (
                <div
                  key={set.set_number}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Set {set.set_number}: {set.actual_weight_kg}kg x {set.actual_reps} wdh</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="bg-slate-950/85 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex((prev) => prev - 1)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-200 tap-effect flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> {t("prevExercise")}
          </button>

          <button
            type="button"
            disabled={currentExerciseIndex === routineExercises.length - 1}
            onClick={() => setCurrentExerciseIndex((prev) => prev + 1)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-200 tap-effect flex items-center gap-1"
          >
            {t("nextExercise")} <ChevronRight className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl p-6 shadow-2xl animate-slide-up border border-white/[0.1]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4 mx-auto border border-emerald-500/30">
              <Trophy className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white text-center tracking-tight">
              {t("finishWorkoutTitle")}
            </h3>
            <p className="text-xs text-slate-400 text-center mt-1 mb-6">
              Toplam {totalSetsCompleted} {t("finishWorkoutDesc")}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {t("rpeLabel")}
              </label>
              <div className="flex items-center justify-between gap-1">
                {[5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRpeScore(score)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold tap-effect transition-all ${
                      rpeScore === score
                        ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t("sessionNotesLabel")}
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder={t("sessionNotesPlaceholder")}
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-white/[0.1] rounded-2xl focus:outline-none focus:border-emerald-400 text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs tap-effect"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinishWorkout}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-xs tap-effect flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
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
