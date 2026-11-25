// Shared compatibility: match retired starter strings before applying current CMS defaults.
export const RETIRED_STARTER_COPY = [
  { path: "/about", key: "content.hero.buttonLabel", before: "" },
  { path: "/about", key: "content.hero.buttonLink", before: "" },
  { path: "/services", key: "content.hero.buttonLabel", before: "" },
  { path: "/services", key: "content.hero.buttonLink", before: "" },
  { path: "/resources", key: "content.hero.buttonLabel", before: "" },
  { path: "/resources", key: "content.hero.buttonLink", before: "" },
  { path: "/insurance", key: "content.hero.buttonLabel", before: "" },
  { path: "/insurance", key: "content.hero.buttonLink", before: "" },
  { path: "/contact", key: "content.hero.buttonLabel", before: "" },
  { path: "/contact", key: "content.hero.buttonLink", before: "" },
  { path: "/about", key: "content.sections.2.buttonLabel", before: "" },
  { path: "/about", key: "content.sections.2.buttonLink", before: "" },
  { path: "/contact", key: "copy.formHeading", before: "Send an enquiry" },
  { path: "/", key: "hero.photoLabel", before: "Stock consultation imagery; not Emcrown staff or patients" },
  {
    "path": "/",
    "key": "hero.headline",
    "before": "Your health. Your story."
  },
  {
    "path": "/",
    "key": "hero.highlightedPhrase",
    "before": "Our focus."
  },
  {
    "path": "/",
    "key": "booking.body",
    "before": "Start by getting to know our physicians and checking the practical details. The appointment page currently offers a demonstration; call the practice to arrange an actual visit."
  },
  {
    "path": "/",
    "key": "booking.items.0.title",
    "before": "Explore your options"
  },
  {
    "path": "/",
    "key": "booking.items.1.title",
    "before": "Check the details"
  },
  {
    "path": "/",
    "key": "booking.items.2.title",
    "before": "Know what comes next"
  },
  {
    "path": "/",
    "key": "booking.items.2.description",
    "before": "Follow the practice’s appointment instructions and ask what you need to bring. The website demo does not reserve a visit."
  },
  {
    "path": "/",
    "key": "location.body",
    "before": "Plan your journey before the day of your visit. Please confirm your appointment location with the practice before you travel; the contact details below are reference details pending final verification."
  },
  {
    "path": "/",
    "key": "location.detailsLabel",
    "before": "LOCATION DETAILS — PLEASE CONFIRM BEFORE TRAVEL"
  },
  {
    "path": "/",
    "key": "faq.questions.0.answer",
    "before": "Explore the published physician profiles, then call the practice to discuss a visit. The online appointment page is currently a demonstration: it does not create an appointment or reserve a time."
  },
  {
    "path": "/book",
    "key": "copy.introduction",
    "before": "Take a look at how appointment selection works. This is a demonstration with sample times; call the practice to arrange a real visit."
  },
  {
    "path": "/book",
    "key": "copy.demoTitle",
    "before": "Demo booking only"
  },
  {
    "path": "/book",
    "key": "copy.demoNotice",
    "before": "No appointment will be created. Use fictional contact details. Nothing is sent, saved or shared, and no emails or SMS messages are delivered."
  },
  {
    "path": "/book",
    "key": "copy.noScript",
    "before": "This interactive demo needs JavaScript. You can call the practice instead; contact details are provisional."
  },
  {
    "path": "/book",
    "key": "copy.review",
    "before": "Review demo booking"
  },
  {
    "path": "/book",
    "key": "copy.confirm",
    "before": "Confirm demo booking"
  },
  {
    "path": "/book",
    "key": "copy.confirming",
    "before": "Completing demo…"
  },
  {
    "path": "/book",
    "key": "copy.reset",
    "before": "Start a new demo"
  },
  {
    "path": "/book",
    "key": "copy.steps.0.body",
    "before": "Choose an appointment type. These are demonstration options, not confirmed practice services."
  },
  {
    "path": "/book",
    "key": "copy.steps.1.body",
    "before": "Choose a published physician or view the first available demo option. Times shown are samples, not the physician’s actual schedule."
  },
  {
    "path": "/book",
    "key": "copy.steps.2.body",
    "before": "Select a date and a mock time. This is not live availability."
  },
  {
    "path": "/book",
    "key": "copy.steps.3.body",
    "before": "Enter fictional details, review your choices, and complete the demo within this step."
  },
  {
    "path": "/book",
    "key": "copy.firstAvailableDescription",
    "before": "Show sample times across the demo’s eligible physicians."
  },
  {
    "path": "/book",
    "key": "copy.location",
    "before": "Practice location [provisional]"
  },
  {
    "path": "/book",
    "key": "copy.dates",
    "before": "Choose a demo date"
  },
  {
    "path": "/book",
    "key": "copy.times",
    "before": "Choose a demo time"
  },
  {
    "path": "/book",
    "key": "copy.mockAvailability",
    "before": "Mock availability"
  },
  {
    "path": "/book",
    "key": "copy.chooseDate",
    "before": "Choose a date to view demo times."
  },
  {
    "path": "/book",
    "key": "copy.loading",
    "before": "Loading mock times…"
  },
  {
    "path": "/book",
    "key": "copy.unavailable",
    "before": "No demo times are available for this selection. Choose another date or physician."
  },
  {
    "path": "/book",
    "key": "copy.loadError",
    "before": "The demo availability could not be displayed. Try again or choose another date."
  },
  {
    "path": "/book",
    "key": "copy.unavailableBadge",
    "before": "No demo times"
  },
  {
    "path": "/book",
    "key": "copy.errorBadge",
    "before": "Demo error state"
  },
  {
    "path": "/book",
    "key": "copy.reasonHint",
    "before": "Use fictional, general wording only. Do not enter diagnoses, insurance IDs or medical history."
  },
  {
    "path": "/book",
    "key": "copy.smsConsent",
    "before": "I opt in to SMS appointment reminders in this demo. No messages will be sent."
  },
  {
    "path": "/book",
    "key": "copy.emailConsent",
    "before": "I opt in to email appointment reminders in this demo. No messages will be sent."
  },
  {
    "path": "/book",
    "key": "copy.consentHint",
    "before": "Optional. Both choices start unchecked. Declining does not stop the demo."
  },
  {
    "path": "/book",
    "key": "copy.yes",
    "before": "Opted in [demo only]"
  },
  {
    "path": "/book",
    "key": "copy.errors.dateRequired",
    "before": "Choose a demo date."
  },
  {
    "path": "/book",
    "key": "copy.errors.slotRequired",
    "before": "Choose an available demo time."
  },
  {
    "path": "/book",
    "key": "copy.errors.nameRequired",
    "before": "Enter a fictional name within the allowed length."
  },
  {
    "path": "/book",
    "key": "copy.errors.phoneInvalid",
    "before": "Enter a valid fictional phone number with 10–15 digits."
  },
  {
    "path": "/book",
    "key": "copy.errors.emailInvalid",
    "before": "Enter a valid fictional email address."
  },
  {
    "path": "/book",
    "key": "copy.errors.reasonRequired",
    "before": "Enter a short fictional reason within the allowed length."
  },
  {
    "path": "/book",
    "key": "copy.reviewHighlight",
    "before": "demo choices."
  },
  {
    "path": "/book",
    "key": "copy.reviewBody",
    "before": "Check the fictional details below. Confirming completes this preview only; it does not reserve a time."
  },
  {
    "path": "/book",
    "key": "copy.selectionLocation",
    "before": "Location [provisional]"
  },
  {
    "path": "/book",
    "key": "copy.completionTitle",
    "before": "Demo complete."
  },
  {
    "path": "/book",
    "key": "copy.completionHighlight",
    "before": "No appointment booked."
  },
  {
    "path": "/book",
    "key": "copy.completionBody",
    "before": "Your preview is complete. No appointment was created, no time was reserved, and no notifications were sent. Your fictional contact details have been cleared from this form."
  },
  {
    "path": "/book",
    "key": "copy.confirmationError",
    "before": "The demo could not be completed. No appointment was created. Try again or edit your choices."
  },
  {
    "path": "/faq",
    "key": "groups.0.items.0.answer",
    "before": "Explore the published physician profiles, then call the practice to discuss a visit. The online appointment page is currently a demonstration: it does not create an appointment or reserve a time."
  },
  {
    "path": "/legal",
    "key": "content.notice",
    "before": "Website guidance for client review. Practice policies and the formal Notice of Privacy Practices require approval before launch."
  },
  {
    "path": "/legal",
    "key": "copy.updated",
    "before": "Review status"
  },
  {
    "path": "/legal",
    "key": "copy.updateValue",
    "before": "Client approval pending"
  },
  {
    "path": "/privacy",
    "key": "content.notice",
    "before": "Website guidance for client review. Practice policies and the formal Notice of Privacy Practices require approval before launch."
  },
  {
    "path": "/privacy",
    "key": "content.sections.1.body",
    "before": "The appointment page identifies whether you are using a demonstration. Use fictional details in demo forms. A demonstration does not reserve an appointment or provide a way to send a clinical message. External websites linked from this site have their own privacy information."
  },
  {
    "path": "/privacy",
    "key": "content.sections.2.body",
    "before": "For questions about a medical record, an information request or the practice’s privacy arrangements, call the practice and ask to speak with the person responsible for privacy. The final website policy must identify the approved contact and explain actual collection, use, retention and service-provider arrangements before launch."
  },
  {
    "path": "/terms",
    "key": "content.notice",
    "before": "Website guidance for client review. Practice policies and the formal Notice of Privacy Practices require approval before launch."
  },
  {
    "path": "/terms",
    "key": "content.sections.0.body",
    "before": "A visit is not confirmed simply because you browse the site or complete a demonstration. Follow the confirmation instructions provided by the practice. Do not use a general enquiry or demo form to send an urgent message or personal medical information."
  },
  {
    "path": "/accessibility",
    "key": "content.notice",
    "before": "Website guidance for client review. Practice policies and the formal Notice of Privacy Practices require approval before launch."
  },
  {
    "path": "/notice-of-privacy-practices",
    "key": "content.notice",
    "before": "Website guidance for client review. Practice policies and the formal Notice of Privacy Practices require approval before launch."
  },
  {
    "path": "/_site",
    "key": "legal.updated",
    "before": "Review status"
  },
  {
    "path": "/_site",
    "key": "legal.updateValue",
    "before": "Client approval pending"
  }
];
