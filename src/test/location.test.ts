import { describe, expect, it } from "vitest";
import { getStoreLocation } from "@/lib/location";

describe("store map coordinates", () => {
  it("keeps a store's chosen coordinates without replacing them with a default", () => {
    expect(getStoreLocation("47.920123", "106.910456")).toEqual({ lat: 47.920123, lng: 106.910456 });
    expect(getStoreLocation(0, 0)).toEqual({ lat: 0, lng: 0 });
  });
  it("requires both coordinates and never turns blanks into zero", () => {
    for (const pair of [[null, null], ["", ""], [" ", 106], [47, null], [null, 106], [47, ""]]) {
      expect(getStoreLocation(...pair as [unknown, unknown])).toBeNull();
    }
  });
  it("rejects non-finite values and positions outside geographic bounds", () => {
    for (const pair of [[91, 106], [-91, 106], [47, 181], [47, -181], [NaN, 106], [47, Infinity], ["bad", 106]]) {
      expect(getStoreLocation(...pair as [unknown, unknown])).toBeNull();
    }
    expect(getStoreLocation(-90, -180)).toEqual({ lat: -90, lng: -180 });
    expect(getStoreLocation(90, 180)).toEqual({ lat: 90, lng: 180 });
  });
});