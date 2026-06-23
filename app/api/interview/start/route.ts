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
    const {
      scenarioType,
      companyName,
      jobTitle,
      sector,
      difficulty,
      sessionId,
    }: {
      scenarioType: ScenarioType;
      companyName?: string;
      jobTitle?: string;
      sector?: string;
      difficulty: Difficulty;
      sessionId: string;
    } = body;

    if (!scenarioType || !difficulty || !sessionId) {
      return Response.json(
        { error: "Missing required fields: scenarioType, difficulty, sessionId" },
        { status: 400 }
      );
    }

    // Step 1: Company research (if companyName is provided)
    let companyResearch = "";
    if (companyName) {
      const researchPrompt = buildCompanyResearchPrompt(companyName);
      companyResearch = await chat(
        [{ role: "user", content: researchPrompt }],
        { temperature: 0.3, maxTokens: 512 }
      );

      // Save company research to session
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ company_research: companyResearch })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update company research:", updateError);
      }
    }

    // Step 2: Build interviewer system prompt + generate first message
    const config: InterviewConfig = {
      scenarioType,
      companyName,
      jobTitle,
      sector,
      difficulty,
      companyResearch: companyResearch || undefined,
    };

    const systemPrompt = buildInterviewerSystemPrompt(config);

    const firstMessage = await chat(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Bitte beginne das Gespräch mit einer kurzen Vorstellung und der ersten Frage.",
        },
      ],
      { temperature: 0.85, maxTokens: 256 }
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
      firstMessage,
      companyResearch,
    });
  } catch (error) {
    console.error("Error in /api/interview/start:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
