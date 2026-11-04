import { Link } from "@tanstack/react-router";
import { Play, Clapperboard } from "lucide-react";
import { useLocale } from "@/i18n";
import type { Post } from "@/lib/posts";

interface PostTileProps {
  post: Post;
  url: string | undefined;
  lang: string;
}

export function PostTile({ post, url, lang }: PostTileProps) {
  const locale = useLocale();
  return (
    <Link
      to="/$lang/shorts"
      params={{ lang }}
      search={{ post: post.id }}
      className="group relative block overflow-hidden rounded-xl border border-border bg-cinema shadow-card transition hover:-translate-y-0.5"
    >
      <div className="aspect-[9/16]">
        {url ? (
          post.media_type === "image" ? (
            <img src={url} alt={post.caption} loading="lazy" className="size-full object-cover" />
          ) : (
            <video src={url} muted playsInline preload="metadata" className="size-full object-cover" />
          )
        ) : (
          <div className="grid size-full place-items-center text-cinema-foreground">
            <Clapperboard className="size-8" />
          </div>
        )}
      </div>
      {post.media_type === "video" && (
        <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-cinema/70 text-cinema-foreground">
          <Play className="size-4" />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cinema/90 to-transparent p-3 pt-8 text-cinema-foreground">
        <p className="truncate text-xs font-medium">{post.stores?.name}</p>
        {post.caption && <p className="mt-0.5 line-clamp-2 text-xs opacity-80">{post.caption}</p>}
      </div>
    </Link>
  );
}