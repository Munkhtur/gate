CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_mn text NOT NULL,
  name_zh text NOT NULL,
  sort int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.categories (slug, name_mn, name_zh, sort) VALUES
('electronics','Цахилгаан бараа','电子产品',1),
('clothing','Хувцас','服装',2),
('home','Гэр ахуй, тавилга','家居家具',3),
('beauty','Гоо сайхан','美妆',4),
('sports','Спорт, аялал','运动户外',5),
('food','Хүнс','食品',6),
('vehicles','Тээврийн хэрэгсэл','车辆',7),
('other','Бусад','其他',8);

CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads stores" ON public.stores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owner inserts store" ON public.stores FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates store" ON public.stores FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner deletes store" ON public.stores FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  price numeric(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  images text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_store_idx ON public.products(store_id);
CREATE INDEX products_category_idx ON public.products(category_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_store(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = auth.uid())
$$;

CREATE POLICY "Anyone reads published products" ON public.products FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "Owner reads own products" ON public.products FOR SELECT TO authenticated USING (public.owns_store(store_id));
CREATE POLICY "Owner inserts products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.owns_store(store_id));
CREATE POLICY "Owner updates products" ON public.products FOR UPDATE TO authenticated USING (public.owns_store(store_id)) WITH CHECK (public.owns_store(store_id));
CREATE POLICY "Owner deletes products" ON public.products FOR DELETE TO authenticated USING (public.owns_store(store_id));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();