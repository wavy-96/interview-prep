import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    const category = searchParams.get("category");

    const supabase = await createClient();

    let query = supabase
      .from("problems")
      .select("id, slug, title, description, difficulty, category, companies, starter_code, hints, created_at");

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      query = query.eq("difficulty", difficulty);
    }

    if (category && category.trim()) {
      query = query.contains("category", [category.trim()]);
    }

    const { data: problems, error } = await query;

    if (error) {
      console.error("Random problem fetch error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch problems" },
        { status: 500 }
      );
    }

    if (!problems || problems.length === 0) {
      return NextResponse.json({ error: "No problems found" }, { status: 404 });
    }

    // Pick random (acceptable for small datasets; optimize with TABLESAMPLE for large)
    const randomIndex = Math.floor(Math.random() * problems.length);
    const problem = problems[randomIndex];

    // Fetch example test cases
    const { data: testCases } = await supabase
      .from("test_cases")
      .select("id, input, expected_output, explanation, order_index")
      .eq("problem_id", problem.id)
      .eq("is_example", true)
      .eq("is_hidden", false)
      .order("order_index", { ascending: true, nullsFirst: false });

    return NextResponse.json({
      ...problem,
      test_cases: testCases ?? [],
    });
  } catch (err) {
    console.error("GET /api/problems/random error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
