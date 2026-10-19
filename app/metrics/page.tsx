"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { BodyMetric } from "@/types";
import MetricsTracker from "@/components/metrics/MetricsTracker";

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    const supabase = createClient();
    const currentUser = getCurrentUser();
    try {
      let query = supabase
        .from("body_metrics")
        .select("*")
        .order("recorded_at", { ascending: false });

      if (currentUser?.id) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMetrics((data as BodyMetric[]) || []);
    } catch (err) {
      console.error("Error loading metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page" aria-busy="true" aria-label="Yükleniyor">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-7 w-44" />
            <div className="skeleton h-4 w-60 max-w-full" />
          </div>
          <div className="skeleton h-9 w-28 shrink-0" />
        </div>
        <div className="skeleton h-[104px]" />
        <div className="skeleton h-24" />
        <div className="skeleton h-56" />
      </div>
    );
  }

  return (
    <div className="page">
      <MetricsTracker initialMetrics={metrics} />
    </div>
  );
}
