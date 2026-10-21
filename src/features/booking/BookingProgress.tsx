// Client presentation: animated step milestones; completed steps support safe back navigation.
"use client";
import type { BookingCopy } from "@/config/booking-copy";
import type { BookingStep } from "@/types/booking";
export default function BookingProgress({ step, copy, onBack, disabled = false, complete = false }: {
  step: number; copy: BookingCopy; onBack: (step: BookingStep) => void; disabled?: boolean; complete?: boolean;
}) {
  return <ol className="booking-progress" aria-label={copy.progressLabel}>{copy.steps.map((item, index) => {
    const current = !complete && step === index;
    const done = complete || index < step;
    return <li key={item.label} aria-current={current ? "step" : undefined} data-current={current} data-complete={done}>
      <span className="booking-progress-track" aria-hidden="true"><span /></span>
      <button type="button" className="booking-progress-step" disabled={disabled || complete || !done}
        onClick={() => onBack(index as BookingStep)}>
        <span className="booking-progress-number"><span className="sr-only">{index + 1} </span>
          {done ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path pathLength="1" d="m5 12 4 4L19 6" /></svg> : <span aria-hidden="true">{index + 1}</span>}
        </span><span className="booking-progress-label">{item.label}</span>
      </button>
    </li>;
  })}</ol>;
}
