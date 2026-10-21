// Shared CMS contracts: only validated editorial strings cross the editor boundary.
export type CmsValues = Record<string, string>;
export type CmsField = { key: string; path: string[]; label: string; group: string; owners: string[]; media: boolean; link: boolean };
export type CmsDefinition = { path: string; label: string; fields: CmsField[]; initial: CmsValues };
export type CmsSnapshot = { path: string; values: CmsValues; version: number; published: boolean };
export type CmsRevision = { id: string; action: string; createdAt: string };
export type CmsResult = { ok: true; snapshot: CmsSnapshot; revisions: CmsRevision[]; context?: Record<string, CmsValues> } | { ok: false; code: "conflict" | "invalid" | "unavailable" | "denied" };
export type CmsOperation = "save" | "publish" | "unpublish" | "restore";
