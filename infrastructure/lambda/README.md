# Email worker migration to AWS Lambda

This is a locally prepared migration, not an active AWS deployment. The approved
region is Stockholm (`eu-north-1`). The website, database and saved email queues
stay in place. The first stage still checks for due work every minute; immediate
job triggers and one-time reminder scheduling are future work.

The developer approved Lambda-managed encrypted environment variables on
5 November 2026. Secrets Manager is not used or required by this package/template.

The developer selected one existing Supabase project. Its separate staging schema
has now been created and verified empty, with its restricted login enabled and
the local metadata-only worker readiness check passing; see
[the shared-project staging guide](../staging/PLAN.md). Fictional seed data and
AWS configuration/deployment/activation remain pending. A local HTTP
staging origin does not satisfy the production Lambda HTTPS requirement; prepare
a separate HTTPS staging website origin before supplying AWS worker settings.
Review-mode inbox restrictions cover both account and appointment workers.

## Explanation for reviewers

| Part | Responsibility | Why it is included |
| --- | --- | --- |
| Website | Saves booking and account email jobs in the existing database | An email failure must not lose a booking or reset request. |
| EventBridge Scheduler | Wakes Lambda every minute | Finds immediate messages and future reminders when they become due. |
| Lambda | Runs five account jobs, then five appointment jobs at most | Covers resets/invitations and appointment notifications without hosting another web server. |
| Lambda environment | Supplies the private JSON configuration, encrypted at rest by Lambda | Fits the current settings and avoids a separate credential-storage service charge. |
| Existing SMTP services | Accept email from the worker | Preserves approved transport, templates and calendar attachments. |
| CloudWatch | Records counts/fixed failure stages and infrastructure alarms | Gives operators evidence without logging credentials, recipients or message bodies. |

The database is the source of truth. The worker reuses existing claims and
appointment-version checks to exclude obsolete reminders. One concurrent Lambda
run limits database/SMTP load. AWS failure retries are disabled because a send
may have succeeded before a connection breaks; blind retries can duplicate email.
Unclaimed jobs remain queued for the next minute. Existing account-mail retry and
expiry behavior is retained. Ambiguous appointment sends need staff review.
Exactly-once SMTP delivery is not promised.

Lambda stops starting new jobs with fewer than 90 seconds left in its five-minute
budget and closes database sockets before returning. A fatal error in one queue
does not prevent the other queue from being attempted while time remains. An
incomplete invocation fails visibly. Counts are jobs handled, not guaranteed
inbox deliveries; some provider failures are recorded inside the existing worker.

## Configuration decision and tradeoffs

The function has four configured environment variables:

- `NODE_ENV=production`
- `WORKER_DELIVERY_ENABLED=false` initially
- `EMCROWN_DATABASE_SCOPE=staging` for staging, selected by the DatabaseScope stack parameter
- `WORKER_SETTINGS_JSON`: private JSON with the names in `settings.example.json`

Lambda encrypts environment variables at rest with its default key. There is no
separate Secrets Manager storage/retrieval fee and no secret-store SDK lookup.
People permitted to read Lambda configuration or deploy its code can potentially
access credentials. Restrict those permissions. Do not paste filled settings into
chat, tickets, source files, template metadata, outputs or scheduler events.

Configuration changes are manual: update the private CloudFormation parameter
and wait until the Lambda update succeeds. There is no five-minute secret cache
or automatic credential rotation. Keep the website and worker settings aligned,
especially historical encryption keys, token keys, SMTP credentials and origin.
Do not regenerate encryption keys during migration: existing queue payloads would
become unreadable.

The template uses one `WorkerSettingsJson` parameter with `NoEcho=true`, referenced
only by the Lambda environment. NoEcho masks parameter display; it does not make
values in Outputs/Metadata safe. There are no such references here. When changing
code or flags, retain the existing parameter value through CloudFormation's
Use existing value option. Manage these variables through the stack: editing them
separately in the Lambda console creates drift and a later stack update can
replace those edits.

Lambda's configured environment limit is 4 KB. The bootstrap checks a conservative
serialized size including control fields, and CloudFormation caps the JSON input
length at 3,900 characters. AWS also checks its actual quota. The current local
settings fit the limit (run worker:check-env for the current size), but the final staging/production settings
must fit independently. Do not remove CA validation, shorten keys or drop needed
historical keys to fit; review the design if the configuration grows beyond the
limit. A size check is not proof of database isolation or production readiness.

## Local files and checks

- `bootstrap.cjs`: private handler; validates the operation and environment before
  calling workers. It uses no Secrets Manager client or credential cache.
- `template.json`: disabled CloudFormation setup with exact IAM/log permissions.
- `settings.example.json`: empty field names only; not a deployable configuration.
- `src/features/messaging/`: strict settings, metadata-only database readiness,
  and reusable worker orchestration.

```sh
npm run worker:check-env
npm run worker:package
npm run test:worker
npm run lint
npm run typecheck
```

Only `worker:check-env` loads the local Next environment; it prints counts/size,
never values, and makes no database/provider requests or configuration export.
The package script never loads `.env`, builds the Next.js site or invokes a worker.
It reuses installed lockfile-matched esbuild/JSZip tools without installing packages.
If a future dependency change removes those tools, packaging fails for review.

Ignored outputs under `artifacts/lambda/` are `email-worker.zip`, a standalone
`worker.cjs` smoke-test target and the dependency manifest. The ZIP contains code
and dependency notices only. Tests use fictional settings and in-memory boundaries;
AWS IAM/networking, actual CloudFormation validation and real delivery remain
separate acceptance checks. Runtime archive imports exclude Next request handling.

## Operator steps, in order

1. **Confirm account and access.** Use the practice's AWS account in Stockholm.
   Confirm the existing privacy/provider agreement covers the processing services
   before they receive real booking credentials/data. No authenticated AWS
   connector/CLI is available in this session; these steps use the AWS Console.

2. **Separate test data from the app database.** Local browser/Postman tests
   against the running website use its configured remote database. They do not
   automatically become isolated tests. `AUTH_TEST_DATABASE_URL` is unset locally;
   unit/Lambda tests use fictional in-memory substitutes. Database integration
   tests require their own local PostgreSQL instance and reject remote test URLs.
   Prepare the reviewed emcrown_staging schema with fictional records and the
   emcrown_staging_runtime login in the existing project before a delivery test. Do not test sending against
   the shared queue until its recipients and approval are explicitly reviewed.

3. **Prepare staging settings privately.** Use `settings.example.json` as the
   shape, filling values from the approved staging environment. Every value is a
   string, including ports and flags. Paste the JSON privately into the masked
   CloudFormation parameter when creating/updating the stack; do not save a filled
   version in the repository. Use valid JSON escaping for multiline certificates.
   Use the existing environment's AUTH_SECRET, clinical encryption keys (including
   old versions), active key and token key. Set AUTH_ORIGIN to its final HTTPS
   website origin without a trailing slash. Use a reachable restricted database
   URL with verified TLS. Preserve separate account and clinical SMTP settings.
   Keep CLINICAL_SMS_ENABLED="false"; this migration is email-only. Staging can use
   engineering review=true with approved reviewer addresses. Production requires
   review=false and genuine integration approval=true. Blank optional CA/reviewer
   settings are allowed when not used. Unknown keys are rejected: do not include
   owner/migration URLs, AWS access keys, CAPTCHA settings or CRON_SECRET.

4. **Upload only the code artifact.** Run `npm run worker:package` and retain its
   SHA256. Upload `artifacts/lambda/email-worker.zip` to an approved private S3
   bucket in Stockholm, with public access blocked and default encryption. Use a
   new versioned object key for each release. A changed ArtifactKey tells
   CloudFormation to deploy new code. Never upload a filled settings file.

5. **Create the disabled stack.** Open CloudFormation in Stockholm, create a stack
   and upload `template.json`. Fill Name, ArtifactBucket and ArtifactKey. The
   WorkerSettingsJson parameter defaults to `{}` so a disabled stack can be
   created before credentials are entered. Supply the approved staging JSON
   privately before readiness. Keep DeliveryEnabled=false and
   ScheduleState=DISABLED. AlarmTopicArn optionally accepts an existing approved
   SNS topic. Review the template/change set and acknowledge IAM role creation.
   AWS validates the template and final environment quota during deployment.

6. **Run readiness without sending.** In Lambda's Test screen invoke:

   ```json
   { "operation": "check-configuration" }
   ```

   Expect `{ "ready": true }`. This validates configuration, connects to the
   database and checks role/schema/table privileges through metadata. It does not
   read patient rows, claim email jobs or send messages. `{}` as settings is
   intentionally incomplete and fails this check. Configuration and processing
   failures log only safe fixed stages; do not add raw provider error logging.

7. **Verify controlled staging sends.** Update the stack to DeliveryEnabled=true
   while ScheduleState remains DISABLED, retaining the current private settings.
   Make fictional booking/reset/invitation requests through their normal flows,
   then manually invoke `{ "operation": "deliver-email" }`. Verify intended
   recipient receipt, HTML/plaintext, calendar, latest manage link, cancellation,
   rescheduling and a due reminder. Check delivery/bounce evidence separately.
   A result such as `{ "accounts": 1, "appointments": 2 }` is not proof that all
   messages reached inboxes. Invoking delivery may send every due eligible job.

8. **Cut over after acceptance.** Prepare the production stack/settings with both
   switches off and repeat readiness. Identify all former delivery runners:
   cron-job.org, other appointment HTTP jobs, and any account-mail/CLI schedules.
   Select DatabaseScope=live for production with its live runtime credentials.
   Disable former live runners and wait for in-flight runs to finish. Then enable Lambda delivery
   and its schedule through the stack. A short pause leaves jobs in the queue.
   Keep old job definitions for rollback. Do not clear queues or rotate keys.

9. **Observe delivery and costs.** Check minute executions, Lambda errors/throttles,
   runtime, queue backlog/failed messages, provider delivery events and spending.
   CloudWatch infrastructure alarms cannot alone establish email health. If
   AlarmTopicArn is blank, alarms are visible in CloudWatch but send no operator
   notifications. Logs expire after 14 days. Set a billing budget/alert before
   enabling the production schedule.

## Permissions and resources

The Lambda role can only create streams/write events in its own pre-created log
group. It has no Secrets Manager read, customer-key decrypt, SES API or AWS SMS
permission. SMTP authentication retains its existing separate permissions.
The scheduler role can invoke only this function, and its trust is limited to
this account and schedule group. There is no public worker URL.

CloudFormation creates one Lambda, two IAM roles, one schedule group/schedule,
an async-retry configuration, one log group and Errors/Throttles alarms. It
references an existing private artifact bucket and optional alarm topic. No
Secrets Manager, custom KMS key, API Gateway, EC2 server, VPC or NAT gateway is
created. Database access uses the existing restricted PostgreSQL role.

## Cost explanation

Removing Secrets Manager removes that separate storage/API charge. It does not
guarantee a zero total bill. At one minute, the scheduler makes about 43,200
invocations per 30 days. Published allowances include 14 million Scheduler
invocations, one million Lambda requests and 400,000 Lambda GB-seconds monthly;
account eligibility and other usage still matter. At 256 MB and an assumed
one-second average, this worker would use about 10,800 GB-seconds/month. Actual
runtime, including database/SMTP waits, determines usage.

Lambda-managed default environment encryption adds no separate Secrets Manager
fee. CloudWatch logs/alarms, private S3 storage, email transport (including any
existing Mail Manager features), and database usage remain separate. No paid
customer-managed KMS key or NAT gateway is provisioned. Check region pricing and
billing alerts; don't explain this to reviewers as an entirely free architecture.

Primary references checked during preparation:
- https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
- https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars-encryption.html
- https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html
- https://docs.aws.amazon.com/lambda/latest/dg/with-eventbridge-scheduler.html
- https://aws.amazon.com/eventbridge/pricing/
- https://aws.amazon.com/lambda/pricing/

## Rollback

Disable the EventBridge schedule and set DeliveryEnabled=false through the stack.
Wait for all Lambda invocations to finish before re-enabling the former HTTP
appointment scheduler and account-mail runner. Disabling delivery does not abort
an in-flight invocation. Preserve the database, encryption keys and queued jobs.
Inspect failed/ambiguous sends before resending. No automatic data rollback or
queued-message deletion is part of this migration.
