import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";

export const metadata = {
  title: "Welcome | AI Interview Prep",
  description: "Get set up for your first AI interview",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-paper">
      <OnboardingClient />
    </div>
  );
}
