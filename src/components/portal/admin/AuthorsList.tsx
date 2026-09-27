import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, type Course, type Profile } from "@/lib/portal";
import { AuthorAvatar, useSignedPhotos } from "../AuthorPhoto";
import { PageTitle, PortalCard } from "../ui";
import { ExportButtons } from "./ExportButtons";

export function AuthorsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  // Authors who declined stay reachable, but they are hidden by default.
  const [status, setStatus] = useState("active");

  const { data } = useQuery({
    queryKey: ["portal", "admin", "authors"],
    queryFn: async () => {
      const [{ data: authors }, { data: courses }, { data: contracts }, { data: codes }] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "author").order("full_name"),
        supabase.from("courses").select("id, author_id, status"),
        supabase.from("contracts").select("author_id"),
        supabase.from("access_codes").select("assigned_to, platform").not("assigned_to", "is", null),
      ]);
      return {
        authors: (authors ?? []) as Profile[],
        courses: (courses ?? []) as Pick<Course, "id" | "author_id" | "status">[],
        signed: new Set((contracts ?? []).map((row) => row.author_id)),
        codePlatform: new Map((codes ?? []).map((row) => [row.assigned_to as string, row.platform as string])),
      };
    },
  });

  const rows = useMemo(() => {
    const authors = data?.authors ?? [];
    const term = search.trim().toLowerCase();
    return authors
      .filter((author) =>
        status === "all"
          ? true
          : status === "declined"
            ? author.upwork_status === "declined"
            : author.upwork_status !== "declined",
      )
      .filter((author) =>
        platform === "all" ? true : platform === "unknown" ? !author.platform : author.platform === platform,
      )
      .filter((author) =>
        term
          ? [author.full_name, author.email, author.institution, author.country]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(term))
          : true,
      )
      .map((author) => {
        const courses = (data?.courses ?? []).filter((course) => course.author_id === author.id);
        return {
          author,
          total: courses.length,
          submitted: courses.filter((course) =>
            ["submitted", "accepted", "published"].includes(course.status ?? ""),
          ).length,
          signed: data?.signed.has(author.id) ?? false,
          codePlatform: data?.codePlatform.get(author.id) ?? null,
        };
      });
  }, [data, search, platform, status]);

  const { data: photos } = useSignedPhotos((data?.authors ?? []).map((author) => author.photo_url));

  return (
    <div>
      <PageTitle
        title="Authors"
        lead="Every contributor, their commissioned courses and where their onboarding stands."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButtons />
            <Button asChild variant="pill" size="pillSm">
              <Link to="/auteurs/admin/authors/new">
                <Plus className="size-4" /> New author
              </Link>
            </Button>
          </div>
        }
      />

      <PortalCard>
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search name, email, institution…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 max-w-sm"
            aria-label="Search authors"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-11 w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active authors</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="all">All authors</SelectItem>
            </SelectContent>
          </Select>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="h-11 w-44" aria-label="Filter by platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              <SelectItem value="ios">iOS</SelectItem>
              <SelectItem value="android">Android</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-4xl text-left text-sm">
            <thead className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
              <tr>
                <th className="py-3 pr-4">
                  <span className="sr-only">Photo</span>
                </th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Institution</th>
                <th className="py-3 pr-4">Byline</th>
                <th className="py-3 pr-4">Country</th>
                <th className="py-3 pr-4">Upwork</th>
                <th className="py-3 pr-4">Platform</th>
                <th className="py-3 pr-4">Courses</th>
                <th className="py-3 pr-4">Submitted</th>
                <th className="py-3 pr-4">Examples</th>
                <th className="py-3 pr-4">Agreement</th>
                <th className="py-3 pr-4">Access code</th>
                <th className="py-3">Invite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-6 text-brand-navySoft">
                    No author matches this search.
                  </td>
                </tr>
              ) : (
                rows.map(({ author, total, submitted, signed, codePlatform }) => (
                  <tr
                    key={author.id}
                    onClick={() =>
                      navigate({ to: "/auteurs/admin/authors/$authorId", params: { authorId: author.id } })
                    }
                    className="cursor-pointer transition-colors hover:bg-brand-surface"
                  >
                    <td className="py-3 pr-4">
                      <AuthorAvatar
                        url={author.photo_url ? photos?.get(author.photo_url) : null}
                        name={author.display_name ?? author.full_name}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        to="/auteurs/admin/authors/$authorId"
                        params={{ authorId: author.id }}
                        className="font-bold text-portal-accent hover:underline"
                      >
                        {author.full_name}
                      </Link>
                      {author.is_test ? (
                        <span className="ml-2 rounded-full bg-brand-line px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-brand-navySoft">
                          Test
                        </span>
                      ) : null}
                      <div className="text-xs text-brand-navySoft">{author.email ?? "No email yet"}</div>
                    </td>
                    <td className="py-3 pr-4 text-brand-navySoft">
                      {author.institution ?? <span className="font-semibold text-portal-amber">To confirm</span>}
                    </td>
                    <td className="py-3 pr-4 text-brand-navySoft">
                      {author.display_title ? (
                        <span className="block max-w-xs truncate" title={author.display_title}>
                          {author.display_title}
                        </span>
                      ) : (
                        <span className="font-semibold text-portal-amber">To confirm</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-brand-navySoft">{author.country ?? "—"}</td>
                    <td className="py-3 pr-4">
                      {author.is_test ? (
                        <span className="text-brand-navySoft">—</span>
                      ) : (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                            author.upwork_status === "accepted"
                              ? "bg-portal-green/10 text-portal-green"
                              : author.upwork_status === "declined"
                                ? "bg-portal-red/10 text-portal-red"
                                : "bg-brand-line text-brand-navySoft"
                          }`}
                        >
                          {author.upwork_status === "accepted"
                            ? "Accepted"
                            : author.upwork_status === "declined"
                              ? "Declined"
                              : "Contacted"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-brand-navySoft">
                      {author.platform === "android" ? (
                        "Android"
                      ) : author.platform === "ios" ? (
                        "iOS"
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-portal-amber" title="Platform unknown">
                          <AlertTriangle className="size-4" aria-hidden="true" /> Unknown
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-brand-navy">{total}</td>
                    <td className="py-3 pr-4 text-brand-navy">{submitted}</td>
                    <td
                      className={`py-3 pr-4 font-semibold ${author.examples_reviewed_at ? "text-portal-green" : "text-portal-amber"}`}
                    >
                      {author.examples_reviewed_at ? `Read ${formatDate(author.examples_reviewed_at)}` : "Not read"}
                    </td>
                    <td className={`py-3 pr-4 font-semibold ${signed ? "text-portal-green" : "text-portal-amber"}`}>
                      {signed ? "Signed" : "Not signed"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-brand-navySoft">
                      {author.access_code ? (
                        <>
                          {author.access_code}
                          {author.platform && codePlatform && codePlatform !== author.platform ? (
                            <span
                              className="mt-1 flex items-center gap-1 font-sans text-[11px] font-bold uppercase tracking-wide text-portal-amber"
                              title={`Code is ${codePlatform === "ios" ? "Apple" : "Google Play"}, author is on ${author.platform === "ios" ? "iPhone" : "Android"}`}
                            >
                              <AlertTriangle className="size-3.5" aria-hidden="true" /> Wrong store
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <Link to="/auteurs/admin/codes" className="font-sans font-semibold text-brand-navySoft hover:underline">
                          No code
                        </Link>
                      )}
                    </td>
                    <td className={`py-3 font-semibold ${author.activated_at ? "text-portal-green" : "text-brand-navySoft"}`}>
                      {author.activated_at ? "Activated" : author.invite_token ? "Invite ready" : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PortalCard>
    </div>
  );
}
