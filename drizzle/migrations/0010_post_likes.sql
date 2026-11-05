-- Custom SQL migration file, put your code below! --
-- Create post_likes join table with owner-scoped RLS policies
CREATE TABLE IF NOT EXISTS public.post_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Owner-scoped policies for post_likes
CREATE POLICY "Users read own post likes" 
  ON public.post_likes FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own post likes" 
  ON public.post_likes FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_id AND p.is_published = true
    )
  );

CREATE POLICY "Users delete own post likes" 
  ON public.post_likes FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes(post_id);
