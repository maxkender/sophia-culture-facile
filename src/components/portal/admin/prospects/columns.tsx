import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { countryLabel, handleUrl, SOURCES, STATUSES, TRACKS, todayIso, type Enriched, type Hm } from "./model";

export type EditKind = "text" | "number" | "date" | "status" | "hm" | "enum" | "notes";

export type ColMeta = {
  label: string;
  edit?: EditKind;
  field?: keyof Enriched;
  options?: readonly string[];
  filter?: "text" | "select";
};

export const anyText: FilterFn<Enriched> = (row, id, value) => {
  if (value == null || value === "") return true;
  const v = row.getValue(id);
  const s = Array.isArray(v) ? v.join(" ") : v == null ? "" : String(v);
  return s.toLowerCase().includes(String(value).toLowerCase());
};

export const exact: FilterFn<Enriched> = (row, id, value) => {
  if (!value) return true;
  const v = row.getValue(id);
  return value === "__empty" ? v == null || v === "" : v === value;
};

function fmtDate(v: string | null) {
  return v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "";
}

export function buildColumns(hms: Hm[]): ColumnDef<Enriched, unknown>[] {
  const m = (meta: ColMeta) => meta;
  return [
    {
      id: "select",
      size: 40,
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: false,
      enableHiding: false,
      meta: m({ label: "" }),
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Select all"
          checked={table.getIsAllRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomeRowsSelected();
          }}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label="Select row"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    { accessorKey: "name", size: 180, enableHiding: false, meta: m({ label: "Full name", edit: "text", field: "name" }) },
    { accessorKey: "email", size: 220, meta: m({ label: "Email", edit: "text", field: "email" }) },
    { accessorKey: "phone", size: 130, meta: m({ label: "Phone", edit: "text", field: "phone" }) },
    {
      accessorKey: "country",
      size: 150,
      meta: m({ label: "Country", edit: "text", field: "country" }),
      cell: ({ getValue }) => countryLabel(getValue() as string | null),
    },
    { accessorKey: "language", size: 90, meta: m({ label: "Language", edit: "text", field: "language" }) },
    {
      accessorKey: "track",
      size: 110,
      filterFn: exact,
      meta: m({ label: "Track wanted", edit: "enum", field: "track", options: TRACKS, filter: "select" }),
    },
    { accessorKey: "followers", size: 100, meta: m({ label: "Followers", edit: "number", field: "followers" }), cell: ({ getValue }) => (getValue() as number | null)?.toLocaleString("en-GB") ?? "" },
    {
      accessorKey: "tiktok_handle",
      size: 150,
      meta: m({ label: "TikTok", edit: "text", field: "tiktok_handle" }),
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? (
          <a href={handleUrl("tiktok", v)} target="_blank" rel="noreferrer" className="text-portal-accent underline" onClick={(e) => e.stopPropagation()}>
            {v}
          </a>
        ) : null;
      },
    },
    {
      accessorKey: "instagram_handle",
      size: 150,
      meta: m({ label: "Instagram", edit: "text", field: "instagram_handle" }),
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? (
          <a href={handleUrl("instagram", v)} target="_blank" rel="noreferrer" className="text-portal-accent underline" onClick={(e) => e.stopPropagation()}>
            {v}
          </a>
        ) : null;
      },
    },
    {
      accessorKey: "source",
      size: 110,
      filterFn: exact,
      meta: m({ label: "Source", edit: "enum", field: "source", options: SOURCES, filter: "select" }),
    },
    {
      accessorKey: "status",
      size: 130,
      filterFn: exact,
      meta: m({ label: "Status", edit: "status", field: "status", options: STATUSES, filter: "select" }),
    },
    {
      id: "hm",
      accessorFn: (r) => r.hmName ?? "",
      size: 150,
      filterFn: exact,
      meta: m({ label: "Assigned HM", edit: "hm", field: "assigned_hm_id", options: hms.map((h) => h.full_name ?? h.id), filter: "select" }),
    },
    {
      id: "last_touch",
      accessorFn: (r) => r.lastTouchAt ?? "",
      size: 150,
      meta: m({ label: "Last touch" }),
      cell: ({ row }) => (row.original.lastTouchAt ? `${fmtDate(row.original.lastTouchAt)} · ${row.original.lastTouchChannel}` : ""),
    },
    {
      accessorKey: "next_action_on",
      size: 130,
      meta: m({ label: "Next action", edit: "date", field: "next_action_on" }),
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        if (!v) return "";
        return <span className={v < todayIso() ? "font-bold text-portal-red" : ""}>{fmtDate(v)}</span>;
      },
    },
    { id: "touches", accessorFn: (r) => r.touchCount, size: 80, meta: m({ label: "Touches" }) },
    {
      id: "notes",
      accessorFn: (r) => r.notes ?? r.presentation ?? "",
      size: 220,
      meta: m({ label: "Notes", edit: "notes", field: "notes" }),
      cell: ({ getValue }) => <span className="truncate">{String(getValue() ?? "").split("\n")[0]}</span>,
    },
    { accessorKey: "tags", size: 120, meta: m({ label: "Tags" }), cell: ({ getValue }) => ((getValue() as string[]) ?? []).join(", ") },
    { accessorKey: "created_at", size: 110, meta: m({ label: "Created" }), cell: ({ getValue }) => fmtDate(getValue() as string) },
  ];
}
