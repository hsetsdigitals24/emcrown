// Server route: drafts are framed only after the current MFA session is authorized.
import { authorisedRead } from "@/features/auth/authorize";
import { publicPhysicians } from "@/features/physicians/repository";
import "@/app/physicians.css";
import Preview from "@/features/cms/Preview";
import { AUTH_COPY } from "@/config/auth";
import "@/features/cms/styles.css";
import { getDemoSchedule } from "@/features/booking/demo-data";
export default async function CmsPreviewPage() {
  const result = await authorisedRead("content:edit");
  if (!result.actor) return <p>{AUTH_COPY.denied}</p>;
  const [schedule, physicianRecords] = await Promise.all([getDemoSchedule(), publicPhysicians()]);
  return <Preview schedule={schedule} physicianRecords={physicianRecords} />;
}
