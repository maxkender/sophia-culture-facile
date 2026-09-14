import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Bold, Download, Italic, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BLOCK_LABEL,
  DOCUMENT_LABEL,
  emptyBlock,
  MERGE_TOKENS,
  parseBlocks,
  type DocBlock,
  type DocumentSlug,
} from "@/lib/documents";
import { Switch } from "@/components/ui/switch";
import { downloadDocumentPdf } from "@/lib/documentPdf";
import { formatDateTime } from "@/lib/portal";
import { DocumentBody } from "../DocumentBody";
import { usePortalProfile } from "../usePortal";
import { useDocument, useDocumentVersions } from "../useDocuments";
import { Banner, PageTitle, PortalCard } from "../ui";

const BLOCK_TYPES: DocBlock["type"][] = ["heading", "paragraph", "bullets", "table", "callout"];

/** The state of the document at a glance. */
function PublishState({ published }: { published: boolean }) {
  return (
    <span
      className={
        published
          ? "rounded-full bg-portal-green/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-portal-green"
          : "rounded-full bg-portal-amber/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-portal-amber"
      }
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

/** Wraps the current selection of a field in ** or * markers. */
function wrapSelection(element: HTMLTextAreaElement | HTMLInputElement, marker: string, apply: (value: string) => void) {
  const { selectionStart, selectionEnd, value } = element;
  if (selectionStart === null || selectionEnd === null || selectionStart === selectionEnd) return;
  const next =
    value.slice(0, selectionStart) +
    marker +
    value.slice(selectionStart, selectionEnd) +
    marker +
    value.slice(selectionEnd);
  apply(next);
}

function MarkedField({
  value,
  onChange,
  rows = 4,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  id?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div>
      <div className="mb-1 flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Bold"
          onClick={() => ref.current && wrapSelection(ref.current, "**", onChange)}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Italic"
          onClick={() => ref.current && wrapSelection(ref.current, "*", onChange)}
        >
          <Italic className="size-4" />
        </Button>
      </div>
      <Textarea id={id} ref={ref} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function BlockFields({ block, onChange }: { block: DocBlock; onChange: (block: DocBlock) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <div className="grid gap-3 md:grid-cols-[140px_1fr]">
          <div className="space-y-1">
            <Label>Level</Label>
            <Select
              value={String(block.level)}
              onValueChange={(value) => onChange({ ...block, level: value === "3" ? 3 : 2 })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Heading</SelectItem>
                <SelectItem value="3">Sub-heading</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Text</Label>
            <Input className="h-11" value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} />
          </div>
        </div>
      );
    case "paragraph":
      return <MarkedField value={block.text} onChange={(text) => onChange({ ...block, text })} />;
    case "bullets":
      return (
        <div className="space-y-2">
          {block.items.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <Textarea
                rows={2}
                value={item}
                onChange={(event) => {
                  const items = [...block.items];
                  items[index] = event.target.value;
                  onChange({ ...block, items });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove bullet"
                onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="pillSecondary"
            size="pillSm"
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
          >
            <Plus className="size-4" />
            Add bullet
          </Button>
        </div>
      );
    case "table":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((index) => (
              <div key={index} className="space-y-1">
                <Label>Column {index + 1} heading</Label>
                <Input
                  className="h-11"
                  value={block.header[index] ?? ""}
                  onChange={(event) => {
                    const header: [string, string] = [...block.header] as [string, string];
                    header[index] = event.target.value;
                    onChange({ ...block, header });
                  }}
                />
              </div>
            ))}
          </div>
          {block.rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex items-start gap-2">
              {[0, 1].map((cellIndex) => (
                <Textarea
                  key={cellIndex}
                  rows={2}
                  value={row[cellIndex] ?? ""}
                  onChange={(event) => {
                    const rows = block.rows.map((entry, index) => {
                      if (index !== rowIndex) return entry;
                      const next: [string, string] = [...entry] as [string, string];
                      next[cellIndex] = event.target.value;
                      return next;
                    });
                    onChange({ ...block, rows });
                  }}
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove row"
                onClick={() => onChange({ ...block, rows: block.rows.filter((_, i) => i !== rowIndex) })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="pillSecondary"
            size="pillSm"
            onClick={() => onChange({ ...block, rows: [...block.rows, ["", ""]] })}
          >
            <Plus className="size-4" />
            Add row
          </Button>
        </div>
      );
    case "callout":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[180px_1fr]">
            <div className="space-y-1">
              <Label>Colour</Label>
              <Select value={block.tone} onValueChange={(value) => onChange({ ...block, tone: value === "red" ? "red" : "blue" })}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red — warning</SelectItem>
                  <SelectItem value="blue">Blue — information</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input className="h-11" value={block.title} onChange={(event) => onChange({ ...block, title: event.target.value })} />
            </div>
          </div>
          <MarkedField value={block.body} onChange={(body) => onChange({ ...block, body })} rows={5} />
        </div>
      );
    default:
      return null;
  }
}

export function DocumentEditor({ slug }: { slug: DocumentSlug }) {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const { data: doc, isLoading } = useDocument(slug);
  const { data: versions = [] } = useDocumentVersions(doc?.row.id);

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<DocBlock[]>([]);
  const [note, setNote] = useState("");
  const [newType, setNewType] = useState<DocBlock["type"]>("paragraph");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ version: number; title: string; blocks: DocBlock[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function setPublished(value: boolean) {
    if (!doc) return;
    setPublishing(true);
    try {
      const { error } = await supabase.from("documents").update({ published: value }).eq("id", doc.row.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["portal", "document", slug] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "documents"] });
      toast.success(value ? "Published. Authors can now read and sign it." : "Back to draft. Authors cannot sign it.");
    } catch {
      toast.error("The visibility could not be changed.");
    } finally {
      setPublishing(false);
    }
  }

  useEffect(() => {
    if (doc && loadedFor !== doc.row.id) {
      setTitle(doc.row.title);
      setBlocks(doc.blocks);
      setLoadedFor(doc.row.id);
    }
  }, [doc, loadedFor]);

  if (isLoading) {
    return (
      <PortalCard>
        <p className="text-sm text-brand-navySoft">Loading…</p>
      </PortalCard>
    );
  }
  if (!doc) return <Banner tone="error" title="This document does not exist yet" />;

  function update(index: number, block: DocBlock) {
    setBlocks((current) => current.map((entry, i) => (i === index ? block : entry)));
  }

  function move(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item!);
      return next;
    });
  }

  async function save(nextBlocks: DocBlock[], nextTitle: string, saveNote: string) {
    if (!doc) return;
    setSaving(true);
    try {
      const version = doc.row.current_version + 1;
      const payload = nextBlocks as unknown as never;
      const { error: versionError } = await supabase.from("document_versions").insert({
        document_id: doc.row.id,
        version,
        title: nextTitle,
        content: payload,
        note: saveNote.trim() || null,
        created_by: me?.profile?.id ?? null,
      });
      if (versionError) throw versionError;
      const { error } = await supabase
        .from("documents")
        .update({
          title: nextTitle,
          content: payload,
          current_version: version,
          updated_by: me?.profile?.id ?? null,
        })
        .eq("id", doc.row.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["portal", "document", slug] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "document-versions", doc.row.id] });
      setNote("");
      setLoadedFor(null);
      toast.success(`Saved as version ${version}. Nothing was overwritten.`);
    } catch {
      toast.error("The document could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const subtitle = `Version ${doc.row.current_version} — updated ${formatDateTime(doc.row.updated_at)}`;

  return (
    <div>
      <PageTitle
        title={DOCUMENT_LABEL[slug]}
        lead={
          slug === "contract"
            ? "Authors who have already signed stay bound to the version they signed. Only authors who have not signed see a new version."
            : "Authors always read the current version of this guide."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PublishState published={doc.row.published} />
            <Button
              type="button"
              variant="pillSecondary"
              size="pillSm"
              onClick={() =>
                downloadDocumentPdf({ slug, title, subtitle, version: doc.row.current_version, blocks })
              }
            >
              <Download className="size-4" />
              Download PDF
            </Button>
            <Button type="button" variant="pill" size="pillSm" disabled={saving} onClick={() => save(blocks, title, note)}>
              {saving ? "Saving…" : "Save new version"}
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <PortalCard className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-sm font-bold text-brand-navy">
              Visibility <PublishState published={doc.row.published} />
            </p>
            <p className="mt-1 text-sm text-brand-navySoft">
              {doc.row.published
                ? "Authors can read and sign this document."
                : "Draft. Authors see a short message saying it is being finalised, and nobody can sign it."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="doc-published" className="text-sm font-semibold text-brand-navy">
              {doc.row.published ? "Published" : "Draft"}
            </Label>
            <Switch
              id="doc-published"
              checked={doc.row.published}
              disabled={publishing}
              onCheckedChange={(value) => setPublished(value)}
            />
          </div>
        </PortalCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-5">
          <PortalCard className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="doc-title">Document title</Label>
              <Input id="doc-title" className="h-11" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-note">Note for the version history (optional)</Label>
              <Input id="doc-note" className="h-11" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            <p className="text-xs text-brand-navySoft">
              {subtitle}. Saving writes a new version and leaves every earlier one intact.
            </p>
          </PortalCard>

          <PortalCard className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Merge fields</p>
            <p className="text-sm text-brand-navySoft">
              Typed anywhere in the text, these are replaced with the author's own details when they read the document.
              You always see the raw tokens here.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {MERGE_TOKENS.map((token) => (
                <code
                  key={token}
                  className="rounded bg-portal-accent/10 px-2 py-1 text-xs font-semibold text-portal-accent"
                >{`{{${token}}}`}</code>
              ))}
            </div>
          </PortalCard>

          {blocks.map((block, index) => (
            <PortalCard key={index} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{BLOCK_LABEL[block.type]}</p>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label="Move up" onClick={() => move(index, -1)}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Move down" onClick={() => move(index, 1)}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete block"
                    onClick={() => setBlocks((current) => current.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <BlockFields block={block} onChange={(next) => update(index, next)} />
            </PortalCard>
          ))}

          <PortalCard className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="new-block">Add a block</Label>
              <Select value={newType} onValueChange={(value) => setNewType(value as DocBlock["type"])}>
                <SelectTrigger id="new-block" className="h-11 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {BLOCK_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="pillSecondary"
              size="pillSm"
              onClick={() => setBlocks((current) => [...current, emptyBlock(newType)])}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </PortalCard>
        </div>

        <div className="space-y-6">
          <PortalCard>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Live preview — what the author sees</p>
            <h2 className="mt-3 text-2xl font-extrabold text-brand-navy">{title}</h2>
            <DocumentBody blocks={blocks} className="mt-6" />
          </PortalCard>

          <PortalCard>
            <h2 className="text-lg font-extrabold text-brand-navy">Version history</h2>
            <ul className="mt-4 divide-y divide-brand-line">
              {versions.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">
                      Version {entry.version}
                      {entry.version === doc.row.current_version ? " — current" : ""}
                    </p>
                    <p className="text-xs text-brand-navySoft">
                      {formatDateTime(entry.created_at)}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="pillSm"
                      onClick={() =>
                        setViewing({ version: entry.version, title: entry.title, blocks: parseBlocks(entry.content) })
                      }
                    >
                      View
                    </Button>
                    {entry.version !== doc.row.current_version ? (
                      <Button
                        type="button"
                        variant="pillSecondary"
                        size="pillSm"
                        disabled={saving}
                        onClick={() => {
                          const restored = parseBlocks(entry.content);
                          setBlocks(restored);
                          setTitle(entry.title);
                          void save(restored, entry.title, `Restored from version ${entry.version}`);
                        }}
                      >
                        Restore
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </PortalCard>

          {viewing ? (
            <PortalCard>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-brand-navy">
                  Version {viewing.version} — {viewing.title}
                </h2>
                <Button type="button" variant="ghost" size="pillSm" onClick={() => setViewing(null)}>
                  Close
                </Button>
              </div>
              <DocumentBody blocks={viewing.blocks} className="mt-6" />
            </PortalCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
