import { infiniteQueryOptions, queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Post = Tables<"posts"> & { stores: { name: string } | null };
export const POST_BUCKET = "post-media";
export const POST_MAX_BYTES = 50 * 1024 * 1024;
const MIME_TYPES: Record<string, { kind: "image" | "video"; ext: string }> = {
  "image/jpeg": { kind: "image", ext: "jpg" }, "image/png": { kind: "image", ext: "png" },
  "image/webp": { kind: "image", ext: "webp" }, "video/mp4": { kind: "video", ext: "mp4" },
  "video/webm": { kind: "video", ext: "webm" },
};
export function validatePostFile(file: Pick<File, "type" | "size">) {
  const media = MIME_TYPES[file.type];
  if (!media || file.size <= 0 || file.size > POST_MAX_BYTES) return null;
  return media;
}
export async function uploadPostMedia(file: File, userId: string) {
  const media = validatePostFile(file);
  if (!media || !userId) throw new Error("Invalid post upload");
  const path = `${userId}/${crypto.randomUUID()}.${media.ext}`;
  const { error } = await supabase.storage.from(POST_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return { path, kind: media.kind };
}
export function feedOptions(storeId?: string) {
  return infiniteQueryOptions({
    queryKey: ["posts-feed", storeId ?? "all"], initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let query = supabase.from("posts").select("*, stores(name)").eq("is_published", true);
      if (storeId) query = query.eq("store_id", storeId);
      const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(pageParam, pageParam + 11);
      if (error) throw error;
      return data as Post[];
    },
    getNextPageParam: (last, pages) => last.length === 12 ? pages.length * 12 : undefined,
  });
}
export function latestPostsOptions() {
  return queryOptions({
    queryKey: ["latest-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*, stores(name)").eq("is_published", true)
        .order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data as Post[];
    },
  });
}
export function ownerPostsOptions(storeId: string, userId: string) {
  return queryOptions({ queryKey: ["owner-posts", userId, storeId], queryFn: async () => {
    const { data, error } = await supabase.from("posts").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
}
export function usePostUrls(paths: string[], userId?: string) {
  return useQuery({ queryKey: ["post-urls", userId ?? "public", paths], enabled: paths.length > 0,
    staleTime: 45 * 60 * 1000, refetchInterval: 45 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(POST_BUCKET).createSignedUrls(paths, 3600);
      if (error) throw error;
      return Object.fromEntries(data.flatMap(d => d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])) as Record<string, string>;
    },
  });
}
