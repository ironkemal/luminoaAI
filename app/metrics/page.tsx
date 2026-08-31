"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
    try {
      const { data, error } = await supabase
        .from("body_metrics")
        .select("*")
        .order("recorded_at", { ascending: false });

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
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <MetricsTracker initialMetrics={metrics} />
    </div>
  );
}
