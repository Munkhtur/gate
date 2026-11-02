import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const IMAGE_BUCKET = "listing-images";

/** Uploads into the user's own folder (storage policies require `<uid>/...`). Returns the storage path. */
export async function uploadImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

/** Bucket is private (public buckets are blocked), so display via signed URLs. */
export function useImageUrls(paths: string[]) {
  return useQuery({
    queryKey: ["image-urls", paths],
    enabled: paths.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(paths, 3600);
      if (error) throw error;
      return Object.fromEntries(data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : []))) as Record<string, string>;
    },
  });
}
