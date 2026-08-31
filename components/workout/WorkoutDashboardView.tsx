"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WorkoutRoutine, WorkoutSession, QueueStatus, AppUser } from "@/types";
import { calculateNextRoutine } from "@/lib/workout-queue";
import { getCurrentUser } from "@/lib/auth-pin";
import WorkoutQueueCard from "@/components/workout/WorkoutQueueCard";
import Link from "next/link";
import { Dumbbell, Trophy, Flame, ChevronRight, Scale, Sparkles, History, Calendar, UserCheck, Camera } from "lucide-react";

export default function WorkoutDashboardView() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch active routines
      const { data: routinesData } = await supabase
        .from("workout_routines")
        .select("*")
        .eq("is_active", true)
        .order("sequence_order", { ascending: true });

      // 2. Fetch last completed sessions
      const { data: sessionsData } = await supabase
        .from("workout_sessions")
        .select(`
          id,
          routine_id,
          started_at,
          completed_at,
          notes,
          rpe_score,
          routine:workout_routines(id, name)
        `)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(5);

      const routinesList = routinesData && routinesData.length > 0 ? (routinesData as WorkoutRoutine[]) : [];
      setRoutines(routinesList);

      if (sessionsData && sessionsData.length > 0) {
        const castSessions = sessionsData as unknown as WorkoutSession[];
        setLastSession(castSessions[0]);
        setRecentSessions(castSessions);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentQueueStatus: QueueStatus = calculateNextRoutine(
    routines,
    lastSession
  );

  // If user manually switched the routine in the dropdown
  const effectiveRoutine = selectedRoutineId
    ? routines.find((r) => r.id === selectedRoutineId) || currentQueueStatus.nextRoutine
    : currentQueueStatus.nextRoutine;

  const effectiveQueueStatus: QueueStatus = {
    ...currentQueueStatus,
    nextRoutine: effectiveRoutine,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Antrenman Paneli
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {currentUser
              ? `${currentUser.display_name || currentUser.username} • ${currentUser.current_weight_kg || 100} kg • ${currentUser.fitness_goal || "Recomp"}`
              : "Döngüsel Antrenman ve Gelişim Takibi"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/metrics#progress-photos"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 tap-effect"
          >
            <Camera className="w-3.5 h-3.5" />
            Fotoğraf Çek / Ekle
          </Link>
          <Link
            href="/metrics"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 tap-effect"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            Tartım / Ölçüm
          </Link>
          <Link
            href="/coach"
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 border border-emerald-200/60 shadow-sm flex items-center gap-1.5 tap-effect"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Harun Hoca&apos;ya Danış
          </Link>
        </div>
      </div>

      {/* Main Rotating Queue Card */}
      {loading ? (
        <div className="surface-card p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <WorkoutQueueCard
          queueStatus={effectiveQueueStatus}
          allRoutines={routines}
          onSelectRoutine={(id) => setSelectedRoutineId(id)}
        />
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Hedef Süreç</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">Recomp</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Yağ Yakımı & Kas Kütlesi</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Maks. Direnç</span>
            <Dumbbell className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">2x 24.5 kg</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Ayarlanabilir Dambıl</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Core & Sırt</span>
            <Trophy className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">Ab-Wheel</p>
          <p className="text-[11px] text-slate-500 mt-0.5">+ Barfiks Demiri</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tamamlanan</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-800">
            {recentSessions.length} Seans
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Son döngü kayıtları</p>
        </div>
      </div>

      {/* Recent Workout History */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-800">Son Antrenman Geçmişi</h3>
          </div>
          <Link
            href="/routines"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Tüm Programlar <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 font-medium">
              Henüz tamamlanmış bir antrenman kaydı yok.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Yukarıdaki butona tıklayarak ilk seansınızı başlatın!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    {session.routine?.name || "Özel Seans"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {session.completed_at
                      ? new Date(session.completed_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {session.rpe_score && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
                      RPE: {session.rpe_score}/10
                    </span>
                  )}
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    Tamamlandı
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
