-- Lock down storage.objects for the private 'slide-images' bucket.
-- All access goes through service_role (server functions with supabaseAdmin) + signed URLs.
-- Deny anon/authenticated direct access for every operation.

CREATE POLICY "slide-images deny client select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id <> 'slide-images');

CREATE POLICY "slide-images deny client insert"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id <> 'slide-images');

CREATE POLICY "slide-images deny client update"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id <> 'slide-images')
WITH CHECK (bucket_id <> 'slide-images');

CREATE POLICY "slide-images deny client delete"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id <> 'slide-images');