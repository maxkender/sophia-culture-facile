import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BookMarked, FileText, KeyRound, Library, UserCheck, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
};

export function CommandPalette({ open, onOpenChange, isAdmin }: Props) {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["portal", "palette", isAdmin],
    enabled: open,
    staleTime: 20_000,
    queryFn: async () => {
      const [authors, courses, documents] = await Promise.all([
        isAdmin
          ? supabase.from("profiles").select("id, full_name, institution").order("full_name").limit(50)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null; institution: string | null }[] }),
        supabase.from("courses").select("id, title, lot_code, author_id").order("updated_at", { ascending: false }).limit(60),
        supabase.from("documents").select("slug, title").order("title").limit(30),
      ]);
      return {
        authors: authors.data ?? [],
        courses: courses.data ?? [],
        documents: documents.data ?? [],
      };
    },
  });

  function go(to: string) {
    onOpenChange(false);
    void navigate({ to });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search authors, courses, documents…" />
      <CommandList>
        <CommandEmpty>No result.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          {isAdmin ? (
            <>
              <CommandItem onSelect={() => go("/auteurs/admin/authors/new")}>
                <UserPlus className="size-4" /> Create an author
              </CommandItem>
              <CommandItem onSelect={() => go("/auteurs/admin/review")}>
                <UserCheck className="size-4" /> Open the review queue
              </CommandItem>
              <CommandItem onSelect={() => go("/auteurs/admin/codes")}>
                <KeyRound className="size-4" /> Import access codes
              </CommandItem>
            </>
          ) : (
            <CommandItem onSelect={() => go("/auteurs/courses")}>
              <Library className="size-4" /> My courses
            </CommandItem>
          )}
          <CommandItem onSelect={() => go("/auteurs/guide")}>
            <Library className="size-4" /> Open the writing guide
          </CommandItem>
        </CommandGroup>

        {isAdmin && (data?.authors.length ?? 0) > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Authors">
              {data!.authors.map((author) => (
                <CommandItem
                  key={author.id}
                  value={`author ${author.full_name ?? ""} ${author.institution ?? ""}`}
                  onSelect={() => go(`/auteurs/admin/authors/${author.id}`)}
                >
                  <Users className="size-4" />
                  {author.full_name ?? "Untitled"}
                  {author.institution ? <span className="text-xs text-muted-foreground">{author.institution}</span> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {(data?.courses.length ?? 0) > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Courses">
              {data!.courses.map((course) => (
                <CommandItem
                  key={course.id}
                  value={`course ${course.title} ${course.lot_code ?? ""}`}
                  onSelect={() =>
                    go(isAdmin ? `/auteurs/admin/courses/${course.id}` : `/auteurs/courses/${course.id}`)
                  }
                >
                  <BookMarked className="size-4" />
                  {course.title}
                  {course.lot_code ? <span className="text-xs text-muted-foreground">{course.lot_code}</span> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {(data?.documents.length ?? 0) > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Documents">
              {data!.documents.map((doc) => (
                <CommandItem
                  key={doc.slug}
                  value={`document ${doc.title}`}
                  onSelect={() =>
                    go(isAdmin ? `/auteurs/admin/documents/${doc.slug}` : "/auteurs/guide")
                  }
                >
                  <FileText className="size-4" />
                  {doc.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
