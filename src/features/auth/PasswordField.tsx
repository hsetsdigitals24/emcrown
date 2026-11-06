"use client";
// Client password field: native typing and autofill, with an independent accessible visibility control.
import { useId, useState } from "react";
import { AUTH_COPY } from "@/config/auth";
type Props = { name: string; label: string; newPassword: boolean; describedBy?: string };
export default function PasswordField({ name, label, newPassword, describedBy }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return <div className="admin-password-field">
    <label htmlFor={id}>{label}</label>
    <div className="admin-password-control">
      <input id={id} name={name} type={visible ? "text" : "password"}
        autoComplete={newPassword ? "new-password" : "current-password"}
        autoCapitalize="none" autoCorrect="off" spellCheck={false}
        required minLength={newPassword ? 12 : 1} maxLength={128} aria-describedby={describedBy} />
      <button type="button" className="admin-password-toggle" aria-controls={id}
        aria-label={visible ? AUTH_COPY.hidePassword : AUTH_COPY.showPassword} aria-pressed={visible}
        onMouseDown={event => event.preventDefault()} onClick={() => setVisible(value => !value)}>
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  </div>;
}
