import { useEffect, useMemo, useRef, useState } from "react";
import {
  Atom, Bell, BookOpen, Check, Crown, Download, Globe, GraduationCap, Hand,
  Headphones, LockOpen, Puzzle, Star, Target, TrendingUp, Trophy, UserCheck, X,
} from "lucide-react";
import {
  AGES, ARCHETYPES, COPY, FEATURES, GOALS, KNOWLEDGE_LEVELS, LANGUAGES, MOTIVATIONS,
  ACTIVE_STEPS, OB, PRICING, REVIEWS, ROULETTE_QUESTIONS, STUDENT_PHOTOS, TOPICS,
  buildProfileCourses, buildSwipeDeck, type StartLang, type StepId,
} from "@/config/onboarding";
import { captureAttribution, trackStart } from "@/lib/onboarding-events";
import { AvatarStack, Confetti, Dots, Highlight, LaurelBadge, LaurelBranch, OptionRow, PrimaryBtn, Stars } from "./funnel-ui";
import { AboardHero, IntroVisual, LoadingRows, ReadingSky, ReviewCard, Roulette, SwipeDeck, YearsGrid, QuestionCard } from "./steps-visual";

const TAAP = "https://taap.it/sophia.culture";
const STORE_KEY = "sophia_start_v2";

type Answers = {
  name: string; age?: string; knowledge: string; motivation?: string;
  goals: string[]; topics: string[]; phoneMinutes: number; liked: string[];
  readingHour: number; email: string; plan: "yearly" | "monthly";
};
const EMPTY: Answers = {
  name: "", knowledge: "decent", goals: [], topics: [], phoneMinutes: 180,
  liked: [], readingHour: 8, email: "", plan: "yearly",
};

function loadState(): { step: StepId; answers: Answers } {
  try {
    const raw = sessionStorage.getItem(STORE_KEY) ?? localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { step?: StepId; answers?: Partial<Answers> };
      if (parsed.step && ACTIVE_STEPS.includes(parsed.step)) {
        return { step: parsed.step, answers: { ...EMPTY, ...parsed.answers } };
      }
    }
  } catch { /* in-app browsers may block storage */ }
  return { step: "welcome", answers: EMPTY };
}

export function StartFunnel({ lang: routeLang }: { lang: StartLang }) {
  const [lang, setLang] = useState<StartLang>(routeLang);
  const [step, setStep] = useState<StepId>("welcome");
  const [a, setA] = useState<Answers>(EMPTY);
  const [src, setSrc] = useState("direct");
  const [hydrated, setHydrated] = useState(false);
  const lastAdvance = useRef(0);
  const c = COPY[lang];

  useEffect(() => {
    const attr = captureAttribution();
    setSrc(attr["src"] ?? "direct");
    const saved = loadState();
    setStep(saved.step);
    setA(saved.answers);
    setHydrated(true);
    trackStart("view", { lang: routeLang });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const raw = JSON.stringify({ step, answers: a });
      sessionStorage.setItem(STORE_KEY, raw);
      localStorage.setItem(STORE_KEY, raw);
    } catch { /* ignore */ }
  }, [step, a, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    trackStart("step_view", { step, index: ACTIVE_STEPS.indexOf(step), total: ACTIVE_STEPS.length });
    window.scrollTo(0, 0);
  }, [step, hydrated]);

  /** Forward-only advance with 400 ms double-tap guard + light haptic. */
  const go = (next: StepId) => {
    const now = Date.now();
    if (now - lastAdvance.current < 400) return;
    lastAdvance.current = now;
    try { navigator.vibrate?.(10); } catch { /* unsupported */ }
    setStep(next);
  };
  const next = () => {
    const steps = ACTIVE_STEPS.filter((s) => PRICING.yearly.trialDays > 0 || (s !== "trial" && s !== "reminder"));
    const idx = steps.indexOf(step);
    const target = steps[Math.min(idx + 1, steps.length - 1)]!;
    go(target);
  };
  const answer = (key: keyof Answers, value: unknown) => {
    setA((p) => ({ ...p, [key]: value }));
    trackStart("step_answer", { step, answer: String(value) });
  };
  const finish = (origin: string) => {
    trackStart("cta_click", { cta: origin, plan: a.plan });
    try { sessionStorage.removeItem(STORE_KEY); localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    go("success");
  };
  const storeHref = `${TAAP}?src=${encodeURIComponent(src)}`;

  if (!hydrated) return <div className="ob-shell"><div className="ob-frame" /></div>;

  const name = a.name.trim();
  const deck = buildSwipeDeck(a.topics);
  const profileCourses = buildProfileCourses(a.topics, a.liked);
  const archetype = ARCHETYPES[a.goals[0] ?? "cultivate"]!;

  return (
    <div className="ob-shell">
      <div className="ob-frame">
        <Dots step={step} />
        <div key={step} className="ob-step">
          {/* 1 — Welcome */}
          {step === "welcome" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <div style={{ position: "relative", display: "grid", placeItems: "center", width: 220, height: 220 }}>
                <span className="ob-halo" style={{ width: 220, height: 220 }} />
                <span className="ob-halo" style={{ width: 140, height: 140, opacity: 0.12, animationDelay: "300ms" }} />
                <img src="/onboarding/splash_logo.png" alt="Sophia" className="ob-pop" style={{ width: 104, height: 104, borderRadius: 26 }} />
              </div>
              <h1 className="ob-title-lg ob-reveal" style={{ "--d": "350ms" } as React.CSSProperties}>{c.welcomeTitle}</h1>
              <p className="ob-sub ob-reveal" style={{ "--d": "420ms" } as React.CSSProperties}>{c.welcomeSub}</p>
              <div className="ob-reveal" style={{ "--d": "560ms", marginTop: 26, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 } as React.CSSProperties}>
                <AvatarStack photos={STUDENT_PHOTOS} size={40} overlap={12} />
                <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: OB.ink }}>
                  <Star style={{ width: 15, height: 15, color: OB.gold }} fill="currentColor" strokeWidth={0} />
                  <span>{c.welcomeProof}</span>
                </p>
              </div>
              <div style={{ width: "100%", marginTop: "auto" }}>
                <PrimaryBtn onClick={next}>{c.welcomeCta}</PrimaryBtn>
                <a className="ob-link" href={storeHref} onClick={() => trackStart("cta_click", { cta: "already_account" })}>{c.alreadyAccount}</a>
              </div>
            </div>
          )}

          {/* 2 — Language */}
          {step === "language" && (
            <>
              <div className="ob-spacer" />
              <h1 className="ob-title">{c.langTitle}</h1>
              <p className="ob-sub">{c.langSub}</p>
              <div className="ob-rows">
                {LANGUAGES.map((l, i) => (
                  <OptionRow key={l.id} delay={i * 60} label={l.native} emoji={l.flag} on={lang === l.id}
                    onClick={() => { setLang(l.id); trackStart("step_answer", { step, answer: l.id }); }} />
                ))}
              </div>
              <PrimaryBtn onClick={next}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 3 — Intro carousel */}
          {step === "intro" && <IntroStep lang={lang} c={c} onDone={next} />}

          {/* 4 — Social proof */}
          {step === "social" && (
            <>
              <div style={{ height: 64 }} />
              <h1 className="ob-title"><Highlight text={c.socialTitle} /></h1>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px 12px", justifyItems: "center", margin: "28px 0" }}>
                {[...STUDENT_PHOTOS, ...[1, 2, 3, 4, 5].map((i) => `/onboarding/review_avatar_${i}.jpg`)].map((p, i) => (
                  <img key={p} src={p} alt="" width={58} height={58} loading="lazy" className="ob-pop"
                    style={{ width: 58, height: 58, borderRadius: 999, border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,.12)", objectFit: "cover", animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
              <div className="ob-pop" style={{ animationDelay: "900ms" }}>
                <LaurelBadge caption={c.onAppStore} />
              </div>
              <p className="ob-reveal" style={{ "--d": "1100ms", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, fontSize: 15, fontWeight: 600, color: OB.inkSecondary } as React.CSSProperties}>
                <Globe style={{ width: 18, height: 18, color: OB.accentSoft }} /> {c.countries}
              </p>
              <PrimaryBtn onClick={next}>{c.socialCta}</PrimaryBtn>
            </>
          )}

          {/* 5 — Name */}
          {step === "name" && (
            <NameStep c={c} value={a.name} onChange={(v) => setA((p) => ({ ...p, name: v }))}
              onSubmit={() => { answer("name", a.name.trim()); next(); }} onSkip={next} />
          )}

          {/* 6 — Age */}
          {step === "age" && (
            <>
              <div className="ob-spacer" />
              <h1 className="ob-title">{c.ageTitle}</h1>
              <p className="ob-sub">{c.ageSub}</p>
              <div className="ob-rows">
                {AGES.map((o, i) => (
                  <OptionRow key={o.id} delay={i * 70} label={o.label[lang]} on={a.age === o.id} onClick={() => answer("age", o.id)} />
                ))}
              </div>
              <PrimaryBtn disabled={!a.age} onClick={next}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 7 — Knowledge */}
          {step === "knowledge" && (
            <KnowledgeStep lang={lang} c={c} value={a.knowledge}
              onChange={(v) => answer("knowledge", v)} onNext={next} />
          )}

          {/* 8 — Motivation */}
          {step === "motivation" && (
            <>
              <div className="ob-spacer" />
              <h1 className="ob-title">{c.motivationTitle}</h1>
              <p className="ob-sub">{c.motivationSub}</p>
              <div className="ob-rows">
                {MOTIVATIONS.map((o, i) => (
                  <OptionRow key={o.id} delay={i * 70} label={o.label[lang]} emoji={o.emoji} on={a.motivation === o.id} onClick={() => answer("motivation", o.id)} />
                ))}
              </div>
              <PrimaryBtn disabled={!a.motivation} onClick={next}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 9 — Goals (multi) */}
          {step === "goals" && (
            <>
              <div className="ob-spacer" />
              <h1 className="ob-title">{c.goalsTitle}</h1>
              <p className="ob-sub">{c.goalsSub}</p>
              <div className="ob-rows">
                {GOALS.map((o, i) => {
                  const on = a.goals.includes(o.id);
                  return (
                    <OptionRow key={o.id} delay={i * 70} label={o.label[lang]} emoji={o.emoji} on={on} multi
                      onClick={() => setA((p) => ({ ...p, goals: on ? p.goals.filter((g) => g !== o.id) : [...p.goals, o.id] }))} />
                  );
                })}
              </div>
              <PrimaryBtn disabled={!a.goals.length} onClick={() => { trackStart("step_answer", { step, answer: a.goals.join(",") }); next(); }}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 10 — Topics (multi grid) */}
          {step === "topics" && (
            <>
              <div className="ob-spacer" />
              <h1 className="ob-title">{c.topicsTitle}</h1>
              <p className="ob-sub">{c.topicsSub}</p>
              <div className="ob-tiles">
                {TOPICS.map((t, i) => {
                  const on = a.topics.includes(t.id);
                  return (
                    <button key={t.id} type="button" className="ob-tile ob-reveal" data-on={on} aria-pressed={on}
                      style={{ "--tc": t.color, "--d": `${i * 70}ms` } as React.CSSProperties}
                      onClick={() => setA((p) => ({ ...p, topics: on ? p.topics.filter((x) => x !== t.id) : [...p.topics, t.id] }))}>
                      {on ? <span className="ob-tile-check"><Check className="size-3.5" strokeWidth={3.5} /></span> : null}
                      <span className="ob-emoji" aria-hidden="true">{t.emoji}</span>
                      {t.label[lang]}
                    </button>
                  );
                })}
              </div>
              <PrimaryBtn disabled={!a.topics.length} onClick={() => { trackStart("step_answer", { step, answer: a.topics.join(",") }); next(); }}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 11 — Sophia will help you (tap anywhere) */}
          {step === "help" && (
            <Interstitial words={c.helpWords(name)} hint={c.tapAnywhere} icon={<Target style={{ width: 46, height: 46, color: OB.accentSoft }} />} onTap={next} />
          )}

          {/* 12 — Mission */}
          {step === "mission" && (
            <>
              <div className="ob-spacer" />
              <div style={{ position: "relative", display: "grid", placeItems: "center", height: 150 }}>
                <span className="ob-halo" style={{ width: 150, height: 150 }} />
                <img src="/onboarding/splash_logo.png" alt="" className="ob-pop" style={{ width: 84, height: 84, borderRadius: 20 }} />
              </div>
              <h1 className="ob-title" style={{ marginTop: 16 }}>{c.missionTitle}</h1>
              <p style={{ marginTop: 14, fontSize: 17, fontWeight: 600, textAlign: "center" }}>{c.missionBody1}</p>
              <p className="ob-sub">{c.missionBody2}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 22 }}>
                <AvatarStack photos={["/onboarding/author_rana_abdalla.jpg", "/onboarding/author_mark_n_hoffman.jpg", "/onboarding/author_elizabeth_singer_hunt.jpg", "/onboarding/author_stacy_jankowski.jpg", "/onboarding/author_simon_lea.jpg"]} size={34} overlap={10} />
                <span style={{ fontSize: 13, fontWeight: 600, color: OB.inkSecondary }}>{c.missionTeam}</span>
              </div>
              <PrimaryBtn onClick={next}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 13 — Questions roulette */}
          {step === "questions" && (
            <>
              <div style={{ height: 84 }} />
              <h1 className="ob-title">{c.questionsTitle}</h1>
              <div style={{ marginTop: 24 }}>
                <Roulette items={ROULETTE_QUESTIONS.length} interval={1600} renderCard={(i) => <QuestionCard index={i} lang={lang} />} />
              </div>
              <PrimaryBtn onClick={next}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 14 — Phone time */}
          {step === "phoneTime" && (
            <>
              <div className="ob-spacer" />
              <h1 className="ob-title">{c.phoneTitle}</h1>
              <div className="ob-bignum" style={{ fontSize: 68, textAlign: "center", margin: "36px 0 24px" }}>
                {a.phoneMinutes < 60 ? `${a.phoneMinutes} min` : `${Math.floor(a.phoneMinutes / 60)}h${a.phoneMinutes % 60 ? String(a.phoneMinutes % 60).padStart(2, "0") : ""}`}
              </div>
              <input type="range" className="ob-slider" min={30} max={600} step={30} value={a.phoneMinutes}
                aria-label={c.phoneTitle}
                onChange={(e) => setA((p) => ({ ...p, phoneMinutes: Number(e.target.value) }))} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, fontWeight: 600, color: OB.inkTertiary }}>
                <span>30 min</span><span>10h</span>
              </div>
              <PrimaryBtn onClick={() => { answer("phoneMinutes", a.phoneMinutes); next(); }}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 15 — Life in years */}
          {step === "years" && <YearsStep lang={lang} c={c} minutes={a.phoneMinutes} onNext={next} />}

          {/* 16 — Transform (tap anywhere) */}
          {step === "transform" && (
            <Interstitial words={c.transformWords} hint={c.tapContinue} cycle={c.transformCycle} onTap={next} />
          )}

          {/* 17 — Reviews */}
          {step === "reviews" && (
            <>
              <div className="ob-spacer" />
              <h1 className="ob-title">{c.reviewsTitle}</h1>
              <div style={{ margin: "20px 0" }}>
                <LaurelBadge caption={c.reviewsBadge} compact />
              </div>
              <Roulette items={REVIEWS.length} interval={3000} renderCard={(i) => <ReviewCard index={i} lang={lang} />} />
              <PrimaryBtn onClick={next}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 18 — Personalize (tap anywhere) */}
          {step === "personalize" && (
            <Interstitial words={c.personalizeWords} hint={c.tapContinue} onTap={next} />
          )}

          {/* 19 — Swipe courses */}
          {step === "swipe" && (
            <>
              <div style={{ height: 40 }} />
              <h1 style={{ fontSize: 22, fontWeight: 800, textAlign: "center" }}>{c.swipeTitle}</h1>
              <p className="ob-sub" style={{ fontSize: 15 }}>{c.swipeSub}</p>
              <SwipeDeck deck={deck} lang={lang} onDone={(liked) => { setA((p) => ({ ...p, liked })); trackStart("step_answer", { step: "swipe", answer: liked.join(",") }); next(); }} />
            </>
          )}

          {/* 20 — Loading */}
          {step === "loading" && <LoadingStep lang={lang} c={c} name={name} onNext={next} />}

          {/* 21 — Profile */}
          {step === "profile" && (
            <ProfileStep lang={lang} c={c} name={name} goals={a.goals} archetype={archetype} courses={profileCourses} onNext={next} />
          )}

          {/* 22 — Reading time */}
          {step === "readingTime" && (
            <>
              <div className="ob-spacer" />
              <h1 className="ob-title">{c.readingTitle}</h1>
              <div style={{ margin: "26px 0" }}>
                <ReadingSky hour={a.readingHour} />
              </div>
              <div className="ob-bignum" style={{ fontSize: 52, textAlign: "center", color: OB.ink }}>
                {String(a.readingHour).padStart(2, "0")}:00
              </div>
              <p style={{ textAlign: "center", fontSize: 15, fontWeight: 600, color: OB.inkSecondary, marginTop: 4 }}>
                {c.readingLabels[a.readingHour < 9 ? 0 : a.readingHour < 13 ? 1 : a.readingHour < 18 ? 2 : a.readingHour < 21 ? 3 : 4]}
              </p>
              <input type="range" className="ob-slider" min={5} max={23} step={1} value={a.readingHour}
                aria-label={c.readingTitle} style={{ marginTop: 22 }}
                onChange={(e) => setA((p) => ({ ...p, readingHour: Number(e.target.value) }))} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, fontWeight: 600, color: OB.inkTertiary }}>
                <span>05:00</span><span>23:00</span>
              </div>
              <PrimaryBtn onClick={() => { answer("readingHour", a.readingHour); next(); }}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 23 — Email reminders */}
          {step === "email" && (
            <EmailStep lang={lang} c={c} value={a.email}
              onSubmit={(email) => { answer("email", email); next(); }}
              onSkip={() => { trackStart("step_answer", { step, answer: "skipped" }); next(); }} />
          )}

          {/* 24 — Account (email only, no auth) */}
          {step === "account" && (
            <AccountStep lang={lang} c={c} value={a.email}
              onSubmit={(email) => { answer("email", email); next(); }}
              onProvider={(p) => { trackStart("step_answer", { step, answer: `${p}_placeholder` }); next(); }} />
          )}

          {/* 25 — Welcome aboard */}
          {step === "aboard" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Confetti />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <AboardHero logo="/onboarding/splash_logo.png" />
                <h1 className="ob-title-lg ob-reveal" style={{ "--d": "300ms", marginTop: 12 } as React.CSSProperties}>{c.aboardTitle(name)}</h1>
                <p className="ob-sub ob-reveal" style={{ "--d": "400ms" } as React.CSSProperties}>{c.aboardSub}</p>
              </div>
              <PrimaryBtn onClick={next}>{c.continue}</PrimaryBtn>
            </div>
          )}

          {/* 26 — Features */}
          {step === "features" && (
            <>
              <div style={{ height: 48 }} />
              <h1 className="ob-title">{c.featuresTitle(name)}</h1>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 28, position: "relative" }}>
                <span style={{ position: "absolute", left: 23, top: 24, bottom: 24, width: 3, borderRadius: 24, background: OB.surfaceMuted }} aria-hidden="true" />
                {FEATURES.map((f, i) => (
                  <div key={f.icon} className="ob-reveal" style={{ "--d": `${i * 140}ms`, display: "flex", alignItems: "center", gap: 14, minHeight: 52 } as React.CSSProperties}>
                    <span style={{ width: 48, height: 48, borderRadius: 999, background: f.color, color: "#fff", display: "grid", placeItems: "center", flexShrink: 0, zIndex: 1 }}>
                      {f.icon === "puzzle" ? <Puzzle className="size-5" /> : f.icon === "book" ? <BookOpen className="size-5" /> : f.icon === "trophy" ? <Trophy className="size-5" /> : f.icon === "headphones" ? <Headphones className="size-5" /> : f.icon === "hand" ? <Hand className="size-5" /> : <Atom className="size-5" />}
                    </span>
                    <span style={{ fontSize: 17, fontWeight: 500 }}>{f.text[lang]}</span>
                  </div>
                ))}
              </div>
              <div className="ob-laurel" style={{ marginTop: 26, color: OB.inkTertiary }}>
                <LaurelBranch size={50} />
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: OB.ink }}>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>4.8 / 5</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: OB.inkTertiary }}>{c.onTheAppStore}</span>
                </span>
                <LaurelBranch size={50} flip />
              </div>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <Stars size={22} />
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>{c.reviewsCount}</div>
              </div>
              <p style={{ textAlign: "center", fontSize: 20, fontWeight: 700, marginTop: 18 }}>{c.noCommitment}</p>
              <PrimaryBtn onClick={next}>{c.continue}</PrimaryBtn>
            </>
          )}

          {/* 27 — Trial timeline (only when the annual plan has a trial) */}
          {step === "trial" && <TrialStep lang={lang} c={c} onNext={next} />}

          {/* 28 — Reminder */}
          {step === "reminder" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
              <div className="ob-pop" style={{ display: "grid", placeItems: "center", marginBottom: 28 }}>
                <Bell className="ob-bell" style={{ width: 96, height: 96, color: OB.gold }} fill={OB.gold} strokeWidth={1} />
              </div>
              <ProgressiveWords words={c.reminderWords} />
              <PrimaryBtn onClick={next}>{c.reminderCta}</PrimaryBtn>
            </div>
          )}

          {/* 29 — Paywall A */}
          {step === "paywallA" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
              <button type="button" className="ob-x" aria-label="Close" onClick={() => go("paywallB")}><X className="size-4" /></button>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 18 }}>
                <GraduationCap style={{ width: 46, height: 46, color: OB.accentSoft }} />
                <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>
                  <span style={{ color: OB.success }}>{c.paywallAGreen}</span><br />{c.paywallAInk}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AvatarStack photos={STUDENT_PHOTOS.slice(0, 3)} size={28} overlap={10} />
                  <Star style={{ width: 14, height: 14, color: OB.gold }} fill="currentColor" strokeWidth={0} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>4.8</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: OB.inkSecondary }}>{c.paywallAProof}</span>
                </div>
                <button type="button" onClick={() => go("paywallB")}
                  style={{ fontSize: 15, fontWeight: 600, color: OB.accentSoft, textDecoration: "underline" }}>
                  {c.viewAllPlans}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12, position: "relative" }}>
                <span aria-hidden="true" style={{ position: "absolute", top: 13, left: "16%", right: "16%", height: 3, borderRadius: 3, background: `linear-gradient(90deg, ${OB.accentSoft}, ${OB.surfaceMuted})` }} />
                {c.paywallTimeline.map((t, i) => (
                  <div key={t.when} className="ob-reveal" style={{ "--d": `${i * 120}ms`, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center", zIndex: 1 } as React.CSSProperties}>
                    <span style={{ width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", background: i === 0 ? OB.accentSoft : OB.surfaceMuted, color: i === 0 ? "#fff" : OB.accentSoft, border: "2px solid #fff" }}>
                      {i === 0 ? <LockOpen className="size-3.5" /> : i === 1 ? <Bell className="size-3.5" /> : <Star className="size-3.5" />}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800 }}>{t.when}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: OB.inkSecondary }}>{t.what}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}><ReviewCard index={1} lang={lang} /></div>
              <p style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: OB.inkSecondary, marginBottom: 10 }}>{c.paywallReassurance}</p>
              <button type="button" className="ob-primary" onClick={() => finish("paywall_a_trial")}>{c.trialCtaLong}</button>
              <p style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: OB.inkSecondary, marginTop: 8 }}>{c.billedYearly}</p>
              <LegalRow c={c} storeHref={storeHref} />
            </div>
          )}

          {/* 30 — Paywall B (comparison) */}
          {step === "paywallB" && (
            <PaywallB lang={lang} c={c} plan={a.plan}
              onPlan={(p) => { setA((x) => ({ ...x, plan: p })); trackStart("plan_selected", { plan: p }); }}
              onClose={() => finish("paywall_b_close")} onCta={() => finish("paywall_b_cta")} storeHref={storeHref} />
          )}

          {/* Success / download */}
          {step === "success" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Confetti />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <AboardHero logo="/onboarding/splash_logo.png" />
                <h1 className="ob-title-lg ob-reveal" style={{ "--d": "300ms", marginTop: 12 } as React.CSSProperties}>{c.successTitle}</h1>
                <p className="ob-sub ob-reveal" style={{ "--d": "400ms" } as React.CSSProperties}>{c.successSub}</p>
              </div>
              <div className="ob-footer">
                <a href={storeHref} className="ob-primary" onClick={() => trackStart("store_click", { store: "taap" })}>
                  <Download className="size-5" /> {c.download}
                </a>
                <p style={{ textAlign: "center", fontSize: 12, color: OB.inkTertiary, marginTop: 14 }}>{c.openBrowser}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ sub-steps ============================ */

type C = (typeof COPY)["fr"];

function IntroStep({ lang, c, onDone }: { lang: StartLang; c: C; onDone: () => void }) {
  const [page, setPage] = useState(0);
  const pages = [
    { title: c.intro1, sub: null },
    { title: c.intro2, sub: c.intro2Sub },
    { title: c.intro3, sub: c.intro3Sub },
    { title: c.intro4, sub: c.intro4Sub },
  ];
  return (
    <>
      <div style={{ height: 64 }} />
      <div key={page} className="ob-step" style={{ padding: 0, animationDuration: "400ms" }}>
        <h1 className="ob-title" style={{ minHeight: 108 }}>
          <Highlight text={pages[page]!.title} />
        </h1>
        <div style={{ margin: "26px 0", minHeight: 240 }}>
          <IntroVisual page={page} lang={lang} />
        </div>
        {pages[page]!.sub ? <p className="ob-sub">{pages[page]!.sub}</p> : null}
      </div>
      <div className="ob-pager" aria-hidden="true">
        {pages.map((_, i) => <span key={i} data-on={i === page} />)}
      </div>
      <PrimaryBtn onClick={() => (page < 3 ? setPage(page + 1) : onDone())}>{c.continue}</PrimaryBtn>
    </>
  );
}

function NameStep({ c, value, onChange, onSubmit, onSkip }: {
  c: C; value: string; onChange: (v: string) => void; onSubmit: () => void; onSkip: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.focus(), 650);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <>
      <div className="ob-spacer" />
      <h1 className="ob-title">{c.nameTitle}</h1>
      <p className="ob-sub">{c.nameSub}</p>
      <form style={{ marginTop: 32 }} onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSubmit(); }}>
        <input ref={ref} className="ob-input" value={value} maxLength={24} placeholder={c.namePlaceholder}
          onChange={(e) => onChange(e.target.value)} autoComplete="given-name" />
      </form>
      <PrimaryBtn disabled={!value.trim()} onClick={onSubmit}>{c.continue}</PrimaryBtn>
      <button type="button" className="ob-link" onClick={onSkip}>{c.skip}</button>
    </>
  );
}

function KnowledgeStep({ lang, c, value, onChange, onNext }: {
  lang: StartLang; c: C; value: string; onChange: (v: string) => void; onNext: () => void;
}) {
  const idx = Math.max(0, KNOWLEDGE_LEVELS.findIndex((l) => l.id === value));
  const level = KNOWLEDGE_LEVELS[idx]!;
  return (
    <>
      <div className="ob-spacer" />
      <h1 className="ob-title">{c.knowledgeTitle}</h1>
      <p className="ob-sub">{c.knowledgeSub}</p>
      <div style={{ textAlign: "center", margin: "36px 0 28px" }}>
        <div key={level.id} className="ob-pop" style={{ fontSize: 72, lineHeight: 1 }}>{level.emoji}</div>
        <div key={`${level.id}-l`} className="ob-pop" style={{ fontSize: 28, fontWeight: 800, color: OB.accentSoft, marginTop: 10 }}>{level.label[lang]}</div>
      </div>
      <div style={{ padding: "0 12px", position: "relative" }}>
        <input type="range" className="ob-slider" min={0} max={3} step={1} value={idx}
          aria-label={c.knowledgeTitle} onChange={(e) => onChange(KNOWLEDGE_LEVELS[Number(e.target.value)]!.id)} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          {KNOWLEDGE_LEVELS.map((l, i) => (
            <span key={l.id} style={{ fontSize: 12, fontWeight: i === idx ? 700 : 500, color: i === idx ? OB.accentSoft : OB.inkTertiary, width: 70, textAlign: "center", marginLeft: i === 0 ? -24 : 0, marginRight: i === 3 ? -24 : 0 }}>
              {l.label[lang]}
            </span>
          ))}
        </div>
      </div>
      <PrimaryBtn onClick={onNext}>{c.continue}</PrimaryBtn>
    </>
  );
}

/** Interstitial: words turn bold one by one, then a pulsing hint; tap anywhere. */
function Interstitial({ words, hint, icon, cycle, onTap }: {
  words: string; hint: string; icon?: React.ReactNode; cycle?: readonly string[]; onTap: () => void;
}) {
  const parts = words.split(" ");
  const [shown, setShown] = useState(0);
  const [cycleIdx, setCycleIdx] = useState(0);
  const ready = shown >= parts.length;
  useEffect(() => {
    if (shown < parts.length) {
      const t = window.setTimeout(() => setShown((n) => n + 1), 130);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [shown, parts.length]);
  useEffect(() => {
    if (!ready || !cycle) return undefined;
    const t = window.setInterval(() => setCycleIdx((i) => (i + 1) % cycle.length), 1150);
    return () => window.clearInterval(t);
  }, [ready, cycle]);
  const cycleColors = [OB.accent, OB.danger, OB.gold, OB.success, "#7A5CD1"];
  return (
    <div role="button" tabIndex={0} onClick={() => ready && onTap()} onKeyDown={(e) => e.key === "Enter" && ready && onTap()}
      style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", cursor: "pointer", minHeight: "70vh" }}>
      <span className="ob-halo" style={{ width: 320, height: 320, filter: "blur(30px)" }} />
      {icon ? <span style={{ width: 108, height: 108, borderRadius: 999, background: "color-mix(in srgb, #2E62C4 10%, transparent)", display: "grid", placeItems: "center", marginBottom: 32, zIndex: 1 }}>{icon}</span> : null}
      <p className="ob-words" style={{ zIndex: 1, maxWidth: 340 }}>
        {parts.map((w, i) => {
          const isLast = cycle && i === parts.length - 1;
          if (isLast && ready) {
            return <b key={`cycle-${cycleIdx}`} className="ob-pop" style={{ color: cycleColors[cycleIdx % cycleColors.length], display: "inline-block" }}>{cycle[cycleIdx]!} </b>;
          }
          return i < shown ? <b key={i}>{w} </b> : <span key={i}>{w} </span>;
        })}
      </p>
      {ready ? <span className="ob-hint">{hint}</span> : null}
    </div>
  );
}

/** Progressive bold sentence (step 28). */
function ProgressiveWords({ words }: { words: string }) {
  const parts = words.split(" ");
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown < parts.length) {
      const t = window.setTimeout(() => setShown((n) => n + 1), 320);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [shown, parts.length]);
  return (
    <p className="ob-words">
      {parts.map((w, i) => (i < shown ? <b key={i}>{w} </b> : <span key={i}>{w} </span>))}
    </p>
  );
}

function YearsStep({ lang, c, minutes, onNext }: { lang: StartLang; c: C; minutes: number; onNext: () => void }) {
  const [ready, setReady] = useState(false);
  return (
    <>
      <div style={{ height: 48 }} />
      {ready ? <h1 className="ob-title ob-reveal" style={{ marginBottom: 22 }}>{c.yearsTitle}</h1> : <div style={{ height: 56 }} />}
      <YearsGrid minutes={minutes} lang={lang} onReady={() => setReady(true)} />
      {ready ? <YearsClosing c={c} /> : null}
      {ready ? <PrimaryBtn onClick={onNext}>{c.continue}</PrimaryBtn> : null}
    </>
  );
}

/** "With Sophia, turn that time into …" with the last word cycling in subject colours. */
function YearsClosing({ c }: { c: C }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = window.setInterval(() => setI((v) => (v + 1) % c.yearsCycle.length), 1300); return () => window.clearInterval(t); }, [c]);
  const lead = c.transformWords.split(" ").slice(0, -1).join(" ");
  return (
    <p className="ob-reveal" style={{ "--d": "500ms", marginTop: 22, textAlign: "center", fontSize: 21, fontWeight: 800, lineHeight: 1.3 } as React.CSSProperties}>
      {lead}{" "}
      <b key={i} className="ob-pop" style={{ display: "inline-block", color: TOPICS[i % TOPICS.length]!.color, filter: "brightness(0.9)" }}>{c.yearsCycle[i]}</b>
    </p>
  );
}

function LoadingStep({ lang, c, name, onNext }: { lang: StartLang; c: C; name: string; onNext: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <div className="ob-spacer" />
      <h1 className="ob-title">{c.loadingTitle(name)}</h1>
      <LoadingRows labels={c.loadingRows} onDone={() => setDone(true)} />
      <div style={{ marginTop: 36, textAlign: "center", opacity: done ? 1 : 0.45, transition: "opacity 500ms" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <AvatarStack photos={STUDENT_PHOTOS} size={38} overlap={12} />
        </div>
        <LaurelBadge caption={c.reviewsBadge} compact />
        <p style={{ fontSize: 14, color: OB.inkSecondary, marginTop: 10 }}>
          {c.loadingProof} <strong style={{ color: OB.ink }}>{c.loadingJoin}</strong>
        </p>
      </div>
      <PrimaryBtn disabled={!done} onClick={onNext}>{c.loadingCta}</PrimaryBtn>
    </>
  );
}

function ProfileStep({ lang, c, name, goals, archetype, courses, onNext }: {
  lang: StartLang; c: C; name: string; goals: string[];
  archetype: { emoji: string; name: Record<StartLang, string>; tagline: Record<StartLang, string> };
  courses: ReturnType<typeof buildProfileCourses>; onNext: () => void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(t);
  }, []);
  const goalLabels = goals.map((g) => GOALS.find((x) => x.id === g)).filter(Boolean);
  return (
    <>
      <div style={{ height: 40 }} />
      <div style={{ position: "relative", display: "grid", placeItems: "center", marginBottom: 14 }}>
        <span className="ob-halo" style={{ width: 340, height: 340, filter: "blur(34px)" }} />
        <span className="ob-pop" style={{ width: 116, height: 116, borderRadius: 999, background: "color-mix(in srgb, #2E62C4 10%, transparent)", border: "1px solid color-mix(in srgb, #2E62C4 18%, transparent)", display: "grid", placeItems: "center", fontSize: 52 }}>
          {archetype.emoji}
        </span>
      </div>
      <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: OB.accentSoft }}>{c.profileEyebrow(name)}</p>
      <h1 style={{ textAlign: "center", fontSize: 34, fontWeight: 800, marginTop: 6 }}>{archetype.name[lang]}</h1>
      <p className="ob-sub">{archetype.tagline[lang]}</p>
      {goalLabels.length ? (
        <div style={{ marginTop: 22 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: OB.inkTertiary, textAlign: "center" }}>{c.yourGoal}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 10 }}>
            {goalLabels.map((g) => (
              <span key={g!.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, background: "#fff", border: "1px solid color-mix(in srgb, #2E62C4 25%, transparent)", padding: "9px 14px", fontSize: 15, fontWeight: 600 }}>
                {g!.emoji} {g!.label[lang]}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 28 }}>{c.coursesWaiting}</h2>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", marginTop: 14, paddingBottom: 8, scrollbarWidth: "none" }}>
        {courses.map((course) => (
          <div key={course.id} style={{ position: "relative", flexShrink: 0, width: 168, height: 214, borderRadius: 20, overflow: "hidden", background: OB.ink }}>
            <img src={course.img} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(0,0,0,.75))" }} />
            <div style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
              <span className="ob-pill">{course.subject}</span>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.25, margin: "6px 0 0" }}>{course.title[lang]}</p>
            </div>
          </div>
        ))}
      </div>
      {ready ? <PrimaryBtn onClick={onNext}>{c.profileCta}</PrimaryBtn> : <div style={{ height: 76 }} />}
    </>
  );
}

function EmailStep({ lang, c, value, onSubmit, onSkip }: {
  lang: StartLang; c: C; value: string; onSubmit: (email: string) => void; onSkip: () => void;
}) {
  const [email, setEmail] = useState(value);
  const [error, setError] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <>
      <div className="ob-spacer" />
      <h1 className="ob-title-lg">{c.emailTitle}</h1>
      <p className="ob-sub">{c.emailSub}</p>
      <div className="ob-reveal" style={{ "--d": "150ms", display: "flex", alignItems: "center", gap: 10, borderRadius: 14, background: "color-mix(in srgb, #F2548F 8%, transparent)", padding: "12px 14px", marginTop: 22 } as React.CSSProperties}>
        <TrendingUp style={{ width: 20, height: 20, color: OB.pink, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}><Highlight text={c.emailStat} /></span>
      </div>
      <div className="ob-reveal" style={{ "--d": "250ms", borderRadius: 20, border: `1px solid ${OB.hairline}`, background: "#fff", padding: 16, marginTop: 16, display: "flex", gap: 12, alignItems: "flex-start" } as React.CSSProperties}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: "color-mix(in srgb, #2E62C4 12%, transparent)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>🔔</span>
        <span>
          <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: OB.inkTertiary }}>Sophia</span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{c.notifTitle}</span>
          <span style={{ display: "block", fontSize: 14, color: OB.inkSecondary }}>{c.notifBody}</span>
        </span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {c.emailBullets.map((b) => <li key={b} style={{ fontSize: 15, fontWeight: 500 }}>{b}</li>)}
      </ul>
      <form style={{ marginTop: 18 }} onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(email.trim()); else setError(true); }}>
        <input className="ob-input" type="email" inputMode="email" autoComplete="email" style={{ fontSize: 17 }}
          placeholder={c.emailPlaceholder} value={email}
          onChange={(e) => { setEmail(e.target.value); setError(false); }} />
        {error ? <p style={{ color: OB.danger, fontSize: 13, fontWeight: 600, textAlign: "center", marginTop: 8 }}>{c.emailInvalid}</p> : null}
      </form>
      <PrimaryBtn onClick={() => (valid ? onSubmit(email.trim()) : setError(true))}>{c.emailCta}</PrimaryBtn>
      <div style={{ textAlign: "center" }}>
        <button type="button" className="ob-link ob-link-soft" onClick={onSkip}>{c.maybeLater}</button>
      </div>
    </>
  );
}

function AccountStep({ c, value, onSubmit, onProvider }: { lang: StartLang; c: C; value: string; onSubmit: (email: string) => void; onProvider: (p: "apple" | "google") => void }) {
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [email, setEmail] = useState(value);
  const [error, setError] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const btn: React.CSSProperties = { display: "flex", width: "100%", minHeight: 56, alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 999, fontSize: 17, fontWeight: 600 };
  return (
    <>
      <div className="ob-spacer" />
      <div style={{ display: "grid", placeItems: "center", marginBottom: 22 }}>
        <img src="/onboarding/splash_logo.png" alt="Sophia" className="ob-pop" style={{ width: 84, height: 84, borderRadius: 22 }} />
      </div>
      <h1 className="ob-title">{c.accountTitle}</h1>
      <p className="ob-sub">{c.accountSub}</p>
      {mode === "choose" ? (
        <div className="ob-footer" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button type="button" style={{ ...btn, background: OB.ink, color: "#fff" }} onClick={() => onProvider("apple")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.77-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" /></svg>
            {c.accountApple}
          </button>
          <button type="button" style={{ ...btn, background: OB.surface, color: OB.ink, border: `1px solid ${OB.hairline}` }} onClick={() => onProvider("google")}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"/></svg>
            {c.accountGoogle}
          </button>
          <p style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: OB.inkTertiary }}>{c.accountOr}</p>
          <button type="button" className="ob-link" style={{ margin: "0 auto" }} onClick={() => setMode("email")}>{c.accountEmail}</button>
          <p style={{ textAlign: "center", fontSize: 11, color: OB.inkTertiary, marginTop: 4 }}>{c.accountLegal} {c.accountLegalLinks}</p>
        </div>
      ) : (
        <>
          <form style={{ marginTop: 26 }} onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(email.trim()); else setError(true); }}>
            <input className="ob-input" type="email" inputMode="email" autoComplete="email" autoFocus style={{ fontSize: 17 }}
              placeholder={c.emailPlaceholder} value={email}
              onChange={(e) => { setEmail(e.target.value); setError(false); }} />
            {error ? <p style={{ color: OB.danger, fontSize: 13, fontWeight: 600, textAlign: "center", marginTop: 8 }}>{c.emailInvalid}</p> : null}
          </form>
          <PrimaryBtn onClick={() => (valid ? onSubmit(email.trim()) : setError(true))}>{c.continue}</PrimaryBtn>
          <p style={{ textAlign: "center", fontSize: 11, color: OB.inkTertiary, marginTop: 14 }}>{c.accountLegal} {c.accountLegalLinks}</p>
        </>
      )}
    </>
  );
}

function TrialStep({ lang, c, onNext }: { lang: StartLang; c: C; onNext: () => void }) {
  const endDate = new Date(Date.now() + PRICING.yearly.trialDays * 86400000);
  const formatted = new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long" }).format(endDate);
  const icons = [
    <Check key="c" className="size-5" strokeWidth={3} />,
    <LockOpen key="l" className="size-5" />,
    <Bell key="b" className="size-5" />,
    <Star key="s" className="size-5" />,
  ];
  return (
    <>
      <div className="ob-spacer" />
      <h1 className="ob-title-lg ob-title-left">{c.trialTitle}</h1>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 30, position: "relative" }}>
        <span style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 3, borderRadius: 3, background: "color-mix(in srgb, #2E62C4 18%, transparent)" }} aria-hidden="true" />
        {c.trialSteps.map((s, i) => {
          const active = i < 2;
          return (
            <div key={s.title} className="ob-reveal" style={{ "--d": `${i * 160}ms`, display: "flex", gap: 16, minHeight: 46, marginBottom: 18 } as React.CSSProperties}>
              <span style={{
                width: 40, height: 40, borderRadius: 999, flexShrink: 0, display: "grid", placeItems: "center", zIndex: 1,
                background: active ? OB.accentSoft : OB.surfaceMuted, color: active ? "#fff" : OB.inkTertiary,
              }}>
                {icons[i]}
              </span>
              <span>
                <span style={{ display: "block", fontSize: 17, fontWeight: 700, color: i === 1 ? OB.accentSoft : active ? OB.ink : OB.inkSecondary }}>{s.title}</span>
                <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: OB.inkSecondary, marginTop: 2 }}>
                  {i === 3 ? c.trialEndsBody(formatted) : s.body}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <PrimaryBtn onClick={onNext}>{c.trialCta}</PrimaryBtn>
    </>
  );
}

function LegalRow({ c, storeHref }: { c: C; storeHref: string }) {
  return (
    <div className="ob-legal">
      <a href={storeHref} style={{ color: "inherit" }}>{c.legalLogin}</a>
      <span>·</span><span>{c.legalTerms}</span>
      <span>·</span><span>{c.legalPrivacy}</span>
    </div>
  );
}

function PaywallB({ lang, c, plan, onPlan, onClose, onCta, storeHref }: {
  lang: StartLang; c: C; plan: "yearly" | "monthly";
  onPlan: (p: "yearly" | "monthly") => void; onClose: () => void; onCta: () => void; storeHref: string;
}) {
  const rows: [string, boolean, boolean][] = [
    [c.cmpRows[0]!, true, true], [c.cmpRows[1]!, true, true], [c.cmpRows[2]!, false, true],
    [c.cmpRows[3]!, false, true], [c.cmpRows[4]!, false, true], [c.cmpRows[5]!, false, true],
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
      <button type="button" className="ob-x" aria-label="Close" onClick={onClose}><X className="size-4" /></button>
      <div style={{ height: 52 }} />
      <h1 className="ob-title ob-title-left">{c.paywallBTitle}</h1>
      <div className="ob-cmp">
        <table>
          <thead>
            <tr>
              <th />
              <th style={{ fontSize: 12, fontWeight: 600, color: OB.inkTertiary }}>{c.freeCol}</th>
              <th className="ob-pro-col">
                <Crown style={{ width: 16, height: 16, color: OB.gold, margin: "0 auto 4px" }} fill="currentColor" strokeWidth={0} />
                <span className="ob-pro-pill">PRO</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, free, pro]) => (
              <tr key={label}>
                <td>{label}</td>
                <td className="ob-cmp-cell" style={{ color: free ? OB.inkTertiary : "color-mix(in srgb, #9AA4B2 60%, transparent)" }}>
                  {free ? <Check className="size-4" style={{ margin: "0 auto" }} /> : <X className="size-4" style={{ margin: "0 auto" }} />}
                </td>
                <td className="ob-cmp-cell ob-pro-col">
                  {pro ? (
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: OB.accentSoft, color: "#fff", display: "inline-grid", placeItems: "center" }}>
                      <Check className="size-3" strokeWidth={3.5} />
                    </span>
                  ) : <X className="size-4" style={{ margin: "0 auto" }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto", paddingTop: 18 }}>
        <button type="button" className="ob-plan" data-on={plan === "yearly"} onClick={() => onPlan("yearly")}>
          <span className="ob-save">{c.planSave}</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 700 }}>{c.planYearly}</span>
            <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: OB.inkSecondary }}>{c.planYearlyBilled}</span>
          </span>
          <span style={{ textAlign: "right" }}>
            <span style={{ display: "block", fontSize: 17, fontWeight: 700 }}>{c.planYearlyPer}</span>
            <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: OB.success }}>{c.planTrialBadge}</span>
          </span>
        </button>
        <button type="button" className="ob-plan" data-on={plan === "monthly"} onClick={() => onPlan("monthly")}>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 700 }}>{c.planMonthly}</span>
            <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: OB.inkSecondary }}>{c.planMonthlyBilled}</span>
          </span>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{c.planMonthlyPer}</span>
        </button>
        <button type="button" className="ob-primary" style={{ marginTop: 4 }} onClick={onCta}>
          {plan === "yearly" ? c.trialCtaLong : c.subscribeNow}
        </button>
        <LegalRow c={c} storeHref={storeHref} />
      </div>
    </div>
  );
}
