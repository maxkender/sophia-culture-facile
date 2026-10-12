import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Hub delete confirmation with the optional "archive in Notion" checkbox (default off). */
export function DeleteConfirm({ open, onOpenChange, title, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; onConfirm: (archiveNotion: boolean) => Promise<void> }) {
  const [archive, setArchive] = useState(false); const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) setArchive(false); onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>Removed from the Hub with its stored files. The Notion row is marked "Supprimé du Hub" and will never be re-imported.</AlertDialogDescription>
        </AlertDialogHeader>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archive} onChange={(e) => setArchive(e.target.checked)} />Also archive the row in Notion (recoverable from Notion trash)</label>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(archive); onOpenChange(false); setArchive(false); } finally { setBusy(false); } }}>{busy ? <Loader2 className="size-4 animate-spin" /> : null}Delete</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
