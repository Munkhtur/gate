import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pause, Play, Store, Volume2, VolumeX } from "lucide-react";
import { feedOptions, type Post, usePostUrls } from "@/lib/posts";
import { useLocale, useT } from "@/i18n";
import { Button } from "@/components/ui/button";

export function PostFeed({ storeId, initialPostId }: { storeId?: string; initialPostId?: string }) {
  const t = useT();
  const feed = useInfiniteQuery(feedOptions(storeId));
  const posts = feed.data?.pages.flat() ?? [];
  const urls = usePostUrls(posts.map(post => post.media_path));
  const container = useRef<HTMLDivElement>(null);
  const items = useRef(new Map<string, HTMLElement>());
  const openedPost = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const index = posts.findIndex(post => post.id === activeId);
  useEffect(() => {
    if (!initialPostId) { openedPost.current = null; return; }
    if (openedPost.current === initialPostId) return;
    const element = items.current.get(initialPostId);
    if (element && container.current) {
      container.current.scrollTop = element.offsetTop - container.current.offsetTop;
      setActiveId(initialPostId);
      openedPost.current = initialPostId;
    } else if (feed.hasNextPage && !feed.isFetchingNextPage && !feed.isFetchNextPageError) {
      void feed.fetchNextPage();
    }
  }, [initialPostId, feed.data, feed.hasNextPage, feed.isFetchingNextPage, feed.isFetchNextPageError, feed.fetchNextPage]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) setActiveId(entry.target.id);
      }
    }, { root: container.current, threshold: [0.6] });
    items.current.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [posts.length]);
  useEffect(() => {
    if (index >= posts.length - 3 && feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
  }, [index, posts.length, feed.hasNextPage, feed.isFetchingNextPage, feed.fetchNextPage]);
  function move(direction: number) {
    const post = posts[Math.max(0, Math.min(posts.length - 1, index + direction))];
    if (post) items.current.get(post.id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
  }
  if (feed.isPending) return <p role="status" className="py-12 text-center text-muted-foreground">{t.browse.loading}</p>;
  if (feed.isLoadingError) return <div className="py-12 text-center"><p className="mb-4 text-muted-foreground">{t.auth.genericError}</p><Button variant="outline" onClick={() => feed.refetch()}>{t.wishlist.retry}</Button></div>;
  if (!posts.length) return <p className="py-12 text-center text-muted-foreground">{t.posts.empty}</p>;
  return <div className="relative mx-auto max-w-2xl">
    <div ref={container} tabIndex={0} aria-label={t.posts.title} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); move(event.key === "ArrowDown" ? 1 : -1); }
    }} className="post-feed h-[calc(100dvh-8rem)] min-h-[60vh] max-h-[850px] snap-y snap-mandatory overflow-y-auto overscroll-y-contain rounded-lg bg-cinema outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {posts.map(post => <div key={post.id} id={post.id} ref={element => { if (element) items.current.set(post.id, element); else items.current.delete(post.id); }} className="h-full snap-start snap-always">
        <PostSlide post={post} url={urls.data?.[post.media_path]} active={post.id === activeId} loading={urls.isPending} />
      </div>)}
      {feed.isFetchingNextPage && <p role="status" className="py-4 text-center text-cinema-foreground">{t.browse.loading}</p>}
    </div>
    <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
      <Button variant="secondary" size="icon" aria-label={t.posts.previous} title={t.posts.previous} disabled={index <= 0} onClick={() => move(-1)}><ArrowUp className="size-5" /></Button>
      <Button variant="secondary" size="icon" aria-label={t.posts.next} title={t.posts.next} disabled={index >= posts.length - 1} onClick={() => move(1)}><ArrowDown className="size-5" /></Button>
    </div>
    {feed.isFetchNextPageError && <Button variant="outline" className="mt-3" onClick={() => feed.fetchNextPage()}>{t.wishlist.retry}</Button>}
  </div>;
}

function PostSlide({ post, url, active, loading }: { post: Post; url: string | undefined; active: boolean; loading: boolean }) {
  const t = useT();
  const lang = useLocale();
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [url]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (active && url && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void element.play().catch(() => setPlaying(false));
    } else element.pause();
    return () => element.pause();
  }, [active, url]);
  return <article aria-label={post.caption || post.stores?.name || t.posts.title} className="relative flex h-full flex-col text-cinema-foreground">
    <div className="relative min-h-0 flex-1">
      {!url || failed ? <p role="status" className="grid h-full place-items-center px-6 text-center">{loading ? t.browse.loading : t.posts.mediaError}</p> : post.media_type === "image"
        ? <img src={url} alt={post.caption} onError={() => setFailed(true)} loading="lazy" className="size-full object-contain" />
        : <video ref={video} src={url} loop muted={muted} playsInline preload={active ? "auto" : "metadata"} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} className="size-full object-contain" />}
      {post.media_type === "video" && url && !failed && <div className="absolute bottom-3 right-3 flex gap-2">
        <Button variant="secondary" size="icon" aria-label={playing ? t.posts.pause : t.posts.play} title={playing ? t.posts.pause : t.posts.play} onClick={() => { const element = video.current; if (!element) return; if (element.paused) void element.play().catch(() => setPlaying(false)); else element.pause(); }}>{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</Button>
        <Button variant="secondary" size="icon" aria-label={muted ? t.posts.unmute : t.posts.mute} title={muted ? t.posts.unmute : t.posts.mute} onClick={() => setMuted(value => !value)}>{muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}</Button>
      </div>}
    </div>
    <div className="shrink-0 space-y-2 border-t border-cinema-line px-5 py-4">
      <Link to="/$lang/stores/$id" params={{ lang, id: post.store_id }} className="flex items-center gap-2 font-semibold"><Store className="size-4 shrink-0" /><span className="truncate">{post.stores?.name}</span></Link>
      {post.caption && <p className="max-h-24 overflow-y-auto whitespace-pre-line break-words text-sm">{post.caption}</p>}
      <Button asChild size="sm" variant="secondary"><Link to="/$lang/stores/$id" params={{ lang, id: post.store_id }}>{t.browse.viewStore}</Link></Button>
    </div>
  </article>;
}