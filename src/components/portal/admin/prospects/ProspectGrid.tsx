import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ColMeta } from "./columns";
import { STATUS_CLASS, STATUSES, type Enriched, type Hm, type Prospect } from "./model";

type Props = {
  table: Table<Enriched>;
  hms: Hm[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onSave: (id: string, patch: Partial<Prospect>) => void;
};

const ROW_H = 40;

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold", STATUS_CLASS[status] ?? "bg-muted")}>
      {status.replace("_", " ")}
    </span>
  );
}

export function ProspectGrid({ table, hms, activeId, onOpen, onSave }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  const cols = table.getVisibleLeafColumns();
  const [focus, setFocus] = useState<{ r: number; c: number }>({ r: 0, c: 1 });
  const [editing, setEditing] = useState(false);
  const width = table.getTotalSize();

  const virt = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
  });

  useEffect(() => {
    if (focus.r >= rows.length && rows.length) setFocus((f) => ({ ...f, r: rows.length - 1 }));
  }, [rows.length, focus.r]);

  function move(dr: number, dc: number) {
    setFocus((f) => {
      const r = Math.max(0, Math.min(rows.length - 1, f.r + dr));
      const c = Math.max(0, Math.min(cols.length - 1, f.c + dc));
      virt.scrollToIndex(r);
      return { r, c };
    });
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (editing) return;
    const map: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], Tab: [0, e.shiftKey ? -1 : 1] };
    if (map[e.key]) {
      e.preventDefault();
      move(...map[e.key]);
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      const col = cols[focus.c];
      const row = rows[focus.r];
      if (!col || !row) return;
      if (col.id === "name") onOpen(row.original.id);
      else if ((col.columnDef.meta as ColMeta)?.edit) setEditing(true);
    } else if (e.key === " " && cols[focus.c]?.id === "select") {
      e.preventDefault();
      rows[focus.r]?.toggleSelected();
    }
  }

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      role="grid"
      aria-rowcount={rows.length}
      onKeyDown={onKey}
      className="relative h-[70vh] overflow-auto rounded-xl border border-brand-line bg-card text-sm outline-none focus-visible:ring-2 focus-visible:ring-portal-accent"
    >
      <div style={{ width }} className="min-w-full">
        <div className="sticky top-0 z-20 border-b border-brand-line bg-brand-surface" role="row">
          <div className="flex">
            {table.getHeaderGroups()[0]!.headers.map((h) => {
              const meta = h.column.columnDef.meta as ColMeta;
              const sorted = h.column.getIsSorted();
              return (
                <div key={h.id} style={{ width: h.getSize() }} className="relative shrink-0 border-r border-brand-line px-2 py-1.5" role="columnheader">
                  <button
                    type="button"
                    disabled={!h.column.getCanSort()}
                    onClick={h.column.getToggleSortingHandler()}
                    className="flex w-full items-center gap-1 truncate text-left text-[11px] font-bold uppercase tracking-wide text-brand-navy"
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header ?? meta?.label, h.getContext()) ?? meta?.label}
                    {typeof h.column.columnDef.header !== "function" && meta?.label && !h.column.columnDef.header ? meta.label : null}
                    {sorted === "asc" ? <ArrowUp className="size-3" /> : sorted === "desc" ? <ArrowDown className="size-3" /> : null}
                  </button>
                  {h.column.getCanFilter() ? (
                    meta?.filter === "select" ? (
                      <select
                        aria-label={`Filter ${meta.label}`}
                        className="mt-1 h-6 w-full rounded border border-brand-line bg-card px-1 text-xs"
                        value={(h.column.getFilterValue() as string) ?? ""}
                        onChange={(e) => h.column.setFilterValue(e.target.value || undefined)}
                      >
                        <option value="">All</option>
                        <option value="__empty">(empty)</option>
                        {(meta.options ?? []).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        aria-label={`Filter ${meta?.label}`}
                        className="mt-1 h-6 w-full rounded border border-brand-line bg-card px-1 text-xs"
                        placeholder="Filter…"
                        value={(h.column.getFilterValue() as string) ?? ""}
                        onChange={(e) => h.column.setFilterValue(e.target.value || undefined)}
                      />
                    )
                  ) : null}
                  {h.column.getCanResize() ? (
                    <div
                      onMouseDown={h.getResizeHandler()}
                      onTouchStart={h.getResizeHandler()}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-portal-accent/40"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ height: virt.getTotalSize(), position: "relative" }}>
          {virt.getVirtualItems().map((vr) => {
            const row = rows[vr.index]!;
            return (
              <div
                key={row.id}
                role="row"
                className={cn(
                  "absolute left-0 flex w-full border-b border-brand-line",
                  row.getIsSelected() && "bg-portal-accent/5",
                  activeId === row.original.id && "bg-portal-accent/10",
                )}
                style={{ transform: `translateY(${vr.start}px)`, height: ROW_H }}
              >
                {row.getVisibleCells().map((cell, ci) => {
                  const focused = focus.r === vr.index && focus.c === ci;
                  const meta = cell.column.columnDef.meta as ColMeta;
                  return (
                    <div
                      key={cell.id}
                      role="gridcell"
                      style={{ width: cell.column.getSize() }}
                      className={cn(
                        "flex shrink-0 items-center overflow-hidden whitespace-nowrap border-r border-brand-line/60 px-2",
                        focused && "outline outline-2 -outline-offset-2 outline-portal-accent",
                      )}
                      onClick={() => {
                        setFocus({ r: vr.index, c: ci });
                        if (cell.column.id === "name") onOpen(row.original.id);
                        else if (meta?.edit) setEditing(true);
                      }}
                    >
                      {focused && editing && meta?.edit ? (
                        <CellEditor
                          meta={meta}
                          row={row.original}
                          hms={hms}
                          onDone={(patch) => {
                            setEditing(false);
                            scrollRef.current?.focus();
                            if (patch) onSave(row.original.id, patch);
                          }}
                        />
                      ) : cell.column.id === "status" ? (
                        <StatusPill status={row.original.status} />
                      ) : cell.column.id === "name" ? (
                        <span className="truncate font-semibold text-portal-accent hover:underline">
                          {row.original.name || row.original.email || "(no name)"}
                        </span>
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        {rows.length === 0 ? <p className="p-6 text-center text-brand-navySoft">No prospects match these filters.</p> : null}
      </div>
    </div>
  );
}

function CellEditor({
  meta,
  row,
  hms,
  onDone,
}: {
  meta: ColMeta;
  row: Enriched;
  hms: Hm[];
  onDone: (patch: Partial<Prospect> | null) => void;
}) {
  const field = meta.field as keyof Prospect;
  const initial = row[field] as string | number | null;
  const [val, setVal] = useState(initial == null ? "" : String(initial));
  const done = useRef(false);

  function commit(v = val) {
    if (done.current) return;
    done.current = true;
    const trimmed = v.trim();
    if (trimmed === (initial == null ? "" : String(initial))) return onDone(null);
    let out: unknown = trimmed || null;
    if (meta.edit === "number") out = trimmed ? Number(trimmed.replace(/\D/g, "")) : null;
    onDone({ [field]: out } as Partial<Prospect>);
  }
  function cancel() {
    done.current = true;
    onDone(null);
  }
  const keys = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter" && meta.edit !== "notes") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") cancel();
  };

  if (meta.edit === "status") {
    return (
      <Popover open onOpenChange={(o) => !o && cancel()}>
        <PopoverTrigger asChild>
          <span><StatusPill status={row.status} /></span>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" onKeyDown={keys}>
          {STATUSES.map((s) => (
            <button key={s} type="button" className="block w-full rounded px-2 py-1 text-left hover:bg-brand-surface" onClick={() => commit(s)}>
              <StatusPill status={s} />
            </button>
          ))}
        </PopoverContent>
      </Popover>
    );
  }
  if (meta.edit === "enum" || meta.edit === "hm") {
    const opts = meta.edit === "hm" ? hms.map((h) => ({ v: h.id, l: h.full_name ?? h.id })) : (meta.options ?? []).map((o) => ({ v: o, l: o }));
    return (
      <select
        autoFocus
        className="h-7 w-full rounded border border-portal-accent bg-card text-xs"
        value={val}
        onKeyDown={keys}
        onBlur={() => commit()}
        onChange={(e) => {
          setVal(e.target.value);
          commit(e.target.value);
        }}
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    );
  }
  if (meta.edit === "notes") {
    return (
      <Popover open onOpenChange={(o) => !o && commit()}>
        <PopoverTrigger asChild>
          <span className="truncate">{val.split("\n")[0]}</span>
        </PopoverTrigger>
        <PopoverContent className="w-96 space-y-2" onKeyDown={keys}>
          {row.presentation ? (
            <p className="max-h-32 overflow-auto whitespace-pre-wrap rounded bg-brand-surface p-2 text-xs text-brand-navySoft">
              <b>Presentation:</b> {row.presentation}
            </p>
          ) : null}
          <Textarea autoFocus rows={6} value={val} onChange={(e) => setVal(e.target.value)} placeholder="Notes" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
            <Button size="sm" onClick={() => commit()}>Save</Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <input
      autoFocus
      type={meta.edit === "date" ? "date" : meta.edit === "number" ? "number" : "text"}
      className="h-7 w-full rounded border border-portal-accent bg-card px-1 text-xs"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={keys}
      onBlur={() => commit()}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
