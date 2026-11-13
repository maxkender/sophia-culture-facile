import { useState, type FormEvent } from "react";
import { DocumentBody } from "@/components/portal/DocumentBody";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DocBlock, MergeValues } from "@/lib/documents";
import { t as ct } from "@/i18n/creator-app";

export function CreatorAgreementForm({
  title,
  version,
  blocks,
  merge,
  onSign,
  beforeSignature,
  extraField,
  extraValid = true,
}: {
  title: string;
  version: string;
  blocks: DocBlock[];
  merge: MergeValues;
  onSign: (signedName: string) => Promise<void>;
  beforeSignature?: React.ReactNode;
  extraField?: React.ReactNode;
  extraValid?: boolean;
}) {
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!accepted || name.trim().length < 2 || !extraValid) return;
    setBusy(true);
    try {
      await onSign(name.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-line bg-card p-5 sm:p-8">
        <h2 className="text-2xl font-extrabold text-brand-navy">{title}</h2>
        <p className="mt-1 text-sm text-brand-navySoft">Version {version}</p>
        <DocumentBody blocks={blocks} merge={merge} className="mt-6" />
      </div>
      {beforeSignature}
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-brand-line bg-card p-5">
        <h2 className="text-lg font-extrabold text-brand-navy">{ct("Signature")}</h2>
        <div className="flex items-start gap-3">
          <Checkbox id="accept" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
          <Label htmlFor="accept" className="text-sm font-medium leading-relaxed text-brand-navy">
            {ct("I have read and accept this agreement")}
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signed-name">{ct("Your full legal name")}</Label>
          <Input id="signed-name" value={name} maxLength={160} onChange={(e) => setName(e.target.value)} className="h-11" autoComplete="name" />
        </div>
        {extraField}
        <p className="text-xs text-brand-navySoft">
          Signing records your typed name, the date and time, your IP address, your browser and document version {version}.
        </p>
        <Button type="submit" disabled={busy || !accepted || name.trim().length < 2 || !extraValid}>
          {busy ? "Signing…" : "Sign"}
        </Button>
      </form>
    </div>
  );
}
