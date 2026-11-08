import { Check, Star } from "lucide-react";
import { DOT_STEPS, OB, parseHighlight, type StepId } from "@/config/onboarding";

/** Primary capsule CTA pinned at the bottom of a step. */
export function PrimaryBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <div className="ob-footer">
      <button type="button" {...props} className="ob-primary" />
    </div>
  );
}

/** The 14 progress capsules shown on dotted steps. */
export function Dots({ step }: { step: StepId }) {
  const current = DOT_STEPS.indexOf(step);
  if (current < 0) return null;
  return (
    <div className="ob-dots" aria-hidden="true">
      {DOT_STEPS.map((s, i) => (
        <span key={s} data-on={i <= current} data-current={i === current} />
      ))}
    </div>
  );
}

/** Renders copy with **pink highlight** segments. */
export function Highlight({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {parseHighlight(text).map((p, i) =>
        p.hot ? <span key={i} className="ob-hot">{p.text}</span> : <span key={i}>{p.text}</span>,
      )}
    </span>
  );
}

/** Option row with radio (single) or checkbox (multi). */
export function OptionRow({
  label, emoji, on, multi, onClick, delay = 0,
}: {
  label: string; emoji?: string; on: boolean; multi?: boolean; onClick: () => void; delay?: number;
}) {
  return (
    <button
      type="button" className="ob-row ob-reveal" style={{ "--d": `${delay}ms` } as React.CSSProperties}
      data-on={on} aria-pressed={on} onClick={onClick}
    >
      {emoji ? <span className="ob-emoji" aria-hidden="true">{emoji}</span> : null}
      <span className="ob-label">{label}</span>
      {multi ? (
        <span className="ob-check" aria-hidden="true">{on ? <Check className="size-3.5" strokeWidth={3.5} /> : null}</span>
      ) : (
        <span className="ob-radio" aria-hidden="true">{on ? <Check className="size-3" strokeWidth={3.5} /> : null}</span>
      )}
    </button>
  );
}

/** Five stars row. */
export function Stars({ size = 14 }: { size?: number }) {
  return (
    <span className="ob-stars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => <Star key={i} style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />)}
    </span>
  );
}

/** Simple SVG laurel wreath branch (mirrored for the right side). */
export function LaurelBranch({ flip = false, size = 54 }: { flip?: boolean; size?: number }) {
  const leaves = [0, 1, 2, 3, 4, 5].map((i) => {
    const y = 8 + i * 9;
    const x = 6 + Math.sin(i * 0.7) * 4;
    return <ellipse key={i} cx={x} cy={y} rx="4.5" ry="8" transform={`rotate(${-28 - i * 6} ${x} ${y})`} fill="currentColor" />;
  });
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 24 60" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      {leaves}
    </svg>
  );
}

/** Laurel badge: branches around stars + rating + caption. */
export function LaurelBadge({ caption, compact = false }: { caption: string; compact?: boolean }) {
  return (
    <div className="ob-laurel">
      <LaurelBranch size={compact ? 46 : 54} />
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Stars size={compact ? 12 : 14} />
        <span style={{ fontSize: compact ? 22 : 34, fontWeight: 800, lineHeight: 1.1 }}>4.8</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: OB.inkSecondary }}>{caption}</span>
      </span>
      <LaurelBranch size={compact ? 46 : 54} flip />
    </div>
  );
}

/** Overlapping round photos. */
export function AvatarStack({ photos, size, overlap = 12 }: { photos: string[]; size: number; overlap?: number }) {
  return (
    <span className="ob-stack">
      {photos.map((p, i) => (
        <img key={p} src={p} alt="" width={size} height={size} loading="lazy"
          style={{ width: size, height: size, marginLeft: i ? -overlap : 0, zIndex: photos.length - i }} />
      ))}
    </span>
  );
}

/** Confetti burst (70 pieces, 3 s, from 50 %/32 %). */
export function Confetti() {
  const pieces = Array.from({ length: 70 }, (_, i) => {
    const angle = (i / 70) * Math.PI * 2 + (i % 7) * 0.13;
    const dist = 120 + (i % 9) * 32;
    const colors = [OB.accent, OB.accentSoft, OB.pink, OB.gold, OB.success];
    return {
      x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 160,
      r: (i % 2 ? 1 : -1) * (180 + (i % 5) * 90),
      d: (i % 14) * 40, bg: colors[i % colors.length]!,
    };
  });
  return (
    <div className="ob-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} style={{
          "--x": `${p.x}px`, "--y": `${p.y}px`, "--r": `${p.r}deg`, "--d": `${p.d}ms`,
          background: p.bg,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}
