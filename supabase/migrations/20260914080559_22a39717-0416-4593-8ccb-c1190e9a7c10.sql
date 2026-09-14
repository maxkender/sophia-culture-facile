ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;
UPDATE public.documents SET published = true WHERE slug = 'guide';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fee text;

UPDATE public.documents
SET title = 'Content commission and copyright assignment',
    published = false,
    current_version = 1,
    updated_at = now(),
    content = $doc$[
  { "type": "paragraph", "text": "*Sophia, commissioned course sets*" },
  { "type": "heading", "level": 2, "text": "1. Parties and scope" },
  { "type": "paragraph", "text": "This agreement is made between VIK STUDIOS SAS, a company registered in France, whose registered office is in France (the \"Publisher\"), and {{author_name}}, {{author_title}}, {{author_institution}}, {{author_country}} (the \"Author\")." },
  { "type": "paragraph", "text": "It applies to the work commissioned from the Author through the Upwork platform. It sets out the terms the parties have agreed regarding the ownership and use of that work, and it replaces any default intellectual property terms that would otherwise apply." },
  { "type": "paragraph", "text": "Payment is made through the Upwork platform. Nothing in this agreement is intended to conflict with the Upwork User Agreement." },
  { "type": "heading", "level": 2, "text": "2. The Work" },
  { "type": "paragraph", "text": "The Author will write {{course_count}} short courses on topics supplied by the Publisher, together with the sources relied on, a short biography and a photograph (together, the \"Work\")." },
  { "type": "paragraph", "text": "Format, length and editorial requirements are set out in the writing guide made available to the Author in their author space, which forms part of this agreement." },
  { "type": "heading", "level": 2, "text": "3. Assignment of rights" },
  { "type": "paragraph", "text": "Upon receipt of full payment for the Work, the Author assigns to the Publisher, exclusively and irrevocably, all economic rights in the Work, for the full legal term of copyright and any extensions, throughout the world, in all languages." },
  { "type": "paragraph", "text": "The rights assigned include, without limitation, the right to:" },
  { "type": "bullets", "items": [
    "reproduce, store, copy and digitise the Work in any number of copies and by any means;",
    "publish, distribute, display, perform, broadcast and make the Work available to the public, including on demand;",
    "adapt, edit, shorten, expand, restructure, excerpt and incorporate the Work into larger works;",
    "translate the Work into any language and exploit those translations on the same terms;",
    "produce derivative formats, including audio, video, illustrated, animated, interactive and printed versions, and quiz, exercise and revision material derived from the Work;",
    "use the Work, in whole or in part, to promote the Sophia application and the Publisher's services."
  ] },
  { "type": "paragraph", "text": "These rights apply to all media and distribution channels now known or developed in the future, including mobile applications, websites, third-party platforms, audio and video services, newsletters, social media and print." },
  { "type": "heading", "level": 2, "text": "4. Transfer to third parties" },
  { "type": "paragraph", "text": "The Publisher may freely assign, transfer, license or sub-license the rights acquired under this agreement to any third party, including in connection with a sale of assets, a sale of shares, a merger or any corporate reorganisation, without the Author's further consent." },
  { "type": "heading", "level": 2, "text": "5. Credit and moral rights" },
  { "type": "paragraph", "text": "The Publisher will credit the Author by name on the Work and on each publication of it, including translations and adaptations, together with the Author's title and, where the format allows, a short biography and photograph. The form of the credit may be adapted to the technical constraints of each medium, provided the Author's name remains accessible to the reader." },
  { "type": "paragraph", "text": "The Author consents to the editorial work, adaptation, translation and reformatting described in clauses 2 and 3, and agrees that such work does not constitute a distortion of the Work, provided it does not change the meaning of the argument the Author has made." },
  { "type": "paragraph", "text": "Where moral rights cannot be assigned or waived under the law applicable to the Author, the Author agrees not to assert them in a way that would prevent the normal exploitation contemplated by this agreement." },
  { "type": "heading", "level": 2, "text": "6. Sole authorship" },
  { "type": "paragraph", "text": "The Author warrants that they are the sole author of the Work and that they will write it personally. The Author may not subcontract, delegate or otherwise have any part of the Work written by another person." },
  { "type": "paragraph", "text": "The Work must be written by the Author. Generative artificial intelligence may not be used to produce the text. The Author remains free to use any tool for research purposes." },
  { "type": "paragraph", "text": "The Author acknowledges that the Publisher publishes the Work under the Author's name and academic credentials, and that these warranties are a material condition of this agreement." },
  { "type": "heading", "level": 2, "text": "7. Author's warranties" },
  { "type": "paragraph", "text": "The Author warrants that:" },
  { "type": "bullets", "items": [
    "the Work is original and unpublished, and is not a copy, translation or paraphrase of any existing work;",
    "the Author holds all rights necessary to make this assignment and has not assigned or licensed them to anyone else;",
    "the Work contains nothing defamatory, unlawful, or infringing the rights of any third party, including privacy and image rights;",
    "any quotations or third-party material are within the limits permitted by law or have been cleared, and have been disclosed to the Publisher;",
    "the factual statements in the Work have been verified, and the sources have been supplied to the Publisher."
  ] },
  { "type": "paragraph", "text": "The Author will indemnify the Publisher against any loss arising from a breach of these warranties." },
  { "type": "heading", "level": 2, "text": "8. Name, image and biography" },
  { "type": "paragraph", "text": "The Author authorises the Publisher to reproduce and display their name, title, biography and photograph in order to identify the Work and to promote it and the Sophia application, on all media, worldwide, for the term of this assignment. This authorisation is granted without further payment, the fee under clause 9 taking it into account." },
  { "type": "heading", "level": 2, "text": "9. Fee" },
  { "type": "paragraph", "text": "The Publisher will pay the Author {{fee}} for the Work, through Upwork, in accordance with the milestones set out in the Upwork contract. This fee covers the writing of the Work and all rights assigned under this agreement." },
  { "type": "heading", "level": 2, "text": "10. No obligation to publish" },
  { "type": "paragraph", "text": "The Publisher is under no obligation to publish or exploit the Work, on any medium, in any territory or in any language, and may withdraw it at any time. The Author has no claim to compensation on that basis and does not recover any rights." },
  { "type": "heading", "level": 2, "text": "11. Rejection" },
  { "type": "paragraph", "text": "If, after one round of revisions, the Work does not meet the requirements of the writing guide or the warranties in clauses 6 and 7, the Publisher may reject it. In that case no assignment takes place and the Author recovers the free use of the text, subject to the payment terms agreed on Upwork." },
  { "type": "heading", "level": 2, "text": "12. General" },
  { "type": "paragraph", "text": "This agreement, together with the writing guide, contains the entire agreement of the parties on the ownership and use of the Work. Any amendment must be in writing and agreed by both parties." },
  { "type": "paragraph", "text": "If any provision is held invalid, the remainder continues in force and the parties will replace it with a provision of equivalent effect." },
  { "type": "heading", "level": 2, "text": "13. Governing law" },
  { "type": "paragraph", "text": "This agreement is governed by French law. Any dispute will be submitted to the competent courts in France." },
  { "type": "heading", "level": 2, "text": "14. Acceptance" },
  { "type": "paragraph", "text": "This agreement takes effect when the Author accepts it in writing, before any work begins." },
  { "type": "paragraph", "text": "Date: {{today}}" }
]$doc$::jsonb
WHERE slug = 'contract';

DELETE FROM public.document_versions
WHERE document_id IN (SELECT id FROM public.documents WHERE slug = 'contract');

INSERT INTO public.document_versions (document_id, version, title, content, note)
SELECT id, 1, title, content, 'Initial contract text (draft)'
FROM public.documents WHERE slug = 'contract';