import { createStore } from "@hanghae-plus/lib";
import type { Categories, Product } from "./types";

export const PRODUCT_ACTIONS = {
  // 상품 목록
  SET_PRODUCTS: "products/setProducts",
  ADD_PRODUCTS: "products/addProducts", // 무한스크롤용
  SET_LOADING: "products/setLoading",
  SET_ERROR: "products/setError",

  // 카테고리
  SET_CATEGORIES: "products/setCategories",

  // 상품 상세
  SET_CURRENT_PRODUCT: "products/setCurrentProduct",
  SET_RELATED_PRODUCTS: "products/setRelatedProducts",

  // 리셋
  RESET_FILTERS: "products/resetFilters",
  SETUP: "products/setup",

  // status 관리
  SET_STATUS: "products/setStatus",
} as const;

/**
 * 상품 스토어 초기 상태
 */
export const initialProductState = {
  // 상품 목록
  products: [] as Product[],
  totalCount: 0,

  // 상품 상세
  currentProduct: null as Product | null,
  relatedProducts: [] as Product[],

  // 로딩 및 에러 상태
  loading: true,
  error: null as string | null,
  status: "idle",

  // 카테고리 목록
  categories: {} as Categories,
};

/**
 * 상품 스토어 리듀서
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const productReducer = (state: typeof initialProductState, action: any) => {
  switch (action.type) {
    case PRODUCT_ACTIONS.SET_STATUS:
      return {
        ...state,
        status: action.payload,
      };

    case PRODUCT_ACTIONS.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
        loading: false,
        error: null,
        status: "done",
      };

    case PRODUCT_ACTIONS.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload.products,
        totalCount: action.payload.totalCount,
        loading: false,
        error: null,
        status: "done",
      };

    case PRODUCT_ACTIONS.ADD_PRODUCTS:
      return {
        ...state,
        products: [...state.products, ...action.payload.products],
        totalCount: action.payload.totalCount,
        loading: false,
        error: null,
        status: "done",
      };

    case PRODUCT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case PRODUCT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        status: "done",
      };

    case PRODUCT_ACTIONS.SET_CURRENT_PRODUCT:
      return {
        ...state,
        currentProduct: action.payload,
        loading: false,
        error: null,
        status: "done",
      };

    case PRODUCT_ACTIONS.SET_RELATED_PRODUCTS:
      return {
        ...state,
        relatedProducts: action.payload,
        status: "done",
      };

    case PRODUCT_ACTIONS.SETUP:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

export const createProductStore = (initState: typeof initialProductState) => {
  return createStore(productReducer, { ...initialProductState, ...initState });
};
