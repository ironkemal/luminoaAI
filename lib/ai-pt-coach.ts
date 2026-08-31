import { BodyMetric, SetLog, WorkoutSession, RoutineExercise, Exercise } from "@/types";

export interface EvaluationInput {
  metrics: BodyMetric[];
  recentSessions: WorkoutSession[];
  routineExercises: (RoutineExercise & { exercise?: Exercise })[];
}

export interface GeneratedRoutinePlan {
  name: string;
  sequence_order: number;
  description: string;
  exercises: {
    name: string;
    target_muscle: string;
    equipment: string;
    target_sets: number;
    target_reps: string;
    target_weight_kg: number;
    notes?: string;
  }[];
}

export interface FullProgramResult {
  program_title: string;
  focus: string;
  rationale: string;
  estimated_duration_weeks: number;
  routines: GeneratedRoutinePlan[];
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
- Hedef: Body Recomposition / Lean Cut (Kas kütlesini koruyup artırarak beli inceltmek ve yağ yakmak).
- Ekipman Envanteri:
  1. Ayarlanabilir Dambıl Çifti (Maksimum 24.5 kg her biri).
  2. Ab-Wheel (Karın Tekeri).
  3. Barfiks Demiri.
  4. Vücut Ağırlığı.
- Beslenme Stratejisi: İştah yüksek olduğu için katı açlık yerine tokluk veren yüksek proteinli, lifli ve hacimli makro dengesi.

Görevin:
Kullanıcının antrenman seanslarını, RPE puanlarını ve vücut ölçümlerini (kilo + bel/kol) inceleyerek hem anlık Progressive Overload kararları hem de sıfırdan komple haftalık/döngüsel antrenman programları üretebilmektir.`;
}

export function buildFullProgramPrompt(
  focus: string,
  input: EvaluationInput,
  notes?: string
): string {
  const { metrics, recentSessions } = input;

  const metricsText = metrics
    .slice(0, 5)
    .map(
      (m) =>
        `- ${m.recorded_at}: Kilo ${m.weight_kg}kg | Bel: ${m.waist_cm || "-"}cm | Kol: ${m.arm_cm || "-"}cm`
    )
    .join("\n");

  return `Kullanıcı için yepyeni bir antrenman fazı (Full Program) oluşturacaksın.

ÖZEL ODAK: ${focus}
KULLANICI NOTU: ${notes || "Yok"}

KULLANICININ MEVCUT VERİLERİ:
${metricsText || "100 kg referans başlangıç"}

EKİPMAN SINIRLARI:
- Dambıllar her biri maksimum 24.5 kg! (Ağırlıkları asla 24.5 kg üzerine yazma).
- Ab-Wheel (Karın tekeri).
- Barfiks Demiri (Pull-up / Chin-up).
- Vücut ağırlığı.

Gereksinim:
En az 3, en fazla 5 seanslık döngüsel bir program oluştur (örn: İtiş A, Çekiş A, Bacak & Core, İtiş B, Çekiş B).
Her seans için 4-5 egzersiz, hedef set sayısı (3-4), hedef tekrar aralığı ve kullanıcıya uygun hedef ağırlık (kg) belirle.

Çıktı SADECE JSON formatında olmalıdır:
\`\`\`json
{
  "program_title": "Program Fazı Başlığı",
  "focus": "${focus}",
  "rationale": "Bu programın kullanıcının mevcut durumuna göre neden yazıldığının bilimsel gerekçesi...",
  "estimated_duration_weeks": 4,
  "routines": [
    {
      "name": "İtiş A (Kuvvet & Göğüs)",
      "sequence_order": 1,
      "description": "Ağır dambıl göğüs presi ve omuz kuvveti",
      "exercises": [
        {
          "name": "Dumbbell Floor Press / Bench Press",
          "target_muscle": "Chest",
          "equipment": "Dumbbell",
          "target_sets": 4,
          "target_reps": "8-10",
          "target_weight_kg": 22.5,
          "notes": "Kontrollü negatif tempo"
        }
      ]
    }
  ]
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
