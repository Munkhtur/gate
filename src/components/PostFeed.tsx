import { useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { feedOptions, type Post, usePostUrls } from "@/lib/posts";
import { useLocale, useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";

export function PostFeed({ storeId }: { storeId?: string }) {
  const t = useT();
  const lang = useLocale();
  const feed = useInfiniteQuery(feedOptions(storeId));
  const posts = feed.data?.pages.flat() ?? [];
  const urls = usePostUrls(posts.map((post) => post.media_path));

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll sentinel
  const fetchNextPage = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const sentinelObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    sentinelObserver.observe(sentinel);
    return () => sentinelObserver.disconnect();
  }, [fetchNextPage]);

  // Also fetch next page when near end (fallback)
  const lastPostIndex = posts.length - 1;
  useEffect(() => {
    if (lastPostIndex >= 0 && lastPostIndex >= posts.length - 3 && feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [lastPostIndex, posts.length, feed.hasNextPage, feed.isFetchingNextPage, feed.fetchNextPage]);

  if (feed.isPending) {
    return (
      <div className="flex flex-col items-center py-12" role="status" aria-label={t.browse.loading}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="mt-4 text-muted-foreground">{t.browse.loading}</p>
      </div>
    );
  }

  if (feed.isLoadingError) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-muted-foreground">{t.auth.genericError}</p>
        <Button variant="outline" onClick={() => feed.refetch()}>
          {t.wishlist.retry}
        </Button>
      </div>
    );
  }

  if (!posts.length) {
    return <p className="py-12 text-center text-muted-foreground">{t.posts.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <div key={post.id}>
          <PostCard
            post={post}
            url={urls.data?.[post.media_path]}
            loading={urls.isPending}
            lang={lang}
          />
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" aria-hidden="true">
        {feed.isFetchingNextPage && (
          <div className="flex justify-center py-4" role="status" aria-label={t.browse.loading}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
        {feed.isFetchNextPageError && (
          <div className="flex justify-center py-4">
            <Button variant="outline" onClick={() => feed.fetchNextPage()}>
              {t.wishlist.retry}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}