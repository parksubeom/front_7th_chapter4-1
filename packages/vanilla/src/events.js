// packages/vanilla/src/events.js

import { addEvent, isNearBottom } from "./utils/index.js";
import { router } from "./router/index.js";
import {
  addToCart,
  clearCart,
  deselectAllCart,
  loadMoreProducts,
  loadProducts,
  removeFromCart,
  removeSelectedFromCart,
  searchProducts,
  selectAllCart,
  setCategory,
  setLimit,
  setSort,
  toggleCartSelect,
  updateCartQuantity,
} from "./services/index.js";
import { productStore, uiStore, UI_ACTIONS } from "./stores/index.js";

/**
 * 상품 관련 이벤트 등록
 */
export function registerProductEvents() {
  // 검색 입력 (Enter 키)
  addEvent("keydown", "#search-input", async (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      try {
        await searchProducts(query);
      } catch (error) {
        console.error("검색 실패:", error);
      }
    }
  });

  // 페이지당 상품 수 변경
  addEvent("change", "#limit-select", async (e) => {
    const limit = parseInt(e.target.value);
    try {
      await setLimit(limit);
    } catch (error) {
      console.error("상품 수 변경 실패:", error);
    }
  });

  // 정렬 변경
  addEvent("change", "#sort-select", async (e) => {
    const sort = e.target.value;
    try {
      await setSort(sort);
    } catch (error) {
      console.error("정렬 변경 실패:", error);
    }
  });

  // 검색 조건 초기화
  addEvent("click", "#clear-search", async () => {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.value = "";
    }
    try {
      await searchProducts("");
    } catch (error) {
      console.error("검색 초기화 실패:", error);
    }
  });

  // [메인 페이지] 브레드크럼 카테고리 네비게이션
  addEvent("click", "[data-breadcrumb]", async (e) => {
    const breadcrumbType = e.target.getAttribute("data-breadcrumb");
    try {
      if (breadcrumbType === "reset") {
        await setCategory({ category1: "", category2: "" });
      } else if (breadcrumbType === "category1") {
        const category1 = e.target.getAttribute("data-category1");
        await setCategory({ category1, category2: "" });
      }
    } catch (error) {
      console.error("브레드크럼 네비게이션 실패:", error);
    }
  });

  // 1depth 카테고리 선택
  addEvent("click", ".category1-filter-btn", async (e) => {
    const category1 = e.target.getAttribute("data-category1");
    if (!category1) return;
    try {
      await setCategory({ category1, category2: "" });
    } catch (error) {
      console.error("1depth 카테고리 선택 실패:", error);
    }
  });

  // 2depth 카테고리 선택
  addEvent("click", ".category2-filter-btn", async (e) => {
    const category1 = e.target.getAttribute("data-category1");
    const category2 = e.target.getAttribute("data-category2");
    if (!category1 || !category2) return;
    try {
      await setCategory({ category1, category2 });
    } catch (error) {
      console.error("2depth 카테고리 선택 실패:", error);
    }
  });

  // 재시도 버튼
  addEvent("click", "#retry-btn", async () => {
    try {
      await loadProducts(true);
    } catch (error) {
      console.error("재시도 실패:", error);
    }
  });
}

/**
 * 상품 상세 페이지 관련 이벤트 등록
 */
export function registerProductDetailEvents() {
  // 상품 클릭 -> 상세 페이지 이동
  addEvent("click", ".product-image, .product-info", async (e) => {
    const productCard = e.target.closest(".product-card");
    if (!productCard) return;

    const productId = productCard.getAttribute("data-product-id");
    if (productId) {
      router.push(`/product/${productId}/`);
    }
  });

  // 관련 상품 클릭 -> 상세 페이지 이동
  addEvent("click", ".related-product-card", async (e) => {
    const target = e.target.closest("[data-product-id]");
    if (target && target.dataset.productId) {
      router.push(`/product/${target.dataset.productId}/`);
    }
  });

  // [수정됨] 상세 페이지 브레드크럼 클릭 -> 목록 페이지 이동
  addEvent("click", ".breadcrumb-link", async (e) => {
    e.preventDefault();
    const btn = e.target.closest(".breadcrumb-link");
    if (!btn) return;

    try {
      const { category1, category2 } = btn.dataset;

      // 1. URLSearchParams 생성
      const params = new URLSearchParams();

      // 2. [핵심] current=1을 가장 먼저 추가하여 쿼리 스트링 맨 앞에 오게 함
      params.append("current", "1");

      // 3. 그 다음 카테고리 정보 추가
      if (category1) params.append("category1", category1);
      if (category2) params.append("category2", category2);

      // 4. 이동 (결과 예: /?current=1&category1=...&category2=...)
      router.push(`/?${params.toString()}`);
    } catch (error) {
      console.error("브레드크럼 카테고리 필터 실패:", error);
    }
  });

  // 목록으로 돌아가기 버튼
  addEvent("click", ".go-to-product-list", async () => {
    const product = productStore.getState().currentProduct;

    // 1. URLSearchParams 생성
    const params = new URLSearchParams();

    // 2. [핵심] current=1을 가장 먼저 추가
    params.append("current", "1");

    // 3. 그 다음 카테고리 정보 추가
    if (product?.category1) params.append("category1", product.category1);
    if (product?.category2) params.append("category2", product.category2);

    // 4. 이동
    router.push(`/?${params.toString()}`);
  });

  // 수량 조절
  addEvent("click", "#quantity-increase", () => {
    const input = document.getElementById("quantity-input");
    if (input) {
      const max = parseInt(input.getAttribute("max")) || 100;
      input.value = Math.min(max, parseInt(input.value) + 1);
    }
  });

  addEvent("click", "#quantity-decrease", () => {
    const input = document.getElementById("quantity-input");
    if (input) {
      input.value = Math.max(1, parseInt(input.value) - 1);
    }
  });

  // 장바구니 담기
  addEvent("click", "#add-to-cart-btn", (e) => {
    const productId = e.target.getAttribute("data-product-id");
    const quantityInput = document.getElementById("quantity-input");
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    if (!productId) return;
    const product = productStore.getState().currentProduct;
    if (product) {
      addToCart(product, quantity);
    }
  });
}

/**
 * 장바구니 관련 이벤트 등록
 */
export function registerCartEvents() {
  addEvent("click", ".add-to-cart-btn", async (e) => {
    const productId = e.target.getAttribute("data-product-id");
    if (!productId) return;
    const product = productStore.getState().products.find((p) => p.productId === productId);
    if (product) {
      addToCart(product, 1);
    }
  });

  addEvent("click", ".quantity-increase-btn", (e) => {
    const target = e.target.closest("[data-product-id]");
    const productId = target.getAttribute("data-product-id");
    const quantityInput = target.previousElementSibling;
    if (productId && quantityInput) {
      const newQuantity = parseInt(quantityInput.value) + 1;
      quantityInput.value = newQuantity;
      updateCartQuantity(productId, newQuantity);
    }
  });

  addEvent("click", ".quantity-decrease-btn", (e) => {
    const target = e.target.closest("[data-product-id]");
    const productId = target.getAttribute("data-product-id");
    const quantityInput = target.nextElementSibling;
    if (productId && quantityInput) {
      const newQuantity = Math.max(1, parseInt(quantityInput.value) - 1);
      quantityInput.value = newQuantity;
      updateCartQuantity(productId, newQuantity);
    }
  });

  addEvent("change", ".quantity-input", (e) => {
    const productId = e.target.closest("[data-product-id]");
    const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
    if (productId) {
      updateCartQuantity(productId, newQuantity);
    }
  });

  addEvent("change", ".cart-item-checkbox", (e) => {
    const productId = e.target.getAttribute("data-product-id");
    if (productId) toggleCartSelect(productId);
  });

  addEvent("change", "#select-all-checkbox", (e) => {
    if (e.target.checked) selectAllCart();
    else deselectAllCart();
  });

  addEvent("click", ".cart-item-remove-btn", (e) => {
    const productId = e.target.getAttribute("data-product-id");
    if (productId) removeFromCart(productId);
  });

  addEvent("click", "#remove-selected-btn", removeSelectedFromCart);
  addEvent("click", "#clear-cart-btn", clearCart);
}

/**
 * 장바구니 모달 이벤트
 */
export function registerCartModalEvents() {
  addEvent("click", "#cart-icon-btn", () => {
    uiStore.dispatch({ type: UI_ACTIONS.OPEN_CART_MODAL });
  });

  addEvent("click", "#cart-modal-close-btn, .cart-modal-overlay", () => {
    uiStore.dispatch({ type: UI_ACTIONS.CLOSE_CART_MODAL });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (uiStore.getState().cartModal.isOpen) {
        uiStore.dispatch({ type: UI_ACTIONS.CLOSE_CART_MODAL });
      }
    }
  });

  addEvent("change", "#cart-modal-select-all-checkbox", (e) => {
    if (e.target.checked) selectAllCart();
    else deselectAllCart();
  });

  addEvent("click", "#cart-modal-remove-selected-btn", () => removeSelectedFromCart());
  addEvent("click", "#cart-modal-clear-cart-btn", clearCart);

  addEvent("click", "#cart-modal-checkout-btn", () => {
    uiStore.dispatch({
      type: UI_ACTIONS.SHOW_TOAST,
      payload: { message: "구매 기능은 추후 구현 예정입니다.", type: "info" },
    });
  });
}

/**
 * 무한 스크롤 이벤트
 */
export function registerScrollEvents() {
  window.addEventListener("scroll", async () => {
    if (window.location.pathname !== "/") return;
    if (isNearBottom(200)) {
      const state = productStore.getState();
      const hasMore = state.products.length < state.totalCount;
      if (state.loading || !hasMore) return;
      try {
        await loadMoreProducts();
      } catch (error) {
        console.error("무한 스크롤 로드 실패:", error);
      }
    }
  });
}

/**
 * 토스트 이벤트
 */
export function registerToastEvents() {
  addEvent("click", "#toast-close-btn", () => {
    uiStore.dispatch({ type: UI_ACTIONS.HIDE_TOAST });
  });
}

/**
 * 링크 클릭 이벤트
 */
export function registerLinkEvents() {
  addEvent("click", "[data-link]", (e) => {
    e.preventDefault();
    const anchor = e.target.closest("[data-link]");
    if (anchor && anchor.getAttribute("href")) {
      router.push(anchor.getAttribute("href"));
    }
  });
}

/**
 * 전체 이벤트 등록
 */
export function registerAllEvents() {
  registerProductEvents();
  registerProductDetailEvents();
  registerCartEvents();
  registerCartModalEvents();
  registerScrollEvents();
  registerToastEvents();
  registerLinkEvents();
}
export const setupEventListeners = () => {
  registerAllEvents();
};
