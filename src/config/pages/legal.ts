// Shared legal templates: section slots only, no invented legal or privacy commitments.
import { mockPage, mockSection } from "@/config/pages/helpers";
export const LEGAL_PAGE = mockPage("/legal", "Legal and accessibility", "Information you can", "refer to.", "Policies are awaiting practice approval. These are preview templates, not final policies.");
export const LEGAL_ENTRIES = [
  { ...mockPage("/privacy", "Privacy policy", "Your privacy", "matters.", "[PRIVACY POLICY: awaiting approved legal text and privacy contact]"), slug: "privacy",
    sections: [mockSection("privacy-information", "Information we collect", "[APPROVED PRIVACY TEXT]"), mockSection("privacy-use", "How information is used", "[APPROVED PRIVACY TEXT]"), mockSection("privacy-contact", "Privacy contact", "[APPROVED PRIVACY CONTACT DETAILS]")] },
  { ...mockPage("/terms", "Terms of use", "Using this", "website.", "[TERMS OF USE: awaiting approved legal text]"), slug: "terms",
    sections: [mockSection("terms-use", "Website use", "[APPROVED TERMS TEXT]"), mockSection("terms-content", "Website information", "[APPROVED TERMS TEXT]"), mockSection("terms-contact", "Questions about these terms", "[APPROVED CONTACT DETAILS]")] },
  { ...mockPage("/accessibility", "Accessibility statement", "A more accessible", "experience.", "[ACCESSIBILITY STATEMENT: awaiting approved practice wording]"), slug: "accessibility",
    sections: [mockSection("accessibility-website", "Website accessibility", "[APPROVED WEBSITE ACCESSIBILITY STATEMENT]"), mockSection("accessibility-visiting", "Visiting the practice", "The client has confirmed ADA accessibility and free parking. Location-specific details require verification."), mockSection("accessibility-help", "Request assistance", "[APPROVED ACCESSIBILITY CONTACT AND ASSISTANCE DETAILS]")] },
  { ...mockPage("/notice-of-privacy-practices", "Notice of Privacy Practices", "Privacy information", "for your care.", "[NOTICE OF PRIVACY PRACTICES: client requirement and approved notice still to be confirmed]"), slug: "notice-of-privacy-practices",
    sections: [mockSection("notice-link", "Practice notice", "[LINK SLOT: approved Notice of Privacy Practices document]")] },
];
export const LEGAL_COPY = { updated: "Last updated", updateValue: "[APPROVED POLICY DATE]", notice: "View Notice of Privacy Practices", read: "View policy preview", category: "[POLICY PREVIEW]" };
