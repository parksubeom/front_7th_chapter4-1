import { registerGlobalEvents } from "./utils/index.js";
import { initRender } from "./render.js";
import { registerAllEvents } from "./events.js";
import { loadCartFromStorage } from "./services/index.js";
import { BASE_URL } from "./constants.js";
import { router } from "./router/router.js";
import { registerRoutes } from "./router/routes.js";

// [제거] initHydration 함수는 더 이상 필요 없습니다. (스토어 파일이 스스로 초기화함)

function main() {
  // [제거] initHydration() 호출을 제거합니다.

  // 라우트 등록 실행
  registerRoutes(router);

  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  router.start();
}

/**
 * [수정 포인트]
 * import.meta.env 가 없을 수도 있으므로 '?.MODE' (옵셔널 체이닝) 사용!
 * (Node.js 서버에서 직접 띄울 땐 env가 undefined이므로 에러 방지)
 */
if (typeof window !== 'undefined' && import.meta.env?.MODE !== "test") {
  import("./mocks/browser.js")
    .then(({ worker }) => {
      worker
        .start({
          serviceWorker: {
            url: `${BASE_URL}mockServiceWorker.js`,
          },
          onUnhandledRequest: "bypass",
        })
        .then(() => {
          main();
        })
        .catch((err) => {
          console.warn("MSW Worker start failed, but starting app without MSW:", err);
          main();
        });
    })
    .catch((err) => {
      // [수정] 모듈 로드 실패 시, 에러를 기록하고 MSW 없이 애플리케이션 시작
      console.warn("Mock Service Worker import failed (TypeError in SSR env?):", err);
      main();
    });
} else {
  main();
}