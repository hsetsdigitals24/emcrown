// Vendor browser entry shares the typed raw-text API of the Node entry.
declare module "mammoth/mammoth.browser" {
  import type mammoth from "mammoth";
  const api: typeof mammoth;
  export default api;
}
