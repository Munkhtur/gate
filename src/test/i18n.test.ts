import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, swapLocaleInPath } from "@/i18n";

describe("i18n", () => {
  it("defaults to Mongolian", () => {
    expect(DEFAULT_LOCALE).toBe("mn");
  });
  it("switches language without losing the current page", () => {
    expect(swapLocaleInPath("/mn/account", "zh")).toBe("/zh/account");
    expect(swapLocaleInPath("/zh", "mn")).toBe("/mn");
  });
});
