// 글로벌 라우터 인스턴스
import { BASE_URL } from "../constants.js";
import { ClientRouter, ServerRouter } from "../lib";
import { HomePage } from "../pages/HomePage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";
import { ProductDetailPage } from "../pages/ProductDetailPage.js";
import { isServer } from "../utils/runtime.js";

export const routerMatches = {
  "/": HomePage,
  "/product/:id/": ProductDetailPage,
  ".*": NotFoundPage,
};

export const router = isServer
  ? // 인터페이스 맞추는 용도
    // 서버 요청마다 상태 격리를 위해 사용하지는 않음
    new ServerRouter({})
  : new ClientRouter(BASE_URL, routerMatches);
