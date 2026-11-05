import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MoreHorizontal, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale";
import { useLocale, useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Post } from "@/lib/posts";
import { useImageUrls } from "@/lib/images";
import { useLikedPostIds, setPostLiked } from "@/lib/post-likes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
  url: string | undefined;
  loading: boolean;
  lang: string;
}

export function PostCard({ post, url, loading, lang }: PostCardProps) {
  const t = useT();
  const locale = useLocale();
  const logoUrls = useImageUrls(post.stores?.logo_url ? [post.stores.logo_url] : []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Like functionality
  const { userId, ready, query: likedQuery } = useLikedPostIds();
  const liked = likedQuery.data?.includes(post.id) ?? false;
  const queryClient = useQueryClient();
  const likeMutation = useMutation({
    mutationFn: () => setPostLiked(userId, post.id, !liked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liked-post-ids", userId] });
    },
    onError: () => toast.error(t.auth.genericError),
  });

  useEffect(() => {
    setFailed(false);
  }, [url]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.5);
        }
      },
      { threshold: [0.5] }
    );

    observerRef.current.observe(element);
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !url) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isVisible && !prefersReducedMotion) {
      void element.play().catch(() => setPlaying(false));
    } else {
      element.pause();
    }

    return () => element.pause();
  }, [isVisible, url]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (locale === "zh") {
        return formatDistanceToNow(date, { addSuffix: true, locale: { ...mn, code: "zh-CN" } as any });
      }
      return formatDistanceToNow(date, { addSuffix: true, locale: mn });
    } catch {
      return "";
    }
  };

  const handleVideoClick = () => {
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) {
      void element.play().catch(() => setPlaying(false));
    } else {
      element.pause();
    }
  };

  return (
    <Card className="shadow-sm overflow-hidden">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {post.stores?.logo_url ? (
            <Link
              to="/$lang/stores/$id"
              params={{ lang, id: post.store_id }}
              className="size-10 rounded-full overflow-hidden bg-secondary flex-shrink-0"
              aria-label={post.stores.name}
            >
              <img src={logoUrls.data?.[post.stores.logo_url] ?? post.stores.logo_url} alt="" className="size-full object-cover" />
            </Link>
          ) : (
            <Link
              to="/$lang/stores/$id"
              params={{ lang, id: post.store_id }}
              className="grid size-10 place-items-center rounded-full bg-secondary flex-shrink-0"
              aria-label={post.stores?.name}
            >
              <svg className="size-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </Link>
          )}
          <div className="flex-1 min-w-0">
            <Link
              to="/$lang/stores/$id"
              params={{ lang, id: post.store_id }}
              className="font-semibold truncate hover:underline"
            >
              {post.stores?.name}
            </Link>
            <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t.posts.moreOptions || "More options"}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </div>

        {/* Post Content - Caption */}
        {post.caption && (
          <div className="mt-3 px-1">
            <p className="whitespace-pre-line break-words">{post.caption}</p>
          </div>
        )}
      </div>

      {/* Media */}
      {url && (
        <div className="relative w-full">
          {post.media_type === "image" ? (
            <img
              src={url}
              alt={post.caption || ""}
              onError={() => setFailed(true)}
              loading="lazy"
              className="w-full max-h-[600px] object-cover"
            />
          ) : (
            <div className="relative max-h-[600px] bg-black">
              <video
                ref={videoRef}
                src={url}
                loop
                muted={muted}
                playsInline
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={() => setFailed(true)}
                onClick={handleVideoClick}
                className="w-full max-h-[600px] object-contain"
              />
              {!playing && !muted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-14"
                    onClick={handleVideoClick}
                    aria-label={t.posts.play}
                  >
                    <Play className="size-6" />
                  </Button>
                </div>
              )}
              {post.media_type === "video" && !failed && (
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleVideoClick}
                    aria-label={playing ? t.posts.pause : t.posts.play}
                  >
                    {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMuted((v) => !v)}
                    aria-label={muted ? t.posts.unmute : t.posts.mute}
                  >
                    {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!url && !loading && (
        <div className="aspect-video flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">{t.posts.mediaError}</p>
        </div>
      )}

      {loading && (
        <div className="aspect-video flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">{t.browse.loading}</p>
        </div>
      )}

      {/* Post Footer - Actions */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-1 justify-start gap-2 px-3"
            aria-label={t.posts.like || "Like"}
            onClick={() => {
              if (!ready || !userId) return;
              likeMutation.mutate();
            }}
            disabled={likeMutation.isPending}
          >
            <Heart
              className={`size-5 transition-colors ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`}
              stroke={liked ? "none" : "currentColor"}
            />
            <span className="hidden sm:inline">{t.posts.like || "Like"}</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 flex-1 justify-center gap-2 px-3" aria-label={t.posts.comment || "Comment"}>
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden sm:inline">Comment</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 flex-1 justify-end gap-2 px-3" aria-label={t.posts.share || "Share"}>
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>

        {/* View Store Button */}
        <div className="mt-3">
          <Button asChild variant="outline" className="w-full">
            <Link to="/$lang/stores/$id" params={{ lang, id: post.store_id }}>
              {t.browse.viewStore}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}