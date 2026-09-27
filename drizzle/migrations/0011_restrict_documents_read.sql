DROP POLICY IF EXISTS documents_read ON public.documents;
DROP POLICY IF EXISTS document_versions_read ON public.document_versions;
CREATE POLICY documents_read ON public.documents FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid())
  OR (slug LIKE 'creator-%' AND EXISTS (SELECT 1 FROM public.creators c WHERE c.user_id = auth.uid()))
);
CREATE POLICY document_versions_read ON public.document_versions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.documents d JOIN public.creators c ON c.user_id = auth.uid()
             WHERE d.id = document_versions.document_id AND d.slug LIKE 'creator-%')
);