import { BodyMetric, SetLog, WorkoutSession, RoutineExercise, Exercise, AppUser } from "@/types";

export interface EvaluationInput {
  metrics: BodyMetric[];
  recentSessions: WorkoutSession[];
  routineExercises: (RoutineExercise & { exercise?: Exercise })[];
  userProfile?: AppUser | null;
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

export function buildCoachSystemPrompt(userProfile?: AppUser | null): string {
  const name = userProfile?.display_name || userProfile?.username || "Sporcu";
  const currentWeight = userProfile?.current_weight_kg || 100;
  const targetWeight = userProfile?.target_weight_kg || 85;
  const height = userProfile?.height_cm || 180;
  const age = userProfile?.age || 28;
  const goal = userProfile?.fitness_goal || "Body Recomposition & Lean Cut";
  const experience = userProfile?.experience_level || "Orta Seviye / Kas Hafızası";
  const equip = userProfile?.equipment?.join(", ") || "Dambıllar, Vücut Ağırlığı, Ab-Wheel, Barfiks Barı";
  const maxDumbbell = userProfile?.max_dumbbell_weight_kg || 24.5;
  const injuries = userProfile?.injuries_or_limitations || "Sakatlık yok";
  const healthNotes = userProfile?.health_notes || "";

  return `Sen "Antrenör Harun" (Coach Harun) adında, Lumino Smart PT platformunun kıdemli, kanıta dayalı (evidence-based), samimi ve son derece motive edici Baş Antrenörüsün.

Kullanıcın (${name}) Profili ve Şartları:
- Yaş: ${age}, Boy: ${height} cm, Güncel Kilo: ${currentWeight} kg, Hedef Kilo: ${targetWeight} kg.
- Ana Hedef: ${goal}.
- Deneyim Seviyesi: ${experience}.
- Ekipman Envanteri: ${equip}.
  * Kullanıcının tek elde maksimum dambıl kapasitesi: ${maxDumbbell} kg'dır. Asla ${maxDumbbell} kg üzerinde dambıl ağırlığı yazma!
- SAKATLIK & SAĞLIK DURUMU (ÖNEMLİ HAFIZA):
  * ${injuries} ${healthNotes ? `(${healthNotes})` : ""}
  * Bu sakatlık/kısıtlama bölgesini tetikleyecek riskli hareketleri ASLA önerme veya güvenli alternatiflerini ver.
- Beslenme Stratejisi: Tokluk veren yüksek proteinli, lifli ve dengeli beslenme.

Davranış Kuralların:
1. Kendini her zaman samimi bir şekilde "Antrenörün Harun" olarak tanıt.
2. Kullanıcının sakatlık ve ekipman kısıtlamalarını her zaman en üst öncelik olarak hatırla.
3. Kullanıcı yeni program veya revizyon istediğinde onun kişisel ekipmanına, ${maxDumbbell} kg dambıl sınırına ve sakatlık durumuna tam uygun öneriler sun.`;
}

export function buildFullProgramPrompt(
  focus: string,
  input: EvaluationInput,
  notes?: string
): string {
  const { metrics, recentSessions, userProfile } = input;

  const metricsText = metrics
    .slice(0, 5)
    .map(
      (m) =>
        `- ${m.recorded_at}: Kilo ${m.weight_kg}kg | Bel: ${m.waist_cm || "-"}cm | Kol: ${m.arm_cm || "-"}cm`
    )
    .join("\n");

  const currentWeight = userProfile?.current_weight_kg || 100;
  const targetWeight = userProfile?.target_weight_kg || 85;
  const maxDumbbell = userProfile?.max_dumbbell_weight_kg || 24.5;
  const equip = userProfile?.equipment?.join(", ") || "Dambıllar, Barfiks Barı, Ab-Wheel, Vücut Ağırlığı";
  const injuries = userProfile?.injuries_or_limitations || "Sakatlık yok";

  return `Antrenör Harun olarak kullanıcı için yepyeni bir antrenman fazı (Full Program) oluşturacaksın.

KULLANICI: ${userProfile?.display_name || "Sporcu"} (${currentWeight}kg ➔ Hedef: ${targetWeight}kg)
ÖZEL ODAK: ${focus}
KULLANICI NOTU: ${notes || "Yok"}
SAKATLIK & KISITLAMA ALARMI: ${injuries} (Bu bölgeyi zorlayacak hareketlerden kaçın).

KULLANICININ MEVCUT VERİLERİ:
${metricsText || `${currentWeight} kg referans başlangıç`}

EKİPMAN ENVANTERİ & SINIRLARI:
- Kullanıcının Ekipmanları: ${equip}
- Dambıllar tek elde maksimum ${maxDumbbell} kg! (Ağırlıkları asla ${maxDumbbell} kg üzerine yazma).

Gereksinim:
1. Döngüsel mantıkta (örneğin İtiş, Çekiş, Bacak/Core gibi) sıralı rutinler planla.
2. Egzersizleri ve hedef ağırlıkları kullanıcının ${equip} ekipmanına, maksimum ${maxDumbbell} kg dambıl kapasitesine ve ${injuries} sakatlık durumuna göre progressive overload ilkeleriyle belirle.
3. Yanıtını MUTLAKA aşağıdaki JSON formatında ver:

\`\`\`json
{
  "program_title": "Antrenör Harun - 4-Haftalık Kişiselleştirilmiş Program",
  "focus": "${focus}",
  "rationale": "Kullanıcının ${maxDumbbell}kg dambıl, mevcut ekipman ve sağlık durumuna (${injuries}) göre periyodize edilmiştir.",
  "estimated_duration_weeks": 4,
  "routines": [
    {
      "name": "İtiş A (Göğüs - Omuz - Triceps)",
      "sequence_order": 1,
      "description": "Ağır dambıl presleri ve omuz hipertrofisi",
      "exercises": [
        {
          "name": "Dumbbell Floor Press / Bench Press",
          "target_muscle": "Chest",
          "equipment": "Dumbbell",
          "target_sets": 4,
          "target_reps": "8-10",
          "target_weight_kg": ${Math.min(22.5, maxDumbbell)},
          "notes": "Ağır ana pres hareketi"
        }
      ]
    }
  ]
}
\`\`\`
SADECE JSON FORMATINDA DÖNÜŞ YAP.`;
}

export function buildCoachUserPrompt(input: EvaluationInput): string {
  const { metrics, recentSessions, routineExercises, userProfile } = input;

  const currentWeight = userProfile?.current_weight_kg || 100;
  const targetWeight = userProfile?.target_weight_kg || 85;
  const maxDumbbell = userProfile?.max_dumbbell_weight_kg || 24.5;
  const injuries = userProfile?.injuries_or_limitations || "Sakatlık yok";

  return `Antrenör Harun olarak kullanıcının son antrenman geçmişini ve ölçümlerini incele.

KULLANICI PROFİLİ:
- Başlangıç Kilo: ${currentWeight} kg | Hedef: ${targetWeight} kg | Hedef: ${userProfile?.fitness_goal || "Recomp"}
- Ekipman: ${(userProfile?.equipment || []).join(", ")} | Max Dambıl: ${maxDumbbell} kg
- Sakatlık & Kısıtlama: ${injuries}

SON VÜCUT ÖLÇÜMLERİ:
${JSON.stringify(metrics)}

SON TAMAMLANAN ANTRENMANLAR:
${JSON.stringify(recentSessions)}

MEVCUT EGZERSİZ HEDEFLERİ:
${JSON.stringify(routineExercises)}

Lütfen kullanıcının sakatlık ve ekipman sınırlarını gözeterek durum değerlendirmesi yap ve JSON formatında Progressive Overload önerileri üret.`;
}
