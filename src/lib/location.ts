export type StoreLocation = { lat: number; lng: number };

// A viewing fallback, never saved as a store's location.
export const DEFAULT_MAP_CENTER: StoreLocation = { lat: 47.9185, lng: 106.9177 };

export function getStoreLocation(lat: unknown, lng: unknown): StoreLocation | null {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  if (typeof lat !== "number" && typeof lat !== "string") return null;
  if (typeof lng !== "number" && typeof lng !== "string") return null;
  if (String(lat).trim() === "" || String(lng).trim() === "") return null;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { lat: latitude, lng: longitude };
}