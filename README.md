# Emcrown Physician Services

A physician-practice website and private staff workspace. The public site contains
practice information, physician profiles, services, resources, and appointment
booking. Staff use the admin workspace to manage website content, physicians,
schedules, appointments, and access.

The project is in active development. Booking runs as an explicitly labelled demo
until live integrations and launch gates are configured. Placeholder practice
content must be approved before publication. Never use real patient information
in the demo or development tests.

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript in strict mode |
| Styling | Tailwind CSS 4, shared theme tokens, responsive CSS |
| Motion | GSAP / ScrollTrigger and browser animations, with reduced-motion support |
| Database | PostgreSQL, Drizzle ORM, Drizzle Kit, `postgres` driver |
| Website editor | Puck, draft/publish workflow and revision history |
| Validation | Zod |
| Images | Next.js Image, Sharp normalization, private Supabase Storage |
| Authentication | Server sessions, role permissions, password hashing, TOTP MFA, recovery codes |
| Email | Nodemailer with separate staff-authentication and patient-delivery configuration |
| CV extraction | PDF.js, Tesseract.js OCR, Mammoth for DOCX |
| Deployment target | Vercel; PostgreSQL and Storage are configured separately |

See [package.json](package.json) for dependency ranges and commands.
[package-lock.json](package-lock.json) fixes the dependency versions used by
`npm ci`. Use npm for this project; do not introduce another lockfile.

## Requirements

- Node.js **24 or later** is recommended for the installed PDF.js tooling.
- npm, included with Node.js.
- For backend development: an approved development PostgreSQL database with TLS,
  a runtime database account, and a separate migration account.
- For uploads: a Supabase project with private image/CV buckets.
- For staff email: a development SMTP service or sandbox. Patient delivery has
  separate configuration and approval requirements.

Database and external-service credentials are not part of the repository. Obtain
development credentials from the project maintainer through a secure channel.

## Quick start: public site and booking demo

From the project root:

```bash
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. Leave the database/service values blank for the
public fixture-based preview, and keep these gates disabled:

```dotenv
CLINICAL_BOOKING_ENABLED=false
CLINICAL_INTEGRATIONS_APPROVED=false
CLINICAL_SMS_ENABLED=false
CLINICAL_SMS_APPROVED=false
```

This mode does not enable staff login, persistent editing, real uploads, or real
appointment creation. `/book` displays fictional availability and never reserves
a slot. Once a database is configured, public content can use published records.

If `.env` already exists, edit it rather than overwriting it. Restart the dev
server after changing environment variables. Next.js can choose another port if
3000 is occupied; use the displayed URL and keep `AUTH_ORIGIN` aligned with it.

## Configure the database and staff workspace

### 1. Set server configuration

Use [.env.example](.env.example) as the complete variable reference. For staff
login and database migrations, supply:

| Variables | Purpose |
| --- | --- |
| `DATABASE_URL` | TLS connection for the least-privilege application runtime account |
| `DATABASE_MIGRATION_URL` | Separate owner/migration connection used for migration and bootstrap commands |
| `DATABASE_CA_CERT` | Provider CA PEM if system certificate trust is insufficient; literal `\n` escapes are supported |
| `AUTH_ORIGIN` | Exact browser origin, such as `http://localhost:3000`, without a trailing slash |
| `AUTH_SECRET` | Independent random 32-byte secret encoded as 64 lowercase hexadecimal characters |
| `ORGANISATION_NAME` | Workspace organisation name |
| `SUPER_ADMIN_EMAIL` | Initial organisation owner's email |
| `SUPER_ADMIN_INITIAL_PASSWORD` | Temporary bootstrap password; remove after initial seeding |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Staff authentication/invitation mail transport |

When `DATABASE_URL` is set, startup validates the authentication configuration,
including SMTP. Fill the group together rather than supplying a partial setup.
Use verified TLS; do not disable certificate verification to resolve a connection
error. Supabase transaction-pooler connections are supported; prepared statements
are disabled by the application.

Generate each cryptographic secret independently with a password manager or:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the result private. Do not put credentials in source code, issues, screenshots,
or Git. Secret variables must never use the `NEXT_PUBLIC_` prefix.

### 2. Apply migrations and bootstrap

Check that both connection URLs point to the intended **development** database
before running commands that change it:

```bash
npm run db:migrate
npm run auth:seed
```

Migrations run from `drizzle/` using `DATABASE_MIGRATION_URL`. Bootstrap creates the
organisation and initial owner once; rerunning it does not reset existing users'
passwords. Choose a strong bootstrap password, remove it from the environment
after seeding, then follow the required password-change and MFA setup at:

```text
http://localhost:3000/emcrown-admin/login
```

For a newly provisioned database, have the maintainer/database operator create the
non-owner runtime role and apply the project's runtime grants before using that
role as `DATABASE_URL`. Do not run the web application with migration credentials.
The runtime-grants SQL is currently held in the local, ignored
`docs/ADMIN_RUNTIME_GRANTS.sql`; request it from the maintainer if provisioning a
fresh database. Keep migration credentials out of the production web deployment.

### 3. Configure physician-record encryption

For physician/CV and appointment backend development, also set:

- `CLINICAL_ENCRYPTION_KEYS`: JSON mapping key IDs to independent 32-byte hexadecimal keys.
- `CLINICAL_ACTIVE_KEY`: the key ID used for new encrypted records.
- `CLINICAL_TOKEN_KEY`: a separate 32-byte hexadecimal signing/HMAC key.

Keep existing encryption keys when rotating them so stored records remain
readable. Do not regenerate these values casually against an existing database.
Do not rotate the token key without the corresponding migration plan.

## Configure uploads and CV processing

Set all three image Storage variables together:

```dotenv
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
```

Create an **existing private bucket** whose name exactly matches
`SUPABASE_STORAGE_BUCKET`. A missing bucket causes uploads to fail even when all
three variables are present. The service-role key stays on the server. The
application authorizes access to draft images; never make the bucket public to
work around an upload failure.

Physician portraits accept JPEG, PNG, and WebP up to 3 MB; the server normalizes
images to WebP and strips metadata. For CV uploads, configure a **separate private**
bucket using `SUPABASE_CV_BUCKET`, allow `application/octet-stream`, and permit
objects up to 5 MB for encrypted payloads. Do not add anonymous/browser upload or
read policies for these buckets.

Prepare the local PDF/OCR worker and model assets:

```bash
npm run cv:assets
```

The first run may download the English OCR model and verifies its checksum.
Generated files go to `public/ocr/`, which is ignored by Git. Run this command in
any fresh environment that needs CV extraction, including deployment preparation.
CV processing uses same-origin worker/model assets; staff must review extracted
suggestions before saving them.

## Booking and background jobs

Profile booking links preselect a published physician and allow the visitor to
change the selection. The shared date/time picker uses a month calendar and
compact time tiles. Opening hours are Monday–Friday, 9:00 AM–5:00 PM in
`America/New_York`; live times also depend on actual physician schedules,
closures, lead times, existing reservations, visit duration, and buffers.
Appointments must finish by closing time. Stored slot times use UTC.

Live booking remains disabled until the application validates all required
clinical keys, `CLINICAL_BOOKING_ENABLED`, `CLINICAL_INTEGRATIONS_APPROVED`, retention
policy, CAPTCHA configuration, and separate `CLINICAL_SMTP_*` settings. Complete
the provider/privacy/BAA review before enabling services that receive patient
data. Optional SMS additionally requires its own approval flags and Twilio
configuration. Staff authentication SMTP does not substitute for patient mail.

| Command | Operational effect |
| --- | --- |
| `npm run auth:mail` | Processes queued staff reset/invitation email; can send messages |
| `npm run auth:mail-check` | Checks staff SMTP/queue configuration without sending a test message |
| `npm run appointments:deliver` | Processes clinical notification delivery; can send patient messages |

Schedule the staff mail worker every minute in a trusted environment when email
flows are needed. Automatic Vercel Cron is **not configured**, so its minutely
schedule does not block deployment on Hobby. Removing the schedule does not drain
the notification queue: live confirmations/reminders need a worker before launch.
Do not run delivery workers against a shared/live database as a casual test.

### Enable appointment delivery later with an external scheduler

The existing endpoint works with cron-job.org or another scheduler that supports
custom HTTP headers. No scheduler account or job is created by this repository.

1. Complete the approved clinical delivery configuration and least-privilege
   runtime database setup described above.
2. Set a server-only `CRON_SECRET` of at least 32 random characters in the deployed
   environment, then redeploy. Leaving it blank disables HTTP worker access;
   clearing it later disables access without deleting worker code. Existing live
   integration/encryption settings are still required; this secret only grants
   access to the worker endpoint.
3. Create an external job using these settings:

   | Setting | Value |
   | --- | --- |
   | URL | `https://YOUR_DOMAIN/api/internal/appointments` |
   | Method | `POST` (recommended); `GET` is also supported |
   | Schedule | Every minute, all days, including outside office hours |
   | Header name | `Authorization` |
   | Header value | `Bearer YOUR_CRON_SECRET` |
   | Request body | Empty |

   Use the final HTTPS production domain with no redirect. Do not put the secret
   or patient details in query parameters. This is the app's secret, not the
   scheduler provider's API key. See [cron-job.org custom-header support](https://cron-job.org/en/faq/).
4. Verify successful runs in the scheduler. A test run can deliver due messages;
   use an isolated test environment for delivery testing. Set the scheduler's
   timeout high enough for a delivery batch (the route allows up to 120 seconds);
   monitor timeout/errors and queue backlog. Do not enable response-body logging
   unless needed: the endpoint returns only status and aggregate counts.

The endpoint has no request parameters/body. Its response contract is:

| HTTP status | Body | Meaning |
| --- | --- | --- |
| `200` | `{ "ok": true, "processed": 0 }` | Worker completed; count is claimed entries handled, not a guarantee every message was sent |
| `401` | `{ "ok": false }` | Missing/short configured secret, or missing/incorrect bearer header |
| `429` | `{ "ok": false }` | Worker request rate limit exceeded |
| `503` | `{ "ok": false }` | Runtime/database/delivery configuration or worker service unavailable |

Responses are not cached and never include recipients, appointment details, or
manage tokens. Both methods use the same authentication, throttling and runtime
checks, processing at most five queued entries per HTTP call. Failed or ambiguous
deliveries require staff review; a successful HTTP run can include failed entries.

For Vercel Cron on a plan supporting minutely jobs, add the following property
back to `vercel.json` and redeploy; it uses the same `CRON_SECRET` bearer header:

```json
{
  "crons": [
    { "path": "/api/internal/appointments", "schedule": "* * * * *" }
  ]
}
```

Choose one scheduler to avoid unnecessary duplicate invocations. Setting an
environment variable alone does not create a scheduled job. An approved server
can instead schedule `npm run appointments:deliver` without the HTTP endpoint.

## Project structure

```text
src/app/                   Routes, layouts, metadata and styles
src/components/            Shared UI, public page sections and motion wrappers
src/features/auth/         Staff authentication, permissions and workspace
src/features/cms/          Visual editor, publishing and media access
src/features/physicians/   Profiles, private records and CV handling
src/features/booking/      Booking demo, shared calendar and time utilities
src/features/appointments/ Live availability, booking and delivery
src/config/                Editable copy, policies and practice configuration
src/lib/db/                Drizzle database schemas and database helpers
src/types/                 Shared TypeScript contracts
drizzle/                   SQL migrations, migration journal and schema snapshots
scripts/                   Setup, migration, worker and verification entrypoints
tests/                     Frontend, booking, security and integration checks
public/media/              Public brand and approved/demo image assets
```

Useful configuration entrypoints:

- `src/config/business-hours.ts`: confirmed opening hours and demo slot interval.
- `src/config/booking.ts`: demo providers, visit types, durations and lead times.
- `src/config/practice.ts`: practice locations, contact settings and indexing gate.
- `src/config/brand.ts`: shared logo asset and initial loading timeout.
- `src/config/booking-copy.ts`: booking interface copy.

Keep pages/layouts as Server Components. Extract small client components for
interactive controls. Use shared theme tokens, respect reduced motion, and never
send personal/health data to URLs, logs, analytics, or client storage. Before
changing a Next.js convention, read the installed guides under
`node_modules/next/dist/docs/` and follow `AGENTS.md`.

## Development checks

```bash
npm run lint
npm run typecheck
node tests/booking.cjs
node --conditions=react-server tests/booking-calendar.cjs
node --conditions=react-server tests/appointment-scheduler.cjs
npm run test:clinical-unit
```

For auth/CMS/clinical integration tests, use a **dedicated disposable local**
PostgreSQL test environment and `AUTH_TEST_DATABASE_URL`; some suites create/drop
test databases or roles. Never point them at a shared, production, or patient
database. Available commands include `test:auth`, `test:auth-handover`, `test:cms`,
`test:cms-selection`, `test:clinical`, `test:clinical-ocr`, and `test:auth-qr`.
Check each suite's prerequisites before running it.

During active development, run `npm run dev` and inspect terminal/browser errors.
Run a production build only when explicitly requested. Deployment uses the
existing `npm run build` / `npm run start` scripts; generating a README or checking
local changes does not require a production build.

## What belongs in GitHub?

**Yes: `drizzle/` and `scripts/` belong in source control.** Other developers and
migration/deployment jobs need them. Include SQL migrations, `drizzle/meta/` journal
and snapshots, and the maintained scripts. Do not delete or rewrite migrations
that have already been applied; generate a new migration using
`npm run db:generate`, review it, then apply it deliberately.

Other source-controlled files should include application source, tests,
`package.json`, `package-lock.json`, configuration, and the value-free
`.env.example`. Review files for credentials or private data before publication.

Do **not** include real `.env` files, service keys, database dumps, uploaded
private documents, `node_modules/`, `.next/`, coverage, or generated `public/ocr/`
assets. These generated directories/environment files are already ignored where
applicable. A database dump or private upload must never be placed in the source
tree, regardless of ignore rules.

`docs/` is currently ignored, so the local brief, progress notes and operational
guides are not included in a new Git checkout by default. This README documents
the standard setup; request any additional operational material from the
maintainer. The current task does not change `.gitignore`.

Files do not reach GitHub automatically. Staging, committing, and pushing are
separate actions and require the project owner's explicit authorization. Do not
commit, push, change branches, or modify remotes without that authorization.
# emcrown
# emcrown
