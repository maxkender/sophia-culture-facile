import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type ColumnSizingState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Columns3, Download, Plus, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageTitle } from "../ui";
import { anyText, buildColumns, type ColMeta } from "./prospects/columns";
import { ProspectGrid } from "./prospects/ProspectGrid";
import { ProspectDashboard } from "./prospects/ProspectDashboard";
import { ProspectPanel } from "./prospects/ProspectPanel";
import { AddOneDialog, ProspectImport } from "./prospects/ProspectImport";
import { useProspectMutations, useProspectsData } from "./prospects/useProspects";
import {
  CHANNELS,
  STATUSES,
  PRESETS,
  countryLabel,
  downloadCsv,
  enrich,
  matchPreset,
  matchSearch,
  toCsv,
  type Enriched,
  type PresetView,
} from "./prospects/model";

type SavedView = { name: string; preset: PresetView; search: string; filters: ColumnFiltersState };
type GridPrefs = { visibility?: VisibilityState; sizing?: ColumnSizingState; dashboard?: boolean };

async function loadPref<T>(key: string): Promise<T | null> {
  const { data } = await supabase.from("admin_ui_prefs").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? null;
}
async function savePref(key: string, value: unknown) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("admin_ui_prefs").upsert({ user_id: data.user.id, key, value: value as never, updated_at: new Date().toISOString() });
}

export function CreatorProspects() {
  const { data, isLoading } = useProspectsData();
  const mut = useProspectMutations();
  const hms = data?.hms ?? [];
  const all = useMemo(() => enrich(data?.prospects ?? [], data?.touches ?? [], hms), [data, hms]);

  const [preset, setPreset] = useState<PresetView>("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [visibility, setVisibility] = useState<VisibilityState>({ tags: false });
  const [sizing, setSizing] = useState<ColumnSizingState>({});
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [views, setViews] = useState<SavedView[]>([]);
  const [showDash, setShowDash] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const prefsLoaded = useRef(false);

  useEffect(() => {
    void (async () => {
      const [p, v] = await Promise.all([loadPref<GridPrefs>("prospect_grid"), loadPref<SavedView[]>("prospect_views")]);
      if (p?.visibility) setVisibility(p.visibility);
      if (p?.sizing) setSizing(p.sizing);
      if (typeof p?.dashboard === "boolean") setShowDash(p.dashboard);
      if (v) setViews(v);
      prefsLoaded.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!prefsLoaded.current) return;
    const t = setTimeout(() => void savePref("prospect_grid", { visibility, sizing, dashboard: showDash }), 600);
    return () => clearTimeout(t);
  }, [visibility, sizing, showDash]);

  const pre = useMemo(() => all.filter((p) => matchPreset(p, preset) && matchSearch(p, search)), [all, preset, search]);
  const columns = useMemo(() => buildColumns(hms), [hms]);

  const table = useReactTable({
    data: pre,
    columns,
    getRowId: (r) => r.id,
    state: { sorting, columnFilters, columnVisibility: visibility, columnSizing: sizing, rowSelection: selection },
    defaultColumn: { filterFn: anyText, minSize: 60 },
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setVisibility,
    onColumnSizingChange: setSizing,
    onRowSelectionChange: setSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const visibleRows = table.getRowModel().rows.map((r) => r.original);
  const selectedIds = Object.keys(selection).filter((k) => selection[k]);
  const active = activeId ? all.find((p) => p.id === activeId) ?? null : null;

  const step = useCallback(
    (dir: 1 | -1) => {
      const i = visibleRows.findIndex((r) => r.id === activeId);
      const next = visibleRows[i + dir];
      if (next) setActiveId(next.id);
    },
    [visibleRows, activeId],
  );

  function exportRows(rows: Enriched[], name: string) {
    const cols = table.getVisibleLeafColumns().filter((c) => c.id !== "select");
    const headers = cols.map((c) => (c.columnDef.meta as ColMeta).label);
    const out = rows.map((r) => {
      const o: Record<string, unknown> = {};
      for (const c of cols) {
        const label = (c.columnDef.meta as ColMeta).label;
        o[label] =
          c.id === "country" ? countryLabel(r.country)
          : c.id === "hm" ? r.hmName
          : c.id === "last_touch" ? (r.lastTouchAt ? `${r.lastTouchAt.slice(0, 10)} ${r.lastTouchChannel}` : "")
          : c.id === "touches" ? r.touchCount
          : c.id === "notes" ? r.notes ?? r.presentation
          : (r as Record<string, unknown>)[c.id];
      }
      return o;
    });
    downloadCsv(name, toCsv(out, headers));
  }

  function applyView(v: SavedView) {
    setPreset(v.preset);
    setSearch(v.search);
    setColumnFilters(v.filters);
  }
  function saveView() {
    const name = window.prompt("Name this view");
    if (!name) return;
    const next = [...views.filter((v) => v.name !== name), { name, preset, search, filters: columnFilters }];
    setViews(next);
    void savePref("prospect_views", next);
    toast.success("View saved.");
  }
  function deleteView(name: string) {
    const next = views.filter((v) => v.name !== name);
    setViews(next);
    void savePref("prospect_views", next);
  }

  async function bulk(kind: string) {
    if (!selectedIds.length) return;
    if (kind === "delete") {
      if (!window.confirm(`Delete ${selectedIds.length} prospects and their touch history? This cannot be undone.`)) return;
      await mut.remove(selectedIds);
      setSelection({});
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle title="Prospects" lead={`${all.length} creators you reach out to. Applications with the same email or handle are matched automatically.`} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add one</Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="size-4" /> Import</Button>
          <Button variant="outline" size="sm" onClick={() => exportRows(visibleRows, `prospects-${new Date().toISOString().slice(0, 10)}.csv`)}><Download className="size-4" /> Export CSV</Button>
        </div>
      </div>

      <div>
        <button type="button" onClick={() => setShowDash((s) => !s)} className="mb-2 flex items-center gap-1 text-sm font-bold text-brand-navy">
          {showDash ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />} Dashboard
        </button>
        {showDash ? <ProspectDashboard rows={visibleRows} touches={data?.touches ?? []} hms={hms} /> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Button key={p.id} size="sm" variant={preset === p.id ? "default" : "outline"} onClick={() => setPreset(p.id)}>{p.label}</Button>
        ))}
        {views.map((v) => (
          <span key={v.name} className="inline-flex items-center">
            <Button size="sm" variant="secondary" onClick={() => applyView(v)}>{v.name}</Button>
            <button type="button" aria-label={`Delete view ${v.name}`} className="px-1 text-brand-navySoft hover:text-portal-red" onClick={() => deleteView(v.name)}><X className="size-3" /></button>
          </span>
        ))}
        <Button size="sm" variant="ghost" onClick={saveView}>+ Save current filters as a view</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-brand-navySoft" />
          <Input className="pl-8" placeholder="Search name, email, handles, notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {columnFilters.length ? <Button size="sm" variant="ghost" onClick={() => setColumnFilters([])}>Clear column filters</Button> : null}
        <Popover>
          <PopoverTrigger asChild><Button size="sm" variant="outline"><Columns3 className="size-4" /> Columns</Button></PopoverTrigger>
          <PopoverContent className="w-56 space-y-1">
            {table.getAllLeafColumns().filter((c) => c.getCanHide()).map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} />
                {(c.columnDef.meta as ColMeta).label}
              </label>
            ))}
            <Button size="sm" variant="ghost" className="w-full" onClick={() => { setSizing({}); setVisibility({ tags: false }); }}>Reset</Button>
          </PopoverContent>
        </Popover>
        <span className="text-xs text-brand-navySoft">{visibleRows.length} shown</span>
      </div>

      {selectedIds.length ? (
        <BulkBar
          count={selectedIds.length}
          hms={hms}
          onClear={() => setSelection({})}
          onStatus={(s) => mut.update(selectedIds, { status: s })}
          onHm={(id) => mut.update(selectedIds, { assigned_hm_id: id || null })}
          onDate={(d) => mut.update(selectedIds, { next_action_on: d || null })}
          onTag={async (tag) => {
            for (const p of all.filter((x) => selectedIds.includes(x.id))) {
              if (!(p.tags ?? []).includes(tag)) await mut.update([p.id], { tags: [...(p.tags ?? []), tag] });
            }
            toast.success(`Tag “${tag}” added.`);
          }}
          onLog={async (ch, msg) => { if (await mut.logTouches(selectedIds, ch, msg)) toast.success(`Touch logged for ${selectedIds.length}.`); }}
          onExport={() => exportRows(all.filter((p) => selectedIds.includes(p.id)), "prospects-selected.csv")}
          onDelete={() => void bulk("delete")}
        />
      ) : null}

      {isLoading ? <p className="text-sm text-brand-navySoft">Loading…</p> : (
        <ProspectGrid table={table} hms={hms} activeId={activeId} onOpen={setActiveId} onSave={(id, patch) => void mut.update([id], patch)} />
      )}

      {active ? (
        <ProspectPanel
          prospect={active}
          touches={(data?.touches ?? []).filter((t) => t.prospect_id === active.id)}
          hms={hms}
          templates={data?.templates ?? []}
          onClose={() => setActiveId(null)}
          onStep={step}
          onSave={(patch) => mut.update([active.id], patch)}
          onLog={(ch, msg) => mut.logTouches([active.id], ch, msg)}
          onTemplatesChanged={mut.refresh}
        />
      ) : null}

      <ProspectImport open={importOpen} onOpenChange={setImportOpen} existing={data?.prospects ?? []} onDone={mut.refresh} />
      <AddOneDialog open={addOpen} onOpenChange={setAddOpen} onDone={mut.refresh} />
    </div>
  );
}

function BulkBar(props: {
  count: number;
  hms: { id: string; full_name: string | null }[];
  onClear: () => void;
  onStatus: (s: string) => void;
  onHm: (id: string) => void;
  onDate: (d: string) => void;
  onTag: (t: string) => void;
  onLog: (channel: string, message: string) => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const [ch, setCh] = useState("email");
  const [msg, setMsg] = useState("");
  const sel = "h-8 rounded-md border border-input bg-card px-2 text-xs";
  return (
    <div className="sticky top-16 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-portal-accent/40 bg-card p-2 shadow-md">
      <span className="text-sm font-bold text-brand-navy">{props.count} selected</span>
      <select className={sel} value="" onChange={(e) => e.target.value && props.onStatus(e.target.value)}>
        <option value="">Change status…</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select className={sel} value="_" onChange={(e) => props.onHm(e.target.value)}>
        <option value="_" disabled>Assign HM…</option><option value="">Unassign</option>
        {props.hms.map((h) => <option key={h.id} value={h.id}>{h.full_name}</option>)}
      </select>
      <label className="flex items-center gap-1 text-xs">Next action <input type="date" className={sel} onChange={(e) => props.onDate(e.target.value)} /></label>
      <Button size="sm" variant="outline" onClick={() => { const t = window.prompt("Tag to add"); if (t?.trim()) props.onTag(t.trim()); }}>Add tag</Button>
      <Popover>
        <PopoverTrigger asChild><Button size="sm" variant="outline">Log touch</Button></PopoverTrigger>
        <PopoverContent className="w-80 space-y-2">
          <select className={sel} value={ch} onChange={(e) => setCh(e.target.value)}>{[...CHANNELS, "reply"].map((c) => <option key={c}>{c}</option>)}</select>
          <textarea className="w-full rounded-md border border-input p-2 text-sm" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message sent to all selected" />
          <Button size="sm" onClick={() => { if (msg.trim()) { props.onLog(ch, msg.trim()); setMsg(""); } }}>Log for {props.count}</Button>
        </PopoverContent>
      </Popover>
      <Button size="sm" variant="outline" onClick={props.onExport}>Export selected</Button>
      <Button size="sm" variant="destructive" onClick={props.onDelete}>Delete</Button>
      <Button size="sm" variant="ghost" onClick={props.onClear}>Clear</Button>
    </div>
  );
}
