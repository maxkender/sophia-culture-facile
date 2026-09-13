CREATE POLICY "author_photos_admin_all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'author-photos' AND private.is_admin())
WITH CHECK (bucket_id = 'author-photos' AND private.is_admin());

CREATE POLICY "author_photos_read_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'author-photos' AND (storage.foldername(name))[1] = private.profile_id()::text);