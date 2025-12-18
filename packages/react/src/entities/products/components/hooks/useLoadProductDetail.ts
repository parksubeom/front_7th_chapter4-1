import { useEffect } from "react";
import { useRouterParams } from "../../../../router";
import { useProductStoreContext } from "../../hooks";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);
  const productStore = useProductStoreContext();

  useEffect(() => {
    if (productId) {
      loadProductDetailForPage(productStore, productId);
    }
  }, [productStore, productId]);
};
