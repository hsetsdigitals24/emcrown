// Server component: responsive bounded width without horizontal page overflow.
import type { ReactNode } from "react";
export default function Container({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full min-w-0 max-w-container px-6 md:px-8">{children}</div>;
}
