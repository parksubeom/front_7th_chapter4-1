import { createStore } from "../lib/index.js";
import { PRODUCT_ACTIONS } from "./actionTypes.js";

/**
 * [추가] SSR 데이터 하이드레이션 헬퍼 함수
 * 브라우저 환경에서 window.__INITIAL_STATE__를 참조하여 초기 상태를 가져옵니다.
 */
const getHydratedInitialState = () => {
  // 서버에서만 존재하는 window 객체가 있는지 확인합니다.
  if (typeof window !== 'undefined' && window.__INITIAL_STATE__ && window.__INITIAL_STATE__.product) {
    
    const serverState = window.__INITIAL_STATE__.product;
    
    // [중요] 상태를 사용했으니, 다른 스토어의 중복 초기화를 막기 위해 해당 키를 제거합니다.
    delete window.__INITIAL_STATE__.product;

    return serverState;
  }
  // 서버 상태가 없거나 서버 환경일 경우 기본 초기 상태를 반환합니다.
  return initialProductState;
};


/**
 * 상품 스토어 초기 상태
 */
export const initialProductState = {
  // 상품 목록
  products: [],
  totalCount: 0,

  // 상품 상세
  currentProduct: null,
  relatedProducts: [],

  // 로딩 및 에러 상태
  loading: true,
  error: null,
  status: "idle",

  // 카테고리 목록
  categories: {},
};

/**
 * 상품 스토어 리듀서
 */
export const productReducer = (state, action) => {
  // ... (리듀서 로직은 변경 없이 그대로 유지) ...
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

/**
 * 상품 스토어 생성
 */
// [수정] initialProductState 대신 하이드레이션 함수 결과를 사용합니다.
export const productStore = createStore(productReducer, getHydratedInitialState());

// [추가] 디버깅 및 SSR 재주입을 위한 setState 메서드 (createStore에 구현되어야 함)
// 이 메서드는 main.js에서 불필요해졌지만, 만약 createStore가 setState를 노출한다면 유지합니다.
// productStore.setState = (newState) => { /* ... */ };