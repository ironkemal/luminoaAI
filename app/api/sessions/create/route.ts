import { createClient } from "@/lib/supabase/server";
import type { ScenarioType, Difficulty } from "@/types";

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
      jobListingUrl,
      jobListingText,
    }: {
      scenarioType: ScenarioType;
      companyName?: string;
      jobTitle?: string;
      sector?: string;
      difficulty: Difficulty;
      jobListingUrl?: string;
      jobListingText?: string;
    } = body;

    if (!scenarioType || !difficulty) {
      return Response.json(
        { error: "Missing required fields: scenarioType, difficulty" },
        { status: 400 }
      );
    }

    // Create new session in Supabase
    const { data: session, error: createError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        scenario_type: scenarioType,
        company_name: companyName ?? null,
        job_title: jobTitle ?? null,
        sector: sector ?? null,
        difficulty,
        status: "active",
        job_listing_url: jobListingUrl ?? null,
        job_listing_text: jobListingText ?? null,
      })
      .select("id")
      .single();

    if (createError || !session) {
      console.error("Failed to create session:", createError);
      return Response.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return Response.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error in /api/sessions/create:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
