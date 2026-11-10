"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { CrosshairIcon, Loader2Icon, MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Mapa del checkout (OpenStreetMap + Leaflet, sin llave): el cliente confirma la ubicación exacta de su
// entrega. El pin se coloca solo con la dirección escrita (búsqueda de Nominatim) y se puede arrastrar,
// mover tocando el mapa o llevar a la ubicación actual del teléfono. Es opcional: si no hay pin, el
// pedido se guarda solo con la dirección escrita. Las coordenadas viajan en los campos ocultos lat/lng.

export type AddressQuery = { street: string; neighborhood: string; postalCode: string; city: string; state: string };
type Point = { lat: number; lng: number };
type Status = "idle" | "searching" | "found" | "not-found" | "manual" | "locating" | "geo-error";

const MEXICO_CENTER: Point = { lat: 23.6, lng: -102.5 };
const STREET_ZOOM = 17;

// Pin en los colores de la marca, dibujado con SVG (los íconos de imagen de Leaflet no cargan con el bundler).
export const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42"><path d="M16 1C8 1 1.5 7.4 1.5 15.3 1.5 26 16 41 16 41s14.5-15 14.5-25.7C30.5 7.4 24 1 16 1Z" fill="#00514a" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15.5" r="5.5" fill="#c2e812"/></svg>`;

// Busca la dirección en Nominatim (servicio gratuito de OpenStreetMap). Primero con los campos por
// separado; si no encuentra, con la dirección completa en un solo texto.
async function geocode(address: AddressQuery, signal: AbortSignal): Promise<Point | null> {
  const base = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=mx&accept-language=es";
  const structured = new URLSearchParams({ street: address.street, city: address.city, state: address.state });
  if (address.postalCode) structured.set("postalcode", address.postalCode);
  const freeText = new URLSearchParams({
    q: [address.street, address.neighborhood, address.postalCode, address.city, address.state, "México"]
      .filter(Boolean)
      .join(", "),
  });
  for (const params of [structured, freeText]) {
    const res = await fetch(`${base}&${params}`, { signal });
    if (!res.ok) continue;
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    if (hit) return { lat: Number(hit.lat), lng: Number(hit.lon) };
  }
  return null;
}

const ready = (a: AddressQuery) => Boolean(a.street.trim() && a.state && (a.city.trim() || a.postalCode.trim()));

export function LocationMap({ address, initial }: { address: AddressQuery; initial?: Point | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const movedByHand = useRef(Boolean(initial));
  const [point, setPoint] = useState<Point | null>(initial ?? null);
  const [status, setStatus] = useState<Status>(initial ? "manual" : "idle");

  // Coloca (o mueve) el pin y centra el mapa.
  const placeRef = useRef<(p: Point, zoom?: number) => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      const start = initial ?? MEXICO_CENTER;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [start.lat, start.lng],
        initial ? STREET_ZOOM : 5,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const icon = L.divIcon({ html: PIN_SVG, className: "", iconSize: [32, 42], iconAnchor: [16, 41] });

      placeRef.current = (p, zoom) => {
        if (!markerRef.current) {
          markerRef.current = L.marker([p.lat, p.lng], { icon, draggable: true, keyboard: true, title: "Tu entrega" })
            .addTo(map)
            .on("dragend", () => {
              const { lat, lng } = markerRef.current!.getLatLng();
              movedByHand.current = true;
              setPoint({ lat, lng });
              setStatus("manual");
            });
        } else {
          markerRef.current.setLatLng([p.lat, p.lng]);
        }
        map.setView([p.lat, p.lng], zoom ?? Math.max(map.getZoom(), STREET_ZOOM));
        setPoint(p);
      };
      if (initial) placeRef.current(initial, STREET_ZOOM);

      // Tocar el mapa también mueve el pin.
      map.on("click", (event) => {
        movedByHand.current = true;
        placeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }, map.getZoom());
        setStatus("manual");
      });
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // El mapa se crea una sola vez; `initial` solo cuenta al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Con la dirección completa, se ubica sola (salvo que el cliente ya haya movido el pin).
  const query = JSON.stringify(address);
  useEffect(() => {
    if (movedByHand.current || !ready(address)) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("searching");
      try {
        const found = await geocode(address, controller.signal);
        if (found) {
          placeRef.current(found, STREET_ZOOM);
          setStatus("found");
        } else {
          setStatus("not-found");
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("not-found");
      }
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `query` resume la dirección: solo se busca cuando cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) return setStatus("geo-error");
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        movedByHand.current = true;
        placeRef.current({ lat: coords.latitude, lng: coords.longitude }, STREET_ZOOM);
        setStatus("manual");
      },
      () => setStatus("geo-error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const message: Record<Status, string> = {
    idle: "Escribe tu dirección y la ubicaremos en el mapa.",
    searching: "Buscando tu dirección en el mapa…",
    found: "Ubicamos tu dirección. Si el pin no está en tu puerta, arrástralo o toca el mapa.",
    "not-found": "No encontramos tu dirección en el mapa. Toca el mapa o arrastra el pin hasta tu ubicación.",
    manual: "Listo, guardaremos esta ubicación para tu entrega.",
    locating: "Buscando tu ubicación actual…",
    "geo-error": "No pudimos obtener tu ubicación. Revisa el permiso de ubicación o mueve el pin a mano.",
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <p className="text-[0.9375rem] font-medium text-heading">
          Ubicación en el mapa <span className="font-normal text-muted-foreground">(opcional)</span>
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          <CrosshairIcon className="size-4" aria-hidden="true" />
          Usar mi ubicación actual
        </button>
      </div>
      {/* isolate: los paneles de Leaflet usan z-index altos y no deben pasar encima del encabezado. */}
      <div
        ref={containerRef}
        role="application"
        aria-label="Mapa para confirmar la ubicación de tu entrega"
        className="isolate h-72 w-full overflow-hidden rounded-card border border-input bg-surface"
      />
      <p
        aria-live="polite"
        className={cn(
          "mt-2 flex items-start gap-1.5 text-sm",
          status === "not-found" || status === "geo-error" ? "text-warning" : "text-muted-foreground",
        )}
      >
        {status === "searching" || status === "locating" ? (
          <Loader2Icon className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <MapPinIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
        )}
        {message[status]}
      </p>
      {point && (
        <>
          <input type="hidden" name="lat" value={point.lat.toFixed(6)} />
          <input type="hidden" name="lng" value={point.lng.toFixed(6)} />
        </>
      )}
    </div>
  );
}
