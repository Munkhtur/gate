CREATE TABLE public.posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
 caption text NOT NULL DEFAULT '' CHECK (char_length(caption) <= 2000),
 media_path text NOT NULL,
 media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
 is_published boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published posts" ON public.posts FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "Owners read all their posts" ON public.posts FOR SELECT TO authenticated USING (public.owns_store(store_id));
CREATE POLICY "Owners insert their posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (public.owns_store(store_id) AND media_path LIKE auth.uid()::text || '/%');
CREATE POLICY "Owners update their posts" ON public.posts FOR UPDATE TO authenticated USING (public.owns_store(store_id)) WITH CHECK (public.owns_store(store_id) AND media_path LIKE auth.uid()::text || '/%');
CREATE POLICY "Owners delete their posts" ON public.posts FOR DELETE TO authenticated USING (public.owns_store(store_id));
CREATE INDEX posts_feed_idx ON public.posts (created_at DESC, id DESC) WHERE is_published;
CREATE INDEX posts_store_idx ON public.posts (store_id, created_at DESC);
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Read published post media or own uploads" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'post-media' AND ((storage.foldername(name))[1] = auth.uid()::text OR EXISTS (SELECT 1 FROM public.posts p WHERE p.media_path = name AND p.is_published)));
CREATE POLICY "Store owners upload post media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text AND EXISTS (SELECT 1 FROM public.stores s WHERE s.owner_id = auth.uid()));
CREATE POLICY "Owners delete post media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);