// Shared plain recovery copy for accessible fallback screens and local page search.
export const RECOVERY_COPY = {
  notFound: { eyebrow: "404", headline: "A little off", highlightedPhrase: "the path.", body: "We couldn’t find that page. Find a public page below, return home, or explore appointment options." },
  error: { eyebrow: "Something went wrong", headline: "Let’s try", highlightedPhrase: "again.", body: "This page couldn’t be displayed. You can try again, return home, or explore appointment options." },
  loading: "Loading this page…", retry: "Try again", home: "Return home", booking: "Book appointment",
  searchLabel: "Find a page", searchPlaceholder: "Search public pages", searchButton: "Search", searchEmpty: "No public pages matched. Try another search.", searchHeading: "Public pages",
};
export const PUBLIC_PAGES = [
  { label: "Book appointment [demo]", href: "/book" },
  { label: "About", href: "/about" }, { label: "Services", href: "/services" }, { label: "Physicians", href: "/physicians" },
  { label: "Resources and blog", href: "/resources" }, { label: "Insurance", href: "/insurance" }, { label: "Contact", href: "/contact" },
  { label: "Frequently asked questions", href: "/faq" }, { label: "Legal and accessibility", href: "/legal" },
];
