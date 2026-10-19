"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WorkoutRoutine, RoutineExercise, Exercise } from "@/types";
import WorkoutPlayer from "@/components/workout/WorkoutPlayer";

function WorkoutPlayerContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const routineId = searchParams.get("routineId");

  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
  const [routineExercises, setRoutineExercises] = useState<(RoutineExercise & { exercise: Exercise })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutineDetails();
  }, [routineId]);

  const fetchRoutineDetails = async () => {
    if (!routineId) {
      setError("Antrenman ID bulunamadı.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch Routine
      const { data: rData, error: rErr } = await supabase
        .from("workout_routines")
        .select("*")
        .eq("id", routineId)
        .single();

      if (rErr || !rData) {
        throw new Error("Rutin bulunamadı.");
      }

      // 2. Fetch Routine Exercises with Exercise details
      const { data: reData, error: reErr } = await supabase
        .from("routine_exercises")
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq("routine_id", routineId)
        .order("order_in_routine", { ascending: true });

      if (reErr) throw reErr;

      setRoutine(rData as WorkoutRoutine);
      setRoutineExercises((reData as unknown as (RoutineExercise & { exercise: Exercise })[]) || []);
    } catch (err: unknown) {
      const e = err as Error;
      console.error("Error loading routine for player:", e);
      setError(e.message || "Antrenman yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-slate-50 p-4">
        <div className="spinner w-10 h-10" />
        <p className="text-sm font-semibold text-slate-600">Odak modu yükleniyor...</p>
      </div>
    );
  }

  if (error || !routine || routineExercises.length === 0) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-50 p-4">
        <div className="card w-full max-w-sm text-center">
          <p className="text-sm text-red-600 font-semibold mb-4">{error || "Bu rutinde egzersiz bulunamadı."}</p>
          <button onClick={() => router.push("/workout")} className="btn-dark btn-block">
            Panele dön
          </button>
        </div>
      </div>
    );
  }

  return <WorkoutPlayer routine={routine} routineExercises={routineExercises} />;
}

export default function WorkoutPlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-50">
          <div className="spinner w-10 h-10" />
        </div>
      }
    >
      <WorkoutPlayerContainer />
    </Suspense>
  );
}
