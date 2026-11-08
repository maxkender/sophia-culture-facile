import { SMART_LINK } from "@/config/links";
import { MkFooter, MkHeader, StartButton, StoreBadges } from "./chrome";
import { Hot, Reveal, useMk, useSmoothScroll } from "./motion";
import { Faq, Features, FinalCta, Hero, HowItWorks, PathSection, Researchers, Reviews, Subjects, TimeBack, Trust } from "./sections";

export function MarketingHome() {
  const { c } = useMk();
  useSmoothScroll();
  return (
    <div className="mk">
      <MkHeader page="home" />
      <main>
        <Hero eyebrow={c.hero.eyebrow} title={c.hero.title} subtitle={c.hero.subtitle} />
        <Trust />
        <HowItWorks />
        <PathSection />
        <TimeBack />
        <Subjects />
        <Researchers />
        <Reviews />
        <Features />
        <Faq />
        <FinalCta />
      </main>
      <MkFooter page="home" />
    </div>
  );
}

export function MarketingApp() {
  const { c } = useMk();
  useSmoothScroll();
  return (
    <div className="mk">
      <MkHeader page="landing" />
      <main>
        <Hero eyebrow={c.appPage.eyebrow} title={c.appPage.title} subtitle={c.appPage.subtitle} phone="swipe" />
        <Trust />
        <HowItWorks />
        <Features />
        <Reviews />
        <Faq />
        <FinalCta />
      </main>
      <MkFooter page="landing" />
    </div>
  );
}

export function MarketingDownload() {
  const { c } = useMk();
  useSmoothScroll();
  return (
    <div className="mk">
      <MkHeader page="download" />
      <main>
        <Hero eyebrow={c.downloadPage.eyebrow} title={c.downloadPage.title} subtitle={c.downloadPage.subtitle} />
        <section className="pb-20">
          <div className="mk-wrap">
            <Reveal className="mk-card flex flex-col items-center gap-6 p-10 text-center">
              <h2 className="mk-h3"><Hot text={c.cta.free} /></h2>
              <StoreBadges />
              <StartButton />
              <p className="mk-ink2 text-sm">{c.downloadPage.qrHint} <a href={SMART_LINK} className="font-bold text-[color:var(--ob-blue)] underline">{SMART_LINK.replace("https://", "")}</a></p>
            </Reveal>
          </div>
        </section>
        <Trust />
        <Reviews />
      </main>
      <MkFooter page="download" />
    </div>
  );
}
