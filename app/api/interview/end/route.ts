import { createClient } from "@/lib/supabase/server";
import { chat } from "@/lib/openrouter";
import { buildMentorAnalysisPrompt } from "@/lib/prompts";
import type { AnalysisResult } from "@/types";

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
      return Response.json(
        { error: "Missing required field: sessionId" },
        { status: 400 }
      );
    }

    // Step 1: Fetch session info
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("scenario_type, user_id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    // Step 2: Fetch all messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError || !messages) {
      return Response.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    if (messages.length === 0) {
      return Response.json(
        { error: "No messages found for this session" },
        { status: 400 }
      );
    }

    // Step 3: Build analysis prompt and call OpenRouter
    const analysisPrompt = buildMentorAnalysisPrompt(messages, session.scenario_type);

    const raw = await chat(
      [{ role: "user", content: analysisPrompt }],
      { temperature: 0.3, maxTokens: 1024 }
    );

    // Step 4: Parse JSON analysis result
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: "Failed to parse analysis result" },
        { status: 500 }
      );
    }

    const analysis: AnalysisResult = JSON.parse(jsonMatch[0]);

    // Step 5: Save to session_analysis table
    const { error: analysisError } = await supabase
      .from("session_analysis")
      .insert({
        session_id: sessionId,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        best_moment: analysis.best_moment,
        overall_score: analysis.overall_score,
      });

    if (analysisError) {
      console.error("Failed to save session analysis:", analysisError);
    }

    // Step 6: Save todos to todos table
    if (analysis.todos && analysis.todos.length > 0) {
      const todoRows = analysis.todos.map((content: string) => ({
        user_id: user.id,
        session_id: sessionId,
        content,
        completed: false,
      }));

      const { error: todosError } = await supabase
        .from("todos")
        .insert(todoRows);

      if (todosError) {
        console.error("Failed to save todos:", todosError);
      }
    }

    // Step 7: Mark session as completed
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update session status:", updateError);
    }

    return Response.json({ analysis });
  } catch (error) {
    console.error("Error in /api/interview/end:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
