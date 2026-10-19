"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { AiCoachLog } from "@/types";
import AiCoachView from "@/components/coach/AiCoachView";

export default function CoachPage() {
  const [logs, setLogs] = useState<AiCoachLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAiLogs();
  }, []);

  const fetchAiLogs = async () => {
    setLoading(true);
    const supabase = createClient();
    const currentUser = getCurrentUser();
    try {
      let query = supabase
        .from("ai_coach_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (currentUser?.id) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as AiCoachLog[]) || []);
    } catch (err) {
      console.error("Error loading AI logs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page pb-0 md:pb-6 space-y-4" aria-busy="true" aria-label="Yükleniyor">
        <div className="flex items-center gap-3 h-11">
          <div className="skeleton w-11 h-11 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-48 max-w-full" />
          </div>
        </div>
        <div className="skeleton h-11 w-full" />
        <div className="surface-card h-[calc(100dvh-13.875rem-env(safe-area-inset-bottom)-env(safe-area-inset-top))] min-h-[24rem] md:h-[min(680px,calc(100dvh-14rem))] p-4 flex flex-col gap-3">
          <div className="skeleton h-16 w-4/5" />
          <div className="skeleton h-10 w-1/2 self-end" />
          <div className="skeleton h-12 w-3/4" />
          <div className="mt-auto flex items-center justify-center py-4">
            <span className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page pb-0 md:pb-6">
      <AiCoachView initialLogs={logs} />
    </div>
  );
}
