"use client";

import { useState } from "react";
import { BodyMetric } from "@/types";
import { analyzeBodyMetrics } from "@/lib/metrics-calculator";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
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
  Activity
} from "lucide-react";

interface MetricsTrackerProps {
  initialMetrics: BodyMetric[];
}

export default function MetricsTracker({ initialMetrics }: MetricsTrackerProps) {
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Vücut Kompozisyonu ve Tartım
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Su dalgalanmalarını filtreleyen 7 günlük hareketli ortalama & gelişim takibi
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm tap-effect flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Yeni Ölçüm / Tartım
        </button>
      </div>

      {/* Add Metric Form Drawer / Modal */}
      {showAddForm && (
        <form
          onSubmit={handleAddMetric}
          className="surface-card p-5 md:p-6 animate-slide-up border-emerald-100 bg-white"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" /> Yeni Tartım ve Mezura Girişi
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Kilo (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="99.5"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Bel (cm - Göbek deliği)
              </label>
              <input
                type="number"
                step="0.1"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                placeholder="100.0"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Kol (cm - Sıkılı)
              </label>
              <input
                type="number"
                step="0.1"
                value={armCm}
                onChange={(e) => setArmCm(e.target.value)}
                placeholder="40.0"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Göğüs (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={chestCm}
                onChange={(e) => setChestCm(e.target.value)}
                placeholder="113.0"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-slate-800"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Not (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sabah aç karnına tartım yapıldı..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl tap-effect"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl tap-effect shadow-sm"
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      )}

      {/* Recomposition Analysis Highlights */}
      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Moving Avg Card */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">7G Hareketli Ort.</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {analysis.movingAverage7d}
              </span>
              <span className="text-xs font-bold text-slate-500">kg</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Son tartım: <span className="font-bold text-slate-700">{analysis.currentWeight} kg</span>
            </p>
          </div>

          {/* Waist Trend Card */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Bel Çevresi</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {analysis.currentWaist ? `${analysis.currentWaist}` : "-"}
              </span>
              {analysis.currentWaist && <span className="text-xs font-bold text-slate-500">cm</span>}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {analysis.waistDelta !== null ? (
                <span className={`font-bold ${analysis.waistDelta <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  Başlangıca göre: {analysis.waistDelta > 0 ? `+${analysis.waistDelta}` : analysis.waistDelta} cm
                </span>
              ) : (
                "Mezura takibi için düzenli kaydedin"
              )}
            </p>
          </div>

          {/* Arm / Muscle Card */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Kol (Biceps/Triceps)</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {analysis.currentArm ? `${analysis.currentArm}` : "-"}
              </span>
              {analysis.currentArm && <span className="text-xs font-bold text-slate-500">cm</span>}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {analysis.armDelta !== null ? (
                <span className={`font-bold ${analysis.armDelta >= 0 ? "text-emerald-600" : "text-slate-600"}`}>
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
        <div className="surface-card p-5 bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/50 border-emerald-200/60">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Vücut Kompozisyonu & Lean Cut Durumu
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {analysis.recompositionMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PROGRESS PHOTOS GALLERY (PRE VS POST PUMP) ── */}
      <ProgressPhotosGallery currentWeight={analysis?.currentWeight} />

      {/* Visual Data Points / Trend Log Table */}
      <div className="surface-card p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" /> Ölçüm Geçmişi
        </h3>

        {metrics.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Henüz kayıtlı ölçüm bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3">Kilo</th>
                  <th className="py-2.5 px-3">Bel</th>
                  <th className="py-2.5 px-3">Kol</th>
                  <th className="py-2.5 px-3">Göğüs</th>
                  <th className="py-2.5 px-3">Not</th>
                  <th className="py-2.5 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {metrics.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {new Date(item.recorded_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {item.weight_kg} kg
                    </td>
                    <td className="py-3 px-3">
                      {item.waist_cm ? `${item.waist_cm} cm` : "-"}
                    </td>
                    <td className="py-3 px-3">
                      {item.arm_cm ? `${item.arm_cm} cm` : "-"}
                    </td>
                    <td className="py-3 px-3">
                      {item.chest_cm ? `${item.chest_cm} cm` : "-"}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                      {item.notes || "-"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteMetric(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 tap-effect"
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
