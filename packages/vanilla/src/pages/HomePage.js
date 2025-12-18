import { ProductList, SearchBar } from "../components/index.js";
import { productStore } from "../stores/index.js";
import { router, withLifecycle } from "../router/index.js";
import { loadProducts, loadProductsAndCategories } from "../services/index.js";
import { PageWrapper } from "./PageWrapper.js";

const HomePageComponent = withLifecycle(
  {
    onMount: () => {
      console.log("✅ HomePage mounted.");

      const state = productStore.getState();
      const query = router.query;

      // 1. 필터 조건 확인
      const hasFilter = query.search || query.category1 || query.category2 || query.sort;
      // 2. 상품 데이터 유무 확인
      const isEmpty = !state.products || state.products.length === 0;
      // 3. [핵심] 카테고리 데이터 유무 확인 (상세 페이지에서 돌아왔을 때 유실됨)
      const missingCategories = !state.categories || Object.keys(state.categories).length === 0;

      if (missingCategories) {
        // 카테고리가 없으면 무조건 '상품+카테고리' 모두 로드
        // (productService.js를 수정했으므로 필터 정보도 유지됩니다)
        console.log("Categories missing. Fetching both...");
        loadProductsAndCategories();
      } else if (isEmpty || hasFilter) {
        // 카테고리는 있는데 상품이 없거나 필터가 바뀌었다면 '상품'만 로드
        console.log("Fetching products only...");
        loadProducts(true);
      } else {
        console.log("Data already loaded. Skipping fetch.");
      }
    },

    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
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

HomePageComponent.fetchData = async ({ store, query }) => {
  await loadProductsAndCategories(query, store);
};

export const HomePage = HomePageComponent;
