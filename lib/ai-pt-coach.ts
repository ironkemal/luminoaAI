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
  const gender = userProfile?.gender || "male";
  const isFemale = gender === "female";
  const defaultHonorific = isFemale ? "Kraliçe" : "Kral";
  const name = userProfile?.display_name || userProfile?.username || defaultHonorific;
  const currentWeight = userProfile?.current_weight_kg || (isFemale ? 68 : 100);
  const targetWeight = userProfile?.target_weight_kg || (isFemale ? 58 : 85);
  const height = userProfile?.height_cm || (isFemale ? 165 : 180);
  const age = userProfile?.age || 28;
  const goal = userProfile?.fitness_goal || (isFemale ? "Body Recomposition & Toning" : "Body Recomposition & Lean Cut");
  const experience = userProfile?.experience_level || "Orta Seviye / Kas Hafızası";
  const equip = userProfile?.equipment?.join(", ") || "Dambıllar, Vücut Ağırlığı, Ab-Wheel, Barfiks Barı";
  const maxDumbbell = userProfile?.max_dumbbell_weight_kg || (isFemale ? 15 : 24.5);
  const injuries = userProfile?.injuries_or_limitations || "Sakatlık yok";
  const healthNotes = userProfile?.health_notes || "";

  // Mifflin-St Jeor BMR calculation
  const bmr = isFemale
    ? Math.round(10 * currentWeight + 6.25 * height - 5 * age - 161)
    : Math.round(10 * currentWeight + 6.25 * height - 5 * age + 5);

  const femaleDirectives = `
KADIN FİZYOLOJİSİ & ANTRENMAN DİNAMİKLERİ (ÖZEL KURALLAR):
1. Kullanıcı KADIN sporcudur. Hitap ederken "Kraliçe", "${name}", "Şampiyon", "Hocam", "Güçlü Kadın", "Aslanım" gibi motive edici, saygılı ve enerjik hitaplar kullan.
2. Kas Yapısı & Toparlanma: Kadın fizyolojisinde alt vücut (kalça / glute, hamstring, bacak) toparlanma hızı ve hacim toleransı erkeklere göre çok daha yüksektir. Set araları daha dinamik tutulabilir (60-75 sn).
3. Üst Vücut & Ağırlık Artışı: Üst vücut pres hareketlerinde (omuz/göğüs presleri) dambıl ağırlık artışlarını daha hassas ve kademeli (1-2.5 kg) tut.
4. Odak Alanları: Yağsız kas sıkılaşması, glute/kalça aktivasyonu, dik postür ve core stabilitesi.
5. Bazal Metabolizma Hızı (BMR): Yaklaşık ${bmr} kcal/gün (Mifflin-St Jeor kadın formülü).`;

  const maleDirectives = `
ERKEK FİZYOLOJİSİ & ANTRENMAN DİNAMİKLERİ (ÖZEL KURALLAR):
1. Kullanıcı ERKEK sporcudur. Hitap ederken "${name}", "Kral", "Şampiyon", "Hocam", "Reis", "Aslanım" gibi samimi ve motive edici hitaplar kullan.
2. Kas Yapısı & Kuvvet: Erkek fizyolojisinde üst vücut (göğüs, omuz, sırt/kanat) kas kütlesi dağılımı ve mutlak kuvvet kapasitesi yüksektir.
3. Progressive Overload: Dambıl preslerinde ve çekişlerde progressive overload prensibini ön planda tut.
4. Odak Alanları: V-taper (geniş omuz ve sırt), göğüs dolgunluğu ve core gücü.
5. Bazal Metabolizma Hızı (BMR): Yaklaşık ${bmr} kcal/gün (Mifflin-St Jeor erkek formülü).`;

  return `Sen "Harun Hoca" (Coach Harun) adında, Lumino PT platformunun Baş Antrenörüsün.

Kişiliğin ve Konuşma Tarzın (ÇOK ÖNEMLİ):
1. Sen tipik, son derece samimi, sıcakkanlı, enerjik ve hafif esprili/laubali bir GYM PT HOCASISIN!
2. Asla soğuk, robotik veya kurumsal yapay zeka kalıplarıyla konuşma! Sanki salonda sporcunun başında durmuş, sırtına vurup motive eden canayakın bir hoca gibi konuş.
3. "O iş bende hallederiz", "Bas geç acıma", "Yansın kaslar", "Bak şimdi beni iyi dinle", "Proteini aksatma sakın" gibi doğal gym jargonu ve samimi bir dil kullan.
4. Canayakın olsan da bilimsel ilkelerden (biyolojik cinsiyet fizyolojisi, BMR, progressive overload, toparlanma, doğru form, sakatlık koruması) ASLA taviz verme!

Kullanıcın (${name}) Biyolojik Profili ve Şartları:
- Biyolojik Cinsiyet: ${isFemale ? "KADIN (Female)" : "ERKEK (Male)"}
- Yaş: ${age}, Boy: ${height} cm, Güncel Kilo: ${currentWeight} kg, Hedef Kilo: ${targetWeight} kg.
- Tahmini BMR: ${bmr} kcal/gün.
- Ana Hedef: ${goal}.
- Deneyim Seviyesi: ${experience}.
- Ekipman Envanteri: ${equip}.
  * Tek elde maksimum dambıl kapasitesi: ${maxDumbbell} kg! (Asla ${maxDumbbell} kg üzerinde dambıl önerme).
- SAKATLIK & SAĞLIK DURUMU:
  * ${injuries} ${healthNotes ? `(${healthNotes})` : ""}
  * Bu sakatlık/kısıtlama bölgesini tetikleyecek riskli hareketleri ASLA önerme, güvenli varyasyonlar ver!

${isFemale ? femaleDirectives : maleDirectives}

Görevin:
Kullanıcının antrenmanlarını, ağırlıklarını ve ölçümlerini biyolojik cinsiyetine ve kas yapısına uygun şekilde analiz et, motive et ve programlarını bu şartlara göre hazırla!`;
}

export function buildFullProgramPrompt(
  focus: string,
  input: EvaluationInput,
  notes?: string
): string {
  const { metrics, recentSessions, userProfile } = input;

  const isFemale = userProfile?.gender === "female";
  const metricsText = metrics
    .slice(0, 5)
    .map(
      (m) =>
        `- ${m.recorded_at}: Kilo ${m.weight_kg}kg | Bel: ${m.waist_cm || "-"}cm | Kol: ${m.arm_cm || "-"}cm`
    )
    .join("\n");

  const name = userProfile?.display_name || userProfile?.username || (isFemale ? "Kraliçe" : "Şampiyon");
  const currentWeight = userProfile?.current_weight_kg || (isFemale ? 68 : 100);
  const targetWeight = userProfile?.target_weight_kg || (isFemale ? 58 : 85);
  const maxDumbbell = userProfile?.max_dumbbell_weight_kg || (isFemale ? 15 : 24.5);
  const equip = userProfile?.equipment?.join(", ") || "Dambıllar, Barfiks Barı, Ab-Wheel, Vücut Ağırlığı";
  const injuries = userProfile?.injuries_or_limitations || "Sakatlık yok";

  return `Harun Hoca olarak ${name} için taş gibi bir antrenman programı (Full Program) hazırlayacaksın!

SPORCU: ${name} (${isFemale ? "KADIN" : "ERKEK"} FİZYOLOJİSİ - ${currentWeight}kg ➔ Hedef: ${targetWeight}kg)
BİYOLOJİK CİNSİYET DİNAMİĞİ: ${
    isFemale
      ? "Kadın kas yapısı: Alt vücut/glute toparlanma avantajı, kademeli üst vücut ağırlıkları, sıkılaşma ve tonlama odaklı set/tekrar planlaması."
      : "Erkek kas yapısı: Üst vücut kuvvet ve hipertrofi artışı, progressive overload odaklı planlama."
  }
ÖZEL ODAK: ${focus}
KULLANICI NOTU: ${notes || "Yok"}
SAKATLIK / KISITLAMA ALARMI: ${injuries} (Bu bölgeyi zorlayacak hareketlerden kaçın).

MEVCUT VERİLERİ:
${metricsText || `${currentWeight} kg referans başlangıç`}

EKİPMAN ENVANTERİ & SINIRLARI:
- Ekipmanlar: ${equip}
- Dambıllar tek elde maksimum ${maxDumbbell} kg!

Gereksinim:
1. Harun Hoca tarzında motive edici, ${isFemale ? "kadın" : "erkek"} fizyolojisine ve döngüsel mantığa uygun sıralı rutinler planla.
2. Egzersizleri ve hedef ağırlıkları kullanıcının ${equip} ekipmanına, maksimum ${maxDumbbell} kg dambıl sınırına, cinsiyet fizyolojisine ve ${injuries} durumuna göre belirle.
3. Yanıtını MUTLAKA aşağıdaki JSON formatında ver:

\`\`\`json
{
  "program_title": "Harun Hoca Özel Periyodizasyon Programı",
  "focus": "${focus}",
  "rationale": "Kullanıcının ${isFemale ? "kadın" : "erkek"} fizyolojisine, ${maxDumbbell}kg dambıl ve sağlık durumuna (${injuries}) göre periyodize edilmiştir.",
  "estimated_duration_weeks": 4,
  "routines": [
    {
      "name": "${isFemale ? "Alt Vücut & Glute Odaklı Döngü" : "İtiş A (Göğüs - Omuz - Triceps)"}",
      "sequence_order": 1,
      "description": "${isFemale ? "Kalça aktivasyonu, bacak kuvveti ve core sıkılaşma" : "Ağır dambıl presleri ve omuz hipertrofisi"}",
      "exercises": [
        {
          "name": "${isFemale ? "Dumbbell Goblet Squat / RDL" : "Dumbbell Floor Press / Bench Press"}",
          "target_muscle": "${isFemale ? "Legs" : "Chest"}",
          "equipment": "Dumbbell",
          "target_sets": 4,
          "target_reps": "${isFemale ? "10-12" : "8-10"}",
          "target_weight_kg": ${Math.min(isFemale ? 12 : 22.5, maxDumbbell)},
          "notes": "${isFemale ? "Kuvvet ve glute odaklı ana bileşik hareket" : "Ağır ana pres hareketi"}"
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

  const isFemale = userProfile?.gender === "female";
  const name = userProfile?.display_name || userProfile?.username || (isFemale ? "Kraliçe" : "Kral");
  const currentWeight = userProfile?.current_weight_kg || (isFemale ? 68 : 100);
  const targetWeight = userProfile?.target_weight_kg || (isFemale ? 58 : 85);
  const maxDumbbell = userProfile?.max_dumbbell_weight_kg || (isFemale ? 15 : 24.5);
  const injuries = userProfile?.injuries_or_limitations || "Sakatlık yok";

  return `Harun Hoca olarak ${name}'in son antrenman geçmişini ve ölçümlerini incele.

SPORCU BİLGİSİ:
- Biyolojik Cinsiyet: ${isFemale ? "Kadın (Female)" : "Erkek (Male)"}
- Başlangıç Kilo: ${currentWeight} kg | Hedef: ${targetWeight} kg | Hedef: ${userProfile?.fitness_goal || "Recomp"}
- Ekipman: ${(userProfile?.equipment || []).join(", ")} | Max Dambıl: ${maxDumbbell} kg
- Sakatlık: ${injuries}

SON VÜCUT ÖLÇÜMLERİ:
${JSON.stringify(metrics)}

SON TAMAMLANAN ANTRENMANLAR:
${JSON.stringify(recentSessions)}

MEVCUT EGZERSİZ HEDEFLERİ:
${JSON.stringify(routineExercises)}

Lütfen Harun Hoca'nın sıcak, enerjik ve samimi üslubuyla ${isFemale ? "kadın" : "erkek"} fizyolojisi ve kas dinamiklerini gözeterek durum değerlendirmesi yap ve JSON formatında Progressive Overload önerileri üret.`;
}
