import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Apple, Play } from "lucide-react";
import { LogoMark } from "@/components/site/Logo";
import { appStoreHref, PLAY_STORE_URL } from "@/config/links";
import {
  COPY, DAILY_TIMES, GOALS, INTERESTS, LEVELS, PLANS, QUIZ, REMINDERS, STEPS,
  buildPlan, type Option, type StartLang, type StepId,
} from "@/config/onboarding";
import { captureAttribution, trackStart } from "@/lib/onboarding-events";

type Answers = {
  interests: string[]; level?: string; goal?: string; time?: string; reminder?: string;
  quiz: (number | null)[]; plan?: string;
};
const EMPTY: Answers = { interests: [], quiz: [null, null, null] };
const STORE_KEY = "sophia_start_answers";

function loadAnswers(): Answers {
  try { return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}") }; } catch { return EMPTY; }
}

export function StartFunnel({ lang }: { lang: StartLang }) {
  const c = COPY[lang];
  const [step, setStep] = useState<StepId>("welcome");
  const [a, setA] = useState<Answers>(EMPTY);
  const [isIos, setIsIos] = useState(false);
  const [src, setSrc] = useState("direct");
  const idx = STEPS.indexOf(step);

  useEffect(() => {
    const attr = captureAttribution();
    setSrc(attr["src"] ?? "direct");
    setA(loadAnswers());
    setIsIos(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    trackStart("view", { lang });
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { startStep?: StepId } | null)?.startStep;
      setStep(s && STEPS.includes(s) ? s : "welcome");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [lang]);

  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(a)); } catch { /* ignore */ }
  }, [a]);

  useEffect(() => {
    trackStart("step_view", { step, index: idx });
    window.scrollTo(0, 0);
  }, [step, idx]);

  const go = (next: StepId) => {
    try { window.history.pushState({ startStep: next }, ""); } catch { /* ignore */ }
    setStep(next);
  };
  const nextStep = () => go(STEPS[Math.min(idx + 1, STEPS.length - 1)]!);
  const back = () => (idx > 0 ? window.history.back() : undefined);

  const pick = (key: "level" | "goal" | "time" | "reminder", value: string) => {
    setA((p) => ({ ...p, [key]: value }));
    trackStart("step_answer", { step, answer: value });
    window.setTimeout(nextStep, 220);
  };

  const showChrome = step !== "welcome" && step !== "building" && step !== "success";
  const pct = Math.round((idx / (STEPS.length - 1)) * 100);

  return (
    <div className="ob-shell">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
        {showChrome ? (
          <div className="flex items-center gap-3 py-2">
            <button type="button" onClick={back} aria-label={c.back} className="ob-icon-btn">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <div className="ob-progress" role="progressbar" aria-label={c.progress} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : null}

        <div key={step} className="ob-step flex flex-1 flex-col">
          {step === "welcome" && (
            <Centered>
              <LogoMark className="mx-auto h-20 w-auto text-brand-navy" />
              <h1 className="ob-title mt-8 text-center">{c.welcomeTitle}</h1>
              <p className="ob-text mt-4 text-center">{c.welcomeText}</p>
              <Footer><PrimaryBtn onClick={nextStep}>{c.start}</PrimaryBtn></Footer>
            </Centered>
          )}

          {step === "interests" && (
            <>
              <h1 className="ob-title mt-4">{c.interestsTitle}</h1>
              <p className="ob-text mt-2">{c.interestsHint}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {INTERESTS.map((o) => {
                  const on = a.interests.includes(o.id);
                  return (
                    <button key={o.id} type="button" aria-pressed={on} data-on={on} className="ob-option flex-col !items-start"
                      onClick={() => setA((p) => ({ ...p, interests: on ? p.interests.filter((x) => x !== o.id) : [...p.interests, o.id] }))}>
                      <span className="text-2xl" aria-hidden="true">{o.emoji}</span>
                      <span>{o.label[lang]}</span>
                    </button>
                  );
                })}
              </div>
              <Footer>
                <PrimaryBtn disabled={!a.interests.length} onClick={() => { trackStart("step_answer", { step, answer: a.interests.join(",") }); nextStep(); }}>{c.next}</PrimaryBtn>
              </Footer>
            </>
          )}

          {step === "level" && <Choice title={c.levelTitle} options={LEVELS} lang={lang} value={a.level} onPick={(v) => pick("level", v)} />}
          {step === "goal" && <Choice title={c.goalTitle} options={GOALS} lang={lang} value={a.goal} onPick={(v) => pick("goal", v)} />}
          {step === "time" && <Choice title={c.timeTitle} options={DAILY_TIMES} lang={lang} value={a.time} onPick={(v) => pick("time", v)} />}

          {(step === "quiz0" || step === "quiz1" || step === "quiz2") && (
            <QuizStep
              key={step}
              lang={lang}
              n={Number(step.slice(-1))}
              chosen={a.quiz[Number(step.slice(-1))] ?? null}
              onAnswer={(i, qi) => {
                setA((p) => { const quiz = [...p.quiz]; quiz[qi] = i; return { ...p, quiz }; });
                trackStart("quiz_answer", { question: QUIZ[qi]!.id, correct: i === QUIZ[qi]!.correct ? 1 : 0 });
              }}
              onNext={nextStep}
            />
          )}

          {step === "reminder" && <Choice title={c.reminderTitle} options={REMINDERS} lang={lang} value={a.reminder} onPick={(v) => pick("reminder", v)} />}

          {step === "building" && <Building lang={lang} onDone={nextStep} />}

          {step === "result" && <Result lang={lang} a={a} onNext={() => { trackStart("plan_shown"); nextStep(); }} />}

          {step === "paywall" && (
            <>
              <h1 className="ob-title mt-4">{c.paywallTitle}</h1>
              <ul className="mt-5 flex flex-col gap-3">
                {c.paywallPerks.map((p) => (
                  <li key={p} className="flex items-center gap-3 font-semibold text-brand-navy">
                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-pink/40"><Check className="size-3.5" aria-hidden="true" /></span>{p}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3">
                {PLANS.map((p) => {
                  const on = (a.plan ?? "yearly") === p.id;
                  return (
                    <button key={p.id} type="button" data-on={on} aria-pressed={on} className="ob-option relative justify-between"
                      onClick={() => { setA((x) => ({ ...x, plan: p.id })); trackStart("plan_selected", { plan: p.id }); }}>
                      {p.badge ? <span className="ob-badge">{p.badge[lang]}</span> : null}
                      <span className="flex flex-col items-start text-left">
                        <span className="text-lg font-extrabold">{p.price[lang]} <span className="text-sm font-semibold opacity-70">{p.per[lang]}</span></span>
                        <span className="text-sm font-medium opacity-70">{p.trialDays ? c.trial(p.trialDays) + " · " : ""}{p.note[lang]}</span>
                      </span>
                      <span className="ob-radio" data-on={on} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <Footer>
                <PrimaryBtn onClick={() => { trackStart("paywall_continue", { plan: a.plan ?? "yearly" }); nextStep(); }}>{c.paywallCta}</PrimaryBtn>
                <p className="mt-3 text-center text-xs text-brand-navySoft">{c.paywallNote}</p>
              </Footer>
            </>
          )}

          {step === "success" && (
            <Centered>
              <div className="ob-success-badge mx-auto"><Check className="size-10" aria-hidden="true" /></div>
              <h1 className="ob-title mt-6 text-center">{c.successTitle}</h1>
              <p className="ob-text mt-3 text-center">{c.successText}</p>
              <Footer>
                <StoreLinks lang={lang} src={src} iosFirst={isIos} />
                <p className="mt-4 text-center text-xs text-brand-navySoft">{c.openBrowser}</p>
              </Footer>
            </Centered>
          )}
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col justify-center pt-10">{children}</div>;
}
function Footer({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto pt-8">{children}</div>;
}
function PrimaryBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="ob-primary" />;
}

function Choice({ title, options, lang, value, onPick }: { title: string; options: Option[]; lang: StartLang; value?: string | undefined; onPick: (v: string) => void }) {
  return (
    <>
      <h1 className="ob-title mt-4">{title}</h1>
      <div className="mt-6 flex flex-col gap-3">
        {options.map((o) => (
          <button key={o.id} type="button" data-on={value === o.id} aria-pressed={value === o.id} className="ob-option" onClick={() => onPick(o.id)}>
            <span className="text-2xl" aria-hidden="true">{o.emoji}</span><span>{o.label[lang]}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function QuizStep({ lang, n, chosen, onAnswer, onNext }: { lang: StartLang; n: number; chosen: number | null; onAnswer: (i: number, q: number) => void; onNext: () => void }) {
  const c = COPY[lang];
  const q = QUIZ[n]!;
  const answered = chosen !== null;
  return (
    <>
      <p className="mt-4 text-sm font-bold uppercase tracking-widest text-brand-pink">{c.quizIntro} · {n + 1}/3</p>
      <h1 className="ob-title mt-2">{q.q[lang]}</h1>
      <div className="mt-6 flex flex-col gap-3">
        {q.answers[lang].map((ans, i) => {
          const state = !answered ? undefined : i === q.correct ? "right" : i === chosen ? "wrong" : "dim";
          return (
            <button key={ans} type="button" disabled={answered} data-state={state} className="ob-option" onClick={() => onAnswer(i, n)}>{ans}</button>
          );
        })}
      </div>
      {answered ? (
        <div className="ob-fact mt-5" role="status">
          <p className="font-extrabold">{chosen === q.correct ? c.correct : c.wrong}</p>
          <p className="mt-1 text-sm"><strong>{c.funFact}</strong> {q.fact[lang]}</p>
        </div>
      ) : null}
      <Footer><PrimaryBtn disabled={!answered} onClick={onNext}>{c.next}</PrimaryBtn></Footer>
    </>
  );
}

function Building({ lang, onDone }: { lang: StartLang; onDone: () => void }) {
  const c = COPY[lang];
  const [pct, setPct] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const t = window.setInterval(() => setPct((p) => Math.min(100, p + 4)), 100);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (pct >= 100 && !done.current) { done.current = true; window.setTimeout(onDone, 400); }
  }, [pct, onDone]);
  return (
    <Centered>
      <div className="ob-ring mx-auto" style={{ "--p": `${pct * 3.6}deg` } as React.CSSProperties}><span>{pct}%</span></div>
      <h1 className="ob-title mt-8 text-center">{c.buildingTitle}</h1>
      <ul className="mx-auto mt-6 flex flex-col gap-3">
        {c.buildingSteps.map((s, i) => {
          const on = pct >= (i + 1) * 30;
          return (
            <li key={s} className={`flex items-center gap-3 font-semibold transition-opacity ${on ? "text-brand-navy" : "text-brand-navySoft opacity-50"}`}>
              <span className={`inline-flex size-6 items-center justify-center rounded-full ${on ? "bg-brand-pink" : "bg-brand-line"}`}>{on ? <Check className="size-3.5" aria-hidden="true" /> : null}</span>{s}
            </li>
          );
        })}
      </ul>
    </Centered>
  );
}

function Result({ lang, a, onNext }: { lang: StartLang; a: Answers; onNext: () => void }) {
  const c = COPY[lang];
  const plan = useMemo(() => buildPlan(a.interests), [a.interests]);
  const score = a.quiz.filter((x, i) => x === QUIZ[i]!.correct).length;
  const label = (id: string) => INTERESTS.find((i) => i.id === id);
  return (
    <>
      <h1 className="ob-title mt-4">{c.resultTitle}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="ob-chip">🏆 {c.resultScore(score)}</span>
        <span className="ob-chip">⏱️ {c.resultMinutes(a.time ?? "5")}</span>
      </div>
      <ol className="mt-6 flex flex-col gap-3">
        {plan.map((id, w) => (
          <li key={w} className="ob-card flex items-center gap-4">
            <span className="text-3xl" aria-hidden="true">{label(id)?.emoji}</span>
            <span className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-pink">{c.planWeek(w + 1)} · {c.planWeeks[w]}</span>
              <span className="font-extrabold text-brand-navy">{label(id)?.label[lang]}</span>
            </span>
          </li>
        ))}
      </ol>
      <Footer><PrimaryBtn onClick={onNext}>{c.resultCta}</PrimaryBtn></Footer>
    </>
  );
}

function StoreLinks({ lang, src, iosFirst }: { lang: StartLang; src: string; iosFirst: boolean }) {
  const c = COPY[lang];
  const play = `${PLAY_STORE_URL}&referrer=${encodeURIComponent(`utm_source=${src}&utm_medium=web_start`)}`;
  const links = [
    { id: "ios", href: appStoreHref(), label: c.appStore, Icon: Apple },
    { id: "android", href: play, label: c.play, Icon: Play },
  ];
  if (!iosFirst) links.reverse();
  return (
    <div className="flex flex-col gap-3">
      {links.map(({ id, href, label, Icon }, i) => (
        <a key={id} href={href} className={i === 0 ? "ob-primary" : "ob-secondary"} onClick={() => trackStart("store_click", { store: id })}>
          <Icon className="size-5" aria-hidden="true" />{label}
        </a>
      ))}
    </div>
  );
}
