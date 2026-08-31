"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
    try {
      const { data, error } = await supabase
        .from("ai_coach_logs")
        .select("*")
        .order("created_at", { ascending: false });

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
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <AiCoachView initialLogs={logs} />
    </div>
  );
}
