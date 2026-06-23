import { createClient } from "@/lib/supabase/server";
import { chat } from "@/lib/openrouter";
import { buildMentorProgressPrompt } from "@/lib/prompts";
import type { ScenarioType } from "@/types";

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
      completedTodoIds,
      pendingTodoIds,
    }: {
      completedTodoIds: string[];
      pendingTodoIds: string[];
    } = body;

    if (!Array.isArray(completedTodoIds) || !Array.isArray(pendingTodoIds)) {
      return Response.json(
        { error: "Missing required fields: completedTodoIds, pendingTodoIds" },
        { status: 400 }
      );
    }

    const allIds = [...completedTodoIds, ...pendingTodoIds];

    // Fetch todo contents from Supabase
    const { data: todos, error: todosError } = await supabase
      .from("todos")
      .select("id, content, session_id")
      .in("id", allIds.length > 0 ? allIds : ["__none__"])
      .eq("user_id", user.id);

    if (todosError) {
      console.error("Failed to fetch todos:", todosError);
      return Response.json(
        { error: "Failed to fetch todos" },
        { status: 500 }
      );
    }

    const todoMap = new Map((todos ?? []).map((t) => [t.id, t]));

    const completedContents = completedTodoIds
      .map((id) => todoMap.get(id)?.content)
      .filter((c): c is string => Boolean(c));

    const pendingContents = pendingTodoIds
      .map((id) => todoMap.get(id)?.content)
      .filter((c): c is string => Boolean(c));

    // Determine scenario type from first todo's session (best-effort)
    let scenarioType: ScenarioType = "job_interview";
    const firstTodo = todos?.[0];
    if (firstTodo?.session_id) {
      const { data: session } = await supabase
        .from("sessions")
        .select("scenario_type")
        .eq("id", firstTodo.session_id)
        .eq("user_id", user.id)
        .single();

      if (session?.scenario_type) {
        scenarioType = session.scenario_type as ScenarioType;
      }
    }

    // Build progress prompt and call OpenRouter
    const progressPrompt = buildMentorProgressPrompt(
      completedContents,
      pendingContents,
      scenarioType
    );

    const feedback = await chat(
      [{ role: "user", content: progressPrompt }],
      { temperature: 0.7, maxTokens: 400 }
    );

    return Response.json({ feedback });
  } catch (error) {
    console.error("Error in /api/mentor/progress:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
