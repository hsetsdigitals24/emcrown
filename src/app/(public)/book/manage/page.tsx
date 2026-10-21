// Server page: bearer management UI exposes no patient data in server HTML or metadata.
import type { Metadata } from "next";
import ManageBooking from "@/features/appointments/ManageBooking";
import "@/features/clinical/styles.css";
export const metadata: Metadata = { title: "Manage appointment | Emcrown", description: "Manage an existing appointment securely.", robots: { index: false, follow: false }, alternates: { canonical: "/book/manage" }, openGraph: { title: "Manage appointment", description: "Secure appointment management." } };
export default function Page() { return <ManageBooking />; }
