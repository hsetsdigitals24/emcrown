// Server component: semantic appointment list enhanced by the homepage's deferred scroll effects.
import type { ReactNode } from "react";

export default function BookingCardsMotion({ children }: { children: ReactNode }) {
  return <ol className="booking-steps">{children}</ol>;
}
