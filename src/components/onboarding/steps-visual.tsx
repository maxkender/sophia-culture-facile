import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart, Lock, Search, Sparkles, X } from "lucide-react";
import {
  AUTHOR_PHOTOS, INTRO_COURSES, OB, QUIZ_GRID_IMAGES, REVIEWS, ROULETTE_QUESTIONS,
  UNIVERSITY_LOGOS, screenYears, type Course, type StartLang,
} from "@/config/onboarding";
import { AvatarStack, Highlight } from "./funnel-ui";

/* ------------------------- intro carousel (step 3) ------------------------- */

export function IntroVisual({ page, lang }: { page: number; lang: StartLang }) {
  if (page === 0) return <LessonsVisual lang={lang} />;
  if (page === 1) return <ResearchersVisual />;
  if (page === 2) return <QuizzesVisual />;
  return <PathVisual lang={lang} />;
}

function LessonsVisual({ lang }: { lang: StartLang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 4px" }}>
      {INTRO_COURSES.map((course, i) => (
        <div key={course.id} className="ob-course-card ob-reveal" style={{ "--d": `${i * 220}ms` } as React.CSSProperties}>
          <img src={course.img} alt="" loading="lazy" />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: course.color, filter: "brightness(0.8)" }}>
              {course.subject}
            </span>
            <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 15, fontWeight: 700, color: OB.ink, lineHeight: 1.25 }}>
              {course.title[lang]}
            </span>
          </span>
          <span className="ob-chip-time">🕒 10 min</span>
        </div>
      ))}
    </div>
  );
}

function ResearchersVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <div className="ob-stack" style={{ justifyContent: "center" }}>
        {AUTHOR_PHOTOS.map((p, i) => (
          <img key={p} src={p} alt="" width={60} height={60} loading="lazy" className="ob-pop"
            style={{ width: 60, height: 60, borderRadius: 999, border: "2.5px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,.12)", objectFit: "cover", marginLeft: i ? -12 : 0, animationDelay: `${i * 110}ms` }} />
        ))}
      </div>
      <div className="ob-marquee" style={{ width: "100%" }}>
        <div className="ob-marquee-track">
          {[...UNIVERSITY_LOGOS, ...UNIVERSITY_LOGOS].map((logo, i) => (
            <img key={i} src={logo} alt="" loading="lazy" style={{ height: 72, width: 115, objectFit: "contain" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizzesVisual() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {QUIZ_GRID_IMAGES.map((img, i) => (
        <div key={img} className="ob-pop" style={{ position: "relative", animationDelay: `${i * 140}ms` }}>
          <img src={img} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "1", borderRadius: 18, border: "1px solid rgba(255,255,255,.8)", boxShadow: "0 6px 10px rgba(0,0,0,.10)", objectFit: "cover" }} />
          {[1, 3, 4].includes(i) ? (
            <span className="ob-pop" style={{ position: "absolute", top: -6, right: -6, width: 26, height: 26, borderRadius: 999, background: OB.success, border: "2px solid #fff", display: "grid", placeItems: "center", color: "#fff", animationDelay: `${900 + i * 300}ms` }}>
              <Check className="size-3.5" strokeWidth={3.5} />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PathVisual({ lang }: { lang: StartLang }) {
  const captions = {
    fr: ["La découverte de la pénicilline (Fleming, 1928)", "La structure de l'ADN (Watson & Crick, 1953)", "L'IA va-t-elle remplacer les métiers du savoir ?"],
    en: ["The discovery of penicillin", "The structure of DNA", "Will AI replace knowledge work?"],
  }[lang];
  const pods = [
    { x: -0.55, tint: "#33D499", state: "done" as const },
    { x: 0.6, tint: "#40B8D9", state: "current" as const },
    { x: -0.55, tint: "#40B8D9", state: "locked" as const },
  ];
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 0" }}>
      <svg width="4" height="210" style={{ position: "absolute", top: 30 }} aria-hidden="true">
        <line x1="2" y1="0" x2="2" y2="210" stroke={OB.hairline} strokeWidth="4" strokeLinecap="round" />
      </svg>
      {pods.map((pod, i) => (
        <div key={i} className="ob-reveal" style={{ "--d": `${i * 180}ms`, transform: `translateX(${pod.x * 60}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, zIndex: 1 } as React.CSSProperties}>
          <span style={{ position: "relative", display: "grid", placeItems: "center" }}>
            {pod.state === "current" ? <span className="ob-halo" style={{ width: 84, height: 84, background: pod.tint, opacity: 0.22 }} /> : null}
            <span style={{
              width: 56, height: 56, borderRadius: 999, display: "grid", placeItems: "center",
              background: pod.state === "done" ? pod.tint : pod.state === "current" ? "#fff" : OB.surfaceMuted,
              border: pod.state === "current" ? `4px solid ${pod.tint}` : `1px solid ${OB.hairline}`,
              boxShadow: `0 6px 0 color-mix(in srgb, ${pod.tint} 55%, #98a2b3)`,
              color: pod.state === "done" ? "#fff" : pod.state === "current" ? pod.tint : OB.inkTertiary,
            }}>
              {pod.state === "done" ? <Check className="size-6" strokeWidth={3} /> : pod.state === "current" ? <Sparkles className="size-5" /> : <Lock className="size-5" />}
            </span>
          </span>
          <span style={{ maxWidth: 150, fontSize: 11, fontWeight: 600, color: OB.inkSecondary, textAlign: "center", lineHeight: 1.25 }}>{captions[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------- roulettes (steps 13 & 17) ------------------------- */

export function Roulette({ items, interval, renderCard }: {
  items: number; interval: number; renderCard: (i: number) => React.ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setOffset((o) => o + 1), interval);
    return () => window.clearInterval(t);
  }, [interval]);
  const slots = [-1, 0, 1, 2];
  return (
    <div className="ob-roulette">
      {slots.map((slot) => {
        const idx = ((offset + slot) % items + items) % items;
        const focused = slot === 0;
        return (
          <div key={slot} className="ob-roulette-card" style={{
            transform: `translateY(calc(-50% + ${slot * 104}px)) scale(${focused ? 1 : 0.84})`,
            opacity: focused ? 1 : 0.42, filter: focused ? "none" : "blur(2px)",
            boxShadow: focused ? "0 8px 16px rgba(0,0,0,.08)" : "0 4px 8px rgba(0,0,0,.03)",
          }}>
            {renderCard(idx)}
          </div>
        );
      })}
    </div>
  );
}

export function QuestionCard({ index, lang }: { index: number; lang: StartLang }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span style={{ position: "relative", flexShrink: 0, color: OB.accentSoft }}>
        <Search className="size-[22px]" />
        <Sparkles className="size-3" style={{ position: "absolute", top: -6, right: -8 }} />
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, color: OB.ink }}>{ROULETTE_QUESTIONS[index]![lang]}</span>
    </div>
  );
}

export function ReviewCard({ index, lang }: { index: number; lang: StartLang }) {
  const r = REVIEWS[index]!;
  return (
    <div style={{ minHeight: 148 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {r.avatar ? (
          <img src={r.avatar} alt="" width={36} height={36} loading="lazy" style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover" }} />
        ) : (
          <span style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg,#8CD9EB,#4099BF)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>M</span>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: OB.inkSecondary }}>{r.name}, {r.age}</span>
        <span className="ob-stars" style={{ marginLeft: "auto" }}>
          {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ color: OB.gold, fontSize: 12 }}>★</span>)}
        </span>
      </div>
      <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.4, color: OB.ink, margin: 0 }}>{r.quote[lang]}</p>
    </div>
  );
}

/* ------------------------- life in years (step 15) ------------------------- */

type YearsPhase = "appear" | "sleep" | "work" | "free" | "dim" | "screen" | "done";

export function YearsGrid({ minutes, lang, onReady }: { minutes: number; lang: StartLang; onReady: () => void }) {
  const sy = screenYears(minutes);
  const [phase, setPhase] = useState<YearsPhase>("appear");
  const [count, setCount] = useState(0);
  const ready = useRef(false);

  useEffect(() => {
    let timer: number;
    if (phase === "appear") {
      if (count < 80) timer = window.setTimeout(() => setCount((n) => n + 1), 10);
      else { setCount(0); setPhase("sleep"); }
    } else if (phase === "sleep" || phase === "work" || phase === "free") {
      const target = phase === "free" ? 26 : 27;
      if (count < target) timer = window.setTimeout(() => setCount((n) => n + 1), 30);
      else if (phase === "sleep") { setCount(0); setPhase("work"); }
      else if (phase === "work") { setCount(0); setPhase("free"); }
      else timer = window.setTimeout(() => { setCount(0); setPhase("dim"); }, 500);
    } else if (phase === "dim") {
      timer = window.setTimeout(() => setPhase("screen"), 350);
    } else if (phase === "screen") {
      if (count < sy) timer = window.setTimeout(() => setCount((n) => n + 1), 140);
      else {
        setPhase("done");
        if (!ready.current) { ready.current = true; onReady(); }
      }
    }
    return () => window.clearTimeout(timer);
  }, [phase, count, sy, onReady]);

  const squareColor = (i: number): { bg: string; opacity: number } => {
    const inSleep = i < 27, inWork = i >= 27 && i < 54, inFree = i >= 54;
    if (phase === "appear") return { bg: OB.hairline, opacity: i < count ? 0.7 : 0.15 };
    if (phase === "sleep") return { bg: inSleep && i < count ? "#4C9E6B" : OB.hairline, opacity: inSleep && i < count ? 1 : 0.7 };
    if (phase === "work") return { bg: inSleep ? "#4C9E6B" : inWork && i - 27 < count ? "#8C613D" : OB.hairline, opacity: 1 };
    if (phase === "free") return { bg: inSleep ? "#4C9E6B" : inWork ? "#8C613D" : i - 54 < count ? "#B8D1F2" : OB.hairline, opacity: 1 };
    // dim + screen + done
    const screenIdx = i - 54;
    const isScreen = inFree && (phase === "done" ? screenIdx < sy : screenIdx < count);
    return {
      bg: isScreen ? OB.danger : inSleep ? "#4C9E6B" : inWork ? "#8C613D" : "#B8D1F2",
      opacity: isScreen ? 1 : inFree ? 1 : 0.3,
    };
  };

  const unit = (n: number) => (lang === "fr" ? (n <= 1 ? "an" : "ans") : n <= 1 ? "year" : "years");
  const legend = [
    { color: "#4C9E6B", label: lang === "fr" ? "Sommeil" : "Sleep", value: `27 ${unit(27)}` },
    { color: "#8C613D", label: lang === "fr" ? "Travail" : "Work", value: `27 ${unit(27)}` },
    { color: "#B8D1F2", label: lang === "fr" ? "Temps libre" : "Free time", value: `26 ${unit(26)}` },
    { color: OB.danger, label: lang === "fr" ? "Sur ton téléphone" : "On your phone", value: `${sy} ${unit(sy)}` },
  ];

  return (
    <div>
      <div className="ob-years" role="img" aria-label="80 squares">
        {Array.from({ length: 80 }, (_, i) => {
          const s = squareColor(i);
          return <span key={i} style={{ background: s.bg, opacity: s.opacity }} />;
        })}
      </div>
      <div className="ob-legend" style={{ marginTop: 20 }}>
        {legend.map((l) => (
          <span key={l.label}><i style={{ background: l.color }} />{l.label} <b>{l.value}</b></span>
        ))}
      </div>
      {phase === "done" ? (
        <div className="ob-reveal" style={{ textAlign: "center", marginTop: 24 }}>
          <div className="ob-bignum" style={{ fontSize: 44, color: OB.danger }}>{sy} {unit(sy)}</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: OB.danger, margin: "6px 0 0" }}>
            {lang === "fr"
              ? `Sur tes 26 années de temps libre, tu en passes ${sy} sur ton téléphone.`
              : `Of your 26 years of free time, you spend ${sy} on your phone.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------- swipe deck (step 19) ------------------------- */

export function SwipeDeck({ deck, lang, onDone }: { deck: Course[]; lang: StartLang; onDone: (liked: string[]) => void }) {
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [drag, setDrag] = useState({ dx: 0, active: false });
  const [fly, setFly] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);

  const choose = (like: boolean) => {
    if (fly) return;
    const card = deck[index];
    if (!card) return;
    setFly(like ? "right" : "left");
    window.setTimeout(() => {
      const nextLiked = like ? [...liked, card.id] : liked;
      setLiked(nextLiked);
      setFly(null);
      setDrag({ dx: 0, active: false });
      if (index + 1 >= deck.length) window.setTimeout(() => onDone(nextLiked), 1500);
      setIndex((i) => i + 1);
    }, 280);
  };

  if (index >= deck.length) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 300 }}>
        <span className="ob-pop" style={{ width: 120, height: 120, borderRadius: 999, background: OB.success, display: "grid", placeItems: "center", color: "#fff" }}>
          <Check className="size-14" strokeWidth={3} />
        </span>
        <p style={{ marginTop: 18, fontSize: 22, fontWeight: 800 }}>{lang === "fr" ? "C'est noté !" : "Got it!"}</p>
      </div>
    );
  }

  const visible = deck.slice(index, index + 3);
  return (
    <>
      <div className="ob-deck">
        {visible.map((card, depth) => {
          const isTop = depth === 0;
          const dx = isTop ? drag.dx : 0;
          const flyX = isTop && fly ? (fly === "right" ? 600 : -600) : 0;
          const x = dx + flyX;
          return (
            <div key={card.id} className="ob-swipe-card" style={{
              transform: `translateX(${x}px) translateY(${depth * 12}px) scale(${1 - depth * 0.04}) rotate(${isTop ? x / 18 : 0}deg)`,
              transition: drag.active || !isTop ? "none" : "transform 280ms ease",
              zIndex: 10 - depth,
            }}
              onPointerDown={(e) => { if (!isTop) return; startX.current = e.clientX; setDrag({ dx: 0, active: true }); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
              onPointerMove={(e) => { if (isTop && drag.active) setDrag({ dx: e.clientX - startX.current, active: true }); }}
              onPointerUp={() => {
                if (!isTop || !drag.active) return;
                if (Math.abs(drag.dx) > 100) choose(drag.dx > 0);
                else setDrag({ dx: 0, active: false });
              }}
            >
              <img src={card.img} alt="" draggable={false} />
              <span className="ob-swipe-grad" />
              {isTop && Math.abs(x) > 20 ? (
                <span className="ob-stamp" style={{
                  left: x > 0 ? 18 : undefined, right: x < 0 ? 18 : undefined,
                  color: x > 0 ? OB.success : OB.danger,
                  transform: `rotate(${x > 0 ? -12 : 12}deg)`, opacity: Math.min(1, Math.abs(x) / 110),
                }}>
                  {x > 0 ? "LIKE" : "NOPE"}
                </span>
              ) : null}
              <div className="ob-swipe-info">
                <span className="ob-pill">{card.subject}</span>
                <h3>{card.title[lang]}</h3>
              </div>
            </div>
          );
        })}
      </div>
      <div className="ob-swipe-btns">
        <button type="button" aria-label={lang === "fr" ? "Non" : "Nope"} onClick={() => choose(false)} style={{ color: OB.danger }}>
          <X className="size-7" strokeWidth={3} />
        </button>
        <button type="button" aria-label={lang === "fr" ? "J'aime" : "Like"} onClick={() => choose(true)} style={{ color: OB.success }}>
          <Heart className="size-7" fill="currentColor" strokeWidth={0} />
        </button>
      </div>
    </>
  );
}

/* ------------------------- reading-time sky (step 22) ------------------------- */

export function ReadingSky({ hour }: { hour: number }) {
  // daylight 0 (night) → 1 (noon)
  const daylight = Math.max(0, Math.sin(((hour - 6) / 14) * Math.PI));
  const mix = (night: string, day: string) => `color-mix(in srgb, ${day} ${Math.round(daylight * 100)}%, ${night})`;
  const sunX = 8 + ((hour - 5) / 18) * 84; // % across
  const sunY = 78 - Math.sin(((hour - 5) / 18) * Math.PI) * 62;
  const isDawnDusk = Math.abs(hour - 6.5) < 1.2 || Math.abs(hour - 20) < 1.2;
  const stars = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ x: (i * 37) % 92 + 4, y: (i * 23) % 45 + 5 })), []);
  return (
    <div className="ob-sky" style={{ background: `linear-gradient(180deg, ${mix("#0F1738", "#5CA6F2")}, ${mix("#1F2952", "#C7E6FF")})` }}>
      {daylight < 0.35 ? stars.map((s, i) => (
        <span key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: 3, height: 3, borderRadius: 999, background: "#fff", opacity: 0.8 - daylight }} />
      )) : null}
      {daylight < 0.5 ? (
        <span style={{ position: "absolute", right: "12%", top: "14%", width: 34, height: 34, borderRadius: 999, background: "#F5F5E6", opacity: 1 - daylight * 2, boxShadow: "inset -8px -4px 0 rgba(0,0,0,.12)" }} />
      ) : null}
      {isDawnDusk ? <span style={{ position: "absolute", left: 0, right: 0, bottom: "18%", height: 60, background: "radial-gradient(ellipse at 50% 100%, rgba(255,158,82,.55), transparent 70%)" }} /> : null}
      <span style={{
        position: "absolute", left: `${sunX}%`, top: `${sunY}%`, width: 46, height: 46, borderRadius: 999,
        background: "radial-gradient(circle, #FFED9E, #FFB840)", boxShadow: "0 0 30px rgba(255,184,64,.7)", transform: "translate(-50%,-50%)",
      }} />
      <span style={{ position: "absolute", left: "-10%", right: "-10%", bottom: "-30%", height: "55%", borderRadius: "50% 50% 0 0", background: mix("#1A2938", "#6BB27A") }} />
    </div>
  );
}

/* ------------------------- loading rows (step 20) ------------------------- */

export function LoadingRows({ labels, onDone }: { labels: string[]; onDone: () => void }) {
  const durations = [1300, 2200, 1600];
  const [progress, setProgress] = useState([0, 0, 0]);
  const done = useRef(false);
  useEffect(() => {
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = now - started;
      setProgress(durations.map((d, i) => {
        const start = i * 350;
        return Math.min(1, Math.max(0, (t - start) / d));
      }));
      if (t < 350 * 2 + 2200 + 200) raf = requestAnimationFrame(tick);
      else if (!done.current) { done.current = true; onDone(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 32 }}>
      {labels.map((label, i) => {
        const p = progress[i]!;
        return (
          <div key={label} className="ob-load-row" data-done={p >= 1}>
            <span className="ob-load-ico">
              {p >= 1 ? <Check className="size-4" strokeWidth={3} /> : <span className="ob-spinner" />}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, width: 150, flexShrink: 0 }}>{label}</span>
            <span className="ob-load-bar"><span style={{ width: `${p * 100}%`, transition: "width 100ms linear" }} /></span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------- welcome-aboard hero (steps 25 & success) ------------------------- */

export function AboardHero({ logo }: { logo: string }) {
  const floaters = [
    { img: "/onboarding/pourquoi_reve_t_on.jpg", x: -148, y: -60, size: 44, rot: -8 },
    { img: "/onboarding/la_joconde.jpg", x: 150, y: -50, size: 40, rot: 7 },
    { img: "/onboarding/apollo_11_aldrin_us_flag_lunar_module_1969.jpg", x: -128, y: 46, size: 38, rot: 5 },
    { img: "/onboarding/qu_est_ce_qu_un_trou_noir.jpg", x: 134, y: 56, size: 44, rot: -6 },
    { img: "/onboarding/giza_pyramids_khufu_khafre_menkaure_wide_view.jpg", x: -62, y: -126, size: 42, rot: 6 },
    { img: "/onboarding/la_nuit_etoilee_van_gogh.jpg", x: 76, y: -130, size: 46, rot: -5 },
  ];
  return (
    <div style={{ position: "relative", display: "grid", placeItems: "center", height: 240 }}>
      <span className="ob-halo" style={{ width: 200, height: 200 }} />
      <span className="ob-halo" style={{ width: 136, height: 136, opacity: 0.12, animationDelay: "300ms" }} />
      {floaters.map((f, i) => (
        <img key={i} src={f.img} alt="" loading="lazy" className="ob-floater"
          style={{ left: `calc(50% + ${f.x}px)`, top: `calc(50% + ${f.y}px)`, width: f.size, height: f.size, "--rot": `${f.rot}deg`, "--t": `${3.2 + i * 0.36}s`, marginLeft: -f.size / 2, marginTop: -f.size / 2 } as React.CSSProperties} />
      ))}
      <span style={{ position: "relative" }}>
        <img src={logo} alt="Sophia" className="ob-pop" style={{ width: 96, height: 96, borderRadius: 24 }} />
        <span className="ob-pop" style={{ position: "absolute", bottom: -6, right: -6, width: 38, height: 38, borderRadius: 999, background: OB.success, border: "3px solid #fff", display: "grid", placeItems: "center", color: "#fff", animationDelay: "350ms" }}>
          <Check className="size-5" strokeWidth={3.5} />
        </span>
      </span>
    </div>
  );
}

export { Highlight };
