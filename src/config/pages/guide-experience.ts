// Editable, practical visit-planning content; no unconfirmed clinical service claims.
export const GUIDE_EXPERIENCES = [
  {
    intro: "A little preparation makes room for a better conversation. Start with what matters most to you, then check the details that help your first appointment run smoothly.",
    checklist: ["Check that the physician sees patients for my concern", "Confirm the date, time and appointment address", "Write down my three most important questions"],
    prompts: ["What would I most like to understand by the end of this visit?", "Do I need to complete forms or bring any documents?", "What should I do if I need to change the appointment?"],
    questions: [
      { title: "What should I bring?", body: "Ask the practice which documents and forms are required for your specific appointment. Bring your written questions and any preparation instructions you have received. Requirements can vary by visit." },
      { title: "Can I book for any health concern?", body: "Confirm the physician’s areas of care and visit requirements with the practice first. The guides on this website do not confirm that a particular clinical service is offered." },
    ],
  },
  {
    intro: "The right starting point is a physician whose published background matches the conversation you need. Use profiles to prepare questions, then confirm the practical details with the practice.",
    checklist: ["Read the physician’s published profile", "Ask whether my concern fits their areas of care", "Check the location and appointment availability"],
    prompts: ["Do you see patients for the concern I want to discuss?", "Are there referral or age requirements for this visit?", "Which location would my appointment be at?"],
    questions: [
      { title: "How do I compare physician profiles?", body: "Look for published background, areas of care and languages. Consider what matters to your visit and ask the practice about anything that is unclear. A profile is a starting point, rather than a guarantee of suitability." },
      { title: "What if I am unsure who to choose?", body: "Contact the practice with a brief question about appointment suitability. Avoid putting a detailed medical history into a general website enquiry; ask which appropriate channel to use instead." },
    ],
  },
  {
    intro: "Keep the essentials in one place so you can focus on the conversation. A short list of questions and clear appointment instructions can make the day feel more manageable.",
    checklist: ["Gather the paperwork the practice requested", "Keep my appointment instructions easy to find", "Put my most important question at the top of my list"],
    prompts: ["Is there anything specific I need to do before this appointment?", "Which forms should I complete in advance?", "Who should I contact if the preparation instructions are unclear?"],
    questions: [
      { title: "Should I change my usual routine before the visit?", body: "Follow the instructions given specifically for your appointment. Ask your treating clinician or the practice if you are unsure; do not make changes based on a general website guide." },
      { title: "What if I forget to ask something?", body: "Keep a short written list and bring it with you. Before the visit ends, ask how to send a follow-up question and which communication route the practice recommends." },
    ],
  },
  {
    intro: "A visit does not end with the last question. Make sure you understand what happens next, how to arrange follow-up and who to contact when something needs clarifying.",
    checklist: ["Ask what the next step is and when it should happen", "Check whether another appointment is needed", "Keep the follow-up instructions somewhere safe"],
    prompts: ["Could you explain the next step in plain language?", "When should I follow up if I have not heard anything?", "Which contact route should I use for questions after the visit?"],
    questions: [
      { title: "What if an instruction is unclear?", body: "Ask for it to be explained in different words, and confirm your understanding before you leave. If a question comes up later, use the contact route recommended by your treating team." },
      { title: "How do I arrange a follow-up?", body: "Ask whether a follow-up is needed and which physician or appointment type to request. Confirm the date, location and any preparation when arranging it." },
    ],
  },
  {
    intro: "Keep your appointment details close at hand. Confirmations, reminders and the manage link can help you stay organised when your plans change.",
    checklist: ["Review my confirmation for the correct date and time", "Keep the appointment reminder and manage link", "Check the current policy before cancelling or rescheduling"],
    prompts: ["Are the physician, location, date and time correct?", "Where can I find the link to manage this appointment?", "Who should I contact if I cannot make a change online?"],
    questions: [
      { title: "How do I change an appointment?", body: "Use the manage link in your appointment message where one has been provided, or contact the practice. Available changes depend on the current policy and the time remaining before the appointment." },
      { title: "What if I cannot find my confirmation?", body: "Check your email folders and contact the practice to confirm the booking details. Do not send sensitive medical information through a general enquiry or share your private manage link with others." },
    ],
  },
  {
    intro: "Plan the practical part of your visit before setting out. Confirm the address in your appointment instructions and ask about the entrance or access support you may need.",
    checklist: ["Confirm the exact address in my appointment details", "Ask about parking and the correct entrance", "Allow time for travel and check-in"],
    prompts: ["Which entrance should I use for my appointment?", "Where should I park when I arrive?", "Can you help me plan for a particular access need?"],
    questions: [
      { title: "Is parking available?", body: "Free parking and ADA accessibility are confirmed practice features. Contact the practice for parking and entrance details at your appointment location." },
      { title: "What if I expect to arrive late?", body: "Contact the practice as soon as you can. Ask whether you should continue to the appointment or make another arrangement; do not assume the appointment can be held." },
    ],
  },
];
export const GUIDE_EXPERIENCE_COPY = {
  back: "All visit guides", overview: "A clearer next step", onPage: "In this guide",
  steps: "Make your visit easier", checklist: "Your preparation checklist", checklistHint: "Tick off what you have checked. This list resets when you leave; nothing is sent or saved.",
  completed: "completed", reset: "Reset checklist", prompts: "Questions to take with you",
  faq: "A few helpful answers", contact: "Ask the practice", contactLink: "/contact",
  next: "Keep exploring", step: "Step", imageLabel: "Illustrative image • Not Emcrown staff or premises",
};
