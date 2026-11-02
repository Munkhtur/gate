import { MapPin } from "lucide-react";
import { useT } from "@/i18n";
import { getStoreLocation } from "@/lib/location";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StoreMap } from "@/components/StoreMap";

type Props = { name: string; address: string | null; lat: unknown; lng: unknown };

export function StoreLocationButton({ name, address, lat, lng }: Props) {
  const t = useT();
  const position = getStoreLocation(lat, lng);
  if (!position) return <p className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{address || t.maps.noLocation}</p>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="link" aria-label={t.maps.open} className="h-auto max-w-full justify-start gap-2 whitespace-normal p-0 text-left">
          <MapPin className="size-4 shrink-0" /><span className="min-w-0 break-words">{address || t.maps.title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t.maps.close} className="w-[calc(100%-2rem)] max-w-3xl rounded-lg p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription className="break-words">{address || t.maps.title}</DialogDescription>
        </DialogHeader>
        <StoreMap position={position} />
      </DialogContent>
    </Dialog>
  );
}