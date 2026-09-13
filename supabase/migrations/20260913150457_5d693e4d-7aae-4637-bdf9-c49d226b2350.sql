CREATE POLICY author_photos_write_own ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'author-photos' AND (storage.foldername(name))[1] = (private.profile_id())::text);
CREATE POLICY author_photos_update_own ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'author-photos' AND (storage.foldername(name))[1] = (private.profile_id())::text)
  WITH CHECK (bucket_id = 'author-photos' AND (storage.foldername(name))[1] = (private.profile_id())::text);