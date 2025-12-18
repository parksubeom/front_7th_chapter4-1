import { getCategories, getProduct, getProducts } from "../api/productApi.js";
import { initialProductState, productStore, PRODUCT_ACTIONS } from "../stores/index.js";
import { router } from "../router/router.js";

/**
 * [ISOMORPHIC] 상품 목록 및 카테고리 로드
 */
export const loadProductsAndCategories = async (serverQuery = null, serverStore = null) => {
  const targetStore = serverStore || productStore;
  let targetQuery;

  if (serverQuery) {
    targetQuery = { ...serverQuery, current: undefined };
  } else {
    // [수정] CSR에서는 현재 라우터의 쿼리(URL 파라미터)를 그대로 사용해야 합니다.
    // 강제로 router.query = {} 로 초기화하면 필터 정보가 날아갑니다.
    targetQuery = router.query;
  }

  targetStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: { ...initialProductState, loading: true, status: "pending" },
  });

  try {
    const [
      {
        products,
        pagination: { total },
      },
      categories,
    ] = await Promise.all([getProducts(targetQuery), getCategories()]);

    targetStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { products, categories, totalCount: total, loading: false, status: "done" },
    });
  } catch (error) {
    targetStore.dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
    throw error;
  }
};

/**
 * [CSR] 상품 목록 로드 (새로고침)
 */
export const loadProducts = async (resetList = true) => {
  try {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { loading: true, status: "pending", error: null },
    });

    const {
      products,
      pagination: { total },
    } = await getProducts(router.query);
    const payload = { products, totalCount: total };

    if (resetList) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SET_PRODUCTS, payload });
    } else {
      productStore.dispatch({ type: PRODUCT_ACTIONS.ADD_PRODUCTS, payload });
    }
  } catch (error) {
    productStore.dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
    throw error;
  }
};

/**
 * [CSR] 더보기 (무한 스크롤)
 */
export const loadMoreProducts = async () => {
  const state = productStore.getState();
  const hasMore = state.products.length < state.totalCount;

  if (!hasMore || state.loading) return;

  router.query = { ...router.query, current: Number(router.query.current ?? 1) + 1 };
  await loadProducts(false);
};

/**
 * 쿼리 파라미터를 업데이트하고 URL을 변경하는 내부 유틸리티
 */
const updateQuery = (newParams) => {
  const currentQuery = router.query || {};
  const mergedQuery = { ...currentQuery, ...newParams };

  const searchParams = new URLSearchParams();
  Object.entries(mergedQuery).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  router.push(`/?${searchParams.toString()}`);
};

export const searchProducts = (search) => {
  updateQuery({ search, current: 1 });
};

export const setCategory = (categoryData) => {
  updateQuery({ ...categoryData, current: 1 });
};

export const setSort = (sort) => {
  updateQuery({ sort, current: 1 });
};

export const setLimit = (limit) => {
  updateQuery({ limit, current: 1 });
};

/**
 * [ISOMORPHIC] 상품 상세 페이지 로드
 */
export const loadProductDetailForPage = async (productId, serverStore = null) => {
  const targetStore = serverStore || productStore;

  try {
    const currentProduct = targetStore.getState().currentProduct;
    if (!serverStore && productId === currentProduct?.productId) {
      if (currentProduct.category2) {
        await loadRelatedProducts(currentProduct.category2, productId, targetStore);
      }
      return;
    }

    targetStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { ...initialProductState, currentProduct: null, loading: true, status: "pending" },
    });

    const product = await getProduct(productId);

    targetStore.dispatch({ type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, payload: product });

    if (product.category2) {
      await loadRelatedProducts(product.category2, productId, targetStore);
    }
  } catch (error) {
    targetStore.dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
    throw error;
  }
};

export const loadRelatedProducts = async (category2, excludeProductId, serverStore = null) => {
  const targetStore = serverStore || productStore;
  try {
    const params = { category2, limit: 20, page: 1 };
    const response = await getProducts(params);
    const relatedProducts = response.products.filter((p) => p.productId !== excludeProductId);

    targetStore.dispatch({ type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS, payload: relatedProducts });
  } catch (error) {
    targetStore.dispatch({ type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS, payload: [] });
    console.log(error);
  }
};
