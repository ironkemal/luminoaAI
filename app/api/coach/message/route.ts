import { createClient } from "@/lib/supabase/server";
import { chatStream } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";

function buildCoachSystemPrompt(context: {
  userName: string | null;
  userEmail: string | null;
  totalSessions: number;
  recentAnalyses: Array<{
    scenario: string;
    companyName: string | null;
    score: number;
    strengths: string[];
    weaknesses: string[];
    bestMoment: string;
  }>;
  pendingTodos: string[];
  completedTodosCount: number;
}): string {
  // Use first name only, fall back to email prefix
  const name = context.userName
    ? context.userName.split(" ")[0]
    : context.userEmail
    ? context.userEmail.split("@")[0]
    : "Kandidat";

  const analysisLines =
    context.recentAnalyses.length > 0
      ? context.recentAnalyses
          .slice(0, 3)
          .map((a, i) => {
            // Distinguish: user name vs company name
            const companyPart = a.companyName && a.companyName.toLowerCase() !== name.toLowerCase()
              ? ` bei "${a.companyName}"`
              : "";
            return (
              `Gespräch ${i + 1}: ${a.scenario}${companyPart} — Score ${a.score}/100\n` +
              `  ✓ Stärken: ${a.strengths.slice(0, 3).join(" | ")}\n` +
              `  ✗ Schwächen: ${a.weaknesses.slice(0, 3).join(" | ")}\n` +
              `  ★ Bester Moment: ${a.bestMoment}`
            );
          })
          .join("\n\n")
      : "Noch keine abgeschlossenen Gespräche vorhanden.";

  const todoLines =
    context.pendingTodos.length > 0
      ? `Offene Trainingsaufgaben (${context.pendingTodos.length} offen, ${context.completedTodosCount} erledigt):\n` +
        context.pendingTodos.slice(0, 6).map((t) => `  • ${t}`).join("\n")
      : `Alle Aufgaben erledigt (${context.completedTodosCount} abgehakt). Neue Herausforderung empfehlen!`;

  return `Du bist Max, der persönliche KI-Karriere-Coach von ${name} auf der Lumino AI Plattform.

WICHTIG — PERSONENUNTERSCHIED:
- Du sprichst MIT ${name} (dem/der Nutzer/in der App)
- In den Gesprächsanalysen steht "bei [Firmenname]" — das ist die Übungs-Firma, NICHT der Nutzer
- Verwechsle niemals den Nutzernamen mit dem Firmennamen

DEINE ROLLE:
- Persönlicher Mentor: kennst ${name}s Stärken, Schwächen und Fortschritt genau
- Antwortest auf Deutsch, klar und direkt (max 200 Wörter pro Antwort)
- Keine Markdown-Überschriften (###) — fließender Text mit Absätzen
- Stellst am Ende immer eine konkrete Folgefrage oder gibst eine klare Übungsaufgabe
- Ehrlich über Schwächen, motivierend über Stärken

TRAININGSSTAND VON ${name.toUpperCase()}:
Abgeschlossene Übungsgespräche: ${context.totalSessions}

${analysisLines}

${todoLines}

WIE DU HILFST:
- Beziehe dich konkret auf Schwächen aus den Analysen oben
- Erkläre Techniken kurz und praxisnah (STAR, Harvard-Methode, Stressfragen-Strategie)
- Priorisiere die wichtigsten offenen Aufgaben
- Empfiehl das nächste sinnvolle Übungsszenario
- Wenn noch keine Gespräche: ermutige zum ersten Schritt mit konkretem Tipp

Antworte immer auf Deutsch. Kein Markdown. Kurz, präzise, handlungsorientiert.`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, history = [] }: { message: string; history: Array<{ role: string; content: string }> } = body;

    if (!message?.trim()) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    // Parallel fetches for speed
    const [profileRes, sessionsRes, todosRes] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase.from("sessions")
        .select("id, scenario_type, company_name, status")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("todos")
        .select("content, completed")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const sessions = sessionsRes.data ?? [];
    const sessionIds = sessions.map((s) => s.id);

    const { data: analyses } = sessionIds.length > 0
      ? await supabase
          .from("session_analysis")
          .select("session_id, overall_score, strengths, weaknesses, best_moment")
          .in("session_id", sessionIds)
      : { data: [] };

    const scenarioLabels: Record<string, string> = {
      job_interview: "Vorstellungsgespräch",
      salary_negotiation: "Gehaltsverhandlung",
      performance_review: "Mitarbeitergespräch",
    };

    const recentAnalyses = (analyses ?? []).map((a) => {
      const session = sessions.find((s) => s.id === a.session_id);
      return {
        scenario: scenarioLabels[session?.scenario_type ?? ""] ?? "Gespräch",
        companyName: session?.company_name ?? null,
        score: a.overall_score,
        strengths: a.strengths ?? [],
        weaknesses: a.weaknesses ?? [],
        bestMoment: a.best_moment ?? "",
      };
    });

    const todos = todosRes.data ?? [];
    const pendingTodos = todos.filter((t) => !t.completed).map((t) => t.content);
    const completedTodosCount = todos.filter((t) => t.completed).length;

    const systemPrompt = buildCoachSystemPrompt({
      userName: profileRes.data?.full_name ?? null,
      userEmail: user.email ?? null,
      totalSessions: sessions.length,
      recentAnalyses,
      pendingTodos,
      completedTodosCount,
    });

    const openRouterMessages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-12).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // Stream response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    chatStream(openRouterMessages, async (chunk) => {
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
      } catch {}
    }, { temperature: 0.72, maxTokens: 700 })  // 700 tokens — enough for full answers
      .then(async () => {
        try {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          await writer.close();
        } catch {}
      })
      .catch(async (err) => {
        try {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
          await writer.close();
        } catch {}
      });

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
