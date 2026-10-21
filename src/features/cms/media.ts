// Server-only media handling: bounded raster uploads, no SVG or executable file paths.
import "server-only";
import { publishedPhysicianPhoto } from "@/features/physicians/media-access";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { storeImage, deleteImage, loadImage } from "@/lib/storage";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cmsDocuments, cmsMedia, organisations } from "@/lib/db/schema";
import { cmsActor } from "@/features/cms/access";
import { CMS_POLICY } from "@/config/cms/copy";
export function rasterType(data: Buffer) {
  if (data.length < 12 || data.length > CMS_POLICY.maxImageBytes) return null;
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { type: "image/png", ext: "png" };
  if (data[0] === 255 && data[1] === 216 && data[2] === 255) return { type: "image/jpeg", ext: "jpg" };
  if (data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return { type: "image/webp", ext: "webp" };
  return null;
}
export async function uploadMedia(data: Buffer) {
  const format = rasterType(data);
  if (!format) return null;
  return db().transaction(async tx => {
    const actor = await cmsActor(tx);
    if (!actor) return null;
    // Decode and re-encode after authorization; reject corrupt/pixel-bomb inputs and drop EXIF metadata.
    let normalized: Buffer;
    try {
      normalized = await sharp(data, { limitInputPixels: CMS_POLICY.maxImagePixels, failOn: "error" })
        .rotate().resize({ width: CMS_POLICY.imageWidth, height: CMS_POLICY.imageWidth, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 }).timeout({ seconds: 5 }).toBuffer();
    } catch { return null; }
    if (normalized.length > CMS_POLICY.maxImageBytes) return null;
    const id = randomUUID();
    const storagePath = `${actor.organisationId}/${id}.webp`;
    await storeImage(storagePath, normalized);
    try {
      await tx.insert(cmsMedia).values({ id, organisationId: actor.organisationId, contentType: "image/webp", data: "", storagePath });
    } catch (error) {
      await deleteImage(storagePath).catch(() => undefined);
      throw error;
    }
    return `/media/cms/${id}.webp`;
  });
}
export async function readMedia(id: string, path: string) {
  return db().transaction(async tx => {
    const [media] = await tx.select().from(cmsMedia).where(eq(cmsMedia.id, id)).limit(1);
    if (!media) return null;
    const actor = await cmsActor(tx);
    if (actor?.organisationId === media.organisationId) return media;
    const [published] = await tx.select({ id: organisations.id }).from(cmsDocuments)
      .innerJoin(organisations, eq(organisations.id, cmsDocuments.organisationId))
      .where(and(eq(organisations.key, "emcrown"), eq(cmsDocuments.organisationId, media.organisationId),
        sql`exists (select 1 from jsonb_each_text(${cmsDocuments.published}) as f where f.value = ${path})`)).limit(1);
    return published || await publishedPhysicianPhoto(tx, media.organisationId, path) ? media : null;
  });
}

// Resolve bytes only after readMedia has applied the draft/public access checks.
export async function mediaBytes(media: { data: string; storagePath: string | null }) {
  return media.storagePath ? loadImage(media.storagePath) : Buffer.from(media.data, "base64");
}
