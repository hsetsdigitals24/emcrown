// Client component: focus follows step/review changes, with no animated hiding of content.
"use client";
import { useEffect, useRef } from "react";
import type { BookingCopy } from "@/config/booking-copy";
import type { BookingState } from "@/types/booking";
export default function BookingHeading({ state, copy }: { state: Pick<BookingState, "step" | "phase">; copy: BookingCopy }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => { if (mounted.current) ref.current?.focus(); mounted.current = true; }, [state.step, state.phase]);
  const editing = copy.steps[state.step];
  const title = state.phase === "complete" ? copy.completionTitle : state.phase === "review" ? copy.reviewTitle : editing.headline;
  const highlight = state.phase === "complete" ? copy.completionHighlight : state.phase === "review" ? copy.reviewHighlight : editing.highlightedPhrase;
  const body = state.phase === "complete" ? copy.completionBody : state.phase === "review" ? copy.reviewBody : editing.body;
  return <div className="booking-step-heading"><p className="text-eyebrow uppercase tracking-eyebrow text-textSecondary">{copy.stepLabel} {state.step + 1} {copy.ofLabel} {copy.steps.length}</p>
    <h2 ref={ref} tabIndex={-1} id="booking-step-heading" className="font-heading text-heading font-light leading-heading text-primary">{title} <span className="text-highlight">{highlight}</span></h2>
    <p className="text-textSecondary">{body}</p>
  </div>;
}
