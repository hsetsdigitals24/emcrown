"use client";
// Client recovery: avoid displaying internal errors or sensitive provider responses.
import Link from "next/link";
import AuthFrame from "@/features/auth/AuthFrame";
import { AUTH_COPY } from "@/config/auth";
export default function AdminError({ retry }: { retry: () => void }) {
  return <AuthFrame><Link href="/emcrown-admin" className="auth-back-link">← {AUTH_COPY.home}</Link><h1>{AUTH_COPY.errorTitle}</h1><p>{AUTH_COPY.genericError}</p>
    <button className="admin-button mt-4" onClick={retry}>{AUTH_COPY.retry}</button></AuthFrame>;
}
