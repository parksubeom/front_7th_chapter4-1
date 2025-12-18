import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { useProductStoreContext } from "../../hooks";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const productStore = useProductStoreContext();
  const { search, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  useEffect(() => {
    loadProducts(productStore, { search, limit, sort, category1, category2 }, true);
  }, [productStore, search, limit, sort, category1, category2]);

  return {
    searchQuery: search,
    limit,
    sort,
    category,
  };
};
