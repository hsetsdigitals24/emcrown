// Shared editable visit guides: these topics do not claim unconfirmed clinical services.
import { GUIDE_EXPERIENCES } from "@/config/pages/guide-experience";
import type { ServiceEntry } from "@/types/public";
import { mockPage, mockSection } from "@/config/pages/helpers";
const guides = [
  {
    title: "Your first appointment", category: "Getting started",
    summary: "Start with your questions. Confirm the details before your first visit.",
    sections: [
      ["Start with your main question", "Think about what you would like help understanding. When arranging a visit, ask whether the physician sees patients for that concern and which appointment type is appropriate. You do not need to share a detailed medical history through a general enquiry."],
      ["Confirm the practical details", "Check the physician’s name, appointment location, date and time. Ask whether you need a referral, any paperwork or specific instructions before your visit. Keep those details somewhere you can find them easily."],
      ["Arrive with a short agenda", "A few written questions can help you remember what you want to discuss. Put the most important question first, and tell your physician if there is something you are worried about or do not understand."],
    ],
  },
  {
    title: "Choosing a physician", category: "Your care team",
    summary: "Explore physician profiles and find the right fit for your needs.",
    sections: [
      ["Read beyond the name", "A physician profile is a starting point. Look at the background, areas of care and languages listed, then consider the questions you would like to ask before arranging a visit."],
      ["Ask about your needs", "Contact the practice to check whether your chosen physician sees patients for the concern you have. Ask about any age limits, referral requirements or other visit criteria that may apply."],
      ["Check availability and coverage", "Confirm appointment availability and the location where the physician will see you. If you use insurance, verify the specific physician and location with both the practice and your plan."],
    ],
  },
  {
    title: "Getting ready for a visit", category: "Before your appointment",
    summary: "Bring your questions, paperwork and visit instructions together.",
    sections: [
      ["Keep the essentials together", "Ask the practice what to bring and which forms to complete. Keep your appointment details and any instructions in one place so you can check them before leaving home."],
      ["Make room for your questions", "Write down the concerns you want to discuss, starting with the one that matters most to you. If something has changed since your last visit, make a note so you remember to mention it."],
      ["Check before changing your routine", "Follow the instructions given specifically for your appointment. If you are unsure about preparation, ask the practice or your treating clinician rather than guessing or changing your usual routine yourself."],
    ],
  },
  {
    title: "Your next steps", category: "After your visit",
    summary: "Leave with a clearer plan for follow-up and staying in touch.",
    sections: [
      ["Understand the next step", "Before you leave, ask what should happen next and whether another appointment is needed. If a term or instruction is unfamiliar, ask for it to be explained in plain language."],
      ["Check how to stay in touch", "Ask which contact route to use for questions after your visit and when to follow up if you are waiting for information. General website enquiries should not include sensitive medical details."],
      ["Keep useful notes", "Store your visit instructions somewhere you can find them. If you need to arrange another appointment, confirm the physician, location and any preparation when you book."],
    ],
  },
  {
    title: "Managing your appointment", category: "Booking and reminders",
    summary: "Keep track of your booking, reminders and appointment changes.",
    sections: [
      ["Confirm your booking", "Check your appointment confirmation for the physician, date, time and location. Contact the practice if a detail needs correcting."],
      ["Keep your reminders", "Keep your confirmation and reminders somewhere easy to find. Check the appointment details before travelling."],
      ["When plans change", "Use the manage link provided with your appointment, where available, or contact the practice to ask about cancellation and rescheduling. Check the current policy before making a change."],
    ],
  },
  {
    title: "Planning your journey", category: "Visiting the practice",
    summary: "Confirm your location, access and parking before you set out.",
    sections: [
      ["Confirm where you are going", "Check the location shown in your appointment instructions. Confirm your appointment address with the practice before travelling; do not rely on a previously used location."],
      ["Discuss access needs", "Free parking and ADA accessibility have been confirmed for the practice. For details such as the entrance, parking area or help you may need on arrival, contact the practice about your specific location."],
      ["If your plans change", "Contact the practice as soon as you know you need to change an appointment. Ask about the current cancellation or rescheduling requirements, since a final policy is not yet published here."],
    ],
  },
];
export const SERVICE_ENTRIES: ServiceEntry[] = guides.map((guide, index) => {
  const slug = `service-${index + 1}`;
  return { ...mockPage(`/services/${slug}`, guide.title, guide.title, "", guide.summary),
    slug, category: guide.category, tags: [guide.category],
    guide: GUIDE_EXPERIENCES[index], image: `/media/visit-guide-${index + 1}.webp`,
    sections: guide.sections.map(([headline, body], section) => mockSection(["service-overview", "service-conditions", "service-visit"][section], headline, body)),
  };
});
