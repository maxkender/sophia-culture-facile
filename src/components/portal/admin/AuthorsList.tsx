import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Course, Profile } from "@/lib/portal";
import { PageTitle, PortalCard } from "../ui";

export function AuthorsList() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");

  const { data } = useQuery({
    queryKey: ["portal", "admin", "authors"],
    queryFn: async () => {
      const [{ data: authors }, { data: courses }, { data: contracts }] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "author").order("full_name"),
        supabase.from("courses").select("id, author_id, status"),
        supabase.from("contracts").select("author_id"),
      ]);
      return {
        authors: (authors ?? []) as Profile[],
        courses: (courses ?? []) as Pick<Course, "id" | "author_id" | "status">[],
        signed: new Set((contracts ?? []).map((row) => row.author_id)),
      };
    },
  });

  const rows = useMemo(() => {
    const authors = data?.authors ?? [];
    const term = search.trim().toLowerCase();
    return authors
      .filter((author) => (platform === "all" ? true : author.platform === platform))
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
        };
      });
  }, [data, search, platform]);

  return (
    <div>
      <PageTitle
        title="Authors"
        lead="Every contributor, their commissioned courses and where their onboarding stands."
        action={
          <Button asChild variant="pill" size="pillSm">
            <Link to="/auteurs/admin/authors/new">
              <Plus className="size-4" /> New author
            </Link>
          </Button>
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
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="h-11 w-44" aria-label="Filter by platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              <SelectItem value="ios">iOS</SelectItem>
              <SelectItem value="android">Android</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-4xl text-left text-sm">
            <thead className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
              <tr>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Institution</th>
                <th className="py-3 pr-4">Country</th>
                <th className="py-3 pr-4">Platform</th>
                <th className="py-3 pr-4">Courses</th>
                <th className="py-3 pr-4">Submitted</th>
                <th className="py-3 pr-4">Agreement</th>
                <th className="py-3 pr-4">Access code</th>
                <th className="py-3">Invite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-brand-navySoft">
                    No author matches this search.
                  </td>
                </tr>
              ) : (
                rows.map(({ author, total, submitted, signed }) => (
                  <tr key={author.id}>
                    <td className="py-3 pr-4">
                      <Link
                        to="/auteurs/admin/authors/$authorId"
                        params={{ authorId: author.id }}
                        className="font-bold text-portal-accent hover:underline"
                      >
                        {author.full_name}
                      </Link>
                      <div className="text-xs text-brand-navySoft">{author.email ?? "No email yet"}</div>
                    </td>
                    <td className="py-3 pr-4 text-brand-navySoft">{author.institution ?? "—"}</td>
                    <td className="py-3 pr-4 text-brand-navySoft">{author.country ?? "—"}</td>
                    <td className="py-3 pr-4 text-brand-navySoft">{author.platform === "android" ? "Android" : "iOS"}</td>
                    <td className="py-3 pr-4 text-brand-navy">{total}</td>
                    <td className="py-3 pr-4 text-brand-navy">{submitted}</td>
                    <td className={`py-3 pr-4 font-semibold ${signed ? "text-portal-green" : "text-portal-amber"}`}>
                      {signed ? "Signed" : "Not signed"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-brand-navySoft">{author.access_code ?? "—"}</td>
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
