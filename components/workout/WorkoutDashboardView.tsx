"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WorkoutRoutine, WorkoutSession, QueueStatus, AppUser } from "@/types";
import { calculateNextRoutine } from "@/lib/workout-queue";
import { getCurrentUser } from "@/lib/auth-pin";
import WorkoutQueueCard from "@/components/workout/WorkoutQueueCard";
import Link from "next/link";
import { Dumbbell, Trophy, Flame, ChevronRight, Scale, History, Calendar, UserCheck, Camera, CheckCircle2 } from "lucide-react";

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
    const user = getCurrentUser();

    try {
      // 1. Fetch active routines for current user
      let routinesQuery = supabase
        .from("workout_routines")
        .select("*")
        .eq("is_active", true)
        .order("sequence_order", { ascending: true });

      if (user?.id) {
        routinesQuery = routinesQuery.eq("user_id", user.id);
      }

      // 2. Fetch last completed sessions for current user
      let sessionsQuery = supabase
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

      if (user?.id) {
        sessionsQuery = sessionsQuery.eq("user_id", user.id);
      }

      const [{ data: routinesData }, { data: sessionsData }] = await Promise.all([
        routinesQuery,
        sessionsQuery,
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

  // If user manually switched the routine in the dropdown
  const effectiveRoutine = selectedRoutineId
    ? routines.find((r) => r.id === selectedRoutineId) || currentQueueStatus.nextRoutine
    : currentQueueStatus.nextRoutine;

  const effectiveQueueStatus: QueueStatus = {
    ...currentQueueStatus,
    nextRoutine: effectiveRoutine,
  };

  const quickActions = [
    { href: "/metrics#progress-photos", label: "Fotoğraf", sub: "Çek / ekle", icon: Camera },
    { href: "/metrics", label: "Ölçüm", sub: "Tartım / kilo", icon: Scale },
    { href: "/coach", label: "Harun Hoca", sub: "Danış", icon: UserCheck },
  ];

  const stats = [
    { label: "Hedef süreç", value: "Recomp", meta: "Yağ yakımı & kas", icon: Flame },
    { label: "Maks. direnç", value: "2× 24.5 kg", meta: "Ayarlanabilir dambıl", icon: Dumbbell },
    { label: "Core & sırt", value: "Ab-Wheel", meta: "+ Barfiks demiri", icon: Trophy },
    { label: "Tamamlanan", value: `${recentSessions.length} seans`, meta: "Son döngü kayıtları", icon: History },
  ];

  return (
    <div className="page">
      {/* Header */}
      <header className="min-w-0">
        <h1 className="page-title">Antrenman Paneli</h1>
        <p className="page-subtitle truncate">
          {currentUser
            ? `${currentUser.display_name || currentUser.username} • ${currentUser.current_weight_kg || 100} kg • ${currentUser.fitness_goal || "Recomp"}`
            : "Döngüsel Antrenman ve Gelişim Takibi"}
        </p>
      </header>

      {/* Quick actions */}
      <nav aria-label="Hızlı işlemler" className="grid grid-cols-3 gap-2.5">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="surface-card tap-effect min-w-0 flex flex-col items-start gap-2.5 p-3 md:hover:border-emerald-200"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <span className="min-w-0 w-full">
                <span className="block text-[13px] font-bold text-slate-900 leading-tight truncate">{a.label}</span>
                <span className="block text-xs text-slate-500 leading-tight mt-0.5 truncate">{a.sub}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Main Rotating Queue Card */}
      {loading ? (
        <div className="card space-y-3" aria-busy="true">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-7 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-[52px] w-full mt-4" />
        </div>
      ) : (
        <WorkoutQueueCard
          queueStatus={effectiveQueueStatus}
          allRoutines={routines}
          onSelectRoutine={(id) => setSelectedRoutineId(id)}
        />
      )}

      {/* Quick Stats Grid */}
      <section aria-label="Özet" className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow truncate">{s.label}</span>
                <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <p className="mt-2.5 text-lg font-extrabold tracking-tight text-slate-900 tabular-nums leading-tight truncate">
                {s.value}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 truncate">{s.meta}</p>
            </div>
          );
        })}
      </section>

      {/* Recent Workout History */}
      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="section-title flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Son Antrenmanlar</span>
          </h3>
          <Link href="/routines" className="btn-ghost btn-sm shrink-0 -mr-2 text-emerald-700">
            Programlar <ChevronRight />
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="card-muted text-center py-8 mt-3">
            <p className="text-sm text-slate-600 font-medium">
              Henüz tamamlanmış bir antrenman kaydı yok.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Yukarıdaki butonla ilk seansını başlat!
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentSessions.map((session) => (
              <li key={session.id} className="py-3 flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 shrink-0"
                  role="img"
                  aria-label="Tamamlandı"
                  title="Tamamlandı"
                >
                  <CheckCircle2 className="w-[18px] h-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">
                    {session.routine?.name || "Özel Seans"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums truncate">
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
                {session.rpe_score && (
                  <span className="chip shrink-0 tabular-nums">RPE {session.rpe_score}/10</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
