// Shared patient-resource drafts: practical guidance, source links and honest review status.
import type { ArticleEntry } from "@/types/public";
import { mockPage, mockSection } from "@/config/pages/helpers";
const articles = [
  {
    title: "Make the most of your first appointment", category: "Preparing for a visit",
    summary: "A short list of questions and a little preparation can help you focus on what matters most during your appointment.",
    sections: [
      ["Put your main concern first", "Write down two or three things you want to discuss, with your main concern at the top. A short note can be easier to use than trying to remember everything when you arrive."],
      ["Bring information you can refer to", "Prepare a current list of medicines, including non-prescription products and supplements. Ask the practice about any appointment-specific paperwork or preparation. If something is unclear during the visit, ask for an explanation before moving on."],
      ["Further reading", "For more preparation ideas, read the Agency for Healthcare Research and Quality guide below. This article offers general visit guidance and has not been medically reviewed by an Emcrown physician."],
    ],
    source: "https://www.ahrq.gov/questions/be-engaged/index.html", sourceLabel: "Read AHRQ’s appointment guide",
  },
  {
    title: "Questions to ask before you leave", category: "Talking about your care",
    summary: "Leave the conversation knowing what comes next, what to clarify and how to follow up with the right person.",
    sections: [
      ["Ask for a clear explanation", "If a test is discussed, ask what it is intended to show and how you will receive the results. If treatment is discussed, ask about its purpose, alternatives and possible risks. You can ask for unfamiliar words to be explained."],
      ["Check your next step", "Before leaving, ask whether you need another appointment, who to contact with questions and when to follow up if you are waiting for information. Keep any instructions you receive so you can refer to them afterward."],
      ["Further reading", "The NHS question guide below offers more prompts for conversations with a healthcare professional. This article is general communication guidance, not a care plan or a substitute for instructions from your own clinician."],
    ],
    source: "https://www.nhs.uk/nhs-services/gps/what-to-ask-your-doctor/", sourceLabel: "Explore questions to ask your clinician",
  },
  {
    title: "Check your coverage before you book", category: "Insurance basics",
    summary: "Checking the specific physician, location and visit with your insurer can help you ask clearer questions about coverage.",
    sections: [
      ["Check the provider network", "An insurer’s name alone does not tell you whether a particular physician is in your plan’s network. Check with your plan and the practice about the physician and location you intend to visit."],
      ["Keep your questions specific", "Ask your insurer which benefits apply to your visit, whether any referral or authorisation is needed and which costs may be yours to pay. Ask the practice separately about its current insurance and payment arrangements. No accepted-plan list is published on this website yet."],
      ["Further reading", "The Centers for Medicare & Medicaid Services guide below explains provider networks. Coverage depends on your own plan; this article does not verify benefits, promise payment or provide financial advice."],
    ],
    source: "https://www.cms.gov/marketplace/outreach-and-education/what-you-should-know-provider-networks.pdf", sourceLabel: "Read the CMS provider-network guide",
  },
];
export const ARTICLE_ENTRIES: ArticleEntry[] = articles.map((article, index) => {
  const slug = `article-${index + 1}`;
  return { ...mockPage(`/resources/${slug}`, article.title, article.title, "", article.summary),
    slug, category: article.category, author: "", reviewDate: "", publishedDate: "",
    labels: { author: "Written by", reviewDate: "Medically reviewed", publishedDate: "Published", category: "Category" },
    sections: article.sections.map(([headline, body], section) => ({
      ...mockSection(["article-introduction", "article-body", "article-references"][section], headline, body),
      ...(section === 2 ? { buttonLabel: article.sourceLabel, buttonLink: article.source } : {}),
    })),
  };
});
