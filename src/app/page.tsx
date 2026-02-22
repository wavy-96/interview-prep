import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HomeContent } from "./home-content";

export const metadata = {
  title: "AI Interview Prep | Practice with AI, Land Your Dream Role",
  description:
    "Practice technical interviews with an AI voice interviewer. Real-time code observation, execution, and post-interview evaluation. Start free with 3 credits.",
  openGraph: {
    title: "AI Interview Prep | Practice with AI, Land Your Dream Role",
    description:
      "Practice technical interviews with an AI voice interviewer. Real-time code observation and evaluation.",
    type: "website",
  },
  keywords: ["interview prep", "AI interview", "coding practice", "technical interview"],
  robots: "index, follow",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <HomeContent />;
}
