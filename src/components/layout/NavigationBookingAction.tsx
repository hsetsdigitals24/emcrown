// Client island: the booking page reserves orange for its final demo confirmation.
"use client";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import type { ContentLink } from "@/types/content";
export default function NavigationBookingAction({ link }: { link: ContentLink }) {
  const pathname = usePathname();
  return <Button purpose={pathname === "/book" ? "primary" : "booking"} href={link.href}>{link.label}</Button>;
}
