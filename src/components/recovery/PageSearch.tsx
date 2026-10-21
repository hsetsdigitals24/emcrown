// Client component: local search filters public navigation without URLs or analytics.
"use client";
import { useState } from "react";
import Link from "next/link";
import type { ContentLink } from "@/types/content";
import { searchPublicPages } from "@/lib/page-search";
import type { RECOVERY_COPY } from "@/config/pages/recovery";
export default function PageSearch({ pages, copy }: { pages: ContentLink[]; copy: typeof RECOVERY_COPY }) {
  const [query, setQuery] = useState("");
  const matches = searchPublicPages(pages, query);
  return <section aria-labelledby="page-search-heading" className="page-search">
    <h2 id="page-search-heading" className="font-heading text-2xl text-primary">{copy.searchHeading}</h2>
    <label htmlFor="page-search-input">{copy.searchLabel}</label>
    <input id="page-search-input" type="search" value={query} placeholder={copy.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
    <div aria-live="polite">{matches.length === 0 && <p>{copy.searchEmpty}</p>}</div>
    <ul>{matches.map((page) => <li key={page.href}><Link className="inline-flex min-h-target items-center text-primary" href={page.href}>{page.label}</Link></li>)}</ul>
  </section>;
}
