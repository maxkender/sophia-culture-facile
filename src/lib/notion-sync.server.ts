// Server-only two-way sync between the owner's Notion "Inspiration" database and Hub Inspiration.
// Never creates, deletes or re-titles Notion pages; only writes the Hub-owned properties.
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any
import { normalise } from "./inspirations.server";

export const NOTION_FORMATS = ["Face caméra", "POV / lifestyle", "Démo app", "Storytime", "Sketch", "Slideshow", "Montage / edit", "Voix off", "Autre"] as const;
const API = "https://api.notion.com/v1";
const SOPHIA = "00000000-0000-4000-8000-000000000001";
const UNSWIPE = "00000000-0000-4000-8000-000000000002";
const HUB_URL = "https://sophia-culture.com/hub/ugc/inspiration";
const RESERVED_IG = new Set(["p", "reel", "reels", "tv", "explore", "stories", "accounts", "direct", "about"]);

/** Video → existing Inspiration import; profile → skipped; anything else → error. */
export function classifyLink(raw: string): { kind: "video"; url: string; key: string } | { kind: "profile" } | { kind: "other"; error: string } {
  const s = (raw ?? "").trim();
  const n = normalise(s);
  if (n) return { kind: "video", url: n.url, key: n.key };
  let p: URL; try { p = new URL(s); } catch { return { kind: "other", error: s ? "Not a URL" : "Empty link" }; }
  const host = p.hostname.replace(/^www\.|^m\./, "");
  const parts = p.pathname.split("/").filter(Boolean);
  if (host.endsWith("tiktok.com") && parts[0]?.startsWith("@") && !parts.includes("video")) return { kind: "profile" };
  if (host.endsWith("instagram.com") && parts[0] && !RESERVED_IG.has(parts[0].toLowerCase())) return { kind: "profile" };
  return { kind: "other", error: "Not a TikTok/Instagram video or profile link" };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function notion(path: string, init: { method?: string; body?: unknown } = {}) {
  const token = process.env["NOTION_TOKEN"]; if (!token) throw new Error("NOTION_TOKEN missing");
  const wait = 350 - (Date.now() - last); if (wait > 0) await sleep(wait); last = Date.now(); // ≤ 3 req/s
  const r = await fetch(`${API}${path}`, { method: init.method ?? "GET", headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "content-type": "application/json" }, ...(init.body ? { body: JSON.stringify(init.body) } : {}) });
  if (r.status === 429) { await sleep(Number(r.headers.get("retry-after") ?? 1) * 1000); return notion(path, init); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Notion ${r.status}: ${(j as { message?: string }).message ?? "error"}`.slice(0, 300));
  return j as any;
}

const text = (p: any) => (p?.title ?? p?.rich_text ?? []).map((t: any) => t.plain_text ?? "").join("").trim();
const sel = (p: any) => p?.select?.name ?? null;
const multi = (p: any) => (p?.multi_select ?? []).map((m: any) => m.name as string);
function readProps(page: any) {
  const P = page.properties ?? {};
  return { lien: text(P["Lien"]), app: multi(P["App"]), source: sel(P["Source"]), concurrent: sel(P["Concurrent direct ?"]), ad: sel(P["Ad ?"]), notes: text(P["Notes"]), format: sel(P["Type de format"]), hub_status: sel(P["Statut Hub"]) };
}

export async function testConnection(dbId: string) {
  const d = await notion(`/databases/${dbId}`);
  return { title: (d.title ?? []).map((t: any) => t.plain_text).join("") || "(untitled)", properties: Object.keys(d.properties ?? {}) };
}

async function setStatus(pageId: string, status: string) {
  await notion(`/pages/${pageId}`, { method: "PATCH", body: { properties: { "Statut Hub": { select: { name: status } } } } });
}

export async function runNotionSync(a: Admin) {
  if (!process.env["NOTION_TOKEN"]) return { skipped: "NOTION_TOKEN missing" };
  const { data: cfg } = await a.from("ugc_settings").select("notion_database_id, notion_last_sync, notion_last_full_sync").eq("id", 1).maybeSingle();
  const dbId = cfg?.notion_database_id; if (!dbId) return { skipped: "No database id" };
  const started = new Date();
  const full = !cfg?.notion_last_sync || !cfg?.notion_last_full_sync || Date.now() - new Date(cfg.notion_last_full_sync).getTime() > 24 * 3600_000;
  const out = { pulled: 0, imported: 0, linked: 0, profiles: 0, errors: 0, pushed: 0, pushErrors: 0, full };
  try {
    // ---- PULL ----
    const pages: any[] = []; let cursor: string | undefined;
    const filter = full ? undefined : { timestamp: "last_edited_time", last_edited_time: { on_or_after: new Date(new Date(cfg.notion_last_sync).getTime() - 3600_000).toISOString() } };
    do { const r = await notion(`/databases/${dbId}/query`, { method: "POST", body: { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}), ...(filter ? { filter } : {}) } }); pages.push(...r.results); cursor = r.has_more ? r.next_cursor : undefined; } while (cursor);
    const { data: known } = await a.from("notion_items").select("notion_page_id, hub_status, inspiration_id, profile_status").in("notion_page_id", pages.map((p) => p.id).concat(["-"]));
    const { data: setRow } = await a.from("ugc_settings").select("notion_videos_per_profile").eq("id", 1).maybeSingle();
    const perProfile = setRow?.notion_videos_per_profile ?? 10;
    const byId = new Map<string, any>((known ?? []).map((k: any) => [k.notion_page_id, k]));
    const batchId = crypto.randomUUID();
    for (const page of pages) {
      out.pulled++;
      const pr = readProps(page); const c = classifyLink(pr.lien); const prev = byId.get(page.id);
      const base = { notion_page_id: page.id, url: pr.lien || null, notion_props: pr, notion_last_edited: page.last_edited_time, kind: c.kind };
      try {
        if (c.kind === "profile") {
          out.profiles++;
          const started = ["queued", "running", "done"].includes(prev?.profile_status ?? "");
          await a.from("notion_items").upsert({ ...base, norm_key: null, inspiration_id: null, ...(started ? {} : { hub_status: "Profil — en file", error: null, profile_status: "queued", profile_target: perProfile }) });
          if (!started) await a.rpc("inspiration_queue_arm");
          continue;
        }
        if (c.kind === "other") {
          out.errors++;
          await a.from("notion_items").upsert({ ...base, norm_key: null, hub_status: "Erreur", error: c.error, inspiration_id: null });
          if (pr.hub_status !== "Erreur") await setStatus(page.id, "Erreur");
          continue;
        }
        const appId = pr.app.includes("Sophia") ? SOPHIA : pr.app.includes("UnSwipe") ? UNSWIPE : null;
        const tags = [pr.source, pr.concurrent === "Oui" ? "Concurrent direct" : null, pr.ad === "Oui" ? "Ad" : null].filter(Boolean).map((t: string) => t.toLowerCase());
        let { data: ins } = await a.from("inspirations").select("id, notion_page_id, tags, app_id").eq("norm_key", c.key).maybeSingle();
        if (!ins) {
          const { enqueue } = await import("./inspirations.server");
          const r = await enqueue(a, [c.url], appId, null, batchId);
          ins = { id: r.ids[0], notion_page_id: null, tags: [], app_id: appId }; out.imported++;
        } else out.linked++;
        const patch: Record<string, unknown> = { notion_notes: pr.notes || null, tags: [...new Set([...(ins.tags ?? []), ...tags])] };
        if (!ins.notion_page_id) patch["notion_page_id"] = page.id;
        if (!ins.app_id && appId) patch["app_id"] = appId;
        if (ins.notion_page_id && ins.notion_page_id !== page.id) delete patch["notion_page_id"]; // same video listed twice in Notion
        await a.from("inspirations").update(patch).eq("id", ins.id);
        const status = prev?.hub_status === "Analysé" ? "Analysé" : "Importé";
        await a.from("notion_items").upsert({ ...base, norm_key: c.key, inspiration_id: ins.id, hub_status: status, error: null });
        if (status === "Importé" && pr.hub_status !== "Importé" && pr.hub_status !== "Analysé") await setStatus(page.id, "Importé");
      } catch (e) {
        out.errors++;
        await a.from("notion_items").upsert({ ...base, error: (e as Error).message.slice(0, 300) });
      }
    }
    // ---- PUSH ----
    const r = await pushChanges(a); out.pushed = r.pushed; out.pushErrors = r.errors;
    await a.from("ugc_settings").update({ notion_last_sync: started.toISOString(), ...(full ? { notion_last_full_sync: started.toISOString() } : {}), notion_last_error: null }).eq("id", 1);
    return out;
  } catch (e) {
    await a.from("ugc_settings").update({ notion_last_error: (e as Error).message.slice(0, 300) }).eq("id", 1);
    throw e;
  }
}

/** Analysed (or failed) linked inspirations whose Hub data changed since the last push. */
export async function pushChanges(a: Admin) {
  const { data: items } = await a.from("notion_items").select("notion_page_id, pushed_at, hub_status, inspirations(id, status, updated_at, score, hook_text, notion_format, app_id, error, no_audio)").eq("kind", "video").not("inspiration_id", "is", null);
  let pushed = 0; let errors = 0;
  for (const it of items ?? []) {
    const ins = it.inspirations; if (!ins || !["analyzed", "error"].includes(ins.status)) continue;
    if (it.pushed_at && new Date(it.pushed_at) >= new Date(ins.updated_at)) continue;
    try {
      const page = await notion(`/pages/${it.notion_page_id}`);
      const pr = readProps(page);
      const props: Record<string, unknown> = {};
      if (ins.status === "error") props["Statut Hub"] = { select: { name: "Erreur" } };
      else {
        props["Statut Hub"] = { select: { name: ins.no_audio ? "Analysé (sans audio)" : "Analysé" } };
        if (ins.score != null) props["Score /10"] = { number: ins.score };
        props["Hook"] = { rich_text: ins.hook_text ? [{ text: { content: String(ins.hook_text).slice(0, 2000) } }] : [] };
        props["Analyse Hub"] = { url: `${HUB_URL}?open=${ins.id}` };
        if (!pr.format && ins.notion_format && (NOTION_FORMATS as readonly string[]).includes(ins.notion_format)) props["Type de format"] = { select: { name: ins.notion_format } };
        if (!pr.app.length && (ins.app_id === SOPHIA || ins.app_id === UNSWIPE)) props["App"] = { multi_select: [{ name: ins.app_id === SOPHIA ? "Sophia" : "UnSwipe" }] };
      }
      await notion(`/pages/${it.notion_page_id}`, { method: "PATCH", body: { properties: props } });
      await a.from("notion_items").update({ pushed_at: new Date().toISOString(), hub_status: ins.status === "error" ? "Erreur" : ins.no_audio ? "Analysé (sans audio)" : "Analysé", error: ins.status === "error" ? friendly(ins.error) : null }).eq("notion_page_id", it.notion_page_id);
      pushed++;
    } catch (e) {
      errors++;
      await a.from("notion_items").update({ error: (e as Error).message.slice(0, 300) }).eq("notion_page_id", it.notion_page_id);
    }
  }
  const p = await pushProfiles(a);
  return { pushed: pushed + p.pushed, errors: errors + p.errors };
}

function friendly(err: string | null) {
  if (!err) return null;
  return /privée|not found|private|deleted|supprimée/i.test(err) ? "Vidéo privée ou supprimée" : err;
}

function profileOf(url: string): { platform: "tiktok" | "instagram"; handle: string } | null {
  try {
    const p = new URL(url.trim()); const host = p.hostname.replace(/^www\.|^m\./, ""); const first = p.pathname.split("/").filter(Boolean)[0] ?? "";
    if (host.endsWith("tiktok.com") && first.startsWith("@")) return { platform: "tiktok", handle: first.slice(1) };
    if (host.endsWith("instagram.com") && first) return { platform: "instagram", handle: first };
  } catch { /* invalid */ }
  return null;
}

/** One profile per call: Apify recent videos → top N by views → normal Inspiration queue (dedup by norm_key). */
export async function runProfileStep(a: Admin) {
  await a.from("notion_items").update({ profile_status: "queued" }).eq("kind", "profile").eq("profile_status", "running").lt("profile_started_at", new Date(Date.now() - 15 * 60_000).toISOString());
  const { count: running } = await a.from("notion_items").select("notion_page_id", { count: "exact", head: true }).eq("kind", "profile").eq("profile_status", "running");
  if (running) return { skipped: "profile running" };
  const { data: next } = await a.from("notion_items").select("notion_page_id, url, notion_props, profile_target, inspiration_ids").eq("kind", "profile").eq("profile_status", "queued").order("created_at").limit(1).maybeSingle();
  if (!next) return { skipped: "no profile" };
  const { data: claimed } = await a.from("notion_items").update({ profile_status: "running", profile_started_at: new Date().toISOString(), hub_status: "Profil — import en cours" }).eq("notion_page_id", next.notion_page_id).eq("profile_status", "queued").select("notion_page_id");
  if (!claimed?.length) return { skipped: "lost claim" };
  const target = Math.max(1, next.profile_target ?? 10);
  const pr = profileOf(next.url ?? "");
  try {
    if (!pr) throw new Error("Lien de profil illisible");
    const { apifyRun, INSPIRATION_ACTORS, enqueue } = await import("./inspirations.server");
    const limit = Math.max(30, target * 3);
    let vids: { url: string; views: number }[] = [];
    if (pr.platform === "tiktok") {
      const r = await apifyRun(INSPIRATION_ACTORS.tiktok, { profiles: [pr.handle], resultsPerPage: limit, shouldDownloadVideos: false, shouldDownloadCovers: false });
      vids = r.items.filter((i) => i?.webVideoUrl && !i.error).map((i) => ({ url: i.webVideoUrl, views: Number(i.playCount ?? 0) }));
    } else {
      const purl = `https://www.instagram.com/${pr.handle}/`;
      for (const resultsType of ["reels", "posts"]) {
        const r = await apifyRun(INSPIRATION_ACTORS.instagram, { directUrls: [purl], resultsType, resultsLimit: limit, addParentData: false });
        vids = r.items.filter((i) => i && !i.error && (i.shortCode || i.url) && (i.type === "Video" || i.videoUrl || i.productType === "clips"))
          .map((i) => ({ url: i.url ?? `https://www.instagram.com/reel/${i.shortCode}/`, views: Number(i.videoPlayCount ?? i.videoViewCount ?? 0) }));
        if (vids.length) break;
      }
    }
    if (!vids.length) throw new Error("Aucune vidéo trouvée (profil privé ou vide)");
    const top = vids.sort((x, y) => y.views - x.views).slice(0, target);
    const props = (next.notion_props ?? {}) as { app?: string[] };
    const appId = props.app?.includes("Sophia") ? SOPHIA : props.app?.includes("UnSwipe") ? UNSWIPE : null;
    const res = await enqueue(a, top.map((v) => v.url), appId, null, crypto.randomUUID());
    for (const id of res.ids) {
      const { data: ins } = await a.from("inspirations").select("tags, author_handle, notion_page_id").eq("id", id).maybeSingle();
      await a.from("inspirations").update({ tags: [...new Set([...(ins?.tags ?? []), "from profile"])], author_handle: ins?.author_handle ?? pr.handle, ...(ins?.notion_page_id ? {} : { notion_page_id: next.notion_page_id }) }).eq("id", id);
    }
    const ids = [...new Set([...(next.inspiration_ids ?? []), ...res.ids])];
    await a.from("notion_items").update({ profile_status: "done", inspiration_ids: ids, imported_count: ids.length, hub_status: "Importé", error: null, pushed_at: null }).eq("notion_page_id", next.notion_page_id);
    try { await setStatus(next.notion_page_id, "Importé"); } catch { /* push retries later */ }
    return { profile: pr.handle, added: res.added, total: ids.length };
  } catch (e) {
    const msg = (e as Error).message.slice(0, 300);
    await a.from("notion_items").update({ profile_status: "error", hub_status: "Erreur", error: msg }).eq("notion_page_id", next.notion_page_id);
    try { await setStatus(next.notion_page_id, "Erreur"); } catch { /* ignore */ }
    return { profile: pr?.handle, error: msg };
  }
}

/** Profile rows: write back once every imported video is finished. */
async function pushProfiles(a: Admin) {
  const { data: items } = await a.from("notion_items").select("notion_page_id, url, pushed_at, inspiration_ids").eq("kind", "profile").eq("profile_status", "done");
  let pushed = 0; let errors = 0;
  for (const it of items ?? []) {
    const ids: string[] = it.inspiration_ids ?? []; if (!ids.length) continue;
    const { data: rows } = await a.from("inspirations").select("status, score, hook_text, updated_at").in("id", ids);
    if (!rows?.length || rows.some((r: any) => !["analyzed", "error"].includes(r.status))) continue;
    const latest = rows.reduce((m: string, r: any) => (r.updated_at > m ? r.updated_at : m), "");
    if (it.pushed_at && new Date(it.pushed_at) >= new Date(latest)) continue;
    const ok = rows.filter((r: any) => r.status === "analyzed").sort((x: any, y: any) => (y.score ?? 0) - (x.score ?? 0));
    const best = ok[0]; const handle = profileOf(it.url ?? "")?.handle ?? "";
    try {
      const props: Record<string, unknown> = best
        ? { "Statut Hub": { select: { name: "Analysé" } }, ...(best.score != null ? { "Score /10": { number: best.score } } : {}), "Hook": { rich_text: best.hook_text ? [{ text: { content: String(best.hook_text).slice(0, 2000) } }] : [] }, "Analyse Hub": { url: `${HUB_URL}?author=${encodeURIComponent(handle)}` } }
        : { "Statut Hub": { select: { name: "Erreur" } } };
      await notion(`/pages/${it.notion_page_id}`, { method: "PATCH", body: { properties: props } });
      await a.from("notion_items").update({ pushed_at: new Date().toISOString(), hub_status: best ? "Analysé" : "Erreur", error: best ? null : "Aucune vidéo analysable" }).eq("notion_page_id", it.notion_page_id);
      pushed++;
    } catch (e) { errors++; await a.from("notion_items").update({ error: (e as Error).message.slice(0, 300) }).eq("notion_page_id", it.notion_page_id); }
  }
  return { pushed, errors };
}

/** Cheap classification of an existing analysis into one of the 9 Notion formats (no transcription). */
export async function classifyNotionFormat(a: Admin, ids: string[]) {
  const key = process.env["LOVABLE_API_KEY"]; if (!key) throw new Error("The AI key is not configured.");
  const { data: rows } = await a.from("inspirations").select("id, analysis, kind, caption").in("id", ids);
  const done: Record<string, string> = {};
  for (const r of rows ?? []) {
    if (!r.analysis) continue;
    const an = r.analysis;
    const prompt = `Pick the single best "Type de format" for this short video among exactly: ${NOTION_FORMATS.join(" | ")}.\nKind: ${r.kind}. Style: ${an.style}. Audio: ${an.audio} ${an.audio_note}. Hook: ${JSON.stringify(an.hook)}. Structure: ${JSON.stringify(an.structure).slice(0, 1500)}.`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: "openai/gpt-6-astra", reasoning: { effort: "low" }, store: false, stream: true, input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }], text: { format: { type: "json_schema", name: "f", strict: true, schema: { type: "object", additionalProperties: false, required: ["notion_format"], properties: { notion_format: { type: "string", enum: [...NOTION_FORMATS] } } } } } }),
    });
    if (!res.ok || !res.body) throw new Error(`AI error ${res.status}`);
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""; let txt = "";
    for (;;) {
      const { value, done: end } = await reader.read(); if (end) break;
      buf += dec.decode(value, { stream: true }); let i: number;
      while ((i = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line.startsWith("data:")) continue; try { const ev = JSON.parse(line.slice(5)); if (ev.type === "response.output_text.delta") txt += ev.delta ?? ""; } catch { /* skip */ } }
    }
    const v = (JSON.parse(txt || "{}") as { notion_format?: string }).notion_format ?? "";
    if ((NOTION_FORMATS as readonly string[]).includes(v)) { await a.from("inspirations").update({ notion_format: v, updated_at: new Date().toISOString() }).eq("id", r.id); done[r.id] = v; }
  }
  return done;
}
