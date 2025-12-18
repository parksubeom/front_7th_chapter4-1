import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "cross-fetch/dist/node-polyfill.js";

import { productStore, PRODUCT_ACTIONS } from "./src/stores/index.js";
import { Router } from "./src/lib/Router.js";
import { registerRoutes } from "./src/router/routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INDEX_HTML_PATH = path.resolve(__dirname, "../../dist/vanilla/index.html");
const ITEMS_JSON_PATH = path.resolve(__dirname, "./src/mocks/items.json");

// [추가] 동적 타이틀 생성 함수
const getTitle = (store, path) => {
  if (path === "/" || path === "") return "쇼핑몰 - 홈";

  const state = store.getState();
  if (state.currentProduct) {
    return `${state.currentProduct.title} - 쇼핑몰`;
  }
  return "Vanilla Javascript Shopping Mall";
};

async function generateStaticSite() {
  console.log("🚀 Generating Static Site...");

  try {
    let templatePath = INDEX_HTML_PATH;
    if (!fs.existsSync(templatePath)) {
      const altPath = path.resolve(__dirname, "../dist/vanilla/index.html"); // 로컬 dist 확인
      if (fs.existsSync(altPath)) templatePath = altPath;
      else throw new Error(`Template not found. Run 'pnpm build' first.`);
    }
    const template = fs.readFileSync(templatePath, "utf-8");
    const itemsData = fs.readFileSync(ITEMS_JSON_PATH, "utf-8");
    const items = JSON.parse(itemsData);

    const router = new Router();
    registerRoutes(router);

    // --- 1. 메인 페이지 생성 ---
    const match = router.match("/");
    const { component: HomePage } = match;

    // 데이터 주입
    const categories = {};
    items.forEach((item) => {
      if (!categories[item.category1]) categories[item.category1] = {};
      if (item.category2) categories[item.category1][item.category2] = {};
    });

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: items.slice(0, 20),
        categories,
        totalCount: items.length,
        loading: false,
        status: "done",
        currentProduct: null, // 홈이므로 null
      },
    });

    const appHtml = HomePage();

    // 상태 JSON 생성
    const initialState = {
      product: productStore.getState(),
      cart: { items: [], selectedAll: false },
    };
    const stateJson = JSON.stringify(initialState).replace(/</g, "\\u003c");

    // HTML 조립
    let result = template.replace(/<div id="root">.*?<\/div>/s, `<div id="root">${appHtml}</div>`);

    // [핵심] 타이틀 교체
    const title = getTitle(productStore, "/");
    result = result.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

    if (result.includes("window.__INITIAL_STATE__")) {
      result = result.replace(/window\.__INITIAL_STATE__\s*=\s*\{.*?\};/s, `window.__INITIAL_STATE__ = ${stateJson};`);
    } else {
      result = result.replace("</body>", `<script>window.__INITIAL_STATE__ = ${stateJson};</script></body>`);
    }

    fs.writeFileSync(templatePath, result);
    console.log(`✅ Static Site Generated Successfully at ${templatePath}`);
  } catch (error) {
    console.error("❌ Failed to generate static site:", error);
    process.exit(1);
  }
}

generateStaticSite();
