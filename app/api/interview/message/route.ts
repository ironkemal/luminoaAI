import { createClient } from "@/lib/supabase/server";
import { chatStream } from "@/lib/openrouter";
import { buildInterviewerSystemPrompt } from "@/lib/prompts";
import type { ChatMessage, InterviewConfig } from "@/types";

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
    const { sessionId, message }: { sessionId: string; message: string } = body;

    if (!sessionId || !message) {
      return Response.json(
        { error: "Missing required fields: sessionId, message" },
        { status: 400 }
      );
    }

    const userMessage = message;

    // Step 1: Fetch session info from Supabase
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(
        "scenario_type, difficulty, company_name, job_title, sector, company_research"
      )
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    // Step 2: Fetch user's CV data
    const { data: cvData } = await supabase
      .from("cv_data")
      .select("extracted_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const cvText = cvData?.extracted_text ?? undefined;

    // Step 3: Build system prompt
    const config: InterviewConfig = {
      scenarioType: session.scenario_type,
      difficulty: session.difficulty,
      companyName: session.company_name ?? undefined,
      jobTitle: session.job_title ?? undefined,
      sector: session.sector ?? undefined,
      companyResearch: session.company_research ?? undefined,
      cvText,
    };

    const systemPrompt = buildInterviewerSystemPrompt(config);

    // Step 4: Fetch conversation history from DB
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    // Step 5: Build OpenRouter messages array
    const openRouterMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(history ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: userMessage },
    ];

    // Step 6: Save user message to Supabase
    await supabase.from("messages").insert({
      session_id: sessionId,
      role: "user",
      content: userMessage,
    });

    // Step 7: Stream AI response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    let fullAiResponse = "";

    // Run streaming in background, collect full response for saving
    chatStream(
      openRouterMessages,
      async (chunk) => {
        fullAiResponse += chunk;
        try {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
        } catch {
          // Writer may have been closed
        }
      },
      { temperature: 0.85 }
    )
      .then(async () => {
        // Save AI response to Supabase after streaming completes
        await supabase.from("messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: fullAiResponse,
        });
        try {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          await writer.close();
        } catch {
          // Writer may already be closed
        }
      })
      .catch(async (err) => {
        console.error("Streaming error:", err);
        try {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Streaming failed" })}\n\n`
            )
          );
          await writer.close();
        } catch {
          // Ignore
        }
      });

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in /api/interview/message:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
