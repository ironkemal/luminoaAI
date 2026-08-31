import { WorkoutRoutine, WorkoutSession, QueueStatus } from "@/types";

/**
 * Dinamik Sarkma Algoritması (Rotating Queue)
 * Takvim günü yerine seans döngüsünü baz alır.
 */
export function calculateNextRoutine(
  routines: WorkoutRoutine[],
  lastSession: WorkoutSession | null
): QueueStatus {
  const activeRoutines = routines
    .filter((r) => r.is_active)
    .sort((a, b) => a.sequence_order - b.sequence_order);

  if (activeRoutines.length === 0) {
    const fallbackRoutine: WorkoutRoutine = {
      id: "fallback-routine",
      name: "Tüm Vücut / Genel Antrenman",
      sequence_order: 1,
      is_active: true,
      description: "Genel kuvvet ve kondisyon",
    };
    return {
      nextRoutine: fallbackRoutine,
      lastSession: null,
      hoursSinceLastWorkout: null,
      recoveryStatus: "ready",
      recoveryMessage: "Program başlatılmaya hazır.",
    };
  }

  let nextIndex = 0;

  if (lastSession && lastSession.routine_id) {
    const lastRoutineIndex = activeRoutines.findIndex(
      (r) => r.id === lastSession.routine_id
    );

    if (lastRoutineIndex !== -1) {
      // Bir sonraki sıradaki rutin (döngüsel)
      nextIndex = (lastRoutineIndex + 1) % activeRoutines.length;
    }
  }

  const nextRoutine = activeRoutines[nextIndex];

  let hoursSinceLastWorkout: number | null = null;
  let recoveryStatus: "fresh" | "recovering" | "ready" = "ready";
  let recoveryMessage = "Döngüdeki sıradaki antrenmanınız hazır!";

  if (lastSession && lastSession.completed_at) {
    const lastDate = new Date(lastSession.completed_at).getTime();
    const now = new Date().getTime();
    hoursSinceLastWorkout = Math.max(0, Math.round((now - lastDate) / (1000 * 60 * 60)));

    if (hoursSinceLastWorkout < 20) {
      recoveryStatus = "recovering";
      recoveryMessage = `Son antrenmandan ${hoursSinceLastWorkout} saat geçti. Kas toparlanması sürüyor (İsteğe bağlı başlatabilirsiniz).`;
    } else if (hoursSinceLastWorkout <= 72) {
      recoveryStatus = "ready";
      recoveryMessage = `Son antrenmandan ${hoursSinceLastWorkout} saat geçti. Kas toparlanması optimal seviyede.`;
    } else {
      recoveryStatus = "fresh";
      const days = Math.floor(hoursSinceLastWorkout / 24);
      recoveryMessage = `Son antrenmandan ${days} gün geçti. Sarkma algoritması devrede: Sıradaki seans doğrudan karşınıza geldi!`;
    }
  } else {
    recoveryStatus = "fresh";
    recoveryMessage = "Yeni antrenman döngüsü başlatılmaya hazır.";
  }

  return {
    nextRoutine,
    lastSession,
    hoursSinceLastWorkout,
    recoveryStatus,
    recoveryMessage,
  };
}
