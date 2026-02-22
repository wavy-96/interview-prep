import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: problem, error: problemError } = await supabase
      .from("problems")
      .select("*")
      .eq("slug", slug)
      .single();

    if (problemError || !problem) {
      if (problemError?.code === "PGRST116") {
        return NextResponse.json({ error: "Problem not found" }, { status: 404 });
      }
      console.error("Problem fetch error:", problemError?.message);
      return NextResponse.json(
        { error: "Failed to fetch problem" },
        { status: 500 }
      );
    }

    // RLS automatically filters to is_example=TRUE AND is_hidden=FALSE
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
    console.error("GET /api/problems/[slug] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
