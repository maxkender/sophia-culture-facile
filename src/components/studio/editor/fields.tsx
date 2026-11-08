import { useRef, type ReactNode } from "react";
import { Bold, BookMarked, GripVertical, Plus, Trash2, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { SL } from "@/i18n/studio";
import { countWords, type Block, type TimelineEvent } from "@/lib/studio/course-format";

export const inputCls =
  "w-full rounded-lg border border-brand-line bg-card px-3 py-2 text-sm text-brand-navy outline-none transition focus:border-portal-accent focus:ring-2 focus:ring-portal-accent/15 disabled:opacity-70";

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-2">
      <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-navySoft">{children}</span>
      {hint ? <span className="text-[11px] text-brand-navySoft">{hint}</span> : null}
    </div>
  );
}

/** Textarea with the **bold** and [[glossary]] helper buttons. */
export function MarkedTextarea({
  value, onChange, rows = 3, placeholder, disabled, helpers = true, path,
}: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; disabled?: boolean; helpers?: boolean; path?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function wrap(open: string, close: string) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const sel = value.slice(a, b) || (open === "**" ? SL("bold", "gras") : SL("term", "terme"));
    const next = value.slice(0, a) + open + sel + close + value.slice(b);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + open.length, a + open.length + sel.length);
    });
  }
  return (
    <div>
      {helpers && !disabled ? (
        <div className="mb-1 flex gap-1">
          <button type="button" onClick={() => wrap("**", "**")} className="inline-flex items-center gap-1 rounded-md border border-brand-line px-2 py-0.5 text-xs font-bold text-brand-navy hover:bg-brand-surface" title={SL("Wrap the selection in **bold**", "Mettre la sélection en **gras**")}>
            <Bold className="size-3.5" />{SL("Bold", "Gras")}
          </button>
          <button type="button" onClick={() => wrap("[[", "]]")} className="inline-flex items-center gap-1 rounded-md border border-brand-line px-2 py-0.5 text-xs font-bold text-brand-navy hover:bg-brand-surface" title={SL("Mark the selection as a [[glossary]] term", "Marquer la sélection comme terme du [[glossaire]]")}>
            <BookMarked className="size-3.5" />{SL("Glossary", "Glossaire")}
          </button>
        </div>
      ) : null}
      <textarea ref={ref} data-path={path} className={cn(inputCls, "resize-y leading-relaxed")} rows={rows} value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function BLOCK_LABEL(type: Block["type"]): string {
  return {
    paragraph: SL("Paragraph", "Paragraphe"),
    heading: SL("Sub-heading", "Intertitre"),
    image: SL("Image", "Image"),
    timeline: SL("Timeline", "Frise"),
    funFact: SL("Did you know?", "Le saviez-vous ?"),
    takeaway: SL("Key takeaway", "À retenir"),
    quote: SL("Quote", "Citation"),
  }[type];
}

/** Sortable wrapper exposing a drag handle. */
export function Sortable({ id, children, className }: { id: string; className?: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button type="button" {...attributes} {...listeners} aria-label={SL("Drag to reorder", "Glisser pour réordonner")} className="cursor-grab touch-none rounded p-0.5 text-brand-navySoft/60 hover:bg-brand-surface hover:text-brand-navy active:cursor-grabbing">
      <GripVertical className="size-4" />
    </button>
  );
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(className, isDragging && "relative z-10 opacity-80 shadow-lg")}>
      {children(handle)}
    </div>
  );
}

export function BlockCard({
  block, path, handle, disabled, onChange, onDelete,
}: {
  block: Block; path: string; handle: ReactNode; disabled: boolean; onChange: (b: Block) => void; onDelete: () => void;
}) {
  const words = "text" in block ? countWords(block.text) : 0;
  return (
    <div data-path={path} className="rounded-xl border border-brand-line bg-card p-3 transition">
      <div className="mb-2 flex items-center gap-2">
        {disabled ? null : handle}
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold",
          block.type === "takeaway" ? "bg-brand-navy text-brand-onNavy" : block.type === "funFact" ? "bg-portal-amber/15 text-brand-navy" : "bg-brand-surfaceStrong text-brand-navy")}>{BLOCK_LABEL(block.type)}</span>
        {words ? <span className="text-[11px] text-brand-navySoft">{words} {SL("words", "mots")}</span> : null}
        {disabled ? null : (
          <button type="button" onClick={onDelete} className="ml-auto rounded p-1 text-brand-navySoft/60 hover:bg-portal-red/10 hover:text-portal-red" aria-label={SL("Delete block", "Supprimer le bloc")}>
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <BlockForm block={block} path={path} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function BlockForm({ block, path, disabled, onChange }: { block: Block; path: string; disabled: boolean; onChange: (b: Block) => void }) {
  switch (block.type) {
    case "paragraph":
    case "funFact":
    case "takeaway":
      return <MarkedTextarea path={`${path}.text`} value={block.text} disabled={disabled} rows={block.type === "paragraph" ? 4 : 2} onChange={(text) => onChange({ ...block, text })} />;
    case "heading":
      return <input data-path={`${path}.text`} className={cn(inputCls, "font-bold")} value={block.text} disabled={disabled} onChange={(e) => onChange({ ...block, text: e.target.value })} />;
    case "quote":
      return (
        <div className="space-y-2">
          <MarkedTextarea path={`${path}.text`} value={block.text} disabled={disabled} rows={2} onChange={(text) => onChange({ ...block, text })} />
          <input className={inputCls} value={block.attribution ?? ""} disabled={disabled} placeholder={SL("Who said it (optional)", "Auteur de la citation (facultatif)")} onChange={(e) => onChange({ ...block, attribution: e.target.value })} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <div className="flex gap-3">
            {block.image_url ? <img src={block.image_url} alt="" className="size-16 shrink-0 rounded-lg object-cover" /> : <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-brand-line text-[10px] text-brand-navySoft">{SL("No image", "Aucune image")}</div>}
            <div className="min-w-0 flex-1 space-y-2">
              <input data-path={`${path}.image_url`} className={inputCls} value={block.image_url} disabled={disabled} placeholder="https://upload.wikimedia.org/…" onChange={(e) => onChange({ ...block, image_url: e.target.value.trim() })} />
              <p className="text-[11px] text-brand-navySoft">{SL("Wikimedia Commons search arrives in the Images tab soon. For now, paste a direct https image link.", "La recherche Wikimedia Commons arrive bientôt dans l'onglet Images. Pour l'instant, collez un lien https direct vers l'image.")}</p>
            </div>
          </div>
          <input className={inputCls} value={block.caption ?? ""} disabled={disabled} placeholder={SL("Caption (optional)", "Légende (facultatif)")} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={block.credit?.author ?? ""} disabled={disabled} placeholder={SL("Credit: author", "Crédit : auteur")} onChange={(e) => onChange({ ...block, credit: { ...block.credit, author: e.target.value } })} />
            <input className={inputCls} value={block.credit?.license ?? ""} disabled={disabled} placeholder={SL("Credit: licence", "Crédit : licence")} onChange={(e) => onChange({ ...block, credit: { ...block.credit, license: e.target.value } })} />
          </div>
          <label className="flex items-center gap-2 text-xs text-brand-navySoft">
            <input type="checkbox" checked={Boolean(block.fullBleed)} disabled={disabled} onChange={(e) => onChange({ ...block, fullBleed: e.target.checked })} />
            {SL("Full width", "Pleine largeur")}
          </label>
        </div>
      );
    case "timeline":
      return <TimelineForm events={block.events} path={path} disabled={disabled} onChange={(events) => onChange({ ...block, events })} />;
  }
}

function TimelineForm({ events, path, disabled, onChange }: { events: TimelineEvent[]; path: string; disabled: boolean; onChange: (e: TimelineEvent[]) => void }) {
  const set = (i: number, patch: Partial<TimelineEvent>) => onChange(events.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div key={i} data-path={`${path}.events[${i}]`} className="grid grid-cols-[90px_1fr_auto] gap-2">
          <input className={inputCls} value={e.date} disabled={disabled} placeholder={SL("Date", "Date")} onChange={(ev) => set(i, { date: ev.target.value })} />
          <div className="space-y-1">
            <input className={cn(inputCls, "font-semibold")} value={e.title} disabled={disabled} placeholder={SL("Event", "Événement")} onChange={(ev) => set(i, { title: ev.target.value })} />
            <input className={inputCls} value={e.detail ?? ""} disabled={disabled} placeholder={SL("Detail (optional)", "Détail (facultatif)")} onChange={(ev) => set(i, { detail: ev.target.value })} />
          </div>
          {disabled ? <span /> : (
            <button type="button" onClick={() => onChange(events.filter((_, j) => j !== i))} className="self-start rounded p-1.5 text-brand-navySoft/60 hover:text-portal-red" aria-label={SL("Remove event", "Retirer l'événement")}><X className="size-4" /></button>
          )}
        </div>
      ))}
      {disabled ? null : (
        <button type="button" onClick={() => onChange([...events, { date: "", title: "" }])} className="inline-flex items-center gap-1 text-xs font-bold text-portal-accent hover:underline"><Plus className="size-3.5" />{SL("Add an event", "Ajouter un événement")}</button>
      )}
    </div>
  );
}
