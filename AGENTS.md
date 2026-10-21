<!-- BEGIN:agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.




# AGENTS.md: Rules for building the Emcrown Physician Services website

This file is read first in every session. Follow it unless the developer (Oladoye) tells you otherwise in the current conversation. If a rule here and a request conflict, say so before acting.

## 1. Source of truth

* The project brief is at `docs/PROJECT_BRIEF.md`. It holds the requirements, client decisions, open questions and design language.
* Do not read the whole brief every time. Search it for the section you need (for example the booking requirements or the colour tokens) and read only that part.
* Order of authority: the developer's latest message, then Sections 8 and 14 of the brief, then the rest of the brief, then this file for working style.
* Anything labelled OPEN, DEFAULT or PROPOSAL in the brief must be built as configuration, not hard coded.
* Never invent facts: physician names, credentials, licence numbers, statistics, insurance plans, testimonials, addresses or phone numbers. Use clearly marked placeholders such as `[PHYSICIAN NAME]`.
* This is a new site. Never copy content from emcrownclinicalresearch.com beyond the facts listed in Section 9 of the brief.

## 2. Git and working agreement

* Work on the `main` branch. Do not create, switch or delete branches unless asked.
* Never push. Do not run `git push`, open pull requests or touch any remote. Nothing goes to GitHub until the developer says so.
* Do not commit unless asked. If asked, make small local commits with a clear message.
* Never run destructive commands (force operations, hard resets, deleting folders) without asking first.
* Do not install, upgrade or remove packages without asking. When a new package is needed, tell me which one, why, and what it costs in size and risk.
* Next.js and Tailwind are already installed at their latest versions. Do not downgrade or change major versions. Read the installed versions from `package.json` and follow that version's conventions, not older habits from memory. If you are unsure about a file convention or API (for example a feature that was renamed in newer releases), check the installed version's documentation before writing code.

## 3. Be economical with files

* Do not open files just to look around. Use search (`rg`) to find the exact file or line first, then open only that file or range.
* Do not read files again if their content is already in the conversation.
* Do not scan the whole repository, `node_modules` or build output unless a specific problem requires it.
* Read `docs/PROGRESS.md` once at the start of a session, and update it at the end of each task (see Section 12).

## 4. Stop and tell me

When you find a mistake, risk or design problem, tell me. Do not quietly work around it and do not quietly fix it in a way that changes the design.

Stop and report before continuing when:
* A requested approach is insecure, fragile, or will cause trouble later.
* The brief and the request conflict, or the brief is unclear on something that matters.
* A decision is hard to undo (data model, routing, auth, hosting, third party services).
* You notice an existing architectural flaw, even if it is outside the current task.

Use this format:

```
PROBLEM: what is wrong, in one or two plain sentences.
WHY IT MATTERS: the real consequence (security, cost, rework, patient data, speed).
OPTIONS: two or three ways forward, with the trade off of each.
RECOMMENDATION: the option you would take and why.
```

For big or irreversible issues, wait for my decision. For small ones, proceed with your recommendation and list it in the task report.

## 5. Server first components

Everything is a Server Component by default. Only move code to the client when it needs interactivity.

Rules:
* Pages, layouts and data fetching stay on the server. Never put `"use client"` on a page or layout.
* A component needs `"use client"` only if it uses state, effects, event handlers, browser APIs, or a client only library (animation, maps, form widgets).
* When one part of a section needs interactivity, extract only that part into its own small file with `"use client"`, then import it into the parent Server Component. Do not turn the whole section into a client component.
* Pass the client part plain serialisable props (strings, numbers, simple objects). Fetch data on the server and hand it down.
* Server Components can be passed as `children` into client components. Use this to keep content on the server.
* Never import server only code (database, secrets, server actions that read secrets) into a client file.
* Load heavy client libraries (animation, carousels) with dynamic imports so they stay out of the first load. Keep them out of the booking page bundle where practical.

Example of the pattern:

```tsx
// Server Component: renders content, no directive.
import FaqAccordion from "@/components/sections/FaqAccordion"; // client part
import { getFaqs } from "@/lib/content";

export default async function FaqSection() {
  const faqs = await getFaqs(); // runs on the server
  return (
    <section>
      <h2>Answers to common questions</h2>
      <FaqAccordion items={faqs} />
    </section>
  );
}
```

## 6. Modular and readable code

* One component or one job per file. Components stay under about 150 lines, functions under about 40. When a file grows past that, split it.
* Reuse before creating. Check for an existing component, hook or helper first (search, do not browse). Do not duplicate logic.
* Keep syntax simple: clear names, early returns, small functions, no clever one liners, no deep nesting, no abbreviations.
* Names: PascalCase for components, camelCase for functions and variables, UPPER_CASE for constants. Folder names are lowercase single words.
* Start each file with a short comment saying what it is for and whether it runs on the server or client.
* Comment the reason (why), not the obvious (what). Add a short comment above any non obvious logic, especially time zones, slot availability and security checks.
* Keep route files in `src/app` thin. They compose sections and call data functions. Logic lives elsewhere.
* Use the `@/` import alias. No long relative paths.

Suggested layout (create only what is needed):
* `src/app`: routes, layouts, metadata, loading and error files.
* `src/components/ui`: small generic parts (Button, Card, Badge, Input).
* `src/components/sections`: page sections built from CMS content (Hero, ServicesGrid, FaqSection).
* `src/components/motion`: animation wrappers (Reveal, Stagger, Parallax). Client components.
* `src/features/booking`: booking components, actions, validation schemas and types together.
* `src/lib`: helpers, content fetching, security helpers, environment checks.
* `src/config`: site settings (locations, hours, appointment types, reminder times).
* `src/types`: shared types and data contracts.

## 7. TypeScript

* Keep `strict` on. Do not use `any`. Use `unknown` and narrow it, or write a proper type.
* Define data contracts (CMS content, booking, appointment, message log) once in `src/types` and reuse them.
* Validate every external input at the boundary with a schema (for example Zod): forms, server actions, route handlers, webhooks, environment variables, CMS responses.
* Infer types from schemas where possible so there is one source of truth.

## 8. Security (treat this as a medical booking system)

Booking data is protected health information. The reason for visit is free text and may contain health details. Treat it as sensitive everywhere.

Data and logging:
* Never put personal or health data in URLs, logs, error messages, analytics events, email subjects or reminder messages.
* Reminders contain only the practice name, date, time, location and the manage link.
* Collect the minimum data. Never ask for diagnoses, insurance IDs or medical history.
* Before adding any third party service that could see booking data, stop and ask. It must be able to sign a BAA.

Server and actions:
* Treat every Server Action and route handler as a public endpoint. Check authentication, check permission, validate input, and apply rate limiting each time.
* Put server only modules behind the server only package (`import "server-only"`) so they can never reach the browser.
* Secrets live in environment variables only. Never commit them, never log them, never prefix a secret with `NEXT_PUBLIC`. Keep a `.env.example` with names and no values. Validate environment variables when the app starts.
* Use parameterised queries or the ORM. Never build queries from strings.
* Return generic errors to the browser. Log details on the server without personal data.

Browser and headers:
* Set security headers: Content Security Policy (with nonces, no unsafe inline scripts), Strict Transport Security, X Content Type Options set to nosniff, a strict Referrer Policy, a minimal Permissions Policy, and frame ancestors set to none.
* Cookies are `httpOnly`, `secure` and `sameSite`.
* Do not use `dangerouslySetInnerHTML` unless the content is sanitised first. Sanitise all CMS rich text before rendering.
* No `eval`, no inline event strings, no loading scripts from unknown hosts.

Booking specific:
* Cancel and reschedule links use signed, expiring tokens (HMAC), compared in constant time, with the cutoff window from configuration.
* Booking and contact forms need rate limiting and invisible CAPTCHA.
* Prevent double booking in the database itself (a uniqueness rule or transaction), not only in application code.
* Store times in UTC and show them in the practice time zone (America/New_York unless told otherwise).
* Admin area needs role based access, MFA, and an audit log of who viewed appointment data.
* No advertising pixels or session replay on booking or form pages. Analytics must never receive health details.

Dependencies:
* Prefer few, well maintained packages. Commit the lockfile. Run the dependency audit when packages change and report findings.

## 9. Design system and content

* Follow Sections 15 to 17 of the brief for colours, type, spacing, components and motion.
* Define colours, fonts, radii and spacing once as Tailwind theme tokens. Use tokens, never raw hex values in components.
* Light theme. Blue is primary. Orange is for Book appointment buttons only, with at most one orange button in view.
* Single column vertical flow. No horizontal scrolling at any width.
* No hard coded page copy inside components. Text arrives through props or CMS content. Every section is a block with named text slots (eyebrow, headline, highlighted phrase, subheading, body, button label, button link), so staff can edit any text.
* Fax numbers show as plain text, never as a call link.
* Mark placeholders clearly, for example `[PHOTO PLACEHOLDER: consultation room]`.

## 10. Accessibility, performance and SEO

* Use semantic HTML, one `h1` per page, labelled form fields, visible focus, 44px tap targets, and 4.5:1 text contrast (WCAG 2.1 AA).
* Respect reduced motion: turn off parallax, pinning and scaling and keep simple fades. Animate only transform and opacity. Content must show even if JavaScript fails.
* Use `next/image` and `next/font`. Set image sizes to avoid layout shift. The home headline, not an image or video, should be the largest paint.
* Every route sets its own metadata (title, description, canonical, Open Graph). Add structured data (JSON LD) as the brief requires, plus a sitemap and robots file.
* Never block the Book appointment button with an animation or overlay.
* Target Lighthouse mobile 90 or higher. Check after adding each large section, not at the end.

## 11. Other things a complete site needs

* Add `loading`, `error` and `not found` files for routes so failures are friendly and recover to booking and home.
* Keep a documented setup in `README.md` and a `.env.example`. Keep both current.
* Keep lint, formatting and type checking configured and passing.
* Write tests for the logic that must not fail: slot availability, double booking, time zones, token signing and expiry, and input validation.
* Make anything the client may change (locations, appointment types, durations, reminder times, hours, policy text, contact details) configuration or CMS content.
* Keep the data model ready for a future patient portal, telehealth and online payments, without building them now.
* Do not build deferred items (waitlist, CSV export) unless asked.
* Do not create Google accounts or request Google access. That is still unresolved in the brief.

## 12. Finishing a task

Before saying a task is done:
* Run the smallest check that proves the change (type check, lint, or a focused test). Run lint and type check before reporting a whole feature complete. Developer override (13 October 2026): after implementing changes, run `npm run dev` and inspect errors. Do not run a production build unless explicitly requested while the project is in continuous development.
* Update `docs/PROGRESS.md` briefly: what is done, what is next, and decisions made. Keep it short.
* Reply with a short report: what changed, files touched, checks run, any problems raised under Section 4, and the suggested next step.
* Keep replies brief and plain. Ask at most one question at a time, and only when it blocks the work.
<!-- END:agent-rules -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
