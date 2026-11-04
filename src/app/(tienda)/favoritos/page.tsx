import type { Metadata } from "next";
import { WishlistPage } from "@/components/wishlist/wishlist-page";

export const metadata: Metadata = {
  title: "Favoritos | Mi Terza",
  robots: { index: false, follow: true },
};

// La lista vive en el navegador (localStorage); la página solo pide los productos por slug.
export default function FavoritesRoute() {
  return <WishlistPage />;
}
