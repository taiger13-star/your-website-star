import { createContext, useContext, type ReactNode } from "react";

import type { CatalogSnapshot, PublicProduct } from "@/server/catalog-service";

type CatalogContextValue = CatalogSnapshot & {
  productById: (id: string) => PublicProduct | undefined;
  collectionById: (id: string | null) => CatalogSnapshot["collections"][number] | undefined;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  data,
  children,
}: {
  data: CatalogSnapshot;
  children: ReactNode;
}) {
  const value: CatalogContextValue = {
    ...data,
    productById: (id) => data.products.find((product) => product.id === id),
    collectionById: (id) => data.collections.find((collection) => collection.id === id),
  };
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}

export function minimumPrice(product: PublicProduct) {
  return Math.min(...product.variants.map((variant) => variant.price));
}
