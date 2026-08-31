"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WorkoutRoutine, RoutineExercise, Exercise } from "@/types";
import RoutineManager from "@/components/routines/RoutineManager";

type RoutineWithExercises = WorkoutRoutine & {
  routine_exercises: (RoutineExercise & { exercise: Exercise })[];
};

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutinesAndExercises();
  }, []);

  const fetchRoutinesAndExercises = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch routines with routine_exercises and exercise details
      const { data: routinesData, error: rErr } = await supabase
        .from("workout_routines")
        .select(`
          *,
          routine_exercises (
            *,
            exercise:exercises(*)
          )
        `)
        .order("sequence_order", { ascending: true });

      if (rErr) throw rErr;

      // Sort routine exercises by order_in_routine
      const parsedRoutines = (routinesData || []).map((r: any) => ({
        ...r,
        routine_exercises: (r.routine_exercises || []).sort(
          (a: any, b: any) => a.order_in_routine - b.order_in_routine
        ),
      }));

      // 2. Fetch all exercises
      const { data: exercisesData, error: eErr } = await supabase
        .from("exercises")
        .select("*")
        .order("target_muscle", { ascending: true });

      if (eErr) throw eErr;

      setRoutines(parsedRoutines);
      setExercises((exercisesData as Exercise[]) || []);
    } catch (err) {
      console.error("Error loading routines data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <RoutineManager routines={routines} allExercises={exercises} />
    </div>
  );
}
