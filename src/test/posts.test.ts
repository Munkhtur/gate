import { beforeEach, describe, expect, it, vi } from "vitest";
import { feedOptions, ownerPostsOptions, POST_MAX_BYTES, uploadPostMedia, validatePostFile } from "@/lib/posts";

const mocks = vi.hoisted(() => ({
  chain: { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn() },
  from: vi.fn(), upload: vi.fn(), storageFrom: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: mocks.from, storage: { from: mocks.storageFrom },
} }));
beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mocks.chain).forEach(method => method.mockReturnValue(mocks.chain));
  mocks.chain.range.mockResolvedValue({ data: [], error: null });
  mocks.from.mockReturnValue(mocks.chain);
  mocks.storageFrom.mockReturnValue({ upload: mocks.upload });
  mocks.upload.mockResolvedValue({ error: null });
});
describe("promotional posts", () => {
  it("accepts promotional images and videos", () => {
    expect(validatePostFile({ type: "image/jpeg", size: 10 })).toEqual({ kind: "image", ext: "jpg" });
    expect(validatePostFile({ type: "video/mp4", size: 10 })).toEqual({ kind: "video", ext: "mp4" });
    expect(validatePostFile({ type: "video/webm", size: 10 })?.kind).toBe("video");
    expect(validatePostFile({ type: "text/html", size: 10 })).toBeNull();
  });
  it("enforces the 50 MB upload limit and refuses empty files", () => {
    expect(POST_MAX_BYTES).toBe(52428800);
    expect(validatePostFile({ type: "video/mp4", size: 52428800 })).not.toBeNull();
    expect(validatePostFile({ type: "video/mp4", size: 52428801 })).toBeNull();
    expect(validatePostFile({ type: "image/png", size: 0 })).toBeNull();
  });
  it("refuses uploads without a signed-in owner", async () => {
    await expect(uploadPostMedia(new File(["a"], "a.png", { type: "image/png" }), "")).rejects.toThrow();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("uploads media only under the account's folder", async () => {
    const media = await uploadPostMedia(new File(["a"], "a.png", { type: "image/png" }), "owner-a");
    expect(media.path).toMatch(/^owner-a\/.+\.png$/);
    expect(mocks.storageFrom).toHaveBeenCalledWith("post-media");
    expect(mocks.upload).toHaveBeenCalledWith(media.path, expect.any(File), { contentType: "image/png" });
  });
  it("only browses published posts in bounded pages", async () => {
    const options = feedOptions("store-a");
    await options.queryFn?.({ pageParam: 12 } as never);
    expect(mocks.from).toHaveBeenCalledWith("posts");
    expect(mocks.chain.eq).toHaveBeenCalledWith("is_published", true);
    expect(mocks.chain.eq).toHaveBeenCalledWith("store_id", "store-a");
    expect(mocks.chain.range).toHaveBeenCalledWith(12, 23);
  });
  it("isolates owner caches by account and store", () => {
    expect(ownerPostsOptions("store-a", "user-a").queryKey).toEqual(["owner-posts", "user-a", "store-a"]);
    expect(ownerPostsOptions("store-a", "user-b").queryKey).not.toEqual(ownerPostsOptions("store-a", "user-a").queryKey);
  });
});