import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  experience_level: "junior" | "mid" | "senior" | "staff" | null;
  target_companies: string[] | null;
  credits: number;
  subscription_tier: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
};

export type ProfileUpdateBody = {
  full_name?: string | null;
  experience_level?: "junior" | "mid" | "senior" | "staff" | null;
  target_companies?: string[] | null;
  onboarding_completed?: boolean;
};

const ALLOWED_KEYS = ["full_name", "experience_level", "target_companies", "onboarding_completed"] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
      console.error("Profile fetch error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error("GET /api/users/profile error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Body must be an object" },
        { status: 400 }
      );
    }

    const updates: Partial<ProfileUpdateBody> = {};
    for (const key of ALLOWED_KEYS) {
      if (key in body) {
        const value = (body as Record<string, unknown>)[key];
        if (key === "full_name") {
          if (value === null || value === undefined) {
            updates.full_name = null;
          } else if (typeof value === "string") {
            const trimmed = value.trim().slice(0, 200);
            updates.full_name = trimmed || null;
          } else {
            updates.full_name = null;
          }
        } else if (key === "experience_level") {
          const valid = ["junior", "mid", "senior", "staff"];
          if (value === null || value === undefined) {
            updates.experience_level = null;
          } else if (typeof value === "string" && valid.includes(value)) {
            updates.experience_level = value as ProfileUpdateBody["experience_level"];
          } else {
            return NextResponse.json(
              { error: `Invalid experience_level. Must be one of: ${valid.join(", ")}` },
              { status: 400 }
            );
          }
        } else if (key === "target_companies") {
          updates.target_companies =
            value === null || value === undefined
              ? null
              : Array.isArray(value) && value.every((v) => typeof v === "string")
                ? value
                : null;
        } else if (key === "onboarding_completed") {
          // Write-once: only allow setting to true, never back to false
          if (value === true) {
            updates.onboarding_completed = true;
          }
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error.message);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/users/profile error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
