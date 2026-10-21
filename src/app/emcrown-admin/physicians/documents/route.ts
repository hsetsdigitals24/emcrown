// Server CV upload: bounded multipart payload, authenticated permission checks, encrypted persistence.
import { z } from "zod";
import { clinicalHttp } from "@/features/clinical/http";
import { boundedBody } from "@/features/cms/http";
import { saveDocument } from "@/features/physicians/documents";
import { CLINICAL_POLICY } from "@/config/clinical";
export async function POST(request: Request) {
  return clinicalHttp(request, async () => {
    const bytes = await boundedBody(request, CLINICAL_POLICY.cvBytes + CLINICAL_POLICY.cvCharacters * 4 + 10000);
    const parsed = new Request(request.url, { method: "POST", headers: request.headers, body: new Uint8Array(bytes) });
    const data = await parsed.formData(); const file = data.get("file");
    const id = z.uuid().safeParse(data.get("physicianId")); const text = z.string().max(CLINICAL_POLICY.cvCharacters).safeParse(data.get("text"));
    if (!(file instanceof File) || !id.success || !text.success) return { ok: false, code: "invalid" };
    return saveDocument(id.data, file, text.data);
  });
}
