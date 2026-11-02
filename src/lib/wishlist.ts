import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const savedIdsOptions = (userId: string) => queryOptions({
  queryKey: ["wishlist-ids", userId],
  queryFn: async () => {
    const { data, error } = await supabase.from("wishlist").select("product_id").eq("user_id", userId);
    if (error) throw error;
    return data.map((row) => row.product_id);
  },
});

export const wishlistOptions = (userId: string) => queryOptions({
  queryKey: ["wishlist-products", userId],
  queryFn: async () => {
    const { data, error } = await supabase.from("wishlist")
      .select("created_at, products!inner(*, stores(name))")
      .eq("user_id", userId).eq("products.is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((row) => row.products);
  },
});

export const mostLikedOptions = () => queryOptions({
  queryKey: ["most-liked-products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("popular_products")
      .select("*, stores(name)")
      .order("save_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    return data;
  },
});

export async function setProductSaved(userId: string, productId: string, saved: boolean) {
  if (!userId) throw new Error("Sign-in required");
  const result = saved
    ? await supabase.from("wishlist").upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true })
    : await supabase.from("wishlist").delete().eq("user_id", userId).eq("product_id", productId);
  if (result.error) throw result.error;
}

export function useSavedIds() {
  const { session, ready } = useSession();
  const userId = session?.user.id ?? "";
  const query = useQuery({ ...savedIdsOptions(userId), enabled: ready && !!userId });
  return { userId, ready, query };
}