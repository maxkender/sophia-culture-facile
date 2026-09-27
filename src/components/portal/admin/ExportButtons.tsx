import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportAuthors, exportValidatedCourses } from "@/lib/admin-export.functions";

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons() {
  const [busy, setBusy] = useState<"courses" | "authors" | null>(null);
  const runCourses = useServerFn(exportValidatedCourses);
  const runAuthors = useServerFn(exportAuthors);

  const handle = async (kind: "courses" | "authors") => {
    setBusy(kind);
    try {
      const result = kind === "courses" ? await runCourses({ data: {} }) : await runAuthors({ data: {} });
      downloadCsv(result.filename, result.csv);
      toast.success("Export downloaded.");
    } catch {
      toast.error("The export failed. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="pill" size="pillSm" onClick={() => handle("courses")} disabled={busy !== null}>
        {busy === "courses" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        Validated courses CSV
      </Button>
      <Button variant="pill" size="pillSm" onClick={() => handle("authors")} disabled={busy !== null}>
        {busy === "authors" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        Authors export CSV
      </Button>
    </div>
  );
}
