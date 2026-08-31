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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Antrenman Paneli
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">
            100 kg Body Recomposition & 24.5 kg Dambıl Takibi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/metrics"
            className="px-3.5 py-2 rounded-xl btn-secondary text-xs font-bold flex items-center gap-1.5 tap-effect"
          >
            <Scale className="w-3.5 h-3.5 text-[#E2F952]" />
            {t("newMetricBtn")}
          </Link>
          <Link
            href="/coach"
            className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-bold text-white border border-white/[0.08] flex items-center gap-1.5 tap-effect"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E2F952]" />
            {t("tabChat")}
          </Link>
        </div>
      </div>

      {/* Main Rotating Queue Card */}
      {loading ? (
        <div className="surface-card p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#E2F952] rounded-full animate-spin"></div>
        </div>
      ) : (
        <WorkoutQueueCard
          queueStatus={effectiveQueueStatus}
          allRoutines={routines}
          onSelectRoutine={(id) => setSelectedRoutineId(id)}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hedef</span>
            <Flame className="w-4 h-4 text-[#FF6B4A]" />
          </div>
          <p className="text-lg font-black text-white">Recomp</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Yağ Yakımı & Güç</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ekipman</span>
            <Dumbbell className="w-4 h-4 text-[#E2F952]" />
          </div>
          <p className="text-lg font-black text-white">2x 24.5 kg</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Ayarlanabilir Dambıl</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Yardımcı</span>
            <Trophy className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-lg font-black text-white">Ab-Wheel</p>
          <p className="text-[10px] text-slate-400 mt-0.5">+ Barfiks Barı</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tamamlanan</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-black text-white">
            {recentSessions.length} Seans
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Son döngü kayıtları</p>
        </div>
      </div>

      {/* Recent Workout History */}
      <div className="surface-card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Son Antrenman Geçmişi</h3>
          </div>
          <Link
            href="/routines"
            className="text-xs font-bold text-[#E2F952] hover:underline flex items-center gap-1 tap-effect"
          >
            {t("navRoutines")} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-6 bg-[#090B0E] rounded-xl border border-dashed border-white/[0.06]">
            <p className="text-xs text-slate-400 font-medium">
              Henüz tamamlanmış bir antrenman kaydı yok.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Yukarıdaki butona tıklayarak ilk seansınızı başlatın!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    {session.routine?.name || "Özel Seans"}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
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

                <div className="flex items-center gap-2">
                  {session.rpe_score && (
                    <span className="px-2 py-0.5 rounded-md bg-[#171C26] border border-white/[0.06] text-slate-300 font-bold text-[11px]">
                      RPE {session.rpe_score}/10
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-[#E2F952] bg-[#E2F952]/10 px-2 py-0.5 rounded-md">
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
