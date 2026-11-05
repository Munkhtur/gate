import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const likedPostIdsOptions = (userId: string) =>
  queryOptions({
    queryKey: ["liked-post-ids", userId],
    queryFn: async () => {
      // Using unsafe cast or dynamic query until generated types are updated
      const { data, error } = await (supabase.from as any)("post_likes")
        .select("post_id")
        .eq("user_id", userId);
      if (error) throw error;
      return (data as { post_id: string }[]).map((row) => row.post_id);
    },
  });

export async function setPostLiked(userId: string, postId: string, liked: boolean) {
  if (!userId) throw new Error("Sign-in required");
  const result = liked
    ? await (supabase.from as any)("post_likes").upsert(
        { user_id: userId, post_id: postId },
        { onConflict: "user_id,post_id", ignoreDuplicates: true }
      )
    : await (supabase.from as any)("post_likes")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

  if (result.error) throw result.error;
}

export function useLikedPostIds() {
  const { session, ready } = useSession();
  const userId = session?.user.id ?? "";
  const query = useQuery({ ...likedPostIdsOptions(userId), enabled: ready && !!userId });
  return { userId, ready, query };
}
