// Server fallback: keep admin navigation within the private workspace.
import Link from "next/link";
import AuthFrame from "@/features/auth/AuthFrame";
import { AUTH_COPY } from "@/config/auth";
export default function AdminNotFound() {
  return <AuthFrame><h1>{AUTH_COPY.notFound}</h1><Link href="/emcrown-admin">{AUTH_COPY.home}</Link></AuthFrame>;
}
