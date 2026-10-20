"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
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
    const currentUser = getCurrentUser();

    try {
      // 1. Fetch routines with routine_exercises and exercise details (user-scoped)
      let routinesQuery = supabase
        .from("workout_routines")
        .select(`
          *,
          routine_exercises (
            *,
            exercise:exercises(*)
          )
        `)
        .order("sequence_order", { ascending: true });

      if (currentUser?.id) {
        routinesQuery = routinesQuery.eq("user_id", currentUser.id);
      }

      // 2. Fetch all exercises (in parallel)
      const exercisesQuery = supabase
        .from("exercises")
        .select("*")
        .order("target_muscle", { ascending: true });

      const [{ data: routinesData, error: rErr }, { data: exercisesData, error: eErr }] =
        await Promise.all([routinesQuery, exercisesQuery]);

      if (rErr) throw rErr;
      if (eErr) throw eErr;

      // Sort routine exercises by order_in_routine
      const parsedRoutines = (routinesData || []).map((r: any) => ({
        ...r,
        routine_exercises: (r.routine_exercises || []).sort(
          (a: any, b: any) => a.order_in_routine - b.order_in_routine
        ),
      }));

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
      <div className="page" aria-busy="true" aria-label="Yükleniyor">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-44" />
          <div className="skeleton h-4 w-64 max-w-full" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          <div className="skeleton h-11 w-56 shrink-0" />
          <div className="skeleton h-11 w-48 shrink-0" />
        </div>
        <div className="skeleton h-80 rounded-[1.25rem]" />
      </div>
    );
  }

  return (
    <div className="page">
      <RoutineManager routines={routines} allExercises={exercises} />
    </div>
  );
}
