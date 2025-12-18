import { isServer } from "../utils/runtime.js";

const withBaseUrl = (url) => {
  // 서버 환경에서는 절대 경로를 사용해야하기 때문에 임시 baseURL 설정
  // msw 핸들러에서 baseURL 상관 없이 처리함
  return isServer ? new URL(url, `http://localhost`) : url;
};

export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  const response = await fetch(withBaseUrl(`/api/products?${searchParams}`));

  return await response.json();
}

export async function getProduct(productId) {
  const response = await fetch(withBaseUrl(`/api/products/${productId}`));
  return await response.json();
}

export async function getCategories() {
  const response = await fetch(withBaseUrl("/api/categories"));
  return await response.json();
}
