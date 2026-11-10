// Enlaces para que el repartidor abra la ruta a la entrega en Google Maps o en Waze. Con el pin que el
// cliente confirmó en el checkout van a la ubicación exacta; si no hay pin, a la dirección escrita.

type ShippingAddress = {
  shippingStreet: string;
  shippingNeighborhood: string;
  shippingPostalCode: string;
  shippingCity: string;
  shippingState: string;
  shippingLat: number | null;
  shippingLng: number | null;
};

export function directionLinks(order: ShippingAddress) {
  const exact = order.shippingLat !== null && order.shippingLng !== null;
  const coords = exact ? `${order.shippingLat},${order.shippingLng}` : null;
  const text = [
    order.shippingStreet,
    order.shippingNeighborhood,
    order.shippingPostalCode,
    order.shippingCity,
    order.shippingState,
    "México",
  ].join(", ");
  return {
    exact,
    google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords ?? text)}`,
    waze: coords
      ? `https://waze.com/ul?ll=${encodeURIComponent(coords)}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(text)}&navigate=yes`,
  };
}
