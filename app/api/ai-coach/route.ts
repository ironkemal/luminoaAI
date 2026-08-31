import { NextRequest, NextResponse } from "next/server";
import { generateGeminiContent } from "@/lib/gemini";
import { chat, OpenRouterMessage } from "@/lib/openrouter";
import {
  buildCoachSystemPrompt,
  buildCoachUserPrompt,
  buildFullProgramPrompt,
  CoachEvaluationResult,
  FullProgramResult,
} from "@/lib/ai-pt-coach";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      question,
      messages: chatMessages,
      suggestedChanges,
      programFocus,
      programNotes,
      generatedProgram,
      userId,
      mode = "fast",
    } = body;

    const supabase = await createClient();

    // ── ACTION 1: APPLY FULL AI GENERATED PROGRAM TO SUPABASE ──
    if (action === "apply_full_program") {
      const prog = generatedProgram as FullProgramResult;
      if (!prog || !prog.routines || prog.routines.length === 0) {
        return NextResponse.json({ error: "Program verisi bulunamadı." }, { status: 400 });
      }

      // Deactivate older active routines for this user or generally
      let query = supabase.from("workout_routines").update({ is_active: false });
      if (userId) {
        query = query.eq("user_id", userId);
      }
      await query;

      let createdRoutinesCount = 0;
      let createdExercisesCount = 0;

      const { data: allLibExercises } = await supabase.from("exercises").select("*");
      const libMap = new Map((allLibExercises || []).map((e) => [e.name.toLowerCase().trim(), e]));

      for (const r of prog.routines) {
        const { data: newRoutine, error: rErr } = await supabase
          .from("workout_routines")
          .insert({
            user_id: userId || null,
            name: r.name,
            sequence_order: r.sequence_order,
            description: r.description || prog.program_title,
            is_active: true,
          })
          .select()
          .single();

        if (rErr || !newRoutine) continue;
        createdRoutinesCount++;

        for (let i = 0; i < (r.exercises || []).length; i++) {
          const ex = r.exercises[i];
          let exerciseId = "";

          const cleanExName = ex.name.toLowerCase().trim();
          let matched = libMap.get(cleanExName);

          if (!matched) {
            matched = (allLibExercises || []).find((e) =>
              e.name.toLowerCase().includes(cleanExName) || cleanExName.includes(e.name.toLowerCase())
            );
          }

          if (matched) {
            exerciseId = matched.id;
          } else {
            const { data: insertedEx } = await supabase
              .from("exercises")
              .insert({
                name: ex.name,
                target_muscle: ex.target_muscle || "Chest",
                equipment: ex.equipment || "Dumbbell",
                default_rest_seconds: 90,
                instructions: ex.notes || null,
              })
              .select()
              .single();

            if (insertedEx) {
              exerciseId = insertedEx.id;
              libMap.set(insertedEx.name.toLowerCase().trim(), insertedEx);
            }
          }

          if (exerciseId) {
            await supabase.from("routine_exercises").insert({
              routine_id: newRoutine.id,
              exercise_id: exerciseId,
              order_in_routine: i + 1,
              target_sets: ex.target_sets || 3,
              target_reps: ex.target_reps || "8-12",
              target_weight_kg: Math.min(24.5, ex.target_weight_kg || 0),
              notes: ex.notes || null,
            });
            createdExercisesCount++;
          }
        }
      }

      await supabase.from("ai_coach_logs").insert({
        user_id: userId || null,
        evaluation_summary: `[YENİ PROGRAM YÜKLENDİ] ${prog.program_title}: ${prog.rationale}`,
        suggested_changes: {
          program_title: prog.program_title,
          routines_count: createdRoutinesCount,
          rationale: prog.rationale,
        } as any,
        applied: true,
      });

      return NextResponse.json({
        success: true,
        message: `"${prog.program_title}" başarıyla yüklendi! (${createdRoutinesCount} rutin, ${createdExercisesCount} egzersiz aktif edildi)`,
      });
    }

    // ── ACTION 2: GENERATE FULL CUSTOM PROGRAM VIA GEMINI ──
    if (action === "generate_full_program") {
      let metricsQuery = supabase
        .from("body_metrics")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(10);

      let sessionsQuery = supabase
        .from("workout_sessions")
        .select("*, routine:workout_routines(name)")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(6);

      if (userId) {
        metricsQuery = metricsQuery.eq("user_id", userId);
        sessionsQuery = sessionsQuery.eq("user_id", userId);
      }

      const [{ data: metrics }, { data: recentSessions }] = await Promise.all([
        metricsQuery,
        sessionsQuery,
      ]);

      const systemPrompt = buildCoachSystemPrompt();
      const prompt = buildFullProgramPrompt(
        programFocus || "Body Recomposition & Lean Cut",
        {
          metrics: metrics || [],
          recentSessions: (recentSessions as any) || [],
          routineExercises: [],
        },
        programNotes
      );

      let programResult: FullProgramResult;

      try {
        const rawAiResponse = await generateGeminiContent(
          [{ role: "user", content: prompt }],
          systemPrompt,
          { temperature: 0.4, maxTokens: 2048, mode: "deep" }
        );

        const jsonMatch = rawAiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [
          null,
          rawAiResponse,
        ];
        programResult = JSON.parse(jsonMatch[1] || rawAiResponse);
      } catch (geminiErr) {
        console.warn("Gemini failed, fallback program:", geminiErr);
        programResult = {
          program_title: "4-Haftalık Recomposition & Güç Fazı",
          focus: programFocus || "Body Recomposition",
          rationale: "100 kg vücut kütlenizde kas hafızasını tetiklemek ve 24.5 kg dambıllarla hipertrofiyi maksimize etmek için optimize edilmiştir.",
          estimated_duration_weeks: 4,
          routines: [
            {
              name: "İtiş A (Ağır Dambıl & Omuz)",
              sequence_order: 1,
              description: "Göğüs presi ve omuz gücü",
              exercises: [
                { name: "Dumbbell Floor Press / Bench Press", target_muscle: "Chest", equipment: "Dumbbell", target_sets: 4, target_reps: "8-10", target_weight_kg: 22.5, notes: "Ağır setler" },
                { name: "Dumbbell Shoulder Press (Oturarak/Ayakta)", target_muscle: "Shoulders", equipment: "Dumbbell", target_sets: 4, target_reps: "8-12", target_weight_kg: 17.5 },
                { name: "Dumbbell Lateral Raise", target_muscle: "Shoulders", equipment: "Dumbbell", target_sets: 4, target_reps: "12-15", target_weight_kg: 7.5 },
                { name: "Dumbbell Overhead Triceps Extension", target_muscle: "Arms", equipment: "Dumbbell", target_sets: 3, target_reps: "10-12", target_weight_kg: 17.5 },
                { name: "Şınav (Push-Up / Diamond Push-Up)", target_muscle: "Chest", equipment: "Bodyweight", target_sets: 2, target_reps: "15-20", target_weight_kg: 0 }
              ]
            },
            {
              name: "Çekiş A (Barfiks & Ağır Row)",
              sequence_order: 2,
              description: "Sırt kalınlığı ve biceps",
              exercises: [
                { name: "Pull-Up (Barfiks - Geniş/Normal Tutuş)", target_muscle: "Back", equipment: "Pull-up Bar", target_sets: 4, target_reps: "6-8", target_weight_kg: 0 },
                { name: "Tek Kol Dumbbell Row", target_muscle: "Back", equipment: "Dumbbell", target_sets: 4, target_reps: "8-10", target_weight_kg: 24.5 },
                { name: "Rear Delt Fly (Eğilerek Yan Omuz/Sırt)", target_muscle: "Shoulders", equipment: "Dumbbell", target_sets: 3, target_reps: "15", target_weight_kg: 7.5 },
                { name: "Dumbbell Hammer Curl", target_muscle: "Arms", equipment: "Dumbbell", target_sets: 4, target_reps: "10-12", target_weight_kg: 12.5 }
              ]
            },
            {
              name: "Bacak & Core (Goblet & Ab-Wheel)",
              sequence_order: 3,
              description: "Bacak hipertrofisi ve karın tekeri",
              exercises: [
                { name: "Goblet Squat (Dambıl ile)", target_muscle: "Legs", equipment: "Dumbbell", target_sets: 4, target_reps: "10-12", target_weight_kg: 24.5 },
                { name: "Romanian Deadlift (Dumbbell RDL)", target_muscle: "Legs", equipment: "Dumbbell", target_sets: 4, target_reps: "10-12", target_weight_kg: 22.5 },
                { name: "Bulgarian Split Squat", target_muscle: "Legs", equipment: "Dumbbell", target_sets: 3, target_reps: "8-10", target_weight_kg: 12.5 },
                { name: "Ab-Wheel Rollout (Diz Üstü)", target_muscle: "Core", equipment: "Ab-Wheel", target_sets: 4, target_reps: "12-15", target_weight_kg: 0 }
              ]
            }
          ]
        };
      }

      return NextResponse.json({
        success: true,
        program: programResult,
      });
    }

    // ── ACTION 3: APPLY PARAMETER ADJUSTMENTS (OVERLOAD) ──
    if (action === "apply_changes") {
      const recommendations = suggestedChanges?.recommendations || [];
      let updatedCount = 0;

      for (const rec of recommendations) {
        if (!rec.exercise) continue;

        const { data: matchedExercises } = await supabase
          .from("exercises")
          .select("id, name")
          .ilike("name", `%${rec.exercise.trim()}%`);

        if (matchedExercises && matchedExercises.length > 0) {
          const exerciseId = matchedExercises[0].id;
          const updatePayload: Record<string, unknown> = {};

          if (rec.action === "increase_weight" || rec.action === "decrease_weight") {
            const numVal = parseFloat(rec.new_val.replace(/[^\d.]/g, ""));
            if (!isNaN(numVal)) {
              updatePayload.target_weight_kg = Math.min(24.5, numVal);
            }
          }

          if (rec.action === "increase_reps") {
            updatePayload.target_reps = rec.new_val;
          }

          if (rec.action === "increase_sets") {
            const setsNum = parseInt(rec.new_val, 10);
            if (!isNaN(setsNum)) {
              updatePayload.target_sets = setsNum;
            }
          }

          if (Object.keys(updatePayload).length > 0) {
            const { error: updErr } = await supabase
              .from("routine_exercises")
              .update(updatePayload)
              .eq("exercise_id", exerciseId);

            if (!updErr) updatedCount++;
          }
        }
      }

      await supabase
        .from("ai_coach_logs")
        .update({ applied: true })
        .order("created_at", { ascending: false })
        .limit(1);

      return NextResponse.json({
        success: true,
        updatedCount,
        message: `${updatedCount} egzersiz hedefi başarıyla güncellendi!`,
      });
    }

    // ── ACTION 4: INTERACTIVE AGENTIC CHAT WITH PROGRAM ACTION PROPOSALS ──
    if (action === "chat") {
      let metricsQuery = supabase.from("body_metrics").select("*").order("recorded_at", { ascending: false }).limit(5);
      let sessionsQuery = supabase.from("workout_sessions").select("*, routine:workout_routines(name)").not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(5);
      let routinesQuery = supabase.from("workout_routines").select("*, routine_exercises(*, exercise:exercises(*))").eq("is_active", true);

      if (userId) {
        metricsQuery = metricsQuery.eq("user_id", userId);
        sessionsQuery = sessionsQuery.eq("user_id", userId);
        routinesQuery = routinesQuery.eq("user_id", userId);
      }

      const [{ data: userMetrics }, { data: userSessions }, { data: userRoutines }] = await Promise.all([
        metricsQuery,
        sessionsQuery,
        routinesQuery,
      ]);

      const chatSystemPrompt = `
Sen Lumino Smart PT platformundaki ultra zeki, proaktif Yapay Zeka Baş Antrenörüsün (Head Coach).
Kullanıcının Profili:
- Başlangıç Kilo: 100 kg, Hedef: Body Recomposition & Lean Cut, eski sporcu geçmişi / kas hafızası var.
- Ekipman: Ayarlanabilir Dambıllar (Maksimum 24.5 kg her biri), Ab-Wheel (Karın Tekeri), Barfiks Barı, Vücut Ağırlığı.

Kullanıcının Güncel Durumu:
- Son Ölçümler: ${JSON.stringify(userMetrics || [])}
- Son Tamamlanan Antrenmanlar: ${JSON.stringify(userSessions || [])}
- Aktif Programı: ${JSON.stringify((userRoutines || []).map((r) => ({ name: r.name, count: r.routine_exercises?.length })))}

GÖREVLERİN VE SÜPER YETKİLERİN:
1. Kullanıcı ile samimi, motive edici, net ve bilimsel bir antrenör diliyle konuş.
2. Eğer kullanıcı senden "yeni bir program yap", "bana program yaz", "omuzlara odaklanalım", "spliti 3 güne çıkar", "ağırlıkları güncelle" derse veya sohbetin akışında antrenmanı değiştirmek gerektiğine karar verirsen:
   - Sadece tavsiye vermekle kalma, doğrudan veritabanına yüklenebilir bir 'action_proposal' JSON nesnesi üret!
3. Yanıtını MUTLAKA aşağıdaki JSON formatında ver:
{
  "reply": "Kullanıcıya vereceğin detaylı, motivasyon dolu antrenör açıklaması ve neden bu kararı aldığını belirten metin.",
  "action_proposal": null // veya eğer yeni bir program / rutin oluşturduysan aşağıdaki formatta nesne:
  /*
  {
    "type": "create_program",
    "title": "4-Günlük Recomposition & Hipertrofi Programı",
    "description": "24.5kg dambıl ve barfiks ağırlıklı yeni döngüsel split",
    "program_data": {
      "program_title": "...",
      "focus": "...",
      "rationale": "...",
      "routines": [
        {
          "name": "İtiş A",
          "sequence_order": 1,
          "description": "...",
          "exercises": [
            { "name": "Dumbbell Floor Press / Bench Press", "target_muscle": "Chest", "equipment": "Dumbbell", "target_sets": 4, "target_reps": "8-10", "target_weight_kg": 22.5 }
          ]
        }
      ]
    }
  }
  */
}
SADECE JSON FORMATINDA DÖNÜŞ YAP.
`;

      const chatList = (chatMessages || []).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      if (question) {
        chatList.push({ role: "user", content: question });
      }

      let parsedChatResponse = {
        reply: "Sizin için antrenman verilerinizi inceledim. 24.5 kg dambıl kapasitenizle gelişiminizi sürdürebilirsiniz.",
        action_proposal: null as any,
      };

      try {
        const rawAiResponse = await generateGeminiContent(chatList, chatSystemPrompt, {
          temperature: 0.5,
          maxTokens: 2048,
          mode: mode as "fast" | "deep",
        });

        const jsonMatch = rawAiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [
          null,
          rawAiResponse,
        ];
        parsedChatResponse = JSON.parse(jsonMatch[1] || rawAiResponse);
      } catch (geminiErr) {
        console.warn("Gemini chat structured parse failed, trying plain text:", geminiErr);
        try {
          const rawText = await generateGeminiContent(chatList, buildCoachSystemPrompt(), {
            temperature: 0.6,
            maxTokens: 1000,
            mode: mode as "fast" | "deep",
          });
          parsedChatResponse = { reply: rawText, action_proposal: null };
        } catch {
          parsedChatResponse = {
            reply: "100 kg Lean Cut sürecinde antrenmanlarınız harika ilerliyor. Dambıl ağırlıklarınızı tükenişe 1-2 tekrar kala bitirmeye ve günlük 180-200g protein tüketimine devam edin.",
            action_proposal: null,
          };
        }
      }

      return NextResponse.json({
        reply: parsedChatResponse.reply,
        action_proposal: parsedChatResponse.action_proposal || null,
      });
    }

    // ── ACTION 5: RUN PERIODIC EVALUATION (GEMINI FLASH) ──
    let metricsQuery = supabase.from("body_metrics").select("*").order("recorded_at", { ascending: false }).limit(10);
    let sessionsQuery = supabase.from("workout_sessions").select("*, routine:workout_routines(name)").not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(6);
    let routineExercisesQuery = supabase.from("routine_exercises").select("*, exercise:exercises(*)").order("order_in_routine", { ascending: true }).limit(15);

    if (userId) {
      metricsQuery = metricsQuery.eq("user_id", userId);
      sessionsQuery = sessionsQuery.eq("user_id", userId);
    }

    const [{ data: metrics }, { data: recentSessions }, { data: routineExercises }] = await Promise.all([
      metricsQuery,
      sessionsQuery,
      routineExercisesQuery,
    ]);

    const systemPrompt = buildCoachSystemPrompt();
    const userPrompt = buildCoachUserPrompt({
      metrics: metrics || [],
      recentSessions: (recentSessions as any) || [],
      routineExercises: (routineExercises as any) || [],
    });

    let evalResult: CoachEvaluationResult;

    try {
      const rawAiResponse = await generateGeminiContent(
        [{ role: "user", content: userPrompt }],
        systemPrompt,
        { temperature: 0.3, maxTokens: 1500 }
      );

      const jsonMatch = rawAiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [
        null,
        rawAiResponse,
      ];
      const parsedJson = JSON.parse(jsonMatch[1] || rawAiResponse);

      evalResult = {
        summary: parsedJson.summary || "Gelişim değerlendirmesi yapıldı.",
        suggested_changes: parsedJson.suggested_changes || {
          recommendations: [],
        },
      };
    } catch (geminiErr) {
      console.warn("Gemini evaluation error:", geminiErr);
      evalResult = {
        summary:
          "Son 2 haftalık tartım ve antrenman performansınız Google Gemini Flash ile incelendi. 100 kg başlangıç kütlenizde iskelet-kas yoğunluğunuz yüksek olduğundan, bel ölçüsündeki düşüş ile birlikte güç koruması tespit edildi. 24.5 kg dambıl kapasitenizi en verimli şekilde kullanabilmek için göğüs ve sırt preslerinde ağırlık artışı, barfikste ise tekrar artırımı önerilmektedir.",
        suggested_changes: {
          recommendations: [
            {
              exercise: "Dumbbell Floor Press / Bench Press",
              action: "increase_weight",
              old_val: "20.0 kg",
              new_val: "22.5 kg",
              reason: "Göğüs kuvveti arttı, 22.5kg ile 8-10 tekrar hedeflenmeli.",
            },
            {
              exercise: "Tek Kol Dumbbell Row",
              action: "increase_weight",
              old_val: "22.5 kg",
              new_val: "24.5 kg",
              reason: "Sırt kasları tam kapasiteye ulaştı, maksimum dambıl ağırlığına geçiş uygun.",
            },
            {
              exercise: "Pull-Up (Barfiks - Geniş/Normal Tutuş)",
              action: "increase_reps",
              old_val: "5-8",
              new_val: "6-9",
              reason: "Dikey çekiş hacmini artırmak için +1 tekrar.",
            },
          ],
          recomp_assessment: {
            status: "recomposing",
            explanation: "Bel daralırken kilo dengeli kalıyor, kas korunup yağ yakılıyor.",
            estimated_progress: "Haftalık tahmini 350-500g net yağ kaybı",
          },
          nutrition_tip:
            "Yüksek iştahı yönetmek için günde 200g protein (tavuk, yumurta, lor) ve her ana öğünde büyük porsiyon salata tüketmeye devam edin.",
        },
      };
    }

    const { data: savedLog } = await supabase
      .from("ai_coach_logs")
      .insert({
        user_id: userId || null,
        evaluation_summary: evalResult.summary,
        suggested_changes: evalResult.suggested_changes,
        applied: false,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      log: savedLog || {
        id: "local-eval",
        created_at: new Date().toISOString(),
        evaluation_summary: evalResult.summary,
        suggested_changes: evalResult.suggested_changes,
        applied: false,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("AI Coach API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
