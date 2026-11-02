CREATE TABLE public.product_stats (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  views integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.product_stats TO service_role;
ALTER TABLE public.product_stats ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.record_product_view(_product_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.product_stats (product_id, views)
  SELECT id, 1 FROM public.products WHERE id = _product_id AND is_published
  ON CONFLICT (product_id) DO UPDATE SET views = product_stats.views + 1;
$$;
REVOKE ALL ON FUNCTION public.record_product_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_product_view(uuid) TO anon, authenticated;

CREATE FUNCTION public.store_product_stats(_store_id uuid)
RETURNS TABLE(product_id uuid, views integer, saves integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, COALESCE(s.views, 0), (SELECT count(*)::integer FROM public.wishlist w WHERE w.product_id = p.id)
  FROM public.products p LEFT JOIN public.product_stats s ON s.product_id = p.id
  WHERE p.store_id = _store_id AND public.owns_store(_store_id);
$$;
REVOKE ALL ON FUNCTION public.store_product_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_product_stats(uuid) TO authenticated;