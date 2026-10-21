// Node scheduled worker: configure approved clinical delivery before scheduling this command.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing TypeScript server loader. */
require("./auth.cjs");
require("../src/features/clinical/runtime.ts").assertClinicalRuntime()
  .then(() => require("../src/features/appointments/worker.ts").deliverAppointments()).then(count => {
  console.log(`Appointment outbox processed ${count} messages.`); process.exit(0);
}).catch(() => { console.error("Appointment delivery unavailable. Check clinical configuration; no patient data was logged."); process.exit(1); });
