import { cartStore, productStore, uiStore } from "./stores/index.js";
import { router } from "./router/router.js"; // router 인스턴스 가져오기
import { NotFoundPage } from "./pages/index.js";
import { withBatch } from "./utils/index.js";

/**
 * 전체 애플리케이션 렌더링
 */
export const render = withBatch(() => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  // [수정] router.match를 다시 호출하지 않고, router가 결정한 target 컴포넌트를 사용합니다.
  // router.target이 없으면(아직 라우팅 전) NotFound가 아니라 null 처리를 하거나,
  // start() 직후라면 초기 매칭된 컴포넌트가 있어야 합니다.
  const PageComponent = router.target || NotFoundPage;

  // 컴포넌트 유효성 검사
  if (typeof PageComponent !== "function") {
    // 404 상황에서도 router.target이 NotFoundPage로 설정되어 있어야 함
    console.error("Critical Error: Component is not a function.", PageComponent);
    return;
  }

  // 1. HTML 렌더링 (HTML 문자열 생성)
  // 컴포넌트는 내부적으로 router.params, router.query 또는 Store를 참조하여 렌더링됩니다.
  const newHtml = PageComponent();

  // 2. DOM 업데이트 (HTML 삽입)
  // Diff 알고리즘 없이 통째로 교체 (Vanilla JS 과제 특성상 허용)
  rootElement.innerHTML = newHtml;

  // 3. 라이프사이클 훅 (mount) 실행
  // DOM이 그려진 직후 실행되어야 이벤트 리스너 등이 정상 작동합니다.
  if (typeof PageComponent.mount === "function") {
    // setTimeout을 사용하여 Call Stack이 비워진 후(DOM 렌더링 후) 실행 보장
    setTimeout(() => {
      PageComponent.mount();
    }, 0);
  }
});

/**
 * 렌더링 초기화 - Store 및 Router 변화 감지 설정
 */
export function initRender() {
  // 각 Store의 변화를 감지하여 자동 렌더링
  productStore.subscribe(render);
  cartStore.subscribe(render);
  uiStore.subscribe(render);

  // [중요] 라우터 변경(페이지 이동) 시에도 렌더링 트리거
  router.subscribe(render);
}
