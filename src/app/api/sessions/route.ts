import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(
        `
        id,
        problem_id,
        status,
        difficulty_override,
        language,
        started_at,
        ended_at,
        duration_seconds,
        hints_used,
        test_cases_passed,
        test_cases_total,
        credits_consumed,
        created_at,
        problems (id, slug, title, difficulty, category),
        evaluations (overall_score, hiring_recommendation)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Sessions fetch error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    const { count } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      sessions: sessions ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (err) {
    console.error("GET /api/sessions error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
