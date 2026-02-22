#!/usr/bin/env npx tsx
/**
 * Story 1.4b: Seed 50 problems with test cases and solutions
 * Gated behind NODE_ENV=development or FORCE_SEED=1
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import { createClient } from "@supabase/supabase-js";
import { PROBLEMS } from "./data/problems";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function main() {
  if (process.env.NODE_ENV !== "development" && process.env.FORCE_SEED !== "1") {
    console.warn("Seed is gated to NODE_ENV=development or FORCE_SEED=1. Skipping.");
    process.exit(0);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  async function run() {
    console.log(`Seeding ${PROBLEMS.length} problems...`);

    for (const p of PROBLEMS) {
      const { data: existing } = await supabase
        .from("problems")
        .select("id")
        .eq("slug", p.slug)
        .single();

      let problemId: string;

      if (existing) {
        problemId = existing.id;
        await supabase
          .from("problems")
          .update({
            title: p.title,
            description: p.description,
            difficulty: p.difficulty,
            category: p.category,
            starter_code: p.starterCode,
            has_solution: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", problemId);

        await supabase.from("test_cases").delete().eq("problem_id", problemId);
      } else {
        const { data: inserted, error } = await supabase
          .from("problems")
          .insert({
            slug: p.slug,
            title: p.title,
            description: p.description,
            difficulty: p.difficulty,
            category: p.category,
            starter_code: p.starterCode,
            has_solution: true,
          })
          .select("id")
          .single();

        if (error) {
          console.error(`Failed to insert ${p.slug}:`, error.message);
          continue;
        }
        problemId = inserted.id;
      }

      for (const tc of p.testCases) {
        const { error: tcErr } = await supabase.from("test_cases").insert({
          problem_id: problemId,
          input: tc.input,
          expected_output: tc.expectedOutput,
          is_example: tc.isExample,
          is_hidden: tc.isHidden,
          order_index: tc.orderIndex,
        });
        if (tcErr) {
          console.error(`  Test case error for ${p.slug}:`, tcErr.message);
        }
      }

      const { error: solErr } = await supabase
        .from("problem_solutions")
        .upsert(
          {
            problem_id: problemId,
            solution_code: p.solutionCode,
            explanation: `Solution for ${p.title}`,
          },
          { onConflict: "problem_id" }
        );

      if (solErr) {
        console.error(`  Solution error for ${p.slug}:`, solErr.message);
      }

      console.log(`  ✓ ${p.slug}`);
    }

    const { count } = await supabase
      .from("problems")
      .select("*", { count: "exact", head: true });
    console.log(`\nDone. Total problems: ${count}`);
  }

  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

main();
