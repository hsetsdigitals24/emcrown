// Shared presentation: server links and client buttons, with no state or data fetching.
import Link from "next/link";
import "@/components/ui/booking-button.css";
import type { MouseEventHandler, ReactNode } from "react";
type Props = {
  children: ReactNode;
  href?: string;
  purpose?: "booking" | "secondary" | "primary";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  cmsField?: string;
  bookingAction?: boolean;
};
const STYLES = {
  booking: "bg-accentOrange text-background hover:bg-accentOrangeHover",
  primary: "bg-primary text-background hover:bg-primaryHover",
  secondary: "border border-border bg-background text-primary hover:bg-surfaceTint",
};
export default function Button({ children, href, purpose = "secondary", type = "button", disabled, onClick, cmsField, bookingAction = false, className: extraClass = "" }: Props) {
  const isBooking = bookingAction || purpose === "booking";
  const typography = isBooking ? "text-xl font-bold" : "text-base font-medium";
  const className = `inline-flex min-h-target items-center justify-center rounded-pill px-6 py-3 ${typography} transition-opacity ${isBooking ? "booking-action" : "hover:opacity-95"} ${STYLES[purpose]} ${extraClass}`;
  const content = isBooking ? <span className="booking-action-content">{children}</span> : children;
  if (href) return <Link href={href} className={className} data-cms-field={cmsField} data-booking-tone={isBooking ? purpose : undefined}>{content}</Link>;
  return <button type={type} disabled={disabled} onClick={onClick} data-cms-field={cmsField} data-booking-tone={isBooking ? purpose : undefined} className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}>{content}</button>;
}
