import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellPlus, BellRing, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n";
import { setStoreFollowed, useFollowedIds } from "@/lib/follows";

export function FollowStoreButton({ storeId }: { storeId: string }) {
  const t = useT();
  const lang = useLocale();
  const client = useQueryClient();
  const { userId, ready, query } = useFollowedIds();
  const followed = query.data?.includes(storeId) ?? false;
  const mutation = useMutation({
    mutationFn: () => setStoreFollowed(userId, storeId, !followed),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["follow-ids", userId] }),
        client.invalidateQueries({ queryKey: ["following-feed", userId] }),
      ]);
    },
    onError: () => toast.error(t.auth.genericError),
  });
  if (ready && !userId) return (
    <Button asChild variant="outline">
      <Link to="/$lang/auth" params={{ lang }} search={{ redirect: `/${lang}/stores/${storeId}` }}>
        <BellPlus /> {t.follow.signInToFollow}
      </Link>
    </Button>
  );
  return (
    <Button type="button" variant={followed ? "secondary" : "default"} aria-pressed={followed}
      disabled={!ready || query.isPending || mutation.isPending} onClick={() => mutation.mutate()}>
      {mutation.isPending ? <LoaderCircle className="animate-spin" /> : followed ? <BellRing /> : <BellPlus />}
      {followed ? t.follow.unfollow : t.follow.follow}
    </Button>
  );
}
