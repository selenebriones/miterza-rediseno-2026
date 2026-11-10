"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { PIN_SVG } from "./location-map";

// Mapa de solo lectura con el pin de la entrega (confirmación del pedido). Sin arrastre ni zoom con la
// rueda: solo muestra dónde quedó la ubicación que el cliente confirmó en el checkout.
export function PinMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        zoomControl: false,
      }).setView([lat, lng], 16);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const icon = L.divIcon({ html: PIN_SVG, className: "", iconSize: [32, 42], iconAnchor: [16, 41] });
      L.marker([lat, lng], { icon, interactive: false }).addTo(map);
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Mapa con la ubicación de tu entrega"
      className={`isolate overflow-hidden rounded-card bg-white ${className ?? ""}`}
    />
  );
}
