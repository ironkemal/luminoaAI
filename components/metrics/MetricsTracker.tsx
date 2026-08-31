"use client";

import { useState } from "react";
import { BodyMetric } from "@/types";
import { analyzeBodyMetrics } from "@/lib/metrics-calculator";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { useLanguage } from "@/lib/i18n";
import ProgressPhotosGallery from "@/components/metrics/ProgressPhotosGallery";
import {
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Flame,
  Activity,
  Camera
} from "lucide-react";

interface MetricsTrackerProps {
  initialMetrics: BodyMetric[];
}

export default function MetricsTracker({ initialMetrics }: MetricsTrackerProps) {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<BodyMetric[]>(initialMetrics);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [weightKg, setWeightKg] = useState<string>("99.5");
  const [waistCm, setWaistCm] = useState<string>("");
  const [armCm, setArmCm] = useState<string>("");
  const [chestCm, setChestCm] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const analysis = analyzeBodyMetrics(metrics);

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weightKg);
    if (isNaN(weightNum) || weightNum <= 0) return;

    setIsSubmitting(true);
    const supabase = createClient();
    const currentUser = getCurrentUser();

    try {
      const newEntry = {
        user_id: currentUser?.id || null,
        recorded_at: new Date().toISOString().split("T")[0],
        weight_kg: weightNum,
        waist_cm: waistCm ? parseFloat(waistCm) : null,
        arm_cm: armCm ? parseFloat(armCm) : null,
        chest_cm: chestCm ? parseFloat(chestCm) : null,
        notes: notes || null,
      };

      const { data, error } = await supabase
        .from("body_metrics")
        .insert(newEntry)
        .select()
        .single();

      if (error) throw error;

      setMetrics((prev) => [data as BodyMetric, ...prev]);
      setShowAddForm(false);
      setNotes("");
    } catch (err) {
      console.error("Error adding metric:", err);
      alert("Ölçüm kaydedilirken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMetric = async (id: string) => {
    if (!confirm("Bu ölçüm kaydını silmek istediğinize emin misiniz?")) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.from("body_metrics").delete().eq("id", id);
      if (error) throw error;
      setMetrics((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Error deleting metric:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{t("metricsTitle")}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {t("metricsSubtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 tap-effect flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> {t("newMetricBtn")}
        </button>
      </div>

      {/* Add Metric Form Drawer / Modal */}
      {showAddForm && (
        <form
          onSubmit={handleAddMetric}
          className="surface-card p-5 md:p-7 animate-slide-up border-emerald-500/30 space-y-4"
        >
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" /> Yeni Tartım ve Mezura Girişi
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Kilo (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="99.5"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-white/[0.1] rounded-2xl focus:border-emerald-400 focus:outline-none text-white font-black"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Bel (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                placeholder="100.0"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-white/[0.1] rounded-2xl focus:border-emerald-400 focus:outline-none text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Kol (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={armCm}
                onChange={(e) => setArmCm(e.target.value)}
                placeholder="40.0"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-white/[0.1] rounded-2xl focus:border-emerald-400 focus:outline-none text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Göğüs (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={chestCm}
                onChange={(e) => setChestCm(e.target.value)}
                placeholder="113.0"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-white/[0.1] rounded-2xl focus:border-emerald-400 focus:outline-none text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Not (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sabah aç karnına tartım yapıldı..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-white/[0.1] rounded-2xl focus:border-emerald-400 focus:outline-none text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl tap-effect"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 text-xs font-black rounded-2xl tap-effect shadow-md shadow-emerald-500/25"
            >
              {isSubmitting ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      )}

      {/* Recomposition Analysis Highlights */}
      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Moving Avg Card */}
          <div className="surface-card p-5 surface-card-hover border-emerald-500/20">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t("movingAvg7d")}</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {analysis.movingAverage7d}
              </span>
              <span className="text-xs font-bold text-emerald-400">kg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Son tartım: <span className="font-bold text-white">{analysis.currentWeight} kg</span>
            </p>
          </div>

          {/* Waist Trend Card */}
          <div className="surface-card p-5 surface-card-hover border-amber-500/20">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t("waist")}</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {analysis.currentWaist ? `${analysis.currentWaist}` : "-"}
              </span>
              {analysis.currentWaist && <span className="text-xs font-bold text-amber-400">cm</span>}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {analysis.waistDelta !== null ? (
                <span className={`font-bold ${analysis.waistDelta <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  Başlangıca göre: {analysis.waistDelta > 0 ? `+${analysis.waistDelta}` : analysis.waistDelta} cm
                </span>
              ) : (
                "Mezura takibi için düzenli kaydedin"
              )}
            </p>
          </div>

          {/* Arm / Muscle Card */}
          <div className="surface-card p-5 surface-card-hover border-cyan-500/20">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t("arm")}</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {analysis.currentArm ? `${analysis.currentArm}` : "-"}
              </span>
              {analysis.currentArm && <span className="text-xs font-bold text-cyan-400">cm</span>}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {analysis.armDelta !== null ? (
                <span className={`font-bold ${analysis.armDelta >= 0 ? "text-emerald-400" : "text-slate-300"}`}>
                  Değişim: {analysis.armDelta > 0 ? `+${analysis.armDelta}` : analysis.armDelta} cm
                </span>
              ) : (
                "Kol kas kütlesi takibi"
              )}
            </p>
          </div>
        </div>
      )}

      {/* Recomposition Banner */}
      {analysis && (
        <div className="surface-card p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border-emerald-500/30">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-md mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                Vücut Kompozisyonu & Lean Cut Durumu
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">
                {analysis.recompositionMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PROGRESS PHOTOS GALLERY SECTION (PRE-WORKOUT VS PUMP) ── */}
      <ProgressPhotosGallery currentWeight={analysis?.currentWeight} />

      {/* Visual Data Points / Trend Log Table */}
      <div className="surface-card p-6">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 pb-3 border-b border-white/[0.08] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" /> {t("history")}
        </h3>

        {metrics.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            {t("noMetrics")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-2.5 px-3">{t("date")}</th>
                  <th className="py-2.5 px-3">{t("weight")}</th>
                  <th className="py-2.5 px-3">{t("waist")}</th>
                  <th className="py-2.5 px-3">{t("arm")}</th>
                  <th className="py-2.5 px-3">{t("chest")}</th>
                  <th className="py-2.5 px-3">{t("notes")}</th>
                  <th className="py-2.5 px-3 text-right">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-medium text-slate-300">
                {metrics.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-3 font-bold text-white">
                      {new Date(item.recorded_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-3 font-black text-emerald-400 text-sm">
                      {item.weight_kg} kg
                    </td>
                    <td className="py-3.5 px-3">
                      {item.waist_cm ? `${item.waist_cm} cm` : "-"}
                    </td>
                    <td className="py-3.5 px-3">
                      {item.arm_cm ? `${item.arm_cm} cm` : "-"}
                    </td>
                    <td className="py-3.5 px-3">
                      {item.chest_cm ? `${item.chest_cm} cm` : "-"}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 max-w-xs truncate">
                      {item.notes || "-"}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteMetric(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/[0.05] tap-effect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
