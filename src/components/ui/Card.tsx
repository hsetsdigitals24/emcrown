// Server component: two reusable card surfaces with optional decorative hover lift.
import type { ReactNode } from "react";
export default function Card({ children, tone = "soft", interactive = false }: {
  children: ReactNode; tone?: "soft" | "tint"; interactive?: boolean;
}) {
  return <div className={`min-w-0 rounded-card border border-border p-6 shadow-soft ${tone === "soft" ? "bg-sectionAlt" : "bg-surfaceTint"} ${interactive ? "card-hover" : ""}`}>{children}</div>;
}
