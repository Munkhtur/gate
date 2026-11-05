import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n";
import { setProductSaved, useSavedIds } from "@/lib/wishlist";

export function SaveProductButton({
  productId,
  compact = false,
}: {
  productId: string;
  compact?: boolean;
}) {
  const t = useT();
  const lang = useLocale();
  const client = useQueryClient();
  const { userId, ready, query } = useSavedIds();
  const saved = query.data?.includes(productId) ?? false;
  const mutation = useMutation({
    mutationFn: () => setProductSaved(userId, productId, !saved),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["wishlist-ids", userId] }),
        client.invalidateQueries({ queryKey: ["wishlist-products", userId] }),
      ]);
    },
    onError: () => toast.error(t.auth.genericError),
  });
  const label = !userId ? t.wishlist.signInToSave : saved ? t.wishlist.remove : t.wishlist.save;
  if (!ready || !userId)
    return (
      <Button asChild variant="outline" size={compact ? "icon" : "default"} title={label}>
        <Link
          to="/$lang/auth"
          params={{ lang }}
          search={{ redirect: `/${lang}/products/${productId}` }}
          aria-label={label}
        >
          <Heart />
          {!compact && label}
        </Link>
      </Button>
    );
  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      size={compact ? "icon" : "default"}
      title={label}
      aria-label={label}
      aria-pressed={saved}
      disabled={query.isPending || query.isError || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? (
        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
      ) : (
        <Heart className={saved ? "fill-current text-primary" : ""} />
      )}
      {!compact && label}
    </Button>
  );
}
