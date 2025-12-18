import { registerGlobalEvents } from "./utils/index.js";
import { initRender } from "./render.js";
import { registerAllEvents } from "./events.js";
import { loadCartFromStorage } from "./services/index.js";
import { BASE_URL } from "./constants.js";
import { router } from "./router/router.js";
import { registerRoutes } from "./router/routes.js";
import { productStore, PRODUCT_ACTIONS } from "./stores/index.js";

async function main() {
  // 1. 라우트 등록 (가장 먼저)
  registerRoutes(router);

  // 2. 초기 데이터 복원 (Hydration)
  if (window.__INITIAL_STATE__) {
    const initialState = window.__INITIAL_STATE__;
    if (initialState.product) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          ...initialState.product,
          loading: false,
          status: "done",
        },
      });
    }
  }

  // 3. 렌더링 시스템 구독 설정
  // router.start()가 호출되면 첫 렌더링이 발생하므로, 구독을 먼저 해야 합니다.
  initRender();

  // 4. 이벤트 등록
  // DOM에 위임하는 방식이므로 순서는 크게 상관없으나,
  // render 직전에 하는 것이 관례상 안전합니다.
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();

  // 5. 라우터 시작 (앱 실행)
  // 이 시점에 첫 화면이 그려집니다.
  router.start();
}

async function bootstrap() {
  const shouldMock = typeof window !== "undefined" && import.meta.env?.MODE !== "test";

  if (shouldMock) {
    try {
      const { worker } = await import("./mocks/browser.js");
      await worker.start({
        serviceWorker: {
          url: `${BASE_URL}mockServiceWorker.js`,
        },
        onUnhandledRequest: "bypass",
      });
      console.log("[MSW] Started");
    } catch (error) {
      console.warn("[MSW] Failed:", error);
    }
  }

  await main();
}

bootstrap();
