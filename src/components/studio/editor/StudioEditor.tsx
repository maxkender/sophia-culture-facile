import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronLeft, Lock, Plus, Send, Smartphone, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PortalCard } from "@/components/portal/ui";
import { usePortalProfile } from "@/components/portal/usePortal";
import { SL, StudioLangSwitch, useStudioLang } from "@/i18n/studio";
import {
  APP_LANGS, BLOCK_TYPES, GLOSSARY_CLASSES, GLOSSARY_CLASS_LABEL, LIMITS, SUBCATEGORY_SUGGESTIONS, SUBJECTS, SUBJECT_LABEL,
  blockingIssues, courseWords, fixEmDash, fromRow, newBlock, sectionWords, validateCourse,
  type Block, type BlockType, type Section, type StudioCourseContent, type Subject,
} from "@/lib/studio/course-format";
import { BLOCK_LABEL, BlockCard, FieldLabel, MarkedTextarea, Sortable, inputCls } from "./fields";
import { ChecksPanel } from "./ChecksPanel";
import { StudioPreview } from "./StudioPreview";

const key = () => Math.random().toString(36).slice(2, 10);
const EDITABLE = new Set(["draft", "changes_requested"]);

const STATUS: Record<string, { en: string; fr: string; cls: string }> = {
  draft: { en: "Draft", fr: "Brouillon", cls: "bg-brand-surfaceStrong text-brand-navySoft" },
  submitted: { en: "Under review", fr: "En relecture", cls: "bg-brand-navy/10 text-brand-navy" },
  changes_requested: { en: "Changes requested", fr: "Modifications demandées", cls: "bg-portal-amber/15 text-portal-amber" },
  accepted: { en: "Accepted", fr: "Accepté", cls: "bg-portal-green/10 text-portal-green" },
  publishing: { en: "Publishing", fr: "Publication en cours", cls: "bg-portal-accent/10 text-portal-accent" },
  published: { en: "Published", fr: "Publié", cls: "bg-portal-green/15 text-portal-green" },
  failed: { en: "Publishing failed", fr: "Échec de publication", cls: "bg-portal-red/10 text-portal-red" },
  archived: { en: "Archived", fr: "Archivé", cls: "bg-brand-surfaceStrong text-brand-navySoft" },
};
export function StudioStatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS["draft"]!;
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold", s.cls)}>{SL(s.en, s.fr)}</span>;
}

function langName(code: string, ui: string) {
  try {
    return new Intl.DisplayNames([ui], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Map every string in the content through fixEmDash (URLs never contain one). */
function deepFix<T>(v: T): T {
  if (typeof v === "string") return fixEmDash(v) as T;
  if (Array.isArray(v)) return v.map(deepFix) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepFix(x)])) as T;
  return v;
}

function scrollToPath(path: string) {
  let p = path;
  for (;;) {
    const el = document.querySelector<HTMLElement>(`[data-path="${CSS.escape(p)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-portal-red/50");
      window.setTimeout(() => el.classList.remove("ring-2", "ring-portal-red/50"), 1600);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true });
      return;
    }
    const next = p.replace(/(\.[A-Za-z_]+|\[\d+\])$/, "");
    if (next === p || !next) return;
    p = next;
  }
}

type Row = {
  id: string; status: string; origin_lang: string; review_comment: string | null; updated_at: string;
  title: string; subtitle: string | null; subject: string | null; subcategory: string | null; description: string;
  hero: Json; sections: Json; sources: Json; glossary: Json; quiz: Json | null;
};

export function StudioEditor({ id }: { id: string }) {
  const { data: me } = usePortalProfile();
  const ui = useStudioLang(me?.profile?.writing_lang ?? null);
  const qc = useQueryClient();
  const { data: row, isLoading, error } = useQuery({
    queryKey: ["studio", "course", id],
    queryFn: async (): Promise<Row | null> => {
      const { data, error } = await supabase.from("studio_courses").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Row | null;
    },
    staleTime: Infinity,
  });

  if (isLoading) return <div className="h-64" />;
  if (error || !row)
    return <PortalCard><p className="text-sm text-brand-navy">{SL("This course could not be found.", "Ce cours est introuvable.")}</p></PortalCard>;
  return <EditorBody key={row.id} row={row} ui={ui} onSaved={() => void qc.invalidateQueries({ queryKey: ["studio", "my-courses"] })} />;
}

function EditorBody({ row, ui, onSaved }: { row: Row; ui: string; onSaved: () => void }) {
  const [content, setContent] = useState<StudioCourseContent>(() => fromRow(row, key));
  const [lang, setLang] = useState(row.origin_lang);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(new Date(row.updated_at));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tab, setTab] = useState("checks");
  const [phone, setPhone] = useState(false);
  const readOnly = !EDITABLE.has(row.status);
  const latest = useRef({ content, lang });
  latest.current = { content, lang };

  const issues = useMemo(() => validateCourse(content), [content]);
  const toFix = blockingIssues(issues).length;
  const words = courseWords(content);
  const wordsOk = words >= LIMITS.words[0] && words <= LIMITS.words[1];

  const update = useCallback((fn: (c: StudioCourseContent) => StudioCourseContent) => {
    setContent((c) => fn(c));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    if (readOnly) return;
    const { content: c, lang: l } = latest.current;
    setSaving(true);
    setDirty(false);
    const { error } = await supabase
      .from("studio_courses")
      .update({
        title: c.title, subtitle: c.subtitle || null, subject: c.subject || null, subcategory: c.subcategory || null,
        description: c.description, hero: c.hero as Json, sections: c.sections as unknown as Json,
        sources: c.sources as unknown as Json, glossary: c.glossary as unknown as Json, origin_lang: l,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      setDirty(true);
      setSaveError(SL("Not saved. Check your connection; we will retry.", "Non enregistré. Vérifiez votre connexion ; nouvel essai bientôt."));
      return;
    }
    setSaveError(null);
    setSavedAt(new Date());
    onSaved();
  }, [readOnly, row.id, onSaved]);

  // Autosave 2 s after the last change.
  useEffect(() => {
    if (!dirty || readOnly) return;
    const t = window.setTimeout(() => void save(), 2000);
    return () => window.clearTimeout(t);
  }, [dirty, content, lang, save, readOnly]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (latest.current && dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const setSection = (si: number, fn: (s: Section) => Section) =>
    update((c) => ({ ...c, sections: c.sections.map((s, i) => (i === si ? fn(s) : s)) }));
  const onSectionDrag = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    update((c) => {
      const from = c.sections.findIndex((s) => s._key === e.active.id);
      const to = c.sections.findIndex((s) => s._key === e.over!.id);
      return from < 0 || to < 0 ? c : { ...c, sections: arrayMove(c.sections, from, to) };
    });
  };
  const onBlockDrag = (si: number) => (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setSection(si, (s) => {
      const from = s.blocks.findIndex((b) => b._key === e.active.id);
      const to = s.blocks.findIndex((b) => b._key === e.over!.id);
      return from < 0 || to < 0 ? s : { ...s, blocks: arrayMove(s.blocks, from, to) };
    });
  };
  const addSection = () => {
    const k = key();
    update((c) => ({ ...c, sections: [...c.sections, { _key: k, title: "", blocks: [newBlock("paragraph", key())] }] }));
    window.setTimeout(() => scrollToPath(`sections[${content.sections.length}]`), 60);
  };
  const addGlossary = (term: string) => {
    update((c) => ({ ...c, glossary: [...c.glossary, { term, classification: "", explanation: "" }] }));
    setTimeout(() => scrollToPath(`glossary[${content.glossary.length}].explanation`), 60);
  };

  const saveLabel = saving
    ? SL("Saving…", "Enregistrement…")
    : saveError ?? (dirty ? SL("Unsaved changes", "Modifications non enregistrées")
      : savedAt ? SL(`Saved at ${savedAt.toLocaleTimeString(ui, { hour: "2-digit", minute: "2-digit" })}`, `Enregistré à ${savedAt.toLocaleTimeString(ui, { hour: "2-digit", minute: "2-digit" })}`) : "");

  const subj = (content.subject || "") as Subject;

  return (
    <TooltipProvider>
      <div className="-mt-2">
        {/* Top bar */}
        <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-brand-line bg-portal-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <Link to="/auteurs/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navySoft hover:text-brand-navy">
            <ChevronLeft className="size-4" />{SL("My courses", "Mes cours")}
          </Link>
          <span className="text-brand-navySoft/50">/</span>
          <span className="max-w-[18rem] truncate text-sm font-bold text-brand-navy">{content.title || SL("Untitled course", "Cours sans titre")}</span>
          <StudioStatusPill status={row.status} />
          <span className={cn("text-xs", saveError ? "text-portal-red" : "text-brand-navySoft")} aria-live="polite">{saveLabel}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navySoft">
              {SL("Writing in", "Rédigé en")}
              <select className="rounded-lg border border-brand-line bg-card px-2 py-1.5 text-xs font-bold text-brand-navy" value={lang} disabled={readOnly} onChange={(e) => { setLang(e.target.value); setDirty(true); }}>
                {APP_LANGS.map((c) => <option key={c} value={c}>{langName(c, ui)}</option>)}
              </select>
            </label>
            <StudioLangSwitch />
            {!readOnly && dirty ? <Button variant="pillSecondary" size="pillSm" onClick={() => void save()}>{SL("Save now", "Enregistrer")}</Button> : null}
            <Button variant="pillSecondary" size="pillSm" onClick={() => setPhone(true)}><Smartphone className="size-4" />{SL("Preview on phone", "Aperçu sur téléphone")}</Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="pillSm" disabled className="pointer-events-none">
                    <Send className="size-4" />{SL("Send for review", "Envoyer en relecture")}{toFix ? ` · ${SL(`${toFix} to fix`, `${toFix} à corriger`)}` : ""}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{toFix ? SL("Fix the red checks first. Sending opens in the next update.", "Corrigez d'abord les points rouges. L'envoi arrive dans la prochaine mise à jour.") : SL("Sending for review opens in the next update.", "L'envoi en relecture arrive dans la prochaine mise à jour.")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {row.status === "changes_requested" && row.review_comment ? (
          <div className="mb-4 rounded-xl border border-portal-amber/40 bg-portal-amber/10 p-4 text-sm text-brand-navy"><strong>{SL("Desk comment: ", "Commentaire de la rédaction : ")}</strong>{row.review_comment}</div>
        ) : null}
        {readOnly ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-surfaceStrong p-3 text-sm text-brand-navy"><Lock className="size-4" />{SL("This course is with the desk and cannot be edited right now.", "Ce cours est entre les mains de la rédaction et ne peut pas être modifié pour l'instant.")}</div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_380px]">
          {/* Left: outline */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <PortalCard className="p-4">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-brand-navySoft">{SL("Course outline", "Plan du cours")}</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDrag}>
                <SortableContext items={content.sections.map((s) => s._key!)} strategy={verticalListSortingStrategy}>
                  <ol className="space-y-1">
                    {content.sections.map((s, i) => (
                      <Sortable key={s._key} id={s._key!}>
                        {(handle) => (
                          <li className="flex items-center gap-1 rounded-lg px-1 py-1 hover:bg-brand-surface">
                            {readOnly ? null : handle}
                            <button type="button" onClick={() => scrollToPath(`sections[${i}]`)} className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-brand-navy">
                              {i + 1}. {s.title || SL("Untitled", "Sans titre")}
                            </button>
                            <span className="text-[11px] tabular-nums text-brand-navySoft">{sectionWords(s)}</span>
                          </li>
                        )}
                      </Sortable>
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
              {readOnly || content.sections.length >= LIMITS.sections[1] ? null : (
                <button type="button" onClick={addSection} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-portal-accent hover:underline"><Plus className="size-3.5" />{SL("Add a section", "Ajouter une section")}</button>
              )}
              <div className={cn("mt-3 rounded-lg px-2.5 py-2 text-xs font-semibold", wordsOk ? "bg-portal-green/10 text-portal-green" : "bg-portal-amber/12 text-brand-navy")}>
                {SL(`${words} words`, `${words} mots`)} · {SL("aim for 500 to 900", "visez 500 à 900")}
              </div>
            </PortalCard>
            <PortalCard className="bg-brand-navy p-4 text-brand-onNavy">
              <p className="mb-2 text-sm font-bold">{SL("After review, Sophia takes care of", "Après la relecture, Sophia s'occupe de")}</p>
              <ul className="space-y-1 text-xs text-brand-onNavy/85">
                <li>· {SL("A quiz written and fact-checked", "Un quiz rédigé et vérifié")}</li>
                <li>· {SL("The glossary explanations, polished", "Les explications du glossaire, relues")}</li>
                <li>· {SL("An illustrated cover", "Une couverture illustrée")}</li>
                <li>· {SL(`Translation into ${APP_LANGS.length - 1} languages`, `La traduction en ${APP_LANGS.length - 1} langues`)}</li>
                <li>· {SL("Audio narration", "La narration audio")}</li>
              </ul>
            </PortalCard>
          </aside>

          {/* Centre: content */}
          <div className="min-w-0 space-y-5">
            <PortalCard className="space-y-4 p-5">
              <div>
                <FieldLabel hint={`${[...content.title].length}/160`}>{SL("Title", "Titre")}</FieldLabel>
                <input data-path="title" className={cn(inputCls, "text-lg font-extrabold")} value={content.title} disabled={readOnly} placeholder={SL("Why does the Mona Lisa smile?", "Pourquoi la Joconde sourit-elle ?")} onChange={(e) => update((c) => ({ ...c, title: e.target.value }))} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FieldLabel>{SL("Subtitle (optional)", "Sous-titre (facultatif)")}</FieldLabel>
                  <input data-path="subtitle" className={inputCls} value={content.subtitle ?? ""} disabled={readOnly} placeholder="1503" onChange={(e) => update((c) => ({ ...c, subtitle: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>{SL("Subject", "Matière")}</FieldLabel>
                  <select data-path="subject" className={inputCls} value={content.subject ?? ""} disabled={readOnly} onChange={(e) => update((c) => ({ ...c, subject: e.target.value }))}>
                    <option value="">{SL("Choose…", "Choisir…")}</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{SL(SUBJECT_LABEL[s].en, SUBJECT_LABEL[s].fr)}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>{SL("Subcategory", "Sous-catégorie")}</FieldLabel>
                  <input data-path="subcategory" list="studio-subcats" className={inputCls} value={content.subcategory ?? ""} disabled={readOnly} onChange={(e) => update((c) => ({ ...c, subcategory: e.target.value }))} />
                  <datalist id="studio-subcats">{(SUBCATEGORY_SUGGESTIONS[subj] ?? []).map((s) => <option key={s} value={s} />)}</datalist>
                </div>
              </div>
              <div>
                <FieldLabel hint={`${[...content.description].length}/600`}>{SL("Description (the course card)", "Description (la carte du cours)")}</FieldLabel>
                <MarkedTextarea path="description" value={content.description} disabled={readOnly} rows={2} onChange={(description) => update((c) => ({ ...c, description }))} />
              </div>
              <div>
                <FieldLabel hint={`${[...(content.hero.hook ?? "")].length}/200`}>{SL("Hook", "Accroche")}</FieldLabel>
                <input data-path="hero.hook" className={inputCls} value={content.hero.hook ?? ""} disabled={readOnly} placeholder={SL("One punchy sentence shown on the cover.", "Une phrase percutante affichée sur la couverture.")} onChange={(e) => update((c) => ({ ...c, hero: { ...c.hero, hook: e.target.value } }))} />
              </div>
              <div>
                <FieldLabel>{SL("Cover image (optional, Sophia can make one)", "Image de couverture (facultatif, Sophia peut la créer)")}</FieldLabel>
                <input data-path="hero.image_url" className={inputCls} value={content.hero.image_url ?? ""} disabled={readOnly} placeholder="https://…" onChange={(e) => update((c) => ({ ...c, hero: { ...c.hero, ratio: "16:9", image_url: e.target.value.trim() } }))} />
              </div>
            </PortalCard>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDrag}>
              <SortableContext items={content.sections.map((s) => s._key!)} strategy={verticalListSortingStrategy}>
                {content.sections.map((s, si) => (
                  <Sortable key={s._key} id={s._key!}>
                    {(handle) => (
                      <SectionCard
                        section={s} index={si} handle={handle} readOnly={readOnly} sensors={sensors}
                        onChange={(fn) => setSection(si, fn)}
                        onDelete={() => update((c) => ({ ...c, sections: c.sections.filter((_, i) => i !== si) }))}
                        onBlockDrag={onBlockDrag(si)}
                      />
                    )}
                  </Sortable>
                ))}
              </SortableContext>
            </DndContext>
            {readOnly || content.sections.length >= LIMITS.sections[1] ? null : (
              <button type="button" onClick={addSection} className="flex w-full items-center justify-center gap-1.5 rounded-portal border-2 border-dashed border-brand-line py-4 text-sm font-bold text-brand-navySoft hover:border-portal-accent hover:text-portal-accent">
                <Plus className="size-4" />{SL("Add a section", "Ajouter une section")}
              </button>
            )}

            <GlossaryCard content={content} readOnly={readOnly} update={update} onAdd={addGlossary} />
            <SourcesCard content={content} readOnly={readOnly} update={update} />
          </div>

          {/* Right: Checks / Images / Preview */}
          <aside className="min-w-0 lg:col-span-2 xl:col-span-1 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto">
            <PortalCard className="p-4">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-3 grid w-full grid-cols-3">
                  <TabsTrigger value="checks">{SL("Checks", "Vérifications")}{toFix ? <span className="ml-1.5 rounded-full bg-portal-red px-1.5 text-[10px] text-brand-onNavy">{toFix}</span> : null}</TabsTrigger>
                  <TabsTrigger value="images">{SL("Images", "Images")}</TabsTrigger>
                  <TabsTrigger value="preview">{SL("Preview", "Aperçu")}</TabsTrigger>
                </TabsList>
                <TabsContent value="checks">
                  <ChecksPanel issues={issues} disabled={readOnly} onShow={scrollToPath} onFixEmDash={() => update((c) => deepFix(c))} onAddGlossary={addGlossary} />
                </TabsContent>
                <TabsContent value="images">
                  <div className="rounded-xl border border-dashed border-brand-line p-5 text-center text-sm text-brand-navySoft">
                    <p className="font-bold text-brand-navy">{SL("Wikimedia Commons search", "Recherche Wikimedia Commons")}</p>
                    <p className="mt-1">{SL("Searching licensed images with credits filled in automatically arrives in the next update. Meanwhile, add an Image block and paste a direct https link.", "La recherche d'images sous licence, avec crédits remplis automatiquement, arrive dans la prochaine mise à jour. En attendant, ajoutez un bloc Image et collez un lien https direct.")}</p>
                  </div>
                </TabsContent>
                <TabsContent value="preview">
                  <div className="-mx-1 overflow-hidden rounded-xl border border-brand-line">
                    <StudioPreview content={content} lang={lang} />
                  </div>
                </TabsContent>
              </Tabs>
            </PortalCard>
          </aside>
        </div>
      </div>

      <Dialog open={phone} onOpenChange={setPhone}>
        <DialogContent className="w-auto max-w-none border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{SL("Preview on phone", "Aperçu sur téléphone")}</DialogTitle>
          <div className="mx-auto h-[min(780px,90vh)] w-[390px] max-w-[92vw] overflow-hidden rounded-[44px] border-[10px] border-brand-navy bg-portal-bg shadow-2xl">
            <div className="h-full overflow-y-auto pt-6"><StudioPreview content={content} lang={lang} /></div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function SectionCard({
  section, index, handle, readOnly, sensors, onChange, onDelete, onBlockDrag,
}: {
  section: Section; index: number; handle: React.ReactNode; readOnly: boolean; sensors: ReturnType<typeof useSensors>;
  onChange: (fn: (s: Section) => Section) => void; onDelete: () => void; onBlockDrag: (e: DragEndEvent) => void;
}) {
  const [palette, setPalette] = useState(false);
  const sp = `sections[${index}]`;
  const add = (type: BlockType) => {
    onChange((s) => ({ ...s, blocks: [...s.blocks, newBlock(type, key())] }));
    setPalette(false);
  };
  return (
    <PortalCard className="mb-5 p-5">
      <div data-path={sp} className="rounded-lg">
        <div className="mb-3 flex items-center gap-2">
          {readOnly ? null : handle}
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-navySoft">
            {SL(`Section ${index + 1}`, `Section ${index + 1}`)}{index === 0 ? ` · ${SL("introduction, free to read", "introduction, en accès libre")}` : ""}
          </span>
          <span className="ml-auto text-xs tabular-nums text-brand-navySoft">{SL(`${sectionWords(section)} words`, `${sectionWords(section)} mots`)}</span>
          {readOnly ? null : (
            <button type="button" onClick={onDelete} className="rounded p-1 text-brand-navySoft/60 hover:bg-portal-red/10 hover:text-portal-red" aria-label={SL("Delete section", "Supprimer la section")}><Trash2 className="size-4" /></button>
          )}
        </div>
        <input data-path={`${sp}.title`} className={cn(inputCls, "mb-3 text-base font-extrabold")} value={section.title} disabled={readOnly} placeholder={index === 0 ? "Introduction" : SL("Section title", "Titre de la section")} onChange={(e) => onChange((s) => ({ ...s, title: e.target.value }))} />
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onBlockDrag}>
          <SortableContext items={section.blocks.map((b) => b._key!)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {section.blocks.map((b, bi) => (
                <Sortable key={b._key} id={b._key!}>
                  {(h) => (
                    <BlockCard
                      block={b} path={`${sp}.blocks[${bi}]`} handle={h} disabled={readOnly}
                      onChange={(nb: Block) => onChange((s) => ({ ...s, blocks: s.blocks.map((x, j) => (j === bi ? nb : x)) }))}
                      onDelete={() => onChange((s) => ({ ...s, blocks: s.blocks.filter((_, j) => j !== bi) }))}
                    />
                  )}
                </Sortable>
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {readOnly ? null : palette ? (
          <div className="mt-3 flex flex-wrap gap-1.5 rounded-xl bg-brand-surface p-2">
            {BLOCK_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => add(t)} className="rounded-lg border border-brand-line bg-card px-2.5 py-1 text-xs font-bold text-brand-navy hover:border-portal-accent">{BLOCK_LABEL(t)}</button>
            ))}
            <button type="button" onClick={() => setPalette(false)} className="px-2 text-xs text-brand-navySoft">{SL("Cancel", "Annuler")}</button>
          </div>
        ) : (
          <button type="button" onClick={() => setPalette(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-portal-accent hover:underline"><Plus className="size-3.5" />{SL("Add a block", "Ajouter un bloc")}</button>
        )}
      </div>
    </PortalCard>
  );
}

type Upd = (fn: (c: StudioCourseContent) => StudioCourseContent) => void;

function GlossaryCard({ content, readOnly, update, onAdd }: { content: StudioCourseContent; readOnly: boolean; update: Upd; onAdd: (t: string) => void }) {
  const set = (i: number, patch: Partial<StudioCourseContent["glossary"][number]>) =>
    update((c) => ({ ...c, glossary: c.glossary.map((g, j) => (j === i ? { ...g, ...patch } : g)) }));
  return (
    <PortalCard className="p-5">
      <div data-path="glossary">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-navySoft">{SL("Glossary", "Glossaire")}</p>
        <p className="mb-3 text-xs text-brand-navySoft">{SL("Each [[term]] marked in the text needs an entry. Sophia polishes them after review.", "Chaque [[terme]] marqué dans le texte demande une entrée. Sophia les relit après la relecture.")}</p>
        <div className="space-y-2">
          {content.glossary.map((g, i) => (
            <div key={i} data-path={`glossary[${i}]`} className="grid gap-2 rounded-xl border border-brand-line p-2.5 sm:grid-cols-[1fr_170px_auto]">
              <input data-path={`glossary[${i}].term`} className={cn(inputCls, "font-bold")} value={g.term} disabled={readOnly} placeholder={SL("Term", "Terme")} onChange={(e) => set(i, { term: e.target.value })} />
              <select data-path={`glossary[${i}].classification`} className={inputCls} value={g.classification} disabled={readOnly} onChange={(e) => set(i, { classification: e.target.value })}>
                <option value="">{SL("Type…", "Type…")}</option>
                {GLOSSARY_CLASSES.map((k) => <option key={k} value={k}>{SL(GLOSSARY_CLASS_LABEL[k].en, GLOSSARY_CLASS_LABEL[k].fr)}</option>)}
              </select>
              {readOnly ? <span /> : (
                <button type="button" onClick={() => update((c) => ({ ...c, glossary: c.glossary.filter((_, j) => j !== i) }))} className="rounded p-1.5 text-brand-navySoft/60 hover:text-portal-red" aria-label={SL("Remove term", "Retirer le terme")}><Trash2 className="size-4" /></button>
              )}
              <textarea data-path={`glossary[${i}].explanation`} className={cn(inputCls, "sm:col-span-3")} rows={2} value={g.explanation} disabled={readOnly} placeholder={SL("Short explanation (10 to 600 characters)", "Explication courte (10 à 600 caractères)")} onChange={(e) => set(i, { explanation: e.target.value })} />
            </div>
          ))}
        </div>
        {readOnly ? null : (
          <button type="button" onClick={() => onAdd("")} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-portal-accent hover:underline"><Plus className="size-3.5" />{SL("Add a term", "Ajouter un terme")}</button>
        )}
      </div>
    </PortalCard>
  );
}

function SourcesCard({ content, readOnly, update }: { content: StudioCourseContent; readOnly: boolean; update: Upd }) {
  const set = (i: number, patch: Partial<StudioCourseContent["sources"][number]>) =>
    update((c) => ({ ...c, sources: c.sources.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  return (
    <PortalCard className="p-5">
      <div data-path="sources">
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-brand-navySoft">{SL("Sources", "Sources")}</p>
        <div className="space-y-2">
          {content.sources.map((s, i) => (
            <div key={i} data-path={`sources[${i}]`} className="grid gap-2 sm:grid-cols-[1fr_220px_auto]">
              <input data-path={`sources[${i}].text`} className={inputCls} value={s.text} disabled={readOnly} placeholder={SL("Author, title, publication, year, pages", "Auteur, titre, publication, année, pages")} onChange={(e) => set(i, { text: e.target.value })} />
              <input data-path={`sources[${i}].url`} className={inputCls} value={s.url ?? ""} disabled={readOnly} placeholder="https://… (optional)" onChange={(e) => set(i, { url: e.target.value.trim() })} />
              {readOnly ? <span /> : (
                <button type="button" onClick={() => update((c) => ({ ...c, sources: c.sources.filter((_, j) => j !== i) }))} className="rounded p-1.5 text-brand-navySoft/60 hover:text-portal-red" aria-label={SL("Remove source", "Retirer la source")}><Trash2 className="size-4" /></button>
              )}
            </div>
          ))}
        </div>
        {readOnly ? null : (
          <button type="button" onClick={() => update((c) => ({ ...c, sources: [...c.sources, { text: "" }] }))} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-portal-accent hover:underline"><Plus className="size-3.5" />{SL("Add a source", "Ajouter une source")}</button>
        )}
      </div>
    </PortalCard>
  );
}
