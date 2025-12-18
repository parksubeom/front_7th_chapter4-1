import { useStore, type createStore } from "@hanghae-plus/lib";
import { createContext, useContext } from "react";
import type { initialProductState } from "../productStore";

export type ProductStore = ReturnType<typeof createStore<typeof initialProductState, unknown>>;

export const ProductStoreContext = createContext<ProductStore | null>(null);

export const useProductStoreContext = () => {
  const productStore = useContext(ProductStoreContext);
  if (!productStore) {
    throw new Error("ProductStoreContext not found");
  }
  return productStore;
};

export const useProductStore = () => {
  const productStore = useProductStoreContext();
  return useStore(productStore);
};
