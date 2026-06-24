import { createClient } from "@/lib/supabase/server";
import { chat } from "@/lib/openrouter";
import {
  buildInterviewerSystemPrompt,
  buildCompanyResearchPrompt,
} from "@/lib/prompts";
import type { ChatMessage, InterviewConfig, ScenarioType, Difficulty } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId }: { sessionId: string } = body;

    if (!sessionId) {
      return Response.json({ error: "Missing required field: sessionId" }, { status: 400 });
    }

    // Fetch session data from DB
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("scenario_type, company_name, job_title, sector, difficulty, company_research, job_listing_text")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !sessionData) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const scenarioType = sessionData.scenario_type as ScenarioType;
    const companyName = sessionData.company_name as string | undefined;
    const jobTitle = sessionData.job_title as string | undefined;
    const sector = sessionData.sector as string | undefined;
    const difficulty = sessionData.difficulty as Difficulty;
    const jobListingText = sessionData.job_listing_text as string | undefined;

    // Fetch CV data and run company research in parallel — don't block the first message on research
    const [cvResult] = await Promise.all([
      supabase
        .from("cv_data")
        .select("extracted_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    const cvText = cvResult.data?.extracted_text ?? undefined;
    const existingResearch = sessionData.company_research ?? "";

    // Fire company research in background if not cached — first message doesn't need it
    if (companyName && !existingResearch) {
      (async () => {
        try {
          const researchPrompt = buildCompanyResearchPrompt(companyName);
          const research = await chat(
            [{ role: "user", content: researchPrompt }],
            { temperature: 0.3, maxTokens: 400 }
          );
          await supabase
            .from("sessions")
            .update({ company_research: research })
            .eq("id", sessionId)
            .eq("user_id", user.id);
        } catch (e) {
          console.warn("Background company research failed:", e);
        }
      })();
    }

    // Build config — opening small talk doesn't need company research, start immediately
    const config: InterviewConfig = {
      scenarioType,
      companyName,
      jobTitle,
      sector,
      difficulty,
      companyResearch: existingResearch || undefined,
      jobListingText: jobListingText || undefined,
      cvText,
    };

    const systemPrompt = buildInterviewerSystemPrompt(config);

    const firstMessage = await chat(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Starte das Gespräch jetzt. Begrüße den Bewerber herzlich, stelle dich vor und beginne mit natürlichem Small Talk bevor du zur ersten Frage übergehst.",
        },
      ],
      { temperature: 0.88, maxTokens: 150 }
    );

    // Step 3: Save the first AI message to messages table
    const { error: msgError } = await supabase.from("messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: firstMessage,
    });

    if (msgError) {
      console.error("Failed to save first message:", msgError);
    }

    return Response.json({
      message: firstMessage,
      companyResearch,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error in /api/interview/start:", msg);
    return Response.json(
      { error: msg },
      { status: 500 }
    );
  }
}
