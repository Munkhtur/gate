import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { LocateFixed, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { DEFAULT_MAP_CENTER, type StoreLocation } from "@/lib/location";

type Props = {
  position: StoreLocation | null;
  onChange?: (position: StoreLocation) => void;
};

export function StoreMap({ position, onChange }: Props) {
  const t = useT();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const latest = useRef({ position, onChange, markerLabel: t.maps.marker });
  latest.current = { position, onChange, markerLabel: t.maps.marker };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    setReady(false);
    setFailed(false);
    setTileError(false);
    void import("leaflet").then((L) => {
      if (cancelled) return;
      const center = latest.current.position ?? DEFAULT_MAP_CENTER;
      const instance = L.map(element, {
        center, zoom: latest.current.position ? 16 : 12,
        zoomControl: false, scrollWheelZoom: false,
      });
      map.current = instance;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      }).on("tileerror", () => { if (!cancelled) setTileError(true); }).addTo(instance);
      if (latest.current.onChange) {
        instance.on("click", (event) => latest.current.onChange?.({
          lat: Number(event.latlng.lat.toFixed(6)),
          lng: Number(event.latlng.wrap().lng.toFixed(6)),
        }));
      }
      observer = new ResizeObserver(() => instance.invalidateSize());
      observer.observe(element);
      setReady(true);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void import("leaflet").then((L) => {
      const instance = map.current;
      if (cancelled || !instance) return;
      if (!position) {
        marker.current?.remove();
        marker.current = null;
        return;
      }
      if (marker.current) {
        marker.current.setLatLng(position);
      } else {
        marker.current = L.marker(position, {
          draggable: Boolean(latest.current.onChange),
          title: latest.current.markerLabel,
          alt: latest.current.markerLabel,
          icon: L.divIcon({ className: "store-map-pin", html: '<span class="store-map-pin-dot"></span>', iconSize: [28, 36], iconAnchor: [14, 36] }),
        }).addTo(instance);
        marker.current.on("dragend", () => {
          const point = marker.current?.getLatLng().wrap();
          if (point) latest.current.onChange?.({ lat: Number(point.lat.toFixed(6)), lng: Number(point.lng.toFixed(6)) });
        });
      }
      instance.panTo(position);
    });
    return () => { cancelled = true; };
  }, [position?.lat, position?.lng, ready]);

  return (
    <div className="store-map relative isolate h-80 overflow-hidden rounded-lg border border-border bg-muted" role="region" aria-label={onChange ? t.maps.picker : t.maps.title}>
      <div ref={container} className="h-full w-full" />
      {!ready && <div className="absolute inset-0 z-[500] flex items-center justify-center gap-3 bg-muted text-sm text-muted-foreground" role="status">
        {failed ? t.maps.unavailable : t.browse.loading}
        {failed && <Button type="button" size="icon" variant="outline" aria-label={t.wishlist.retry} title={t.wishlist.retry} onClick={() => setAttempt((value) => value + 1)}><RotateCcw className="size-4" /></Button>}
      </div>}
      {ready && <div className="absolute right-3 top-3 z-[500] flex flex-col gap-1">
        <Button type="button" variant="outline" size="icon" aria-label={t.maps.zoomIn} title={t.maps.zoomIn} onClick={() => map.current?.zoomIn()}><Plus className="size-4" /></Button>
        <Button type="button" variant="outline" size="icon" aria-label={t.maps.zoomOut} title={t.maps.zoomOut} onClick={() => map.current?.zoomOut()}><Minus className="size-4" /></Button>
        <Button type="button" variant="outline" size="icon" aria-label={t.maps.center} title={t.maps.center} onClick={() => map.current?.setView(position ?? DEFAULT_MAP_CENTER, position ? 16 : 12)}><LocateFixed className="size-4" /></Button>
      </div>}
      {tileError && <div role="status" className="absolute bottom-7 left-3 right-3 z-[500] flex items-center justify-between gap-2 rounded-md bg-background p-2 text-sm text-muted-foreground">
        {t.maps.unavailable}
        <Button type="button" variant="ghost" size="icon" aria-label={t.wishlist.retry} title={t.wishlist.retry} onClick={() => setAttempt((value) => value + 1)}><RotateCcw className="size-4" /></Button>
      </div>}
    </div>
  );
}