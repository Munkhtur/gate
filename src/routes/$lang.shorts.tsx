import { createFileRoute } from "@tanstack/react-router";
import { getMessages, isLocale, useT } from "@/i18n";
import { PostFeed } from "@/components/PostFeed";

export const Route = createFileRoute("/$lang/shorts")({
  validateSearch: (search: Record<string, unknown>): { post?: string } => {
    const post = search["post"];
    return typeof post === "string" && post.length > 0 ? { post } : {};
  },
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.posts.title} — ${t.brand}`;
    return { meta: [{ title }, { name: "description", content: t.posts.description },
      { property: "og:title", content: title }, { property: "og:description", content: t.posts.description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: Shorts,
});
function Shorts() {
  const t = useT();
  const { post } = Route.useSearch();
  return <div className="mx-auto max-w-6xl px-4 py-5"><h1 className="mb-5 font-display text-2xl font-semibold">{t.posts.title}</h1><PostFeed {...(post ? { initialPostId: post } : {})} /></div>;
}