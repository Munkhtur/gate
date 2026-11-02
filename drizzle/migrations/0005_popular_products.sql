-- Already applied directly earlier (view public.popular_products exists); statements commented out so later migrations can run.
-- -- Popular products: published products ranked by wishlist saves.
-- -- The view runs as its owner, so the wishlist table stays private (no public read policy);
-- -- it exposes only published product columns plus an aggregate save count.
CREATE VIEW public.popular_products
WITH (security_barrier = true) AS
SELECT p.*, COALESCE(w.save_count, 0)::integer AS save_count
FROM public.products p
LEFT JOIN (
  SELECT product_id, count(*) AS save_count
  FROM public.wishlist
  GROUP BY product_id
) w ON w.product_id = p.id
WHERE p.is_published;
GRANT SELECT ON public.popular_products TO anon;
GRANT SELECT ON public.popular_products TO authenticated;
