// Coordenadas del pin del mapa (checkout y libreta de direcciones): números dentro del recuadro de
// México, con 6 decimales (~10 cm). Fuera de México o mal formadas se ignoran.
export function parseLocation(rawLat: FormDataEntryValue | null, rawLng: FormDataEntryValue | null) {
  if (rawLat === null || rawLng === null || rawLat === "" || rawLng === "") return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  const inMexico = lat >= 14 && lat <= 33 && lng >= -119 && lng <= -86;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inMexico) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}
