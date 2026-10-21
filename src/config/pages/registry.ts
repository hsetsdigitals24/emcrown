// Shared page registry for discovery, always gated by approval and indexing settings.
import { ABOUT_PAGE, SERVICES_PAGE, PHYSICIANS_PAGE, RESOURCES_PAGE, INSURANCE_PAGE } from "@/config/pages/information";
import { CONTACT_PAGE, FAQ_PAGE } from "@/config/pages/contact";
import { LEGAL_PAGE, LEGAL_ENTRIES } from "@/config/pages/legal";
export const INFORMATION_PAGES = [ABOUT_PAGE, SERVICES_PAGE, PHYSICIANS_PAGE, RESOURCES_PAGE, INSURANCE_PAGE, CONTACT_PAGE, FAQ_PAGE, LEGAL_PAGE, ...LEGAL_ENTRIES];
