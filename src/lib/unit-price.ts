// Pisos: se venden por caja. El precio guardado es el de la caja y aquí se convierte a precio por m².
// Sin m² por caja (el resto de productos) el precio se muestra tal cual.

const areaFormat = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });

export const formatArea = (area: number) => areaFormat.format(area);

export const pricePerArea = (price: number, areaPerBox: number | null) =>
  areaPerBox ? Math.round((price / areaPerBox) * 100) / 100 : price;

// Texto de la línea en el carrito: "Caja de 2.42 m²".
export const boxLabel = (areaPerBox: number) => `Caja de ${formatArea(areaPerBox)} m²`;
