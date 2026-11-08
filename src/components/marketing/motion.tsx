import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useI18n } from "@/i18n";
import { MK_FR } from "@/config/marketing/fr";
import { MK_EN } from "@/config/marketing/en";
import { parseHighlight } from "@/config/onboarding";
import { cn } from "@/lib/utils";

export function useMk() {
  const { lang } = useI18n();
  return { lang, c: lang === "fr" ? MK_FR : MK_EN };
}

/** Text with **pink** highlighted words. */
export function Hot({ text }: { text: string }) {
  return <>{parseHighlight(text).map((p, i) => (p.hot ? <span key={i} className="mk-hot">{p.text}</span> : <span key={i}>{p.text}</span>))}</>;
}

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

export function useInView<T extends Element>(opts: { once?: boolean; margin?: string; threshold?: number } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const { once = true, margin = "0px 0px -12% 0px", threshold = 0.15 } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        setInView(true);
        if (once) io.disconnect();
      } else if (!once) setInView(false);
    }, { rootMargin: margin, threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [once, margin, threshold]);
  return [ref, inView] as const;
}

export function Reveal({ children, delay = 0, className, as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <Tag ref={ref as never} data-in={inView} className={cn("mk-reveal", className)} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Mounts its (animated) children only once visible, so app UI animations start on entry. */
export function WhenVisible({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.25 });
  return <div ref={ref} className={className} style={style}>{inView ? children : null}</div>;
}

/** 0 when the element's top reaches the viewport top, 1 when its bottom reaches the viewport bottom. */
export function useStickyProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const v = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      setP((old) => (Math.abs(old - v) > 0.002 ? v : old));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, p] as const;
}

/** Light smooth scrolling on pointer devices; native scroll on touch and reduced motion. */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let lenis: { raf: (t: number) => void; destroy: () => void; scrollTo: (t: string | HTMLElement, o?: object) => void } | null = null;
    let raf = 0;
    let alive = true;
    void import("lenis").then(({ default: Lenis }) => {
      if (!alive) return;
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 }) as never;
      (window as unknown as { __mkLenis?: unknown }).__mkLenis = lenis;
      const loop = (t: number) => { lenis?.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    });
    return () => { alive = false; cancelAnimationFrame(raf); lenis?.destroy(); delete (window as unknown as { __mkLenis?: unknown }).__mkLenis; };
  }, []);
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const l = (window as unknown as { __mkLenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).__mkLenis;
  if (l) l.scrollTo(el, { offset: -72 });
  else el.scrollIntoView({ behavior: "smooth" });
  return true;
}

/** /start (FR) or /en/start, keeping ?src and UTM parameters from the current URL. */
export function useStartHref() {
  const { lang } = useMk();
  const base = lang === "fr" ? "/start" : "/en/start";
  const [href, setHref] = useState(base);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const keep = new URLSearchParams();
    q.forEach((v, k) => { if (k === "src" || k === "ref" || k.startsWith("utm_")) keep.set(k, v); });
    if (!keep.has("src")) keep.set("src", "site");
    setHref(`${base}?${keep.toString()}`);
  }, [base]);
  return href;
}

export function Phone({ children, width = 300, className }: { children: ReactNode; width?: number; className?: string }) {
  return (
    <div className={cn("mk-phone", className)} style={{ "--pw": `${width}px` } as CSSProperties}>
      <div className="mk-phone-screen">
        <span className="mk-phone-notch" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
