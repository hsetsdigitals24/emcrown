// Server component: isolate pathname-dependent color for partial prerender fallbacks.
import { Suspense } from "react";
import Button from "@/components/ui/Button";
import NavigationBookingAction from "@/components/layout/NavigationBookingAction";
import type { ContentLink } from "@/types/content";
export default function NavigationBookingLink({ link }: { link: ContentLink }) {
  return <Suspense fallback={<Button purpose="primary" href={link.href}>{link.label}</Button>}><NavigationBookingAction link={link} /></Suspense>;
}
