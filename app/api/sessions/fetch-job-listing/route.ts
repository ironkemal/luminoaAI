import { createClient } from "@/lib/supabase/server";

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 3000);
}

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

    const { url }: { url: string } = await request.json();

    if (!url) {
      return Response.json({ error: "URL fehlt" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return Response.json({ error: "Ungültige URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return Response.json({ error: "Ungültige URL" }, { status: 400 });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return Response.json(
        { error: "Seite konnte nicht geladen werden" },
        { status: 422 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return Response.json(
        { error: "Kein HTML-Inhalt gefunden" },
        { status: 422 }
      );
    }

    const html = await response.text();
    const text = extractTextFromHtml(html);

    if (text.length < 100) {
      return Response.json(
        { error: "Zu wenig Inhalt gefunden — die Seite blockiert möglicherweise automatische Anfragen" },
        { status: 422 }
      );
    }

    return Response.json({ text });
  } catch (error: unknown) {
    const isTimeout =
      error instanceof Error && error.name === "TimeoutError";
    return Response.json(
      {
        error: isTimeout
          ? "Zeitüberschreitung — Seite antwortet nicht"
          : "Fehler beim Laden der Seite",
      },
      { status: 422 }
    );
  }
}
