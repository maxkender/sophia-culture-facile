import { GUIDE_VERSION } from "@/config/portal";
import { GUIDE_SECTIONS, GUIDE_SUBTITLE, GUIDE_TITLE, guidePlainText } from "@/content/writing-guide";
import { DocumentView, PageTitle } from "./ui";

export function WritingGuidePage() {
  return (
    <div>
      <PageTitle
        title="Writing guide"
        lead="What a Sophia course looks like, how the five screens work together and what we check before accepting."
      />
      <DocumentView
        title={GUIDE_TITLE}
        subtitle={GUIDE_SUBTITLE}
        sections={GUIDE_SECTIONS}
        filename={`sophia-writing-guide-${GUIDE_VERSION}.txt`}
        plainText={guidePlainText()}
      />
    </div>
  );
}
