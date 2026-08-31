"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { WorkoutRoutine, WorkoutSession, QueueStatus } from "@/types";
import { calculateNextRoutine } from "@/lib/workout-queue";
import WorkoutQueueCard from "@/components/workout/WorkoutQueueCard";
import Link from "next/link";
import {
  Dumbbell,
  Trophy,
  Flame,
  ChevronRight,
  Scale,
  Sparkles,
  History,
  Calendar,
  Layers,
  Activity,
  Clock,
  CheckCircle2
} from "lucide-react";
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
        .limit(6);

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

  const daysOfWeek = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4 animate-fade-in">
      {/* ── TOP HEVY-STYLE HEADER & WEEKLY ACTIVITY BAR ── */}
      <div className="hevy-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Lumino Antrenman Takibi
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
              100 kg Recomp
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dambıl & vücut ağırlığı odaklı döngüsel kuvvet programı
          </p>
        </div>

        {/* Weekly Day Circles */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#0B0E14] p-1.5 rounded-xl border border-[#1E2638]">
          {daysOfWeek.map((day, idx) => {
            const isToday = idx === currentDayIndex;
            const isCompleted = idx < recentSessions.length;

            return (
              <div
                key={day}
                className={`w-7 h-8 rounded-lg flex flex-col items-center justify-center text-[9px] font-bold ${
                  isToday
                    ? "bg-emerald-500 text-black font-black"
                    : isCompleted
                    ? "bg-[#181F2E] text-emerald-400 border border-emerald-500/30"
                    : "text-slate-500"
                }`}
              >
                <span>{day}</span>
                {isCompleted && !isToday && <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN HERO QUEUE CARD ── */}
      {loading ? (
        <div className="hevy-card p-12 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <WorkoutQueueCard
          queueStatus={effectiveQueueStatus}
          allRoutines={routines}
          onSelectRoutine={(id) => setSelectedRoutineId(id)}
        />
      )}

      {/* ── QUICK ATHLETE STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="hevy-card p-3.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Maksimum Yük</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white font-mono">24.5</span>
            <span className="text-xs font-bold text-emerald-400">kg × 2</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Ayarlanabilir Dambıl</span>
        </div>

        <div className="hevy-card p-3.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tamamlanan</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white font-mono">{recentSessions.length}</span>
            <span className="text-xs font-bold text-slate-400">Seans</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Kayıtlı Antrenman</span>
        </div>

        <div className="hevy-card p-3.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rutin Sayısı</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white font-mono">{routines.length}</span>
            <span className="text-xs font-bold text-slate-400">Rutin</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">İtiş / Çekiş / Bacak</span>
        </div>

        <div className="hevy-card p-3.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Faz Durumu</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white">Recomp</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Kas Koruma & Yağ Yakımı</span>
        </div>
      </div>

      {/* ── RECENT COMPLETED WORKOUT SESSIONS (HEVY FEED STYLE) ── */}
      <div className="hevy-card p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2638]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Son Antrenman Seansları
            </h3>
          </div>
          <Link
            href="/routines"
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 tap-effect"
          >
            Tüm Programlar <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            Henüz tamamlanmış bir antrenman kaydı yok.
          </div>
        ) : (
          <div className="divide-y divide-[#1E2638]/60">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    {session.routine?.name || "Özel Seans"}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>
                      {session.completed_at
                        ? new Date(session.completed_at).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </span>
                    {session.notes && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-500 truncate max-w-xs">&ldquo;{session.notes}&rdquo;</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {session.rpe_score && (
                    <span className="px-2 py-0.5 rounded-md bg-[#181F2E] border border-[#1E2638] text-slate-300 font-mono font-bold text-[10px]">
                      RPE {session.rpe_score}/10
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
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
