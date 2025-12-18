import { ProductStoreContext, type ProductStore } from "./hooks";

interface Props {
  productStore: ProductStore;
  children: React.ReactNode;
}

export const ProductProvider = ({ children, productStore }: Props) => {
  return <ProductStoreContext value={productStore}>{children}</ProductStoreContext>;
};
