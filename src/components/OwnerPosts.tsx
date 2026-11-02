import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ownerPostsOptions, POST_BUCKET, uploadPostMedia, usePostUrls, validatePostFile } from "@/lib/posts";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type PostRow = Tables<"posts">;
export function OwnerPosts({ storeId, userId }: { storeId: string; userId: string }) {
  const t = useT();
  const qc = useQueryClient();
  const posts = useQuery(ownerPostsOptions(storeId, userId));
  const urls = usePostUrls((posts.data ?? []).map(p => p.media_path), userId);
  const [editing, setEditing] = useState<PostRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  function refresh() {
    void qc.invalidateQueries({ queryKey: ["owner-posts", userId, storeId] });
    void qc.invalidateQueries({ queryKey: ["posts-feed"] });
    void qc.invalidateQueries({ queryKey: ["post-urls"] });
  }
  async function remove(post: PostRow) {
    if (!window.confirm(t.posts.confirmDelete)) return;
    setDeleting(post.id);
    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id).eq("store_id", storeId);
      if (error) throw error;
      await supabase.storage.from(POST_BUCKET).remove([post.media_path]);
      refresh();
    } catch { toast.error(t.auth.genericError); }
    finally { setDeleting(null); }
  }
  return <section className="mt-12 border-t border-border pt-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-2xl font-semibold">{t.posts.manage}</h2>
      <Button onClick={() => setEditing("new")}><Plus className="size-4" />{t.posts.create}</Button>
    </div>
    {posts.isLoading && <p className="mt-6 text-muted-foreground">{t.browse.loading}</p>}
    {posts.isError && <Button variant="outline" className="mt-6" onClick={() => posts.refetch()}>{t.wishlist.retry}</Button>}
    {posts.data?.length === 0 && <p className="mt-6 text-muted-foreground">{t.posts.emptyOwner}</p>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.data?.map(post => <article key={post.id} className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="aspect-[4/3] bg-muted">
          {urls.data?.[post.media_path] && (post.media_type === "video"
            ? <video src={urls.data[post.media_path]} controls playsInline preload="metadata" className="size-full object-contain" />
            : <img src={urls.data[post.media_path]} alt={post.caption} className="size-full object-contain" />)}
        </div>
        <div className="space-y-3 p-4">
          <Badge variant={post.is_published ? "default" : "secondary"}>{post.is_published ? t.dashboard.published : t.dashboard.draft}</Badge>
          <p className="line-clamp-3 break-words text-sm">{post.caption}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(post)}><Pencil className="size-4" />{t.dashboard.edit}</Button>
            <Button size="sm" variant="ghost" disabled={deleting === post.id} onClick={() => remove(post)}><Trash2 className="size-4" />{t.dashboard.delete}</Button>
          </div>
        </div>
      </article>)}
    </div>
    <Dialog open={editing !== null} onOpenChange={open => { if (!open) setEditing(null); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing === "new" ? t.posts.create : t.posts.edit}</DialogTitle></DialogHeader>
        {editing !== null && <PostForm key={editing === "new" ? "new" : editing.id} post={editing === "new" ? null : editing} storeId={storeId} userId={userId} onDone={() => { setEditing(null); refresh(); }} />}
      </DialogContent>
    </Dialog>
  </section>;
}

function PostForm({ post, storeId, userId, onDone }: { post: PostRow | null; storeId: string; userId: string; onDone: () => void }) {
  const t = useT();
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [published, setPublished] = useState(post?.is_published ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const urls = usePostUrls(post ? [post.media_path] : [], userId);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if ((!post && !file) || (file && !validatePostFile(file))) { toast.error(t.posts.fileError); return; }
    setBusy(true);
    let uploaded: string | undefined;
    try {
      const media = file ? await uploadPostMedia(file, userId) : null;
      uploaded = media?.path;
      const path = media?.path ?? post?.media_path;
      const kind = media?.kind ?? post?.media_type;
      if (!path || !kind) throw new Error("Missing media");
      const row = { store_id: storeId, caption: caption.trim(), media_path: path, media_type: kind, is_published: published };
      const { error } = post ? await supabase.from("posts").update(row).eq("id", post.id).eq("store_id", storeId) : await supabase.from("posts").insert(row);
      if (error) throw error;
      uploaded = undefined;
      if (media && post) await supabase.storage.from(POST_BUCKET).remove([post.media_path]);
      toast.success(t.dashboard.saved);
      onDone();
    } catch {
      if (uploaded) await supabase.storage.from(POST_BUCKET).remove([uploaded]);
      toast.error(t.auth.genericError);
    } finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-5">
    {post && urls.data?.[post.media_path] && <div className="h-48 bg-muted">{post.media_type === "video" ? <video className="size-full object-contain" controls playsInline src={urls.data[post.media_path]} /> : <img className="size-full object-contain" alt={post.caption} src={urls.data[post.media_path]} />}</div>}
    <div className="space-y-2">
      <Label htmlFor="post-file" className="flex items-center gap-2"><ImagePlus className="size-4" />{t.posts.media}</Label>
      <Input id="post-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={busy} required={!post} onChange={event => {
        const chosen = event.target.files?.[0];
        if (chosen && !validatePostFile(chosen)) { toast.error(t.posts.fileError); event.target.value = ""; setFile(null); return; }
        setFile(chosen ?? null);
      }} />
      <p className="text-xs text-muted-foreground">{t.posts.fileFormats}</p>
    </div>
    <div className="space-y-2"><Label htmlFor="post-caption">{t.posts.caption}</Label><Textarea id="post-caption" value={caption} onChange={event => setCaption(event.target.value)} maxLength={2000} rows={4} disabled={busy} /></div>
    <div className="flex items-center gap-2"><Switch id="post-published" checked={published} onCheckedChange={setPublished} disabled={busy} /><Label htmlFor="post-published">{t.dashboard.published}</Label></div>
    <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onDone} disabled={busy}>{t.dashboard.cancel}</Button><Button type="submit" disabled={busy}>{busy ? t.posts.uploading : t.dashboard.save}</Button></div>
  </form>;
}