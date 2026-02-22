import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    const category = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from("problems")
      .select("id, slug, title, description, difficulty, category, companies, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      query = query.eq("difficulty", difficulty);
    }

    if (category && category.trim()) {
      query = query.contains("category", [category.trim()]);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Problems fetch error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch problems" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      problems: data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (err) {
    console.error("GET /api/problems error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
