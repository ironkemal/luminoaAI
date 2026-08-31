"use client";

import { useState } from "react";
import { WorkoutRoutine, RoutineExercise, Exercise } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getExerciseVisual } from "@/lib/exercise-visuals";
import { useLanguage } from "@/lib/i18n";
import ExerciseGuideModal from "@/components/workout/ExerciseGuideModal";
import {
  CalendarDays,
  Dumbbell,
  Edit2,
  Check,
  ArrowRight,
  BookOpen
} from "lucide-react";
import Link from "next/link";

interface RoutineManagerProps {
  routines: (WorkoutRoutine & {
    routine_exercises: (RoutineExercise & { exercise: Exercise })[];
  })[];
  allExercises: Exercise[];
}

export default function RoutineManager({
  routines,
  allExercises,
}: RoutineManagerProps) {
  const { t } = useLanguage();
  const [activeRoutineTab, setActiveRoutineTab] = useState<string>(
    routines[0]?.id || ""
  );
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<Exercise | null>(null);

  // Edit fields state
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editSets, setEditSets] = useState<number>(3);
  const [editReps, setEditReps] = useState<string>("8-12");
  const [isSaving, setIsSaving] = useState(false);

  // Exercise library filter
  const [selectedMuscle, setSelectedMuscle] = useState<string>("All");

  const currentRoutine = routines.find((r) => r.id === activeRoutineTab) || routines[0];

  const handleStartEdit = (re: RoutineExercise) => {
    setEditingExerciseId(re.id);
    setEditWeight(Number(re.target_weight_kg) || 0);
    setEditSets(re.target_sets);
    setEditReps(re.target_reps);
  };

  const handleSaveEdit = async (reId: string) => {
    setIsSaving(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("routine_exercises")
        .update({
          target_weight_kg: editWeight,
          target_sets: editSets,
          target_reps: editReps,
        })
        .eq("id", reId);

      if (error) throw error;

      if (currentRoutine) {
        const found = currentRoutine.routine_exercises.find((r) => r.id === reId);
        if (found) {
          found.target_weight_kg = editWeight;
          found.target_sets = editSets;
          found.target_reps = editReps;
        }
      }
      setEditingExerciseId(null);
    } catch (err) {
      console.error("Error saving routine exercise:", err);
      alert("Güncellenirken hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExercises =
    selectedMuscle === "All"
      ? allExercises
      : allExercises.filter((e) => e.target_muscle === selectedMuscle);

  return (
    <div className="space-y-5 max-w-4xl mx-auto px-4 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {t("routinesTitle")}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t("routinesSubtitle")}
          </p>
        </div>

        {currentRoutine && (
          <Link
            href={`/workout/player?routineId=${currentRoutine.id}`}
            className="px-4 py-2 btn-primary text-xs font-black rounded-xl tap-effect flex items-center gap-1.5 self-start sm:self-auto"
          >
            {t("startThisRoutine")} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Routine Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {routines.map((routine) => (
          <button
            key={routine.id}
            onClick={() => {
              setActiveRoutineTab(routine.id);
              setEditingExerciseId(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all tap-effect flex items-center gap-1.5 ${
              activeRoutineTab === routine.id
                ? "bg-white/[0.12] text-white"
                : "bg-[#11151D] text-slate-400 hover:text-white border border-white/[0.06]"
            }`}
          >
            <span>{routine.sequence_order}. {routine.name}</span>
          </button>
        ))}
      </div>

      {/* Current Routine Card */}
      {currentRoutine && (
        <div className="surface-card p-5 md:p-6">
          <div className="flex items-start justify-between mb-3 pb-3 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#171C26] px-2 py-0.5 rounded-md">
                {t("cycleOrder")} #{currentRoutine.sequence_order}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                {currentRoutine.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentRoutine.description || "Döngüsel kuvvet seansı"}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-300 bg-[#171C26] px-2.5 py-1 rounded-lg">
              {currentRoutine.routine_exercises.length} {t("exercisesCount")}
            </span>
          </div>

          {/* Exercise Table */}
          <div className="divide-y divide-white/[0.04]">
            {currentRoutine.routine_exercises.map((re, index) => {
              const isEditing = editingExerciseId === re.id;
              const ex = re.exercise;
              const visual = ex ? getExerciseVisual(ex.name) : null;

              return (
                <div
                  key={re.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-black overflow-hidden flex-shrink-0 relative border border-white/[0.08]">
                      {visual?.gifUrl ? (
                        <img
                          src={visual.gifUrl}
                          alt={ex?.name || ""}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = visual.thumbnailUrl || "";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#171C26] text-slate-300 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {ex?.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setSelectedGuideExercise(ex || null)}
                          className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-[10px] font-semibold tap-effect flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3 text-[#E2F952]" /> Rehber
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {ex?.target_muscle} • {ex?.equipment}
                      </p>
                    </div>
                  </div>

                  {/* Target Values / Editable Mode */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 bg-[#090B0E] p-2 rounded-xl border border-white/[0.08]">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Ağırlık (kg)</span>
                        <input
                          type="number"
                          step="0.5"
                          value={editWeight}
                          onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                          className="w-14 px-2 py-1 text-xs bg-[#171C26] border border-white/[0.08] rounded-md font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Set</span>
                        <input
                          type="number"
                          value={editSets}
                          onChange={(e) => setEditSets(parseInt(e.target.value, 10) || 1)}
                          className="w-10 px-2 py-1 text-xs bg-[#171C26] border border-white/[0.08] rounded-md font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Tekrar</span>
                        <input
                          type="text"
                          value={editReps}
                          onChange={(e) => setEditReps(e.target.value)}
                          className="w-14 px-2 py-1 text-xs bg-[#171C26] border border-white/[0.08] rounded-md font-mono font-bold text-white"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveEdit(re.id)}
                        disabled={isSaving}
                        className="px-3 py-1.5 btn-primary rounded-lg text-xs font-black self-end tap-effect"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#E2F952] bg-[#E2F952]/10 px-2.5 py-1 rounded-md font-mono">
                          {re.target_weight_kg} kg
                        </span>
                        <span className="text-slate-300 font-medium bg-[#171C26] px-2 py-1 rounded-md">
                          {re.target_sets} Set × {re.target_reps}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(re)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] tap-effect"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercise Library Directory */}
      <div className="surface-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              {t("libraryTitle")} ({allExercises.length})
            </h3>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
            {["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"].map((muscle) => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all tap-effect ${
                  selectedMuscle === muscle
                    ? "bg-white/[0.12] text-white"
                    : "bg-[#090B0E] text-slate-500 hover:text-slate-300"
                }`}
              >
                {muscle === "All" ? t("all") : muscle}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredExercises.map((exercise) => {
            const visual = getExerciseVisual(exercise.name);

            return (
              <div
                key={exercise.id}
                onClick={() => setSelectedGuideExercise(exercise)}
                className="p-3 rounded-xl bg-[#090B0E] border border-white/[0.06] hover:border-white/[0.15] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-28 rounded-lg bg-black mb-2.5 overflow-hidden flex items-center justify-center relative border border-white/[0.04]">
                    <img
                      src={visual.gifUrl}
                      alt={exercise.name}
                      className="w-full h-full object-contain p-1 opacity-90 group-hover:opacity-100 transition-opacity"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = visual.thumbnailUrl || "";
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-bold text-slate-300 uppercase">
                      {exercise.target_muscle}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-[#E2F952] transition-colors line-clamp-1">
                    {exercise.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {exercise.equipment} • {exercise.default_rest_seconds}s
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-white/[0.04] text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Rehber</span>
                  <span className="text-[#E2F952]">▶</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guide Modal */}
      <ExerciseGuideModal
        exercise={selectedGuideExercise}
        isOpen={selectedGuideExercise !== null}
        onClose={() => setSelectedGuideExercise(null)}
      />
    </div>
  );
}
