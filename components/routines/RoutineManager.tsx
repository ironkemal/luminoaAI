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
  Plus,
  Flame,
  ArrowRight,
  Filter,
  Info,
  BookOpen,
  Play,
  Sparkles
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
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {t("routinesTitle")}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {t("routinesSubtitle")}
          </p>
        </div>

        {currentRoutine && (
          <Link
            href={`/workout/player?routineId=${currentRoutine.id}`}
            className="px-5 py-3 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-xs rounded-2xl tap-effect shadow-lg shadow-emerald-500/25 flex items-center gap-2 self-start sm:self-auto transition-all"
          >
            {t("startThisRoutine")} <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Link>
        )}
      </div>

      {/* Routine Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {routines.map((routine) => (
          <button
            key={routine.id}
            onClick={() => {
              setActiveRoutineTab(routine.id);
              setEditingExerciseId(null);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all tap-effect flex items-center gap-2 ${
              activeRoutineTab === routine.id
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-500/30 scale-105"
                : "bg-slate-900/90 border border-white/[0.08] text-slate-400 hover:text-white"
            }`}
          >
            <span>{routine.sequence_order}. {routine.name}</span>
          </button>
        ))}
      </div>

      {/* Current Routine Card */}
      {currentRoutine && (
        <div className="surface-card p-6 border-emerald-500/20">
          <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/[0.08]">
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {t("cycleOrder")} #{currentRoutine.sequence_order}
              </span>
              <h3 className="text-xl font-black text-white mt-1.5">
                {currentRoutine.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {currentRoutine.description || "Döngüsel kuvvet ve hipertrofi seansı"}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-white/[0.08] px-3 py-1.5 rounded-xl">
              {currentRoutine.routine_exercises.length} {t("exercisesCount")}
            </span>
          </div>

          {/* Exercise Table / List */}
          <div className="divide-y divide-white/[0.06]">
            {currentRoutine.routine_exercises.map((re, index) => {
              const isEditing = editingExerciseId === re.id;
              const ex = re.exercise;
              const visual = ex ? getExerciseVisual(ex.name) : null;

              return (
                <div
                  key={re.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 overflow-hidden flex-shrink-0 relative border border-white/[0.1] shadow-md">
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
                        <div className="w-full h-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {ex?.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setSelectedGuideExercise(ex || null)}
                          className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold tap-effect flex items-center gap-1 transition-colors"
                        >
                          <BookOpen className="w-3 h-3 text-emerald-400" /> GIF Rehberi
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {ex?.target_muscle} • {ex?.equipment}
                      </p>
                    </div>
                  </div>

                  {/* Target Values / Editable Mode */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-white/[0.1]">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Ağırlık (kg)</span>
                        <input
                          type="number"
                          step="0.5"
                          value={editWeight}
                          onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-xs bg-slate-900 border border-white/[0.1] rounded-lg font-black text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Set</span>
                        <input
                          type="number"
                          value={editSets}
                          onChange={(e) => setEditSets(parseInt(e.target.value, 10) || 1)}
                          className="w-12 px-2 py-1 text-xs bg-slate-900 border border-white/[0.1] rounded-lg font-black text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Tekrar</span>
                        <input
                          type="text"
                          value={editReps}
                          onChange={(e) => setEditReps(e.target.value)}
                          className="w-16 px-2 py-1 text-xs bg-slate-900 border border-white/[0.1] rounded-lg font-black text-white"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveEdit(re.id)}
                        disabled={isSaving}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black self-end tap-effect shadow-md shadow-emerald-500/25"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-xl">
                          {re.target_weight_kg} kg
                        </span>
                        <span className="text-slate-300 font-bold bg-slate-900 border border-white/[0.08] px-2.5 py-1 rounded-xl">
                          {re.target_sets} Set × {re.target_reps}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(re)}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.05] tap-effect"
                        title="Hedef Değerleri Düzenle"
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

      {/* Exercise Library Directory with Visual Cards */}
      <div className="surface-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {t("libraryTitle")} ({allExercises.length})
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"].map((muscle) => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className={`px-3 py-1 rounded-xl font-bold transition-all tap-effect ${
                  selectedMuscle === muscle
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-500/25"
                    : "bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white"
                }`}
              >
                {muscle === "All" ? t("all") : muscle}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredExercises.map((exercise) => {
            const visual = getExerciseVisual(exercise.name);

            return (
              <div
                key={exercise.id}
                onClick={() => setSelectedGuideExercise(exercise)}
                className="p-3.5 rounded-3xl bg-slate-900/90 border border-white/[0.08] hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-500/10 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Miniature Visual Animation Preview */}
                  <div className="w-full h-32 rounded-2xl bg-slate-950 mb-3 overflow-hidden flex items-center justify-center relative border border-white/[0.08]">
                    <img
                      src={visual.gifUrl}
                      alt={exercise.name}
                      className="w-full h-full object-contain p-1 opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = visual.thumbnailUrl || "";
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[9px] font-black text-white uppercase tracking-wider border border-white/10">
                      {exercise.target_muscle}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {exercise.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {exercise.equipment} • {exercise.default_rest_seconds}s Dinlenme
                  </p>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                  <span>▶ Canlı GIF İzle</span>
                  <span>{t("details")}</span>
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
