// server.js

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// [App Logic]
import { createStore } from "./src/lib/createStore.js";
import { Router } from "./src/lib/Router.js";
import { registerRoutes } from "./src/router/routes.js";
import { router as globalRouter } from "./src/router/router.js";
import { productReducer } from "./src/stores/productStore.js";
import { cartReducer } from "./src/stores/cartStore.js";

// [MSW 설정]
import { setupServer } from 'msw/node';
import { handlers } from './src/mocks/handlers.js'; 

// [수정 1: MSW 서버 인스턴스 생성 및 실행]
const mswServer = setupServer(...handlers);
mswServer.listen({ onUnhandledRequest: 'bypass' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const app = express();

app.use("/src", express.static(path.join(__dirname, "src")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.static(path.join(__dirname, "public")));

const renderHtml = ({ content, state }) => {
  const safeState = state || {}; 
  const stateJson = JSON.stringify(safeState) || '{}';

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vanilla Javascript Shopping Mall</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root">${content}</div>
  <script>
    window.__INITIAL_STATE__ = ${stateJson.replace(/</g, '\\u003c')};
  </script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`.trim();
};

const rootReducer = (state = {}, action) => {
  return {
    product: productReducer(state.product, action),
    cart: cartReducer(state.cart, action),
  };
};

// [수정 2: Syntax Error 유발 라우트들 완전 제거]
// 이 라우트들은 Vite Dev Server가 처리하므로 SSR 서버에서 제거합니다.

// 정규표현식 라우트 매칭 (모든 요청을 처리)
app.get(/.*/, async (req, res) => {
  try {
    // Base URL이 없는 SSR 환경이므로 new Router("") 전달
    const store = createStore(rootReducer);
    const router = new Router(""); 
    registerRoutes(router);

    const match = router.match(req.path);
    if (!match) return res.status(404).send("Page Not Found");

    const { component: Component, params } = match;

    globalRouter.query = req.query;
    globalRouter.params = params;

    if (Component.fetchData) {
      await Component.fetchData({
        store,
        params,
        query: req.query
      });
    }

    const content = Component();
    const initialState = store.getState();
    const html = renderHtml({ content, state: initialState });

    res.send(html);

  } catch (err) {
    console.error("SSR Rendering Error:", err);
    res.status(500).send(err.stack);
  }
});

app.listen(port, () => {
  console.log(`🛒 SSR Server running at http://localhost:${port}`);
});