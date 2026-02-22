import { notFound } from "next/navigation";
import { DesignClient } from "@/app/design/design-client";

export default function DesignPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <DesignClient />;
}
