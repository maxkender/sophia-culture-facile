import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseBlocks, type DocBlock, type DocumentRow, type DocumentSlug } from "@/lib/documents";

export type LoadedDocument = {
  row: DocumentRow;
  blocks: DocBlock[];
};

/** The live document, i.e. the version an author sees today. */
export function useDocument(slug: DocumentSlug) {
  return useQuery({
    queryKey: ["portal", "document", slug],
    staleTime: 15_000,
    queryFn: async (): Promise<LoadedDocument | null> => {
      const { data, error } = await supabase.from("documents").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { row: data, blocks: parseBlocks(data.content) };
    },
  });
}

/**
 * One archived version of a document. Used by the contract page: an author who has signed stays
 * bound to the exact version they signed, even after the editorial desk edits the document.
 */
export function useDocumentVersion(documentId: string | undefined, version: number | null) {
  return useQuery({
    queryKey: ["portal", "document-version", documentId, version],
    enabled: Boolean(documentId) && version !== null,
    staleTime: Infinity,
    queryFn: async (): Promise<{ title: string; blocks: DocBlock[]; createdAt: string } | null> => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("title, content, created_at")
        .eq("document_id", documentId!)
        .eq("version", version!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { title: data.title, blocks: parseBlocks(data.content), createdAt: data.created_at };
    },
  });
}

export function useDocumentVersions(documentId: string | undefined) {
  return useQuery({
    queryKey: ["portal", "document-versions", documentId],
    enabled: Boolean(documentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("id, version, title, content, note, created_at")
        .eq("document_id", documentId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
