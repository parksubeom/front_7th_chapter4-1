import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "cross-fetch/dist/node-polyfill.js";

// [수정] createStore 제거, productStore(싱글톤) 사용
import { productStore, initialProductState, PRODUCT_ACTIONS } from "./src/stores/index.js";
import { Router } from "./src/lib/Router.js";
import { registerRoutes } from "./src/router/routes.js";
import { router as globalRouter } from "./src/router/router.js";

// [MSW]
import { setupServer } from "msw/node";
import { handlers } from "./src/mocks/handlers.js";
import items from "./src/mocks/items.json" with { type: "json" };

const mswServer = setupServer(...handlers);
mswServer.listen({ onUnhandledRequest: "bypass" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const app = express();

const BASE_PATH = "/front_7th_chapter4-1/vanilla";

app.use("/src", express.static(path.join(__dirname, "src")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(`${BASE_PATH}/assets`, express.static(path.join(__dirname, "dist/assets")));
app.use(express.static(path.join(__dirname, "public")));

// ▼▼▼ API 핸들러 (유지) ▼▼▼
function filterProducts(products, query) {
  let filtered = [...products];
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }
  if (query.category1) filtered = filtered.filter((item) => item.category1 === query.category1);
  if (query.category2) filtered = filtered.filter((item) => item.category2 === query.category2);
  if (query.sort) {
    switch (query.sort) {
      case "price_asc":
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
        break;
      case "price_desc":
        filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
        break;
      case "name_asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
        break;
      default:
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }
  return filtered;
}

app.get("/api/products", (req, res) => {
  try {
    const page = parseInt(req.query.page || req.query.current || 1);
    const limit = parseInt(req.query.limit || 20);
    const filteredProducts = filterProducts(items, req.query);
    const startIndex = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + limit);
    res.json({
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", (req, res) => {
  const product = items.find((item) => item.productId === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({
    ...product,
    description: `${product.title} 상세 설명...`,
    rating: 4.5,
    reviewCount: 100,
    stock: 50,
    images: [product.image],
  });
});

app.get("/api/categories", (req, res) => {
  const categories = {};
  items.forEach((item) => {
    if (!categories[item.category1]) categories[item.category1] = {};
    if (item.category2) categories[item.category1][item.category2] = {};
  });
  res.json(categories);
});

app.get(/^\/api\/.*$/, (req, res) => {
  res.status(404).json({ error: "API endpoint not found", path: req.path });
});
// ▲▲▲ API 핸들러 끝 ▲▲▲

//

// [수정] renderHtml 개선: Title 동적 주입 로직 추가
const renderHtml = ({ content, state, path }) => {
  const safeState = state || {};
  const stateJson = JSON.stringify(safeState) || "{}";

  // Title 결정 로직
  let title = "Vanilla Javascript Shopping Mall";

  if (path === "/" || path === "") {
    title = "쇼핑몰 - 홈";
  } else if (safeState.product && safeState.product.currentProduct) {
    // 상품 상세 페이지인 경우 상품명으로 설정
    title = `${safeState.product.currentProduct.title} - 쇼핑몰`;
  }

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root">${content}</div>
  <script>
    window.__INITIAL_STATE__ = ${stateJson.replace(/</g, "\\u003c")};
  </script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`.trim();
};

// [SSR 렌더링 라우트]
app.get(/.*/, async (req, res) => {
  try {
    // 1. [핵심] 요청마다 싱글톤 스토어 초기화 (이전 요청의 상태가 남지 않도록)
    productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: initialProductState });

    const router = new Router();
    registerRoutes(router);

    // 2. 경로 정규화
    let requestPath = req.path;
    if (requestPath.startsWith(BASE_PATH)) {
      requestPath = requestPath.replace(BASE_PATH, "");
    }
    if (!requestPath || requestPath === "/") {
      requestPath = "/";
    }

    console.log(`[SSR] Req: ${req.path} -> Matched: ${requestPath}`);

    const match = router.match(requestPath);
    if (!match) {
      console.log(`[SSR] 404 Route Not Found`);
      return res.status(404).send("Page Not Found");
    }

    const { component: Component, params } = match;

    globalRouter.query = req.query;
    globalRouter.params = params;

    // 3. 데이터 페칭
    if (Component.fetchData) {
      // 여기서 productStore(싱글톤)을 넘겨주므로, 내부에서 이 스토어에 dispatch 하게 됩니다.
      await Component.fetchData({
        store: productStore,
        params,
        query: req.query,
      });
    }

    // 4. 렌더링
    const content = Component();

    // 5. 상태 추출
    const initialState = {
      product: productStore.getState(),
      cart: { items: [], selectedAll: false },
    };

    // [핵심] path 정보를 renderHtml에 전달하여 타이틀 생성에 활용
    const html = renderHtml({ content, state: initialState, path: requestPath });

    res.send(html);
  } catch (err) {
    console.error("SSR Rendering Error:", err);
    res.status(500).send(err.stack);
  }
});

app.listen(port, () => {
  console.log(`🛒 SSR Server running at http://localhost:${port}`);
});
