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
  Check,
  Plus,
  Minus,
  Timer,
  X,
  Trophy,
  Dumbbell,
  BookOpen,
  Trash2,
  Clock,
  Flame,
  Activity,
  Maximize2
} from "lucide-react";

interface WorkoutPlayerProps {
  routine: WorkoutRoutine;
  routineExercises: (RoutineExercise & { exercise: Exercise })[];
}

interface LocalExerciseSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  previous: string;
  completed: boolean;
}

interface LocalExerciseBlock {
  routineExerciseId: string;
  exercise: Exercise;
  sets: LocalExerciseSet[];
}

export default function WorkoutPlayer({
  routine,
  routineExercises,
}: WorkoutPlayerProps) {
  const router = useRouter();
  const { t } = useLanguage();

  // Stopwatch / Elapsed Time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Exercise Blocks state (Hevy/Strong Table Structure)
  const [exerciseBlocks, setExerciseBlocks] = useState<LocalExerciseBlock[]>(() => {
    return routineExercises.map((re) => {
      const parsedRepsMatch = re.target_reps.match(/(\d+)/g);
      const defaultReps = parsedRepsMatch ? parseInt(parsedRepsMatch[0], 10) : 10;
      const defaultWeight = Number(re.target_weight_kg) || 0;

      const initialSets: LocalExerciseSet[] = Array.from({ length: re.target_sets || 3 }).map((_, i) => ({
        id: `${re.id}_set_${i + 1}`,
        setNumber: i + 1,
        weight: defaultWeight,
        reps: defaultReps,
        previous: `${defaultWeight} kg × ${re.target_reps}`,
        completed: false,
      }));

      return {
        routineExerciseId: re.id,
        exercise: re.exercise,
        sets: initialSets,
      };
    });
  });

  // Visual Guide Modal
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<Exercise | null>(null);

  // Floating Rest Timer
  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(90);
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Finish Workout Modal
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rpeScore, setRpeScore] = useState<number>(8);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStartedAt] = useState<string>(new Date().toISOString());

  // Stopwatch ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rest Timer ticker
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
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isResting]);

  const startRestTimer = (seconds = 90) => {
    setRestTotalSeconds(seconds);
    setRestSecondsRemaining(seconds);
    setIsResting(true);
    triggerVibration(100);
  };

  const stopRestTimer = () => {
    setIsResting(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const addRestTime = (seconds: number) => {
    setRestSecondsRemaining((prev) => Math.max(5, prev + seconds));
    setRestTotalSeconds((prev) => Math.max(5, prev + seconds));
  };

  // Toggle set completion (Hevy Checkbox behavior)
  const handleToggleSetComplete = (blockIndex: number, setIndex: number) => {
    setExerciseBlocks((prev) => {
      const updated = [...prev];
      const targetBlock = { ...updated[blockIndex] };
      const targetSets = [...targetBlock.sets];
      const currentSet = { ...targetSets[setIndex] };

      const wasCompleted = currentSet.completed;
      currentSet.completed = !wasCompleted;
      targetSets[setIndex] = currentSet;
      targetBlock.sets = targetSets;
      updated[blockIndex] = targetBlock;

      if (!wasCompleted) {
        // Set completed: trigger haptic & rest timer
        const restDuration = targetBlock.exercise.default_rest_seconds || 90;
        startRestTimer(restDuration);
      }

      return updated;
    });
  };

  // Update Weight / Reps
  const handleUpdateSetValue = (
    blockIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: number
  ) => {
    setExerciseBlocks((prev) => {
      const updated = [...prev];
      const targetBlock = { ...updated[blockIndex] };
      const targetSets = [...targetBlock.sets];
      targetSets[setIndex] = {
        ...targetSets[setIndex],
        [field]: value,
      };
      targetBlock.sets = targetSets;
      updated[blockIndex] = targetBlock;
      return updated;
    });
  };

  // Add Set to Exercise
  const handleAddSet = (blockIndex: number) => {
    setExerciseBlocks((prev) => {
      const updated = [...prev];
      const targetBlock = { ...updated[blockIndex] };
      const lastSet = targetBlock.sets[targetBlock.sets.length - 1];
      const newSetNumber = targetBlock.sets.length + 1;

      const newSet: LocalExerciseSet = {
        id: `${targetBlock.routineExerciseId}_set_${newSetNumber}_${Date.now()}`,
        setNumber: newSetNumber,
        weight: lastSet ? lastSet.weight : 20,
        reps: lastSet ? lastSet.reps : 10,
        previous: lastSet ? `${lastSet.weight} kg × ${lastSet.reps}` : "-",
        completed: false,
      };

      targetBlock.sets = [...targetBlock.sets, newSet];
      updated[blockIndex] = targetBlock;
      return updated;
    });
  };

  // Delete Set
  const handleDeleteSet = (blockIndex: number, setIndex: number) => {
    setExerciseBlocks((prev) => {
      const updated = [...prev];
      const targetBlock = { ...updated[blockIndex] };
      if (targetBlock.sets.length <= 1) return prev; // Keep at least 1 set

      const filtered = targetBlock.sets.filter((_, idx) => idx !== setIndex);
      const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      targetBlock.sets = renumbered;
      updated[blockIndex] = targetBlock;
      return updated;
    });
  };

  // Stats calculation
  let totalVolumeKg = 0;
  let totalCompletedSets = 0;
  let totalSetsTarget = 0;

  exerciseBlocks.forEach((b) => {
    b.sets.forEach((s) => {
      totalSetsTarget++;
      if (s.completed) {
        totalCompletedSets++;
        totalVolumeKg += s.weight * s.reps;
      }
    });
  });

  const formatStopwatch = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

      exerciseBlocks.forEach((block) => {
        block.sets.forEach((s) => {
          if (s.completed) {
            logsToInsert.push({
              session_id: sessionId,
              exercise_id: block.exercise.id,
              set_number: s.setNumber,
              actual_reps: s.reps,
              actual_weight_kg: s.weight,
              completed: true,
            });
          }
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

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-between select-none pb-24">
      {/* ── HEVY / STRONG PRO TOP APP BAR ── */}
      <header className="sticky top-0 z-30 bg-[#121722]/95 backdrop-blur-md border-b border-[#1E2638] px-4 py-2.5 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          {/* Cancel / Exit */}
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

          {/* Title & Live Stopwatch */}
          <div className="text-center">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
              {routine.name}
            </h1>
            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
              <span className="flex items-center gap-1 font-bold text-emerald-400">
                <Clock className="w-3 h-3" /> {formatStopwatch(elapsedSeconds)}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-300">
                {totalVolumeKg.toLocaleString()} kg Hacim
              </span>
            </div>
          </div>

          {/* Finish Button */}
          <button
            onClick={() => setShowFinishModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tap-effect shadow-sm"
          >
            {t("finish")}
          </button>
        </div>
      </header>

      {/* ── WORKOUT EXERCISES & SET LOGGING TABLES ── */}
      <main className="max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 space-y-4 animate-fade-in">
        {exerciseBlocks.map((block, blockIndex) => {
          const visual = getExerciseVisual(block.exercise.name);

          return (
            <div
              key={block.routineExerciseId}
              className="hevy-card p-3 sm:p-4 space-y-3"
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#1E2638]">
                <div className="flex items-center gap-3">
                  {/* Miniature Thumbnail */}
                  <div
                    onClick={() => setSelectedGuideExercise(block.exercise)}
                    className="w-11 h-11 rounded-lg bg-black overflow-hidden flex-shrink-0 relative border border-white/[0.08] cursor-pointer"
                  >
                    <img
                      src={visual.gifUrl}
                      alt={block.exercise.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = visual.thumbnailUrl || "";
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      {blockIndex + 1}. {block.exercise.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="text-emerald-400 font-semibold">{block.exercise.target_muscle}</span>
                      <span>•</span>
                      <span>{block.exercise.equipment}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedGuideExercise(block.exercise)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] tap-effect"
                  title="Form Rehberi & GIF"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                </button>
              </div>

              {/* Hevy Set Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1E2638]/60">
                      <th className="py-1.5 px-2 w-12 text-center">SET</th>
                      <th className="py-1.5 px-2 w-28">ÖNCEKİ</th>
                      <th className="py-1.5 px-2 w-24 text-center">KG</th>
                      <th className="py-1.5 px-2 w-24 text-center">TEKRAR</th>
                      <th className="py-1.5 px-2 w-12 text-center">✓</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/40">
                    {block.sets.map((set, setIndex) => (
                      <tr
                        key={set.id}
                        className={`set-row ${set.completed ? "set-row-completed" : ""}`}
                      >
                        {/* Set Number */}
                        <td className="py-2 px-2 text-center font-bold text-slate-400 font-mono text-xs">
                          {set.setNumber}
                        </td>

                        {/* Previous Weight & Reps */}
                        <td className="py-2 px-2 text-[11px] text-slate-400 font-mono truncate">
                          {set.previous}
                        </td>

                        {/* Weight Input Box */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weight}
                            onChange={(e) =>
                              handleUpdateSetValue(
                                blockIndex,
                                setIndex,
                                "weight",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className={`w-18 px-2 py-1 text-center font-mono font-bold text-xs rounded-lg border focus:outline-none ${
                              set.completed
                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                                : "bg-[#0B0E14] border-[#1E2638] text-white focus:border-emerald-400"
                            }`}
                          />
                        </td>

                        {/* Reps Input Box */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleUpdateSetValue(
                                blockIndex,
                                setIndex,
                                "reps",
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className={`w-14 px-2 py-1 text-center font-mono font-bold text-xs rounded-lg border focus:outline-none ${
                              set.completed
                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                                : "bg-[#0B0E14] border-[#1E2638] text-white focus:border-emerald-400"
                            }`}
                          />
                        </td>

                        {/* Checkbox Complete Button */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSetComplete(blockIndex, setIndex)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center tap-effect transition-all ${
                              set.completed
                                ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/30"
                                : "bg-[#1E2638] text-slate-400 hover:bg-[#28334A] hover:text-white"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom: Add Set Button */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleAddSet(blockIndex)}
                  className="px-3 py-1.5 rounded-lg bg-[#181F2E] hover:bg-[#20293D] text-xs font-semibold text-slate-300 tap-effect flex items-center gap-1 border border-[#1E2638]"
                >
                  <Plus className="w-3.5 h-3.5" /> Set Ekle
                </button>

                {block.sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSet(blockIndex, block.sets.length - 1)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg tap-effect text-xs"
                    title="Son Seti Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* ── FLOATING HEVY REST TIMER DOCK ── */}
      {isResting && (
        <div className="fixed bottom-3 inset-x-3 max-w-md mx-auto z-40 bg-[#181F2E] border border-emerald-500/30 rounded-2xl p-3 shadow-2xl animate-slide-up flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Timer className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Dinlenme</span>
              <span className="text-xl font-mono font-black text-white">
                {Math.floor(restSecondsRemaining / 60)}:
                {(restSecondsRemaining % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => addRestTime(-15)}
              className="px-2.5 py-1.5 rounded-lg bg-[#121722] hover:bg-[#20293D] text-xs font-bold text-slate-300 tap-effect border border-white/5"
            >
              -15s
            </button>
            <button
              onClick={() => addRestTime(30)}
              className="px-2.5 py-1.5 rounded-lg bg-[#121722] hover:bg-[#20293D] text-xs font-bold text-slate-300 tap-effect border border-white/5"
            >
              +30s
            </button>
            <button
              onClick={stopRestTimer}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-extrabold text-xs tap-effect"
            >
              Geç
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      <ExerciseGuideModal
        exercise={selectedGuideExercise}
        isOpen={selectedGuideExercise !== null}
        onClose={() => setSelectedGuideExercise(null)}
      />

      {/* ── FINISH WORKOUT SUMMARY MODAL ── */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121722] rounded-2xl p-6 border border-[#1E2638] animate-slide-up shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 mx-auto border border-emerald-500/20">
              <Trophy className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white text-center">
              Antrenmanı Tamamla
            </h3>
            <p className="text-xs text-slate-400 text-center mt-0.5 mb-4">
              {routine.name} seansınızı özetleyin ve kaydedin.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 bg-[#0B0E14] p-3 rounded-xl border border-[#1E2638] mb-4 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Süre</span>
                <span className="text-sm font-black text-white font-mono">{formatStopwatch(elapsedSeconds)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Hacim</span>
                <span className="text-sm font-black text-emerald-400 font-mono">{totalVolumeKg} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Setler</span>
                <span className="text-sm font-black text-white font-mono">{totalCompletedSets} / {totalSetsTarget}</span>
              </div>
            </div>

            {/* RPE Rating */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Zorluk Derecesi (RPE 1-10)
              </label>
              <div className="flex items-center gap-1">
                {[5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRpeScore(score)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold tap-effect transition-all ${
                      rpeScore === score
                        ? "bg-emerald-500 text-black font-black"
                        : "bg-[#0B0E14] text-slate-400 hover:text-white border border-[#1E2638]"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Antrenman Notları (İsteğe Bağlı)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Enerjim yüksekti, göğüs presinde tükenişe gittim..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-[#0B0E14] border border-[#1E2638] rounded-xl focus:outline-none focus:border-emerald-400 text-white placeholder-slate-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#181F2E] hover:bg-[#222B3F] text-slate-300 font-bold text-xs tap-effect border border-[#1E2638]"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinishWorkout}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs tap-effect flex items-center justify-center gap-1.5 shadow-md"
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
