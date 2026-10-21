"use client";
// Client island: reauthenticated invitation/transfer controls and memory-only recovery codes.
import { useActionState, useState, useSyncExternalStore } from "react";
import { inviteAction, codesAction, transferAction } from "@/features/auth/security-actions";
import { HANDOVER_COPY as copy } from "@/config/handover";
import Toast from "@/features/auth/Toast";
import type { SecurityState } from "@/types/auth";
const actions = { invite: inviteAction, codes: codesAction, transfer: transferAction };
const labels = { invite: copy.invite, codes: copy.generate, transfer: copy.transfer };
const subscribe = () => () => {};
export default function SecurityForm({ mode, candidates = [] }: {
  mode: keyof typeof actions; candidates?: { id: string; email: string }[];
}) {
  const [state, action, pending] = useActionState<SecurityState, FormData>(actions[mode], { message: "" });
  const [saved, setSaved] = useState(false);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return <form action={action} className="admin-form" onSubmit={() => setSaved(false)}>
    <fieldset className="admin-fields" disabled={!ready || pending}>
      {mode === "invite" && <label>{copy.email}<input type="email" name="email" autoComplete="email" maxLength={254} required /></label>}
      {mode === "transfer" && <><label>{copy.target}<select name="targetId" defaultValue="" required>
        <option value="" disabled>{copy.choose}</option>{candidates.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.email}</option>)}
      </select></label><label className="admin-checkbox"><input type="checkbox" name="confirm" required />{copy.confirm}</label></>}
      <label>{copy.code}<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required /></label>
      <button type="submit" className={`admin-button ${mode === "transfer" ? "admin-danger" : ""}`} disabled={mode === "transfer" && !candidates.length}>
        {pending ? copy.pending : labels[mode]}</button>
    </fieldset>
    <Toast key={state.message + String(pending)} message={state.message} success={state.success} />
    {state.codes && !saved && <section className="admin-recovery-codes" aria-label={copy.recoveryTitle}>
      <p>{copy.generated}</p><ul>{state.codes.map(code => <li key={code}><code>{code}</code></li>)}</ul>
      <button type="button" className="admin-button" onClick={() => setSaved(true)}>{copy.acknowledge}</button>
    </section>}
  </form>;
}
