import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { markCreatorStep, signCreatorAgreement } from "@/lib/creator-agreement.functions";
import { creatorAgreementBlocks, TRACK_LABEL } from "@/lib/creator-agreement";
import { parseBlocks } from "@/lib/documents";
import { DocumentBody } from "@/components/portal/DocumentBody";
import { Button } from "@/components/ui/button";
import { CreatorAgreementForm } from "./CreatorAgreementForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { completeSocialAccountStep, joinCreatorSlack, logCreatorPost, SLACK_INVITE_URL } from "@/lib/creator-onboarding.functions";
import { CheckCircle2, Circle } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CreatorOnboarding({ me, refs }: { me: any; refs: any[] }) {
  const qc = useQueryClient();
  const mark = useServerFn(markCreatorStep);
  const sign = useServerFn(signCreatorAgreement);
  const completeAccount = useServerFn(completeSocialAccountStep);
  const join = useServerFn(joinCreatorSlack);
  const logPost = useServerFn(logCreatorPost);
  const [motivated, setMotivated] = useState(false);
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [pictureReady, setPictureReady] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [postPlatform, setPostPlatform] = useState<"tiktok" | "instagram" | "youtube" | "other">("tiktok");
  const { data: docs } = useQuery({
    queryKey: ["creator-docs"],
    queryFn: async () => (await supabase.from("documents").select("slug, title, content, current_version, published").in("slug", ["creator-agreement", "creator-guide"])).data ?? [],
  });
  const agreement = docs?.find((d) => d.slug === "creator-agreement");
  const reload = () => qc.invalidateQueries({ queryKey: ["creator-space"] });
  const step = !me.motivation_confirmed_at ? 1 : !me.agreementSigned ? 2 : !me.social_account_created_at ? 3 : !me.slack_joined_at ? 4 : 5;

  async function done() {
    if (!motivated) {
      toast.error("Confirm the commitment before continuing.");
      return;
    }
    await mark({ data: { step: "examples", motivated: true } });
    await reload();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-extrabold text-brand-navy">Welcome {me.full_name.split(" ")[0]}</h1>
      <ol className="grid gap-2 text-sm font-semibold sm:grid-cols-2">
        {["Check examples and commitment", "Sign the contract", "Create my Sophia account", "Join our Slack", "Post my first post"].map((l, i) => (
          <li key={l} className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 ${step === i + 1 ? "border-primary bg-primary/5 text-brand-navy" : step > i + 1 ? "border-portal-green/30 bg-portal-green/10 text-portal-green" : "border-brand-line text-muted-foreground"}`}>
            {step > i + 1 ? <CheckCircle2 className="size-5 shrink-0" /> : <Circle className="size-5 shrink-0" />} {l}
          </li>
        ))}
      </ol>
      <p className="text-sm text-brand-navySoft">Each completed action updates your progress automatically. Your full creator space unlocks after your first post is logged.</p>

      {step === 1 && (
        <section className="space-y-3 rounded-2xl border border-brand-line p-4">
          <h2 className="font-bold text-brand-navy">Examples</h2>
          {refs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No examples yet. You can continue.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {refs.map((r) => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{r.category} · {r.platform}</a>
                  {r.note ? ` — ${r.note}` : ""}
                </li>
              ))}
            </ul>
          )}
          <label className="flex items-start gap-3 rounded-lg border border-brand-line p-3 text-sm leading-6 text-brand-navy">
            <Checkbox checked={motivated} onCheckedChange={(checked) => setMotivated(checked === true)} className="mt-1" />
            <span>I have checked the examples. I am motivated to create quality content and willing to be part of the Sophia team, not just to work.</span>
          </label>
          <Button disabled={!motivated} onClick={() => void done()}>Complete this step</Button>
        </section>
      )}

      {step === 2 &&
        (!agreement?.published ? (
          <p className="rounded-2xl border border-brand-line p-4 text-sm">The agreement is being finalised. You will be able to sign it here soon.</p>
        ) : (
          <CreatorAgreementForm
            title={agreement.title}
            version={String(agreement.current_version)}
            blocks={creatorAgreementBlocks(parseBlocks(agreement.content), "ugc")}
            merge={{ legal_name: me.full_name, country: me.country, email: me.email, track: TRACK_LABEL.ugc }}
            onSign={async (signedName) => {
              try {
                await sign({ data: { signedName, documentVersion: String(agreement.current_version), userAgent: navigator.userAgent.slice(0, 400) } });
                toast.success("Agreement signed.");
                reload();
              } catch (e: any) {
                toast.error(e?.message ?? "The signature could not be recorded.");
              }
            }}
          />
        ))}

      {step === 3 && (
        <section className="space-y-4 rounded-lg border border-brand-line p-4">
          <div>
            <h2 className="font-bold text-brand-navy">Create your Sophia social account</h2>
            <p className="mt-1 text-sm text-brand-navySoft">Create a brand-new account following the guidelines. It belongs to Sophia; you run it.</p>
          </div>
          <div className="rounded-lg bg-brand-surface p-3 text-sm text-brand-navy">
            Use your first name with a culture-related word or number, for example <b>maximilien.culture49</b>. Choose something natural and memorable, then add the supplied bio and profile picture.
          </div>
          <Input aria-label="Account handle" placeholder="@maximilien.culture49" value={handle} onChange={(event) => setHandle(event.target.value)} />
          <Textarea aria-label="Account bio" placeholder="Paste the bio used on the account" value={bio} onChange={(event) => setBio(event.target.value)} rows={3} />
          <label className="flex items-center gap-3 text-sm text-brand-navy">
            <Checkbox checked={pictureReady} onCheckedChange={(checked) => setPictureReady(checked === true)} />
            The profile picture is set.
          </label>
          <Button disabled={!handle.trim() || !bio.trim() || !pictureReady} onClick={async () => {
            try {
              await completeAccount({ data: { handle, bio, profilePictureConfirmed: true } });
              toast.success("Sophia account recorded.");
              reload();
            } catch (error: any) { toast.error(error?.message ?? "Could not save the account."); }
          }}>I created the account</Button>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4 rounded-lg border border-brand-line p-4">
          <div>
            <h2 className="font-bold text-brand-navy">Join our Slack</h2>
            <p className="mt-1 text-sm text-brand-navySoft">Our team coordinates in Slack. Travaillons ensemble dans UGC - Vik Studios sur Slack. Cette invitation n'a pas de date d'expiration.</p>
          </div>
          <Button asChild className="w-fit">
            <a
              href={SLACK_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                join({}).catch(() => {});
              }}
            >
              Join our Slack
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">Open the link to join UGC - Vik Studios on Slack. It never expires. The step is checked automatically.</p>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-4 rounded-lg border border-brand-line p-4">
          <div>
            <h2 className="font-bold text-brand-navy">Post and log your first post</h2>
            <p className="mt-1 text-sm text-brand-navySoft">After publishing, paste the full link here. Every post you publish must also be logged in Sophia.</p>
          </div>
          <Input type="url" placeholder="https://www.tiktok.com/@…/video/…" value={postUrl} onChange={(event) => setPostUrl(event.target.value)} />
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={postPlatform} onChange={(event) => setPostPlatform(event.target.value as typeof postPlatform)}>
            <option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="other">Other</option>
          </select>
          <Button disabled={!postUrl.trim()} onClick={async () => {
            try {
              await logPost({ data: { url: postUrl, platform: postPlatform, briefId: null, referenceVideoId: null } });
              toast.success("First post logged. Your creator space is ready.");
              reload();
            } catch (error: any) { toast.error(error?.message ?? "Could not log the post."); }
          }}>Log my first post</Button>
        </section>
      )}
    </div>
  );
}
