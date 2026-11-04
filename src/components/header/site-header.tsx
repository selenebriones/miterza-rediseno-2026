import { getAnnouncement, getHeaderNavigation, getMenuProducts } from "@/lib/navigation";
import { getPopularCategories } from "@/lib/search";
import { AnnouncementBar } from "./announcement-bar";
import { HeaderBar } from "./header-bar";

export async function SiteHeader() {
  const [navigation, announcement, popularCategories] = await Promise.all([
    getHeaderNavigation(),
    getAnnouncement(),
    getPopularCategories(),
  ]);
  // Productos de cada línea (o categoría sin líneas) para las tarjetas del mega menú.
  const menuProducts = await getMenuProducts(
    navigation.main
      .flatMap((item) => (item.children?.length ? item.children.map((c) => c.categorySlug) : [item.categorySlug]))
      .filter((slug): slug is string => Boolean(slug)),
  );

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-toast rounded-pill bg-white px-4 py-2 font-semibold text-brand focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <AnnouncementBar announcement={announcement} links={navigation.top} />
      <HeaderBar
        main={navigation.main}
        secondary={navigation.top}
        popularCategories={popularCategories}
        menuProducts={menuProducts}
      />
    </>
  );
}
