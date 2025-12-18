import { getCategories, getProducts } from "../api/productApi.js";
import { ProductList, SearchBar } from "../components";
import { router } from "../router/router.js";
import { withIsomorphicLifecycle } from "../router/withLifecycle.js";
import { initProductsAndCategories, loadProducts, loadProductsAndCategories } from "../services";
import { initialProductState, productStore } from "../stores";
import { isServer } from "../utils/runtime.js";
import { PageWrapper } from "./PageWrapper.js";

const ssrFetcher = async ({ query }) => {
  try {
    const [
      {
        products,
        pagination: { total },
      },
      categories,
    ] = await Promise.all([getProducts(query), getCategories()]);

    return {
      products,
      categories,
      totalCount: total,
      loading: false,
      status: "done",
    };
  } catch (error) {
    return {
      ...initialProductState,
      error: error.message,
      loading: false,
      status: "done",
    };
  }
};

export const HomePage = withIsomorphicLifecycle(
  {
    ssr: ssrFetcher,
    metadata: () => {
      return {
        title: "쇼핑몰 - 홈",
      };
    },
    initStore: ({ data }) => {
      initProductsAndCategories(data);
    },
    onMount: ({ data }) => {
      loadProductsAndCategories(data);
    },
    watches: [
      ({ query }) => {
        const { search, limit, sort, category1, category2 } = query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  ({ data, query }) => {
    const { search: searchQuery, limit, sort, category1, category2 } = isServer ? query : router.query;
    const { products, loading, error, totalCount, categories } = isServer ? data : productStore.getState();
    const category = { category1, category2 };
    const hasMore = products.length < totalCount;

    return PageWrapper({
      headerLeft: `
    <h1 class="text-xl font-bold text-gray-900">
      <a href="/" data-link>쇼핑몰</a>
    </h1>
  `.trim(),
      children: `
    <!-- 검색 및 필터 -->
    ${SearchBar({ searchQuery, limit, sort, category, categories })}
    
    <!-- 상품 목록 -->
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
