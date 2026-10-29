// Tipos de la búsqueda del header. Sin dependencias de servidor: los usan los componentes de cliente.

export type SearchProduct = {
  slug: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string | null;
};

export type SearchCategory = {
  slug: string;
  name: string;
  href: string;
};

export type SearchResults = {
  products: SearchProduct[];
  categories: SearchCategory[];
};
