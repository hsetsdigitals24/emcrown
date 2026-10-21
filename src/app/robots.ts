// Server metadata route: draft pages stay out of crawlers until launch configuration changes.
import type { MetadataRoute } from "next";
import { SITE_SETTINGS } from "@/config/practice";
export default function robots(): MetadataRoute.Robots {
  return { rules: SITE_SETTINGS.indexingEnabled ? { userAgent: "*", allow: "/", disallow: "/emcrown-admin" } : { userAgent: "*", disallow: "/" }, sitemap: `${SITE_SETTINGS.url}/sitemap.xml` };
}
