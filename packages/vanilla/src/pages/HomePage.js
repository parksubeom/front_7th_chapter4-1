// packages/vanilla/src/pages/HomePage.js (복구 완료)

import { ProductList, SearchBar } from "../components/index.js";
import { productStore } from "../stores/index.js";
import { router, withLifecycle } from "../router/index.js"; 
import { 
  loadProducts, 
  loadProductsAndCategories, 
  // 이벤트 등록 로직을 제거했으므로, 이 헬퍼 함수들은 여기서 더 이상 필요하지 않습니다.
  // searchProducts, setSort, setCategory 
} from "../services/index.js"; 
import { PageWrapper } from "./PageWrapper.js";

const HomePageComponent = withLifecycle(
  {
    onMount: () => {
      console.log("✅ HomePage mounted, loading data.");
      // [복구 완료] 이벤트 등록 로직 제거, 순수하게 데이터 로드만 유지
      loadProductsAndCategories();
    },
    
    // [복구 완료] onUnmount 로직 제거
    onUnmount: () => {
        console.log("☑️ HomePage unmounted.");
    },
    
    watches: [
      () => {
        // 라우터 쿼리 변경 감지
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      // 쿼리 변경 시, 상품 목록 재로드 (전체 재로드)
      () => loadProducts(true), 
    ],
  },
  () => {
    const productState = productStore.getState();
    const { search: searchQuery, limit, sort, category1, category2 } = router.query;
    const { products, loading, error, totalCount, categories } = productState;
    const category = { category1, category2 };
    const hasMore = products.length < totalCount;

    return PageWrapper({
      headerLeft: `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim(),
      children: `
        ${SearchBar({ searchQuery, limit, sort, category, categories })}
        
        <div class="mb-6">
          ${ProductList({
            products,
            loading,
            error,
            totalCount,
            hasMore,
          })}
        </div>
      `.trim(),
    });
  },
);

/**
 * [SSR 필수] 서버 사이드 데이터 프리패칭
 */
HomePageComponent.fetchData = async ({ store, query }) => {
  // 서비스를 통해 데이터를 가져오고 스토어에 주입합니다.
  await loadProductsAndCategories(query, store);
};

export const HomePage = HomePageComponent;