"use client";

import { useState } from "react";
import { WorkoutRoutine, RoutineExercise, Exercise } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getExerciseVisual } from "@/lib/exercise-visuals";
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
  Play
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Program & Egzersiz Yönetimi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dinamik döngü rutinleri, 24.5kg dambıl hedefleri ve canlı hareketli form rehberleri
          </p>
        </div>

        {currentRoutine && (
          <Link
            href={`/workout/player?routineId=${currentRoutine.id}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl tap-effect shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            Bu Rutini Başlat <ArrowRight className="w-3.5 h-3.5" />
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
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{routine.sequence_order}. {routine.name}</span>
          </button>
        ))}
      </div>

      {/* Current Routine Card */}
      {currentRoutine && (
        <div className="surface-card p-6">
          <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Döngü Sırası #{currentRoutine.sequence_order}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                {currentRoutine.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {currentRoutine.description || "Döngüsel kuvvet ve hipertrofi seansı"}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              {currentRoutine.routine_exercises.length} Egzersiz
            </span>
          </div>

          {/* Exercise Table / List */}
          <div className="divide-y divide-slate-100">
            {currentRoutine.routine_exercises.map((re, index) => {
              const isEditing = editingExerciseId === re.id;
              const ex = re.exercise;
              const visual = ex ? getExerciseVisual(ex.name) : null;

              return (
                <div
                  key={re.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 relative border border-slate-200">
                      {visual?.gifUrl ? (
                        <img
                          src={visual.gifUrl}
                          alt={ex?.name || ""}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = visual.thumbnailUrl || "";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">
                          {ex?.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setSelectedGuideExercise(ex || null)}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold tap-effect flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" /> GIF Rehberi
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {ex?.target_muscle} • {ex?.equipment}
                      </p>
                    </div>
                  </div>

                  {/* Target Values / Editable Mode */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Ağırlık (kg)</span>
                        <input
                          type="number"
                          step="0.5"
                          value={editWeight}
                          onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-xs bg-white border border-slate-200 rounded font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Set</span>
                        <input
                          type="number"
                          value={editSets}
                          onChange={(e) => setEditSets(parseInt(e.target.value, 10) || 1)}
                          className="w-12 px-2 py-1 text-xs bg-white border border-slate-200 rounded font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">Tekrar</span>
                        <input
                          type="text"
                          value={editReps}
                          onChange={(e) => setEditReps(e.target.value)}
                          className="w-16 px-2 py-1 text-xs bg-white border border-slate-200 rounded font-bold"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveEdit(re.id)}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold self-end tap-effect"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {re.target_weight_kg} kg
                        </span>
                        <span className="text-slate-600 font-semibold">
                          {re.target_sets} Set × {re.target_reps}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(re)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 tap-effect"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-800">
              Canlı Hareketli Egzersiz Kütüphanesi ({allExercises.length})
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
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {muscle === "All" ? "Tümü" : muscle}
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
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Miniature Visual Animation Preview */}
                  <div className="w-full h-32 rounded-xl bg-slate-950 mb-3 overflow-hidden flex items-center justify-center relative">
                    <img
                      src={visual.gifUrl}
                      alt={exercise.name}
                      className="w-full h-full object-contain p-1 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = visual.thumbnailUrl || "";
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white uppercase tracking-wider">
                      {exercise.target_muscle}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {exercise.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {exercise.equipment} • {exercise.default_rest_seconds}s Dinlenme
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-600 font-bold">
                  <span>▶ Canlı GIF İzle</span>
                  <span>Form Detayları →</span>
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
