"use client";

import { useState } from "react";
import { WorkoutRoutine, RoutineExercise, Exercise } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getExerciseVisual } from "@/lib/exercise-visuals";
import ExerciseGuideModal from "@/components/workout/ExerciseGuideModal";
import { Dumbbell, Edit2, Check, X, Play, ChevronRight, Timer } from "lucide-react";
import Link from "next/link";

interface RoutineManagerProps {
  routines: (WorkoutRoutine & {
    routine_exercises: (RoutineExercise & { exercise: Exercise })[];
  })[];
  allExercises: Exercise[];
}

const MUSCLE_FILTERS: { key: string; label: string }[] = [
  { key: "All", label: "Tümü" },
  { key: "Chest", label: "Göğüs" },
  { key: "Back", label: "Sırt" },
  { key: "Legs", label: "Bacak" },
  { key: "Shoulders", label: "Omuz" },
  { key: "Arms", label: "Kol" },
  { key: "Core", label: "Karın" },
];

const MUSCLE_LABELS: Record<string, string> = Object.fromEntries(
  MUSCLE_FILTERS.filter((m) => m.key !== "All").map((m) => [m.key.toLowerCase(), m.label])
);

const muscleLabel = (m?: string | null) => (m ? MUSCLE_LABELS[m.toLowerCase()] || m : "");

function ExerciseThumb({ exercise, className = "" }: { exercise: Exercise; className?: string }) {
  const visual = getExerciseVisual(exercise.name);
  return (
    <img
      src={visual.gifUrl}
      alt={exercise.name}
      loading="lazy"
      className={`w-full h-full object-contain ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = visual.thumbnailUrl || "";
      }}
    />
  );
}

export default function RoutineManager({ routines, allExercises }: RoutineManagerProps) {
  const [activeRoutineTab, setActiveRoutineTab] = useState<string>(routines[0]?.id || "");
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
      : allExercises.filter((e) => (e.target_muscle || "").toLowerCase() === selectedMuscle.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="page-header">
        <div className="min-w-0">
          <p className="eyebrow">Döngüsel program</p>
          <h1 className="page-title mt-1">Programlar</h1>
          <p className="page-subtitle">Rutinlerin, hedef ağırlıkların ve hareket rehberleri.</p>
        </div>
      </header>

      {/* Routine selector — horizontally scrolling, bleeds to the screen edge */}
      {routines.length > 0 && (
        <div className="-mx-4 sm:mx-0">
          <div
            role="tablist"
            aria-label="Rutinler"
            className="flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x scroll-px-4"
          >
            {routines.map((routine) => {
              const active = currentRoutine?.id === routine.id;
              return (
                <button
                  key={routine.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveRoutineTab(routine.id);
                    setEditingExerciseId(null);
                  }}
                  className={`snap-start shrink-0 max-w-[15rem] min-h-[44px] pl-1.5 pr-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 border tap-effect ${
                    active
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 md:hover:bg-slate-50"
                  }`}
                  style={{ transitionProperty: "transform, background-color, color" }}
                >
                  <span
                    className={`w-8 h-8 shrink-0 rounded-lg inline-flex items-center justify-center text-xs font-bold tabular-nums ${
                      active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {routine.sequence_order}
                  </span>
                  <span className="truncate">{routine.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Routine Card */}
      {currentRoutine && (
        <section className="card">
          <div className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-emerald-600 tabular-nums">Sıra #{currentRoutine.sequence_order}</span>
              <span className="chip tabular-nums">{currentRoutine.routine_exercises.length} egzersiz</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 leading-snug mt-1.5">{currentRoutine.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {currentRoutine.description || "Döngüsel kuvvet ve hipertrofi seansı"}
            </p>
          </div>

          {/* Exercise list */}
          <ul className="divide-y divide-slate-100">
            {currentRoutine.routine_exercises.map((re, index) => {
              const isEditing = editingExerciseId === re.id;
              const ex = re.exercise;

              return (
                <li key={re.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedGuideExercise(ex || null)}
                      aria-label={`${ex?.name || "Egzersiz"} — hareket rehberi`}
                      className="flex-1 min-w-0 flex items-center gap-3 text-left tap-effect"
                    >
                      <span className="relative w-12 h-12 shrink-0 rounded-xl bg-white border border-slate-200 overflow-hidden">
                        {ex ? (
                          <ExerciseThumb exercise={ex} />
                        ) : (
                          <span className="w-full h-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/75 text-white inline-flex items-center justify-center">
                          <Play className="w-2 h-2 fill-current" />
                        </span>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                          {ex?.name}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 min-w-0 text-xs text-slate-500">
                          <span className="font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                            {re.target_weight_kg} kg
                          </span>
                          <span className="text-slate-300" aria-hidden>
                            ·
                          </span>
                          <span className="tabular-nums whitespace-nowrap">
                            {re.target_sets} × {re.target_reps}
                          </span>
                          {ex?.target_muscle && (
                            <>
                              <span className="text-slate-300" aria-hidden>
                                ·
                              </span>
                              <span className="truncate">{muscleLabel(ex.target_muscle)}</span>
                            </>
                          )}
                        </span>
                      </span>
                    </button>

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(re)}
                        className="icon-btn"
                        aria-label="Hedef değerleri düzenle"
                        title="Hedef değerleri düzenle"
                      >
                        <Edit2 className="!w-4 !h-4" />
                      </button>
                    )}
                  </div>

                  {/* Inline editor */}
                  {isEditing && (
                    <div className="mt-3 card-muted animate-fade-in-up">
                      <div className="grid grid-cols-3 gap-2">
                        <label className="min-w-0">
                          <span className="field-label">Ağırlık (kg)</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            value={editWeight}
                            onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                            className="input px-2.5 font-bold tabular-nums"
                          />
                        </label>
                        <label className="min-w-0">
                          <span className="field-label">Set</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={editSets}
                            onChange={(e) => setEditSets(parseInt(e.target.value, 10) || 1)}
                            className="input px-2.5 font-bold tabular-nums"
                          />
                        </label>
                        <label className="min-w-0">
                          <span className="field-label">Tekrar</span>
                          <input
                            type="text"
                            value={editReps}
                            onChange={(e) => setEditReps(e.target.value)}
                            className="input px-2.5 font-bold tabular-nums"
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button type="button" onClick={() => setEditingExerciseId(null)} className="btn-secondary btn-sm">
                          <X /> Vazgeç
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(re.id)}
                          disabled={isSaving}
                          className="btn-primary btn-sm"
                        >
                          {isSaving ? <span className="spinner !w-4 !h-4 !border-2 border-white border-t-transparent" /> : <Check />}
                          Kaydet
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="pt-4 border-t border-slate-100">
            <Link href={`/workout/player?routineId=${currentRoutine.id}`} className="btn-primary btn-block">
              <Play className="fill-current" /> Rutini Başlat
            </Link>
          </div>
        </section>
      )}

      {/* Exercise Library */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-emerald-600 shrink-0" />
          <h2 className="section-title">Egzersiz Kütüphanesi</h2>
          <span className="chip tabular-nums">{allExercises.length}</span>
        </div>

        {/* Filter chips */}
        <div className="-mx-4 sm:mx-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-0">
            {MUSCLE_FILTERS.map((m) => {
              const active = selectedMuscle === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMuscle(m.key)}
                  aria-pressed={active}
                  className={`shrink-0 h-9 px-3.5 rounded-full text-xs font-semibold border tap-effect ${
                    active
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 md:hover:bg-slate-50"
                  }`}
                  style={{ transitionProperty: "transform, background-color, color" }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredExercises.length === 0 ? (
          <div className="card text-center text-sm text-slate-500 py-8">Bu kas grubu için egzersiz yok.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setSelectedGuideExercise(exercise)}
                className="surface-card overflow-hidden text-left flex flex-col tap-effect md:hover:border-emerald-300"
              >
                <span className="relative block aspect-[4/3] bg-white border-b border-slate-100">
                  <ExerciseThumb exercise={exercise} className="p-1.5" />
                  <span className="absolute top-1.5 left-1.5 chip bg-slate-900/70 text-white">
                    {muscleLabel(exercise.target_muscle)}
                  </span>
                </span>
                <span className="flex-1 flex flex-col p-2.5 min-w-0">
                  <span className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2">
                    {exercise.name}
                  </span>
                  <span className="mt-auto pt-1.5 flex items-center gap-1 text-xs text-slate-500 min-w-0">
                    <Timer className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="tabular-nums whitespace-nowrap">{exercise.default_rest_seconds}s</span>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <span className="truncate">{exercise.equipment}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-auto text-slate-300" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Guide Modal */}
      <ExerciseGuideModal
        exercise={selectedGuideExercise}
        isOpen={selectedGuideExercise !== null}
        onClose={() => setSelectedGuideExercise(null)}
      />
    </div>
  );
}
