import { BodyMetric } from "@/types";

export interface MetricsAnalysis {
  currentWeight: number;
  movingAverage7d: number;
  weightDelta7d: number;
  currentWaist: number | null;
  waistDelta: number | null;
  currentArm: number | null;
  armDelta: number | null;
  recompositionStatus: "recomposition" | "deficit" | "steady" | "surplus";
  recompositionMessage: string;
  chartData: {
    date: string;
    weight: number;
    movingAvg: number;
    waist?: number | null;
  }[];
}

/**
 * 7 Günlük Hareketli Ortalama ve Recomposition Analiz Motoru
 */
export function analyzeBodyMetrics(metrics: BodyMetric[]): MetricsAnalysis | null {
  if (!metrics || metrics.length === 0) return null;

  // Tarihe göre artan sıralama
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const chartData = sorted.map((item, index) => {
    // Son 7 günün veya önceki tüm kayıtların ortalaması
    const windowStart = Math.max(0, index - 6);
    const windowSlice = sorted.slice(windowStart, index + 1);
    const sum = windowSlice.reduce((acc, curr) => acc + Number(curr.weight_kg), 0);
    const movingAvg = Number((sum / windowSlice.length).toFixed(1));

    return {
      date: item.recorded_at,
      weight: Number(item.weight_kg),
      movingAvg,
      waist: item.waist_cm ? Number(item.waist_cm) : null,
    };
  });

  const latest = sorted[sorted.length - 1];
  const currentWeight = Number(latest.weight_kg);
  const latestAvg = chartData[chartData.length - 1].movingAvg;

  // 7 gün önceki ortalama veya ilk kayıt
  const prevIndex = Math.max(0, chartData.length - 7);
  const prevAvg = chartData[prevIndex].movingAvg;
  const weightDelta7d = Number((latestAvg - prevAvg).toFixed(1));

  // Bel ve Kol değişimleri
  const metricsWithWaist = sorted.filter((m) => m.waist_cm != null);
  let currentWaist: number | null = null;
  let waistDelta: number | null = null;
  if (metricsWithWaist.length > 0) {
    currentWaist = Number(metricsWithWaist[metricsWithWaist.length - 1].waist_cm);
    if (metricsWithWaist.length > 1) {
      const firstWaist = Number(metricsWithWaist[0].waist_cm);
      waistDelta = Number((currentWaist - firstWaist).toFixed(1));
    }
  }

  const metricsWithArm = sorted.filter((m) => m.arm_cm != null);
  let currentArm: number | null = null;
  let armDelta: number | null = null;
  if (metricsWithArm.length > 0) {
    currentArm = Number(metricsWithArm[metricsWithArm.length - 1].arm_cm);
    if (metricsWithArm.length > 1) {
      const firstArm = Number(metricsWithArm[0].arm_cm);
      armDelta = Number((currentArm - firstArm).toFixed(1));
    }
  }

  // Recomposition Değerlendirmesi
  let recompositionStatus: "recomposition" | "deficit" | "steady" | "surplus" = "steady";
  let recompositionMessage = "Kilo ve ölçüm dengesi stabil seyrediyor.";

  if (waistDelta != null && waistDelta < 0 && Math.abs(weightDelta7d) <= 0.8) {
    recompositionStatus = "recomposition";
    recompositionMessage = `🔥 Recomposition Başarısı: Beliniz ${Math.abs(waistDelta)} cm daralırken kilonuz dengeli kalıyor. Yağ yakıp kas inşa ediyorsunuz!`;
  } else if (weightDelta7d < -0.4) {
    recompositionStatus = "deficit";
    recompositionMessage = `📉 Yağ Yakımı (Cut): Haftalık ortalama kilonuz ${Math.abs(weightDelta7d)} kg azaldı. Kas kütlesi için yeterli protein alımına devam edin.`;
  } else if (weightDelta7d > 0.6) {
    recompositionStatus = "surplus";
    recompositionMessage = `📈 Kalori Fazlası: Haftalık ortalama kilonuz ${weightDelta7d} kg arttı. Ağırlık artışları ile orantısını takip edin.`;
  } else {
    recompositionStatus = "steady";
    recompositionMessage = "Vücut ağırlığı sabit, antrenmanlarda progressive overload uygulamaya odaklanın.";
  }

  return {
    currentWeight,
    movingAverage7d: latestAvg,
    weightDelta7d,
    currentWaist,
    waistDelta,
    currentArm,
    armDelta,
    recompositionStatus,
    recompositionMessage,
    chartData,
  };
}
