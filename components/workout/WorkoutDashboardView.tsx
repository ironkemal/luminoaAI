"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { WorkoutRoutine, WorkoutSession, QueueStatus } from "@/types";
import { calculateNextRoutine } from "@/lib/workout-queue";
import WorkoutQueueCard from "@/components/workout/WorkoutQueueCard";
import Link from "next/link";
import { Dumbbell, Trophy, Flame, ChevronRight, Scale, Sparkles, History, Calendar, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function WorkoutDashboardView() {
  const { t } = useLanguage();
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const supabase = createClient();
    const currentUser = getCurrentUser();

    try {
      let rQuery = supabase
        .from("workout_routines")
        .select("*")
        .eq("is_active", true)
        .order("sequence_order", { ascending: true });

      let sQuery = supabase
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

      if (currentUser?.id) {
        rQuery = rQuery.eq("user_id", currentUser.id);
        sQuery = sQuery.eq("user_id", currentUser.id);
      }

      const [{ data: routinesData }, { data: sessionsData }] = await Promise.all([
        rQuery,
        sQuery,
      ]);

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

  const effectiveRoutine = selectedRoutineId
    ? routines.find((r) => r.id === selectedRoutineId) || currentQueueStatus.nextRoutine
    : currentQueueStatus.nextRoutine;

  const effectiveQueueStatus: QueueStatus = {
    ...currentQueueStatus,
    nextRoutine: effectiveRoutine,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Antrenman Paneli</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            100 kg Body Recomposition & 24.5 kg Dambıl Odaklı Sistem
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/metrics"
            className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/[0.1] hover:border-emerald-400/40 text-xs font-bold text-slate-200 shadow-md flex items-center gap-1.5 tap-effect transition-all"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            {t("newMetricBtn")}
          </Link>
          <Link
            href="/coach"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-xs font-bold text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10 flex items-center gap-1.5 tap-effect transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {t("tabChat")}
          </Link>
        </div>
      </div>

      {/* Main Rotating Queue Card */}
      {loading ? (
        <div className="surface-card p-12 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
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
        <div className="surface-card p-4 surface-card-hover">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hedef Süreç</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white">Recomp</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Yağ Yakımı & Kas Kütlesi</p>
        </div>

        <div className="surface-card p-4 surface-card-hover">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Maks. Direnç</span>
            <Dumbbell className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white">2x 24.5 kg</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Ayarlanabilir Dambıl</p>
        </div>

        <div className="surface-card p-4 surface-card-hover">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Core & Sırt</span>
            <Trophy className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-black text-white">Ab-Wheel</p>
          <p className="text-[10px] text-slate-400 mt-0.5">+ Barfiks Demiri</p>
        </div>

        <div className="surface-card p-4 surface-card-hover">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tamamlanan</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-black text-white">
            {recentSessions.length} Seans
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Son döngü kayıtları</p>
        </div>
      </div>

      {/* Recent Workout History */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Son Antrenman Geçmişi</h3>
          </div>
          <Link
            href="/routines"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 tap-effect"
          >
            {t("navRoutines")} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-8 bg-slate-900/50 rounded-2xl border border-dashed border-white/[0.08]">
            <p className="text-xs text-slate-400 font-medium">
              Henüz tamamlanmış bir antrenman kaydı yok.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Yukarıdaki butona tıklayarak ilk seansınızı başlatın!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="py-3.5 flex items-center justify-between hover:bg-white/[0.03] px-2 rounded-xl transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {session.routine?.name || "Özel Seans"}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {session.completed_at
                      ? new Date(session.completed_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {session.rpe_score && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 font-bold text-xs">
                      RPE: {session.rpe_score}/10
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
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
