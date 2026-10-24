// Shared editable copy: the single public location and its publishing workflow.
export const PRACTICE_EDITOR = {
  title: "Practice details", intro: "Update the address used on Contact, Home, booking and appointment messages.",
  label: "Location name", address: "Practice address", hours: "Hours", parking: "Parking", accessibility: "Accessibility", mapLabel: "Map description",
  save: "Save draft", publish: "Publish practice details", saving: "Saving…", saved: "Draft saved. Publish when ready to update the website.",
  published: "Practice details published.", error: "Changes could not be saved. Reload to get the latest settings before trying again.",
  publishingHelp: "Publishing updates the shared site settings, including any other saved changes to navigation, footer or contact details. Existing queued reminders keep the address captured when they were created.",
  draftHelp: "Draft changes stay private until an administrator publishes them. The map below previews your address.",
} as const;
export const PRACTICE_FIELDS = ["label", "address", "hours", "parking", "accessibility", "mapLabel"] as const;
