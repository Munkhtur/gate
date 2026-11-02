import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const followedIdsOptions = (userId: string) => queryOptions({
  queryKey: ["follow-ids", userId],
  queryFn: async () => {
    const { data, error } = await supabase.from("store_follows").select("store_id").eq("user_id", userId);
    if (error) throw error;
    return data.map((r) => r.store_id);
  },
});

export const followingFeedOptions = (userId: string) => queryOptions({
  queryKey: ["following-feed", userId],
  queryFn: async () => {
    const { data: follows, error } = await supabase.from("store_follows")
      .select("created_at, stores!inner(*)").eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const stores = follows.map((f) => f.stores);
    const ids = stores.map((s) => s.id);
    if (!ids.length) return { stores, products: [] };
    const { data: products, error: pErr } = await supabase.from("products")
      .select("*, stores(name)").in("store_id", ids).eq("is_published", true)
      .order("created_at", { ascending: false }).limit(24);
    if (pErr) throw pErr;
    return { stores, products };
  },
});

export async function setStoreFollowed(userId: string, storeId: string, followed: boolean) {
  if (!userId) throw new Error("Sign-in required");
  const result = followed
    ? await supabase.from("store_follows").upsert({ user_id: userId, store_id: storeId }, { onConflict: "user_id,store_id", ignoreDuplicates: true })
    : await supabase.from("store_follows").delete().eq("user_id", userId).eq("store_id", storeId);
  if (result.error) throw result.error;
}

export function useFollowedIds() {
  const { session, ready } = useSession();
  const userId = session?.user.id ?? "";
  const query = useQuery({ ...followedIdsOptions(userId), enabled: ready && !!userId });
  return { userId, ready, query };
}
