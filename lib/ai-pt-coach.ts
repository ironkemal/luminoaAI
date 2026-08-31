import { BodyMetric, SetLog, WorkoutSession, RoutineExercise, Exercise } from "@/types";

export interface EvaluationInput {
  metrics: BodyMetric[];
  recentSessions: WorkoutSession[];
  routineExercises: (RoutineExercise & { exercise?: Exercise })[];
}

export interface CoachEvaluationResult {
  summary: string;
  suggested_changes: {
    recommendations: {
      exercise: string;
      routine?: string;
      exercise_id?: string;
      action: "increase_weight" | "increase_reps" | "increase_sets" | "decrease_weight" | "form_focus";
      old_val?: string;
      new_val: string;
      reason?: string;
    }[];
    recomp_assessment?: {
      status: "recomposing" | "cutting" | "plateau" | "bulking";
      explanation: string;
      estimated_progress: string;
    };
    nutrition_tip?: string;
  };
}

export function buildCoachSystemPrompt(): string {
  return `Sen "Lumino Smart PT" adı verilen, son derece bilgili, gerçekçi, kanıta dayalı (evidence-based) ve motive edici bir Kişisel Antrenör (Personal Trainer) ve Yapay Zeka Karar Motorusun.

Kullanıcı Profili ve Şartlar:
- Boy: 1.80m, Güncel Kilo: ~100 kg.
- Geçmiş: Eski sporcu altyapısı var, son 1.5 yılda sedanter çalışma ile +20kg (dirty bulk etkisi) almış. Yüksek iskelet-kas kütlesi ve kas hafızası avantajı mevcut.
- Hedef: Body Recomposition / Lean Cut (Saf açlık veya aşırı kardiyo yerine, kas kütlesini koruyup artırarak beli inceltmek ve yağ yakmak).
- Ekipman Envanteri:
  1. Ayarlanabilir Dambıl Çifti (Maksimum 24.5 kg her biri).
  2. Ab-Wheel (Karın Tekeri).
  3. Barfiks Demiri.
  4. Vücut Ağırlığı.
- Beslenme Stratejisi: İştah yüksek olduğu için katı açlık yerine tokluk veren yüksek proteinli, lifli ve hacimli makro dengesi.

Görevin:
Kullanıcının son antrenman seanslarını, RPE puanlarını, set tamamlama oranlarını ve vücut ölçümlerini (kilo + bel/kol mezura) inceleyerek:
1. Gelişimi değerlendir (Kas kazanımı, yağ yakımı, toparlanma).
2. Veritabanındaki egzersiz hedefleri için uygulanabilir net Progressive Overload kararları üret (Ağırlık artırımı, tekrar artırımı vb.).
3. Her zaman geçerli bir JSON bloğu üret.

Çıktı Formatı (JSON):
\`\`\`json
{
  "summary": "Analiz ve değerlendirme metni (Türkçe)...",
  "suggested_changes": {
    "recommendations": [
      {
        "exercise": "Egzersiz Adı",
        "action": "increase_weight" | "increase_reps" | "increase_sets" | "decrease_weight" | "form_focus",
        "old_val": "Mevcut değer",
        "new_val": "Yeni önerilen hedef değer",
        "reason": "Gerekçe"
      }
    ],
    "recomp_assessment": {
      "status": "recomposing",
      "explanation": "Bel daralırken kilo dengede kalıyor...",
      "estimated_progress": "Haftalık net yağ kaybı ~400g"
    },
    "nutrition_tip": "Öğünlerde tokluk ve protein desteği için pratik tavsiye"
  }
}
\`\`\``;
}

export function buildCoachUserPrompt(input: EvaluationInput): string {
  const { metrics, recentSessions, routineExercises } = input;

  const metricsText = metrics
    .slice(0, 7)
    .map(
      (m) =>
        `- ${m.recorded_at}: Kilo ${m.weight_kg}kg | Bel: ${m.waist_cm || "-"}cm | Kol: ${m.arm_cm || "-"}cm | Göğüs: ${m.chest_cm || "-"}cm`
    )
    .join("\n");

  const sessionsText = recentSessions
    .slice(0, 5)
    .map(
      (s) =>
        `- ${s.completed_at || s.started_at}: Rutin ID: ${s.routine_id} | RPE: ${s.rpe_score || "-"}/10 | Not: ${s.notes || "-"}`
    )
    .join("\n");

  const exercisesText = routineExercises
    .slice(0, 10)
    .map(
      (re) =>
        `- ${re.exercise?.name || "Egzersiz"}: Hedef ${re.target_weight_kg}kg × ${re.target_sets} set × ${re.target_reps} tekrar`
    )
    .join("\n");

  return `Lütfen aşağıdaki güncel fitness verilerini inceleyip bir sonraki antrenman döngüsü için AI PT Kararını ve JSON yapılandırmasını üret:

1. SON VÜCUT TARTIM VE MEZURA ÖLÇÜMLERİ:
${metricsText || "Henüz yeterli ölçüm yok."}

2. SON TAMAMLANAN ANTRENMAN SEANSLARI:
${sessionsText || "Henüz seans tamamlanmadı."}

3. MEVCUT HEDEF AĞIRLIK VE TEKRARLAR:
${exercisesText}

Şimdi JSON formatında değerlendirmeni yap:`;
}
