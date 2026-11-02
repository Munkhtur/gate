CREATE TABLE public.store_follows (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, store_id)
);
CREATE INDEX store_follows_store_idx ON public.store_follows(store_id);
GRANT SELECT, INSERT, DELETE ON public.store_follows TO authenticated;
GRANT ALL ON public.store_follows TO service_role;
ALTER TABLE public.store_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own follows" ON public.store_follows FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users follow stores" ON public.store_follows FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users unfollow stores" ON public.store_follows FOR DELETE TO authenticated USING (user_id = auth.uid());