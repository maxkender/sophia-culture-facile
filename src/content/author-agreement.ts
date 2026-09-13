import { PUBLISHER, CONTRACT_VERSION } from "@/config/portal";

export type DocSection = { title: string; paragraphs: string[] };

export const AGREEMENT_TITLE = "Author agreement — commissioned course and assignment of rights";
export const AGREEMENT_SUBTITLE = `Sophia editorial collections — document version ${CONTRACT_VERSION}`;

export const AGREEMENT_SECTIONS: DocSection[] = [
  {
    title: "1. Parties",
    paragraphs: [
      `${PUBLISHER.name}, a ${PUBLISHER.legalForm} with share capital of ${PUBLISHER.capital}, registered with the ${PUBLISHER.rcsCity} Trade and Companies Register under number ${PUBLISHER.siren} (SIRET ${PUBLISHER.siret}, EU VAT ${PUBLISHER.vat}), with its registered office at ${PUBLISHER.address}, represented by ${PUBLISHER.director}, President (the "Publisher").`,
      'And the author identified by the account used to sign this agreement in the Sophia author portal (the "Author").',
    ],
  },
  {
    title: "2. Purpose",
    paragraphs: [
      "The Publisher commissions the Author to write short educational courses for the Sophia mobile application. Each course is delivered as five screens of roughly 70 to 100 words, with optional sources.",
      "Each commissioned course is listed in the Author's space in the portal, together with a brief note, a lot code and a due date.",
    ],
  },
  {
    title: "3. Independence",
    paragraphs: [
      "The Author writes as an independent contributor. This agreement creates no employment relationship, no exclusivity and no obligation on either party to commission or accept further work.",
      "The Author organises their own working time and methods, and warrants that they are free to enter into this agreement.",
    ],
  },
  {
    title: "4. Originality and warranties",
    paragraphs: [
      "The Author warrants that every course delivered is original, written by them, and free of plagiarism and of undisclosed generative-AI reproduction of third-party text.",
      "The Author warrants that the content does not infringe any third-party right, is factually accurate to the best of their professional knowledge, and that any quotation is short, attributed and lawful.",
      "The Author indemnifies the Publisher against any claim arising from a breach of these warranties.",
    ],
  },
  {
    title: "5. Assignment of rights",
    paragraphs: [
      "Upon acceptance of a course by the Publisher, the Author assigns to the Publisher, exclusively and for the full legal term of protection, the rights to reproduce, represent, adapt, translate and distribute the course, worldwide and on all digital media, in particular within the Sophia application and its promotional material.",
      "This assignment covers all uses necessary for publishing and promoting the application, including excerpts used in marketing.",
    ],
  },
  {
    title: "6. Moral rights and attribution",
    paragraphs: [
      "The Author retains their moral rights. The Publisher will credit the Author by name, title and institution wherever the course is published, unless the Author asks in writing not to be credited.",
      "The Publisher may edit the text for length, clarity, house style and factual correction without altering the substance of the Author's work.",
    ],
  },
  {
    title: "7. Review and acceptance",
    paragraphs: [
      "A submitted course is reviewed by the Sophia editorial desk. The desk may accept the course or return it once or more with written comments, in which case the Author revises it within a reasonable time.",
      "A course is deemed delivered when it is marked as accepted in the portal.",
    ],
  },
  {
    title: "8. Fees",
    paragraphs: [
      "Fees, milestones and payment are agreed and settled exclusively through the Upwork contract between the parties. No payment is handled, displayed or processed in this portal.",
    ],
  },
  {
    title: "9. Confidentiality",
    paragraphs: [
      "The Author keeps confidential any unpublished editorial plan, brief, pricing or product information disclosed by the Publisher, until it is made public by the Publisher.",
    ],
  },
  {
    title: "10. Term and termination",
    paragraphs: [
      "This agreement takes effect on the date of signature and remains in force for the duration of the commissioned work. Either party may end the collaboration with written notice; rights already assigned on accepted courses remain assigned.",
    ],
  },
  {
    title: "11. Governing law",
    paragraphs: [
      "This agreement is governed by French law. The parties will seek an amicable settlement of any dispute before bringing it before the competent courts of Paris.",
    ],
  },
];

export function agreementPlainText(): string {
  const lines = [AGREEMENT_TITLE, AGREEMENT_SUBTITLE, ""];
  for (const section of AGREEMENT_SECTIONS) {
    lines.push(section.title, "");
    for (const paragraph of section.paragraphs) lines.push(paragraph, "");
  }
  return lines.join("\n");
}
