import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PostFeed } from "@/components/PostFeed";

const mocks = vi.hoisted(() => ({ fetchNextPage: vi.fn(), feed: {} as Record<string, unknown> }));
vi.mock("@tanstack/react-query", () => ({ useInfiniteQuery: () => mocks.feed }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock("@/lib/posts", () => ({ feedOptions: vi.fn(), usePostUrls: () => ({ data: {}, isPending: false }) }));
vi.mock("@/i18n", () => ({ useLocale: () => "mn", useT: () => ({ posts: { title: "Posts", previous: "Previous", next: "Next" }, browse: {}, wishlist: {}, auth: {} }) }));

beforeEach(() => {
  mocks.fetchNextPage.mockReset();
  mocks.feed = {
    data: { pages: [["first", "clicked", "third"].map(id => ({ id, media_path: id, media_type: "image", caption: id, store_id: "store", stores: { name: "Store" } }))] },
    hasNextPage: false, isFetchingNextPage: false, fetchNextPage: mocks.fetchNextPage,
  };
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
    return this.id === "clicked" ? 600 : this.id === "third" ? 1200 : 0;
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("opens the clicked post instead of the first and does not reset subsequent scrolling", async () => {
  const { container, rerender } = render(<PostFeed initialPostId="clicked" />);
  const scroller = container.querySelector(".post-feed");
  expect(scroller).not.toBeNull();
  await waitFor(() => expect(scroller?.scrollTop).toBe(600));
  if (!scroller) throw new Error("Missing feed");
  scroller.scrollTop = 1200;
  rerender(<PostFeed initialPostId="clicked" />);
  expect(scroller.scrollTop).toBe(1200);
  rerender(<PostFeed initialPostId="third" />);
  await waitFor(() => expect(scroller.scrollTop).toBe(1200));
});

it("loads another published page when the selected post is not loaded yet", async () => {
  mocks.feed["hasNextPage"] = true;
  render(<PostFeed initialPostId="older-post" />);
  await waitFor(() => expect(mocks.fetchNextPage).toHaveBeenCalled());
});