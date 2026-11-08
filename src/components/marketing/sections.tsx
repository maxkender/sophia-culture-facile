import { useEffect, useState, type CSSProperties } from "react";
import { BellRing, BookOpen, FlaskConical, Headphones, Hand, Pause, Plus, Trophy } from "lucide-react";
import {
  ABOARD_FLOATERS, ARCHETYPES, AUTHOR_PHOTOS, INTRO_COURSES, REVIEWS, SWIPE_BASE, TOPICS, UNIVERSITY_LOGOS, screenYears,
} from "@/config/onboarding";
import { IntroVisual, ReviewCard, Roulette, SwipeDeck } from "@/components/onboarding/steps-visual";
import { LaurelBadge, Stars } from "@/components/onboarding/funnel-ui";
import { Hot, Phone, Reveal, WhenVisible, useInView, useMk, useReducedMotion, useStickyProgress } from "./motion";
import { StartButton, StoreBadges } from "./chrome";

const AUTHOR_NAMES = ["Rana Abdalla", "Mark N. Hoffman", "Elizabeth Singer Hunt", "Stacy Jankowski", "Simon Lea", "Dušan Nikolić", "Guido Manuel de la Torre Olvera", "Ivana Tošković"];

/* ------------------------------ phone screens ------------------------------ */

function LessonsScreen() {
  const { lang, c } = useMk();
  return (
    <div className="mk-phone-body">
      <p className="mk-screen-title">{c.nav.courses}</p>
      <WhenVisible><IntroVisual page={0} lang={lang} /></WhenVisible>
      <div className="mt-auto flex items-center gap-2 rounded-2xl bg-[color:var(--ob-surface)] p-3 shadow-sm">
        <span className="text-2xl">🔥</span>
        <span className="text-xs font-bold leading-tight">{lang === "fr" ? "10 min aujourd'hui" : "10 min today"}<br /><span className="mk-ink3 font-semibold">{lang === "fr" ? "Objectif du jour" : "Daily goal"}</span></span>
        <span className="ml-auto h-2 w-16 overflow-hidden rounded-full bg-[color:var(--ob-line)]"><span className="block h-full w-2/3 rounded-full bg-[color:var(--ob-accent)]" /></span>
      </div>
    </div>
  );
}

function TopicsScreen({ live }: { live: boolean }) {
  const { lang } = useMk();
  const [on, setOn] = useState<number[]>([]);
  useEffect(() => {
    if (!live) return;
    setOn([]);
    const order = [0, 3, 1, 4];
    const ts = order.map((i, k) => window.setTimeout(() => setOn((o) => [...o, i]), 500 + k * 450));
    return () => ts.forEach(clearTimeout);
  }, [live]);
  return (
    <div className="mk-phone-body">
      <p className="mk-screen-title">{lang === "fr" ? "Qu'est-ce qui t'intéresse ?" : "What are you into?"}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {TOPICS.map((t, i) => (
          <div key={t.id} className="mk-topic" data-on={on.includes(i)} style={{ "--tc": t.color } as CSSProperties}>
            <span className="e">{t.emoji}</span>{t.label[lang]}
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseScreen() {
  const { lang } = useMk();
  const course = INTRO_COURSES[0]!;
  return (
    <div className="mk-phone-body">
      <img src={course.img} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: course.color, filter: "brightness(0.8)" }}>{course.subject} · 10 min</p>
      <p className="mt-1 text-lg font-extrabold leading-tight">{course.title[lang]}</p>
      <p className="mk-ink2 mt-2 text-[13px] leading-relaxed">
        {lang === "fr" ? "Chaque nuit, ton cerveau rejoue la journée. Les chercheurs pensent que le rêve aide à trier les souvenirs…" : "Every night, your brain replays the day. Researchers think dreaming helps sort memories…"}
      </p>
      <div className="mk-audio mt-auto">
        <span className="grid size-9 place-items-center rounded-full bg-[color:var(--ob-surface)] text-[color:var(--ob-accent)]"><Pause className="size-4" fill="currentColor" /></span>
        <span className="mk-audio-bars" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--d": `${(i % 6) * -0.18}s` } as CSSProperties} />)}</span>
        <span className="text-xs font-bold">3:12</span>
      </div>
    </div>
  );
}

function QuizScreen() {
  const { lang } = useMk();
  return (
    <div className="mk-phone-body">
      <p className="mk-screen-title">{lang === "fr" ? "Quiz du jour" : "Today's quiz"}</p>
      <WhenVisible><IntroVisual page={2} lang={lang} /></WhenVisible>
      <div className="mt-auto rounded-2xl bg-[color:var(--ob-green)] p-3 text-center text-sm font-bold text-[color:var(--ob-surface)]">
        {lang === "fr" ? "3 bonnes réponses ! 🎉" : "3 correct answers! 🎉"}
      </div>
    </div>
  );
}

/* ------------------------------ hero ------------------------------ */

export function Hero({ title, subtitle, eyebrow, phone }: { title: string; subtitle: string; eyebrow: string; phone?: "lessons" | "swipe" }) {
  const { c, lang } = useMk();
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 lg:pb-32">
      <span className="mk-halo" style={{ width: 520, height: 520, top: -120, right: -80 }} />
      <span className="mk-halo" style={{ width: 380, height: 380, bottom: -60, left: -120, opacity: 0.1 }} />
      <div className="mk-wrap relative grid items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="mk-eyebrow" style={{ animation: "mk-rise 700ms var(--mk-ease) both" }}>{eyebrow}</p>
          <h1 className="mk-h1 mt-5" style={{ animation: "mk-rise 900ms var(--mk-ease) 80ms both" }}><Hot text={title} /></h1>
          <p className="mk-lead mt-6 max-w-xl" style={{ animation: "mk-rise 900ms var(--mk-ease) 180ms both" }}>{subtitle}</p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center" style={{ animation: "mk-rise 900ms var(--mk-ease) 280ms both" }}>
            <StartButton />
            <StoreBadges outline />
          </div>
          <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-semibold" style={{ animation: "mk-rise 900ms var(--mk-ease) 380ms both" }}>
            <Stars size={18} /> <span className="font-extrabold">{c.hero.rating}</span> <span className="mk-ink2">· {c.hero.ratingLine}</span>
          </p>
        </div>
        <div className="relative mx-auto grid place-items-center" style={{ width: "min(100%, 460px)", minHeight: 560, animation: "mk-rise 1100ms var(--mk-ease) 200ms both" }}>
          <span className="mk-halo" style={{ width: 360, height: 360, opacity: 0.25 }} />
          {phone === "swipe" ? null : ABOARD_FLOATERS.map((f, i) => (
            <span key={f.img} className="mk-float hidden sm:block" style={{
              width: f.size * 1.7, height: f.size * 1.7, left: `calc(50% + ${f.x * 1.45}px - ${f.size * 0.85}px)`, top: `calc(50% + ${f.y * 1.9}px - ${f.size * 0.85}px)`,
              "--r": `${f.rot}deg`, "--d": `${i * -0.9}s`,
            } as CSSProperties}>
              <img src={f.img} alt="" loading="lazy" width={80} height={80} />
            </span>
          ))}
          <Phone width={280}>
            {phone === "swipe" ? (
              <div className="mk-phone-body">
                <p className="mk-screen-title">{lang === "fr" ? "Ça te tente ?" : "Into it?"}</p>
                <SwipeDeck deck={SWIPE_BASE} lang={lang} onDone={() => undefined} />
              </div>
            ) : <LessonsScreen />}
          </Phone>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ trust ------------------------------ */

export function Trust() {
  const { c } = useMk();
  return (
    <section className="border-y border-[color:var(--ob-line)] bg-[color:var(--ob-surface)] py-12">
      <p className="mk-wrap text-center text-lg font-bold md:text-xl"><Hot text={c.trust.line} /></p>
      <div className="mk-marquee mt-8">
        <div className="mk-marquee-track">
          {[...UNIVERSITY_LOGOS, ...UNIVERSITY_LOGOS].map((l, i) => <img key={i} src={l} alt={i < 5 ? c.trust.alt[i] : ""} aria-hidden={i >= 5} loading="lazy" width={160} height={56} />)}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ how it works ------------------------------ */

function HowStep({ i, active, onActive }: { i: number; active: boolean; onActive: (i: number) => void }) {
  const { c } = useMk();
  const s = c.how.steps[i]!;
  const [ref, inView] = useInView<HTMLDivElement>({ once: false, margin: "-45% 0px -45% 0px", threshold: 0 });
  useEffect(() => { if (inView) onActive(i); }, [inView, i, onActive]);
  return (
    <div ref={ref} className="mk-step flex min-h-[72vh] flex-col justify-center" data-on={active}>
      <span className="mk-step-n">{s.n}</span>
      <h3 className="mk-h2 mt-6 !text-[clamp(32px,3.6vw,48px)]">{s.title}</h3>
      <p className="mk-lead mt-4 max-w-md">{s.text}</p>
    </div>
  );
}

export function HowItWorks() {
  const { c } = useMk();
  const [active, setActive] = useState(0);
  const screens = [<TopicsScreen key="t" live={active === 0} />, <CourseScreen key="c" />, <QuizScreen key="q" />];
  return (
    <section id="how" className="mk-section !pb-0">
      <div className="mk-wrap">
        <Reveal className="max-w-3xl">
          <p className="mk-eyebrow">{c.how.eyebrow}</p>
          <h2 className="mk-h2 mt-4"><Hot text={c.how.title} /></h2>
        </Reveal>
        {/* desktop: pinned phone */}
        <div className="hidden gap-16 lg:grid lg:grid-cols-[1fr_auto]">
          <div className="pb-[14vh]">{[0, 1, 2].map((i) => <HowStep key={i} i={i} active={active === i} onActive={setActive} />)}</div>
          <div className="sticky top-0 flex h-screen items-center">
            <div className="relative">
              <span className="mk-halo" style={{ width: 380, height: 380, left: -40, top: 80 }} />
              <Phone width={300}>
                {screens.map((s, i) => <div key={i} className="mk-screen-swap" data-on={active === i}>{active === i || i !== 0 ? s : null}</div>)}
              </Phone>
            </div>
          </div>
        </div>
        {/* mobile: stacked */}
        <div className="mt-14 space-y-20 pb-24 lg:hidden">
          {c.how.steps.map((s, i) => (
            <Reveal key={s.n} className="flex flex-col items-center text-center">
              <span className="mk-step-n !bg-[color:var(--ob-accent)] !text-[color:var(--ob-surface)]">{s.n}</span>
              <h3 className="mk-h3 mt-4">{s.title}</h3>
              <p className="mk-lead mt-3 max-w-md">{s.text}</p>
              <div className="mt-8"><Phone width={260}>{i === 0 ? <WhenVisible className="h-full"><TopicsScreen live /></WhenVisible> : screens[i]}</Phone></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ path ------------------------------ */

export function PathSection() {
  const { c, lang } = useMk();
  const a = ARCHETYPES.cultivate!;
  return (
    <section className="mk-section relative overflow-hidden">
      <div className="mk-wrap flex flex-col items-center text-center">
        <Reveal className="max-w-2xl">
          <p className="mk-eyebrow">{c.path.eyebrow}</p>
          <h2 className="mk-h2 mt-4"><Hot text={c.path.title} /></h2>
          <p className="mk-lead mx-auto mt-5 max-w-xl">{c.path.text}</p>
        </Reveal>
        <div className="relative mt-16 grid w-full max-w-xl place-items-center">
          <span className="mk-halo" style={{ width: 420, height: 420, opacity: 0.16 }} />
          <div className="mk-card relative w-full px-6 py-12 md:py-16">
            <WhenVisible style={{ minHeight: 300, transform: "scale(1.35)", transformOrigin: "top center", marginBottom: 100 }}>
              <IntroVisual page={3} lang={lang} />
            </WhenVisible>
            <Reveal delay={600} className="mt-2 flex justify-center">
              <span className="mk-badge-profile"><span className="e">{a.emoji}</span>{a.name[lang]}</span>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ take your time back ------------------------------ */

type K = "hidden" | "empty" | "sleep" | "work" | "free" | "phone";
const SCREEN_YEARS = screenYears(180);

function yearsState(p: number) {
  const seg = (a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  const appear = Math.round(seg(0.02, 0.14) * 80);
  const sleep = Math.round(seg(0.16, 0.32) * 27);
  const work = Math.round(seg(0.34, 0.5) * 27);
  const free = Math.round(seg(0.52, 0.64) * 26);
  const phone = Math.round(seg(0.68, 0.8) * SCREEN_YEARS);
  const kinds: K[] = Array.from({ length: 80 }, (_, i) => {
    if (i >= appear) return "hidden";
    if (i < 27) return i < sleep ? "sleep" : "empty";
    if (i < 54) return i - 27 < work ? "work" : "empty";
    if (i >= 80 - phone) return "phone";
    return i - 54 < free ? "free" : "empty";
  });
  const stage = p < 0.15 ? 0 : p < 0.33 ? 1 : p < 0.51 ? 2 : p < 0.66 ? 3 : p < 0.84 ? 4 : 5;
  return { kinds, stage };
}

function CyclingWord() {
  const { c } = useMk();
  const [i, setI] = useState(0);
  useEffect(() => { const t = window.setInterval(() => setI((v) => (v + 1) % TOPICS.length), 1700); return () => clearInterval(t); }, []);
  return (
    <span className="mk-cycle">
      <span key={i} className="mk-cycle-word" style={{ color: TOPICS[i]!.color, filter: "saturate(1.1) brightness(0.92)" }}>{c.time.closingWords[i]}</span>
    </span>
  );
}

export function TimeBack() {
  const { c } = useMk();
  const reduced = useReducedMotion();
  const [ref, p0] = useStickyProgress<HTMLElement>();
  const p = reduced ? 1 : p0;
  const { kinds, stage } = yearsState(p);
  const captions = [c.time.title, c.time.stepSleep, c.time.stepWork, c.time.stepFree, c.time.stepPhone, c.time.stepPhone];
  const legend = [
    { k: "sleep", label: c.time.legendSleep, v: "var(--mk-sleep)", show: stage >= 1 },
    { k: "work", label: c.time.legendWork, v: "var(--mk-work)", show: stage >= 2 },
    { k: "free", label: c.time.legendFree, v: "var(--mk-free)", show: stage >= 3 },
    { k: "phone", label: c.time.legendPhone, v: "var(--mk-phone)", show: stage >= 4 },
  ];
  const closing = stage >= 5;
  return (
    <section ref={ref} className="relative" style={{ height: reduced ? "auto" : "420vh" }} aria-label={c.time.eyebrow}>
      <div className={reduced ? "py-24" : "sticky top-0 flex h-screen items-center overflow-hidden"}>
        <div className="mk-wrap grid w-full items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div className="relative min-h-[220px] lg:min-h-[340px]">
            <p className="mk-eyebrow">{c.time.eyebrow}</p>
            <div className="relative mt-5">
              <h2 className="mk-h2 transition-all duration-700" style={{ opacity: closing ? 0 : 1, transform: closing ? "translateY(-24px)" : "none", position: closing ? "absolute" : "relative" }}>
                <span key={stage} className="block" style={{ animation: "mk-rise 700ms var(--mk-ease) both" }}>
                  {stage === 0 ? <Hot text={c.time.title} /> : captions[stage]}
                </span>
              </h2>
              {closing ? (
                <h2 className="mk-h2" style={{ animation: "mk-rise 900ms var(--mk-ease) both" }}>
                  {c.time.closingBefore}<br /><CyclingWord />
                </h2>
              ) : null}
            </div>
            <div className="mk-legend mt-8">
              {legend.map((l) => <span key={l.k} style={{ opacity: l.show ? 1 : 0.25 }}><i style={{ background: l.v }} />{l.label}</span>)}
            </div>
            {closing ? <div className="mt-10" style={{ animation: "mk-rise 900ms var(--mk-ease) 200ms both" }}><StartButton /></div> : null}
          </div>
          <div className="flex flex-col items-center">
            <div className="mk-years" data-dim={stage >= 4} aria-hidden="true">
              {kinds.map((k, i) => <span key={i} data-k={k} />)}
            </div>
            <p className="mk-ink3 mt-5 text-xs">{c.time.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ subjects ------------------------------ */

export function Subjects() {
  const { c } = useMk();
  return (
    <section className="mk-section">
      <div className="mk-wrap">
        <Reveal className="max-w-3xl">
          <p className="mk-eyebrow">{c.subjects.eyebrow}</p>
          <h2 className="mk-h2 mt-4"><Hot text={c.subjects.title} /></h2>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t, i) => {
            const tile = c.subjects.tiles[t.id as keyof typeof c.subjects.tiles];
            return (
              <Reveal key={t.id} delay={(i % 3) * 90}>
                <article className="mk-subject h-full" tabIndex={0} style={{ "--tc": t.color } as CSSProperties}>
                  <span className="e" aria-hidden="true">{t.emoji}</span>
                  <h3 className="mk-h3 mt-5">{tile.name}</h3>
                  <ul className="mt-4">{tile.courses.map((x) => <li key={x}>{x}</li>)}</ul>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ researchers ------------------------------ */

export function Researchers() {
  const { c } = useMk();
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <section className="mk-section bg-[color:var(--ob-surface)]">
      <div className="mk-wrap">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="mk-eyebrow">{c.researchers.eyebrow}</p>
          <h2 className="mk-h2 mt-4"><Hot text={c.researchers.title} /></h2>
          <p className="mk-lead mx-auto mt-5 max-w-xl">{c.researchers.text}</p>
        </Reveal>
        <div ref={ref} className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {AUTHOR_PHOTOS.map((src, i) => (
            <figure key={src} className="mk-author text-center" data-in={inView} style={{ "--d": `${i * 90}ms` } as CSSProperties}>
              <img src={src} alt={AUTHOR_NAMES[i]} loading="lazy" width={200} height={200} className="mx-auto max-w-[150px]" />
              <figcaption className="mt-4">
                <span className="block text-[15px] font-bold">{AUTHOR_NAMES[i]}</span>
                <span className="mk-ink3 block text-sm">{c.researchers.bioPlaceholder}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ reviews ------------------------------ */

export function Reviews() {
  const { c, lang } = useMk();
  return (
    <section id="reviews" className="mk-section">
      <div className="mk-wrap grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="mk-eyebrow">{c.reviews.eyebrow}</p>
          <h2 className="mk-h2 mt-4"><Hot text={c.reviews.title} /></h2>
          <div className="mt-10 flex justify-start"><LaurelBadge caption={c.reviews.badge} /></div>
          <p className="mk-ink2 mt-6 font-semibold">{c.hero.ratingLine}</p>
        </Reveal>
        <WhenVisible className="min-h-[320px]">
          <Roulette items={REVIEWS.length} interval={2600} renderCard={(i) => <ReviewCard index={i} lang={lang} />} />
        </WhenVisible>
      </div>
    </section>
  );
}

/* ------------------------------ features ------------------------------ */

const FEATURE_ICONS = [
  { k: "courses", icon: BookOpen, color: "#F59E0A" },
  { k: "quiz", icon: Trophy, color: "#33D499" },
  { k: "audio", icon: Headphones, color: "#40B8D9" },
  { k: "blocker", icon: Hand, color: "#ED5973" },
  { k: "reminder", icon: BellRing, color: "#8F66EB" },
  { k: "science", icon: FlaskConical, color: "#D98CF2" },
] as const;

export function Features() {
  const { c } = useMk();
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <section className="mk-section bg-[color:var(--ob-surface)]">
      <div className="mk-wrap">
        <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <p className="mk-eyebrow">{c.features.eyebrow}</p>
            <h2 className="mk-h2 mt-4"><Hot text={c.features.title} /></h2>
          </Reveal>
          <div ref={ref} className="min-h-[84px]">
            <div className="mk-notif" data-in={inView} style={{ opacity: inView ? undefined : 0 }}>
              <img src="/onboarding/icon.png" alt="" width={40} height={40} className="size-10 rounded-[10px]" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="flex justify-between text-sm font-bold">{c.features.notifTitle}<span className="mk-ink3 font-semibold">{c.features.notifTime}</span></p>
                <p className="mk-ink2 text-sm">{c.features.notifText}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ICONS.map(({ k, icon: Icon, color }, i) => {
            const it = c.features.items[k];
            return (
              <Reveal key={k} delay={(i % 3) * 90}>
                <div className="mk-card mk-feature h-full p-7" style={{ "--tc": color } as CSSProperties}>
                  <span className="ic"><Icon className="size-6" /></span>
                  <h3 className="mk-h3 mt-5">{it.title}</h3>
                  <p className="mk-ink2 mt-2">{it.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ faq ------------------------------ */

export function Faq() {
  const { c } = useMk();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mk-section">
      <div className="mk-wrap grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <p className="mk-eyebrow">{c.faq.eyebrow}</p>
          <h2 className="mk-h2 mt-4">{c.faq.title}</h2>
        </Reveal>
        <div className="border-t border-[color:var(--ob-line)]">
          {c.faq.items.map((f, i) => (
            <div key={f.q} className="mk-faq-item" data-open={open === i}>
              <button type="button" className="mk-faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                {f.q}<Plus className="size-6 text-[color:var(--ob-blue)]" />
              </button>
              <div className="mk-faq-a"><div><p className="mk-lead pb-6 !text-[17px]">{f.a}</p></div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ final cta ------------------------------ */

export function FinalCta() {
  const { c } = useMk();
  return (
    <section className="pb-20 lg:pb-28">
      <div className="mk-wrap">
        <div className="mk-final mk-on-navy px-6 pt-16 text-center md:px-16 md:pt-24">
          <span className="mk-halo" style={{ width: 500, height: 500, left: "50%", top: "40%", transform: "translateX(-50%)", background: "var(--ob-blue)", opacity: 0.5 }} />
          <Reveal className="relative">
            <h2 className="mk-h2 mx-auto max-w-3xl"><Hot text={c.final.title} /></h2>
            <p className="mx-auto mt-5 max-w-xl text-lg opacity-80">{c.final.text}</p>
            <div className="mt-9 flex flex-col items-center gap-5">
              <StartButton light />
              <StoreBadges />
            </div>
          </Reveal>
          <Reveal delay={200} className="relative mx-auto mt-14 h-[260px] w-[300px] overflow-hidden md:h-[320px]">
            <Phone width={300}><LessonsScreen /></Phone>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

