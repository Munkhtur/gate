import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, Heart, Pencil, Plus, Store, Trash2, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { uploadImage, useImageUrls } from "@/lib/images";
import { getStoreLocation } from "@/lib/location";
import { StoreMap } from "@/components/StoreMap";
import { OwnerPosts } from "@/components/OwnerPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/$lang/_authenticated/dashboard")({
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.dashboard.title} — ${t.brand}`;
    return { meta: [{ title }, { name: "robots", content: "noindex" },
      { name: "description", content: t.home.ownerText }, { property: "og:title", content: title },
      { property: "og:description", content: t.home.ownerText }, { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }] };
  },
  component: Dashboard,
});

type StoreRow = Tables<"stores">;
type ProductRow = Tables<"products">;

function useUserId() {
  return Route.useRouteContext().user.id;
}

function Dashboard() {
  const t = useT();
  const userId = useUserId();
  const store = useQuery({
    queryKey: ["my-store", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").eq("owner_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-14">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold">{t.dashboard.title}</h1>
      {store.isLoading ? null : !store.data ? (
        <>
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-4 sm:p-6">
            <Store className="size-8 text-primary" />
            <p className="text-muted-foreground">{t.dashboard.empty}</p>
          </div>
          <StoreForm store={null} />
        </>
      ) : (
        <>
          <StoreForm store={store.data} />
          <Products store={store.data} />
          <OwnerPosts storeId={store.data.id} userId={userId} />
        </>
      )}
    </div>
  );
}

function StoreForm({ store }: { store: StoreRow | null }) {
  const t = useT();
  const userId = useUserId();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState<string | null>(store?.logo_url ?? null);
  const [lat, setLat] = useState(String(store?.lat ?? ""));
  const [lng, setLng] = useState(String(store?.lng ?? ""));
  const position = getStoreLocation(lat, lng);
  const logoUrls = useImageUrls(logo ? [logo] : []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    if (!name) { toast.error(t.dashboard.required); return; }
    if ((lat.trim() || lng.trim()) && !position) { toast.error(t.maps.invalid); return; }
    const row = {
      owner_id: userId,
      name,
      description: String(f.get("description") || "") || null,
      phone: String(f.get("phone") || "") || null,
      address: String(f.get("address") || "") || null,
      lat: position?.lat ?? null,
      lng: position?.lng ?? null,
      logo_url: logo,
    };
    setBusy(true);
    const { error } = store
      ? await supabase.from("stores").update(row).eq("id", store.id)
      : await supabase.from("stores").insert(row);
    setBusy(false);
    if (error) { toast.error(t.auth.genericError); return; }
    toast.success(t.dashboard.saved);
    qc.invalidateQueries({ queryKey: ["my-store", userId] });
    qc.invalidateQueries({ queryKey: ["store"] });
    qc.invalidateQueries({ queryKey: ["stores"] });
  }

  async function onLogo(file?: File) {
    if (!file) return;
    try {
      setLogo(await uploadImage(file, userId));
    } catch {
      toast.error(t.auth.genericError);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-card">
      <h2 className="font-display text-lg sm:text-xl font-semibold">{store ? t.dashboard.storeInfo : t.dashboard.createStore}</h2>
      <div className="mt-4 space-y-4 sm:grid sm:gap-4 sm:grid-cols-2">
        <Field label={t.dashboard.storeName}><Input name="name" defaultValue={store?.name} required maxLength={120} /></Field>
        <Field label={t.dashboard.phone}><Input name="phone" defaultValue={store?.phone ?? ""} maxLength={40} /></Field>
        <div className="sm:col-span-2">
          <Field label={t.dashboard.description}><Textarea name="description" defaultValue={store?.description ?? ""} maxLength={2000} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t.dashboard.address}><Input name="address" defaultValue={store?.address ?? ""} maxLength={300} /></Field>
        </div>
        <div className="space-y-3 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium">{t.maps.picker}</h3>
            <Button type="button" size="sm" variant="ghost" disabled={!lat && !lng} onClick={() => { setLat(""); setLng(""); }}><X className="size-4" />{t.maps.clear}</Button>
          </div>
          <StoreMap position={position} onChange={(point) => { setLat(String(point.lat)); setLng(String(point.lng)); }} />
        </div>
        <Field label={t.dashboard.lat}><Input name="lat" aria-label={t.dashboard.lat} type="number" min={-90} max={90} step="any" value={lat} onChange={(e) => setLat(e.target.value)} /></Field>
        <Field label={t.dashboard.lng}><Input name="lng" aria-label={t.dashboard.lng} type="number" min={-180} max={180} step="any" value={lng} onChange={(e) => setLng(e.target.value)} /></Field>
        <Field label={t.dashboard.logo}>
          <div className="flex items-center gap-3">
            {logo && logoUrls.data?.[logo] ? (
              <img src={logoUrls.data[logo]} alt="" className="size-12 sm:size-14 rounded-lg object-cover" />
            ) : (
              <div className="grid size-12 sm:size-14 place-items-center rounded-lg bg-secondary"><Store className="size-5 text-muted-foreground" /></div>
            )}
            <Input type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0])} />
          </div>
        </Field>
      </div>
      <Button type="submit" className="mt-4 sm:mt-6" disabled={busy}>{store ? t.dashboard.save : t.dashboard.createStore}</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Products({ store }: { store: StoreRow }) {
  const t = useT();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const products = useQuery({
    queryKey: ["my-products", store.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const stats = useQuery({
    queryKey: ["product-stats", store.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("store_product_stats", { _store_id: store.id });
      if (error) throw error;
      return Object.fromEntries(data.map((r) => [r.product_id, r]));
    },
  });
  const covers = (products.data ?? []).map((p) => p.images[0]).filter(Boolean) as string[];
  const urls = useImageUrls(covers);

  async function remove(p: ProductRow) {
    if (!confirm(t.dashboard.confirmDelete)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { toast.error(t.auth.genericError); return; }
    qc.invalidateQueries({ queryKey: ["my-products", store.id] });
  }

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl sm:text-2xl font-semibold">{t.dashboard.products}</h2>
        <Button onClick={() => setEditing("new")} className="w-full sm:w-auto"><Plus className="size-4" /> {t.dashboard.addProduct}</Button>
      </div>
      {products.data?.length === 0 && <p className="mt-4 text-muted-foreground">{t.dashboard.noProducts}</p>}
      <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.data?.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="aspect-[4/3] bg-secondary">
              {p.images[0] && urls.data?.[p.images[0]] && <img src={urls.data[p.images[0]] ?? undefined} alt={p.title} className="size-full object-cover" />}
            </div>
            <div className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{p.title}</h3>
                <Badge variant={p.is_published ? "default" : "secondary"}>{p.is_published ? t.dashboard.published : t.dashboard.draft}</Badge>
              </div>
              <p className="mt-1 text-lg font-semibold text-primary">₮{Number(p.price).toLocaleString()}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1" title={t.dashboard.views}><Eye className="size-4" /> {stats.data?.[p.id]?.views ?? 0} {t.dashboard.views}</span>
                <span className="inline-flex items-center gap-1" title={t.dashboard.saves}><Heart className="size-4" /> {stats.data?.[p.id]?.saves ?? 0} {t.dashboard.saves}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(p)} className="w-full sm:w-auto"><Pencil className="size-3.5" /> {t.dashboard.edit}</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p)} className="w-full sm:w-auto"><Trash2 className="size-3.5" /> {t.dashboard.delete}</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === "new" ? t.dashboard.addProduct : t.dashboard.editProduct}</DialogTitle></DialogHeader>
          {editing !== null && (
            <ProductForm
              key={editing === "new" ? "new" : editing.id}
              storeId={store.id}
              product={editing === "new" ? null : editing}
              onDone={() => {
                setEditing(null);
                qc.invalidateQueries({ queryKey: ["my-products", store.id] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ProductForm({ storeId, product, onDone }: { storeId: string; product: ProductRow | null; onDone: () => void }) {
  const t = useT();
  const lang = useLocale();
  const userId = useUserId();
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? "");
  const [published, setPublished] = useState(product?.is_published ?? true);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const urls = useImageUrls(images);
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const paths = await Promise.all(Array.from(files).slice(0, 8).map((f) => uploadImage(f, userId)));
      setImages((prev) => [...prev, ...paths].slice(0, 8));
    } catch {
      toast.error(t.auth.genericError);
    }
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") || "").trim();
    if (!title) { toast.error(t.dashboard.required); return; }
    const row = {
      store_id: storeId,
      title,
      description: String(f.get("description") || "") || null,
      price: Math.max(0, Number(f.get("price")) || 0),
      category_id: categoryId || null,
      images,
      is_published: published,
    };
    setBusy(true);
    const { error } = product
      ? await supabase.from("products").update(row).eq("id", product.id)
      : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) { toast.error(t.auth.genericError); return; }
    toast.success(t.dashboard.saved);
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={t.dashboard.productTitle}><Input name="title" defaultValue={product?.title} required maxLength={160} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t.dashboard.price}><Input name="price" type="number" min={0} step="1" defaultValue={product ? Number(product.price) : ""} /></Field>
        <Field label={t.dashboard.category}>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder={t.dashboard.chooseCategory} /></SelectTrigger>
            <SelectContent>
              {categories.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{lang === "zh" ? c.name_zh : c.name_mn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label={t.dashboard.description}><Textarea name="description" defaultValue={product?.description ?? ""} maxLength={4000} rows={4} /></Field>
      <Field label={t.dashboard.photos}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {images.map((p) => (
            <div key={p} className="relative aspect-square overflow-hidden rounded-md bg-secondary">
              {urls.data?.[p] && <img src={urls.data[p]} alt="" className="size-full object-cover" />}
              <button type="button" aria-label={t.dashboard.delete} onClick={() => setImages((prev) => prev.filter((x) => x !== p))} className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {images.length < 8 && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-md border border-dashed border-border text-muted-foreground hover:bg-secondary">
              <ImagePlus className="size-5" />
              <span className="sr-only">{t.dashboard.addPhotos}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          )}
        </div>
        {uploading && <p className="text-sm text-muted-foreground">{t.dashboard.uploading}</p>}
      </Field>
      <div className="flex items-center gap-2">
        <Switch id="pub" checked={published} onCheckedChange={setPublished} />
        <Label htmlFor="pub">{t.dashboard.published}</Label>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} className="w-full sm:w-auto">{t.dashboard.cancel}</Button>
        <Button type="submit" disabled={busy || uploading} className="w-full sm:w-auto">{t.dashboard.save}</Button>
      </div>
    </form>
  );
}
