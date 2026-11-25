// Server component: global light theme and self-hosted proposed typography.

import { HOME_METADATA } from "@/config/home-content";
import { BRAND } from "@/config/brand";
import { SITE_SETTINGS } from "@/config/practice";
import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "@/app/globals.css";
import "@/app/physicians.css";
import "@/app/booking-picker.css";

const heading = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });
const body = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  icons: { icon: BRAND.logo, apple: BRAND.logo },
  title: "Emcrown Physician Services",
  description: HOME_METADATA.description,
  robots: { index: SITE_SETTINGS.indexingEnabled, follow: SITE_SETTINGS.indexingEnabled },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${heading.variable} ${body.variable}`}><body>{children}</body></html>;
}
