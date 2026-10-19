"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { WorkoutRoutine, RoutineExercise, Exercise, SetLog } from "@/types";
import { playRestCompleteSound, playTimerTick, triggerVibration } from "@/lib/sound-haptic";
import { getExerciseVisual } from "@/lib/exercise-visuals";
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
      alert("Antrenman kaydedilirken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalSetsTarget = routineExercises.reduce((acc, curr) => acc + curr.target_sets, 0);
  const totalSetsCompleted = Object.values(completedSets).reduce((acc, curr) => acc + curr.length, 0);
  const progressPercent = Math.min(100, Math.round((totalSetsCompleted / (totalSetsTarget || 1)) * 100));

  const targetSets = currentRoutineExercise?.target_sets || 0;
  const loggedForCurrent = currentExercise ? completedSets[currentExercise.id] || [] : [];
  const displaySetNumber = Math.min(currentSetNumber, Math.max(targetSets, 1));
  const isLastExercise = currentExerciseIndex === routineExercises.length - 1;
  const restProgress = restTotalSeconds > 0 ? restSecondsRemaining / restTotalSeconds : 0;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const stepperBtn =
    "flex items-center justify-center w-12 h-12 shrink-0 rounded-2xl bg-white border border-slate-200 text-slate-800 tap-effect md:hover:bg-slate-100 active:bg-slate-100";
  const navBtn =
    "flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl bg-slate-100 text-slate-700 tap-effect disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-slate-50 select-none">
      {/* ── Top bar ── */}
      <header className="shrink-0 bg-white border-b border-slate-200/80 pt-safe">
        <div className="max-w-xl mx-auto h-14 px-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm("Antrenmandan çıkmak istediğinize emin misiniz?")) {
                router.push("/workout");
              }
            }}
            className="icon-btn"
            aria-label="Antrenmandan çık"
          >
            <X />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-sm font-bold text-slate-900 truncate">{routine.name}</h1>
            <p className="text-xs text-slate-500 tabular-nums">
              Egzersiz {currentExerciseIndex + 1}/{routineExercises.length} · %{progressPercent}
            </p>
          </div>

          <button type="button" onClick={() => setShowFinishModal(true)} className="btn-secondary btn-sm shrink-0 mr-1">
            Bitir
          </button>
        </div>
        {/* Overall progress */}
        <div
          className="h-1 bg-slate-100"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Antrenman ilerlemesi"
        >
          <div
            className="h-full bg-emerald-500 origin-left"
            style={{ transform: `scaleX(${progressPercent / 100})`, transition: "transform 300ms var(--ease-out)" }}
          />
        </div>
      </header>

      {/* ── Exercise tabs ── */}
      <nav aria-label="Egzersizler" className="shrink-0 bg-white border-b border-slate-200/60">
        <div className="max-w-xl mx-auto flex gap-2 overflow-x-auto no-scrollbar px-4 py-2.5">
          {routineExercises.map((re, index) => {
            const isCurrent = index === currentExerciseIndex;
            const completedCount = completedSets[re.exercise_id]?.length || 0;
            const isFinished = completedCount >= re.target_sets;

            return (
              <button
                key={re.id}
                type="button"
                onClick={() => setCurrentExerciseIndex(index)}
                aria-current={isCurrent ? "step" : undefined}
                className={`shrink-0 max-w-[11rem] min-h-[36px] px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 tap-effect transition-colors ${
                  isCurrent
                    ? "bg-slate-900 text-white"
                    : isFinished
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600 md:hover:bg-slate-200"
                }`}
              >
                {isFinished ? (
                  <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                ) : (
                  <span className="tabular-nums shrink-0 opacity-60">{index + 1}</span>
                )}
                <span className="truncate">{re.exercise?.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Main focus area (scrolls) ── */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div key={currentExerciseIndex} className="max-w-xl mx-auto w-full px-4 pt-4 pb-6 space-y-4 animate-fade-in">
          {/* Exercise heading */}
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-emerald-700 truncate">
                {currentExercise?.target_muscle} · {currentExercise?.equipment}
              </p>
              <h2 className="mt-1 text-[1.375rem] leading-tight font-extrabold text-slate-900 tracking-tight">
                {currentExercise?.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="btn-secondary btn-sm shrink-0"
              aria-label="Tüm rehberi aç (ipuçları ve hatalar)"
            >
              <BookOpen /> Rehber
            </button>
          </div>

          {/* Set progress */}
          <div>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                Set {displaySetNumber} / {targetSets}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                {loggedForCurrent.length} tamamlandı
              </span>
            </div>
            <div className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: targetSets }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < loggedForCurrent.length
                      ? "bg-emerald-500"
                      : i === loggedForCurrent.length
                      ? "bg-emerald-200"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Animated form GIF */}
          {currentVisual?.gifUrl &&
            (showAnimation ? (
              <div className="relative w-full h-36 min-[400px]:h-44 sm:h-52 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
                <img
                  src={currentVisual.gifUrl}
                  alt={currentExercise?.name}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = currentVisual.thumbnailUrl || "";
                  }}
                />
                <span className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Canlı form
                </span>
                <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAnimation(false)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md text-white tap-effect"
                    aria-label="Animasyonu gizle"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md text-white tap-effect"
                    aria-label="Büyüt"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAnimation(true)}
                className="btn-ghost btn-sm -ml-2 text-slate-500"
              >
                <Eye /> Animasyonu göster
              </button>
            ))}

          {/* Steppers: weight + reps */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card !p-3 flex flex-col items-center min-w-0">
              <span className="text-xs font-semibold text-slate-500">Ağırlık (kg)</span>
              <span className="mt-1.5 text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums leading-none">
                {activeWeight}
              </span>
              <span className="mt-1.5 text-xs text-slate-500 tabular-nums truncate max-w-full">
                Hedef {currentRoutineExercise?.target_weight_kg} kg
              </span>
              <div className="mt-3 flex items-center gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setActiveWeight((prev) => Math.max(0, Number((prev - 1.25).toFixed(1))))}
                  className={stepperBtn}
                  aria-label="Ağırlığı 1.25 kg azalt"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWeight((prev) => Math.min(24.5, Number((prev + 1.25).toFixed(1))))}
                  className={stepperBtn}
                  aria-label="Ağırlığı 1.25 kg artır"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="card !p-3 flex flex-col items-center min-w-0">
              <span className="text-xs font-semibold text-slate-500">Tekrar</span>
              <span className="mt-1.5 text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums leading-none">
                {activeReps}
              </span>
              <span className="mt-1.5 text-xs text-slate-500 tabular-nums truncate max-w-full">
                Hedef {currentRoutineExercise?.target_reps}
              </span>
              <div className="mt-3 flex items-center gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setActiveReps((prev) => Math.max(1, prev - 1))}
                  className={stepperBtn}
                  aria-label="Tekrarı azalt"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReps((prev) => prev + 1)}
                  className={stepperBtn}
                  aria-label="Tekrarı artır"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 tabular-nums">
            <Timer className="w-3.5 h-3.5" /> Dinlenme {currentExercise?.default_rest_seconds} sn
          </p>

          {/* Previous Completed Sets */}
          {loggedForCurrent.length > 0 && (
            <section>
              <h4 className="eyebrow mb-1.5">Tamamlanan setler</h4>
              <ul className="card !p-0 divide-y divide-slate-100">
                {loggedForCurrent.map((set) => (
                  <li key={set.set_number} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={3} />
                    <span className="font-semibold text-slate-900 tabular-nums">Set {set.set_number}</span>
                    <span className="ml-auto text-slate-600 tabular-nums">
                      {set.actual_weight_kg} kg × {set.actual_reps}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      {/* ── Bottom action dock (thumb zone) ── */}
      <footer className="shrink-0 bg-white border-t border-slate-200/80 shadow-[0_-8px_24px_-12px_rgba(15,26,23,0.12)] pb-safe">
        <div className="max-w-xl mx-auto px-4 py-3">
          {isResting && (
            <div className="mb-3 rounded-2xl bg-emerald-600 text-white p-3.5 animate-fade-in-up" role="timer">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" /> Dinlenme
                  </p>
                  <p className="text-[2.75rem] font-extrabold tracking-tight tabular-nums leading-none mt-1">
                    {formatTime(restSecondsRemaining)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addRestTime(-15)}
                  className="h-11 min-w-[3.5rem] px-2 rounded-xl bg-emerald-700/70 text-sm font-bold tabular-nums tap-effect"
                  aria-label="Dinlenmeyi 15 saniye azalt"
                >
                  −15s
                </button>
                <button
                  type="button"
                  onClick={() => addRestTime(30)}
                  className="h-11 min-w-[3.5rem] px-2 rounded-xl bg-emerald-700/70 text-sm font-bold tabular-nums tap-effect"
                  aria-label="Dinlenmeye 30 saniye ekle"
                >
                  +30s
                </button>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-emerald-800/50 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full origin-left"
                  style={{ transform: `scaleX(${restProgress})`, transition: "transform 1s linear" }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentExerciseIndex === 0}
              onClick={() => setCurrentExerciseIndex((prev) => prev - 1)}
              className={navBtn}
              aria-label="Önceki egzersiz"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {isResting ? (
              <button
                type="button"
                onClick={stopRestTimer}
                className="btn-dark flex-1 min-w-0 !min-h-[56px] !rounded-2xl !text-base"
                aria-label="Dinlenmeyi atla, sonraki sete geç"
              >
                <span className="truncate">Sonraki sete geç</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteSet}
                className="btn-primary flex-1 min-w-0 !min-h-[56px] !rounded-2xl !text-base !font-extrabold"
                aria-label="Seti tamamla ve sayacı başlat"
              >
                <Check className="!w-5 !h-5" strokeWidth={3} />
                <span className="truncate">Seti tamamla</span>
              </button>
            )}

            <button
              type="button"
              disabled={isLastExercise}
              onClick={() => setCurrentExerciseIndex((prev) => prev + 1)}
              className={navBtn}
              aria-label="Sonraki egzersiz"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </footer>

      {/* Exercise Visual Guide Modal */}
      <ExerciseGuideModal
        exercise={currentExercise || null}
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      {/* Finish Workout Sheet */}
      {showFinishModal && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowFinishModal(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="finish-title" className="sheet">
            <div className="shrink-0 px-4 pt-2.5 pb-3 border-b border-slate-100">
              <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <Trophy className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 id="finish-title" className="section-title truncate">
                    Harika iş! Antrenmanı bitir
                  </h3>
                  <p className="text-xs text-slate-500 tabular-nums">Toplam {totalSetsCompleted} set tamamlandı</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="icon-btn -mr-1.5"
                  aria-label="Kapat"
                >
                  <X />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
              <div>
                <span className="field-label">Genel zorluk derecesi (RPE 1–10)</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {[5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRpeScore(score)}
                      aria-pressed={rpeScore === score}
                      className={`h-12 rounded-xl text-base font-bold tabular-nums tap-effect transition-colors ${
                        rpeScore === score
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-700 md:hover:bg-slate-200"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="session-notes" className="field-label">
                  Antrenman notu (isteğe bağlı)
                </label>
                <textarea
                  id="session-notes"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Örn: Shoulder press çok güçlü hissettirdi..."
                  rows={3}
                  className="input py-2.5 resize-none select-text"
                />
              </div>
            </div>

            <div className="shrink-0 px-4 py-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setShowFinishModal(false)} className="btn-secondary btn-lg">
                Geri dön
              </button>
              <button type="button" disabled={isSaving} onClick={handleFinishWorkout} className="btn-primary btn-lg">
                {isSaving ? "Kaydediliyor..." : "Kaydet ve bitir"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
