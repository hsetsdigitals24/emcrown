// Shared presentation: server links and client buttons, with no state or data fetching.
import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
type Props = {
  children: ReactNode;
  href?: string;
  purpose?: "booking" | "secondary" | "primary";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};
const STYLES = {
  booking: "bg-accentOrange text-background hover:bg-accentOrangeHover",
  primary: "bg-primary text-background hover:bg-primaryHover",
  secondary: "border border-border bg-background text-primary hover:bg-surfaceTint",
};
export default function Button({ children, href, purpose = "secondary", type = "button", disabled, onClick, className: extraClass = "" }: Props) {
  const className = `inline-flex min-h-target items-center justify-center rounded-pill px-6 py-3 text-base font-medium transition-opacity hover:opacity-95 ${STYLES[purpose]} ${extraClass}`;
  if (href) return <Link href={href} className={className}>{children}</Link>;
  return <button type={type} disabled={disabled} onClick={onClick} className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}>{children}</button>;
}
