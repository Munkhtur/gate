import { beforeEach, describe, expect, it, vi } from "vitest";
import { savedIdsOptions, setProductSaved, wishlistOptions } from "@/lib/wishlist";

const mocks = vi.hoisted(() => {
  const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), upsert: vi.fn(), delete: vi.fn() };
  return { chain, from: vi.fn() };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));

describe("Wishlist account rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const method of Object.values(mocks.chain)) method.mockReturnValue(mocks.chain);
    mocks.chain.order.mockResolvedValue({ data: [], error: null });
    mocks.chain.upsert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue(mocks.chain);
  });
  it("keeps each account's saved query separate", () => {
    expect(savedIdsOptions("shopper-a").queryKey).toEqual(["wishlist-ids", "shopper-a"]);
    expect(savedIdsOptions("shopper-b").queryKey).not.toEqual(savedIdsOptions("shopper-a").queryKey);
  });
  it("saves a product once for the signed-in account", async () => {
    await setProductSaved("shopper-a", "product-a", true);
    expect(mocks.chain.upsert).toHaveBeenCalledWith({ user_id: "shopper-a", product_id: "product-a" }, { onConflict: "user_id,product_id", ignoreDuplicates: true });
  });
  it("removes only the requested account's product", async () => {
    await setProductSaved("shopper-a", "product-a", false);
    expect(mocks.chain.delete).toHaveBeenCalledOnce();
    expect(mocks.chain.eq).toHaveBeenNthCalledWith(1, "user_id", "shopper-a");
    expect(mocks.chain.eq).toHaveBeenNthCalledWith(2, "product_id", "product-a");
  });
  it("refuses saving without an account", async () => {
    await expect(setProductSaved("", "product-a", true)).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("lists only published products belonging to the current wishlist", async () => {
    const options = wishlistOptions("shopper-a");
    await options.queryFn?.({} as never);
    expect(mocks.chain.eq).toHaveBeenCalledWith("user_id", "shopper-a");
    expect(mocks.chain.eq).toHaveBeenCalledWith("products.is_published", true);
    expect(mocks.chain.select).toHaveBeenCalledWith("created_at, products!inner(*, stores(name))");
  });
});