/** Couronne de laurier (façon distinctions App Store). */
export function Laurel({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 60"
      aria-hidden="true"
      focusable="false"
      className={`h-14 w-6 text-brand-navy/45 ${flip ? "scale-x-[-1]" : ""}`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M18 4C8 12 5 24 8 40c1 5 3 10 6 15" />
        <path d="M15 12c-4-1-7 1-8 4 3 1 6 0 8-4z" />
        <path d="M12 21c-4-1-7 1-8 4 3 1 6 0 8-4z" />
        <path d="M10 30c-4-1-7 1-8 4 3 1 6 0 8-4z" />
        <path d="M10 39c-4-1-7 1-8 4 3 1 6 0 8-4z" />
        <path d="M12 48c-4-1-7 1-8 4 3 1 6 0 8-4z" />
      </g>
    </svg>
  );
}
