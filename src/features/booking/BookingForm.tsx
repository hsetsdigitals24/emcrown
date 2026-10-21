// Client island: four-step demo with memory-only state and no native form submission.
"use client";
import { CLINICAL_COPY } from "@/config/clinical";
import { useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import type { BookingCopy } from "@/config/booking-copy";
import type { BookingSettings, BookingStep, MockSchedule } from "@/types/booking";
import type { PracticeLocation } from "@/types/public";
import useBookingFlow from "@/features/booking/useBookingFlow";
import ChoiceGroup from "@/features/booking/ChoiceGroup";
import ProviderStep from "@/features/booking/ProviderStep";
import DateTimeStep from "@/features/booking/DateTimeStep";
import ContactFields from "@/features/booking/ContactFields";
import BookingSummary from "@/features/booking/BookingSummary";
import BookingHeading from "@/features/booking/BookingHeading";
import BookingProgress from "@/features/booking/BookingProgress";
import BookingActions from "@/features/booking/BookingActions";
import { practiceDate } from "@/features/booking/time";
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export default function BookingForm({ settings, schedule, locations, copy }: {
  settings: BookingSettings; schedule: MockSchedule; locations: PracticeLocation[]; copy: BookingCopy;
}) {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const flow = useBookingFlow(settings, schedule);
  const { state, errors, mock, completion, update } = flow;
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (hydrated && !completion.busy) flow.advance(); }
  return <div className="booking-form-card">{settings.initialProviderId && state.phase === "editing" && <label className="booking-field mb-6">{CLINICAL_COPY.selectedPhysician}
    <select value={state.selection.providerId} disabled={!hydrated || completion.busy} onChange={event => flow.changeSelection({ type: "provider", id: event.target.value })}>
      <option value={settings.firstAvailableId}>{copy.firstAvailable}</option>
      {settings.providers.filter(provider => !state.selection.typeId || settings.types.find(type => type.id === state.selection.typeId)?.providerIds.includes(provider.id)).map(provider => <option key={provider.id} value={provider.id}>{provider.label}</option>)}
    </select></label>}<BookingProgress step={state.step} copy={copy} disabled={!hydrated || completion.busy} complete={state.phase === "complete"} onBack={(step) => update({ type: "step", step })} /><BookingHeading state={state} copy={copy} />
    <form onSubmit={submit} autoComplete="off" noValidate aria-labelledby="booking-step-heading" aria-busy={completion.busy}>
      <fieldset disabled={!hydrated || completion.busy} className="booking-fieldset">
        {Object.keys(errors).length > 0 && <div role="alert" className="booking-error-summary"><p>{copy.errorSummary}</p>{Object.entries(errors).map(([field, error]) => <p key={field}>{copy.errors[error]}</p>)}</div>}
        {completion.failed && <p role="alert" className="booking-error-summary">{copy.confirmationError}</p>}
        <div key={`${state.step}-${state.phase}`} className="booking-step-content">{state.phase === "editing" && state.step === 0 && <ChoiceGroup name="appointmentType" legend={copy.steps[0].label} options={settings.types} value={state.selection.typeId} onChange={(id) => flow.changeSelection({ type: "appointmentType", id, firstAvailableId: settings.types.find(type => type.id === id)?.providerIds.includes(state.selection.providerId) ? state.selection.providerId : settings.firstAvailableId })} />}
        {state.phase === "editing" && state.step === 1 && <ProviderStep settings={settings} selection={state.selection} locations={locations} copy={copy}
          onProvider={(id) => flow.changeSelection({ type: "provider", id })} onLocation={(id) => flow.changeSelection({ type: "location", id })} />}
        {state.phase === "editing" && state.step === 2 && <DateTimeStep settings={settings} schedule={schedule} selection={state.selection} availability={mock.availability} copy={copy}
          onDate={flow.chooseDate} onSlot={(id) => update({ type: "slot", id })} onRetry={() => mock.load(state.selection)} />}
        {state.phase === "editing" && state.step === 3 && <ContactFields settings={settings} details={state.details} errors={errors} copy={copy}
          today={practiceDate(schedule.referenceUtc, settings.timeZone)} onChange={(details) => update({ type: "details", details })} />}
        {state.phase !== "editing" && <BookingSummary state={state} settings={settings} schedule={schedule} locations={locations} copy={copy} contact={state.phase === "review"} />}
        </div><BookingActions state={state} copy={copy} busy={completion.busy || mock.availability.status === "loading"}
          onBack={() => update(state.phase === "review" ? { type: "editing" } : { type: "step", step: (state.step - 1) as BookingStep })}
          onEdit={() => update({ type: "step", step: 0 })} onRestart={flow.reset} />
      </fieldset>
    </form>
  </div>;
}
