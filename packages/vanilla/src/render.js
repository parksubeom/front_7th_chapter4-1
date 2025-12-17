// src/render.js

import { cartStore, productStore, uiStore } from "./stores/index.js";
import { router } from "./router/index.js";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index.js";
import { withBatch } from "./utils/index.js";


/**
 * 전체 애플리케이션 렌더링
 */
export const render = withBatch(() => {
    const rootElement = document.getElementById("root");
    if (!rootElement) return;

    // [수정 2] router.target 대신, 현재 URL에 맞는 컴포넌트를 직접 찾습니다.
    const currentPath = window.location.pathname;
    
    // Base Path를 고려한 순수한 경로를 match 함수에 전달해야 함 (Router.js에서 이미 처리)
    const match = router.match(currentPath); 
    const PageComponent = match ? match.component : router.match('.*')?.component || NotFoundPage;
    
    // 컴포넌트가 함수가 아닐 경우 에러 방지
    if (typeof PageComponent !== 'function') {
        console.error("Critical Error: FinalComponent is not a function.", PageComponent);
        rootElement.innerHTML = "<h1>컴포넌트 로드 실패: 라우터 오류</h1>";
        return;
    }
    
    // 1. HTML 렌더링 (HTML 문자열 생성)
    const newHtml = PageComponent();
    
    // 2. DOM 업데이트 (HTML 삽입)
    rootElement.innerHTML = newHtml;

    // [핵심 수정 3] DOM 삽입 완료 후, PageComponent에 붙은 mount 훅을 호출합니다.
    // withLifecycle.js에서 ComponentWrapper에 .mount를 붙여 주었음을 가정합니다.
    if (typeof window !== 'undefined' && typeof PageComponent.mount === 'function') {
        // DOM 업데이트가 확실히 완료된 '다음 틱'에 호출하여 안정성을 확보합니다.
        setTimeout(() => {
             // CSR/SSR 하이드레이션 후 onMount 실행! (로그가 찍히는 순간)
             PageComponent.mount(); 
        }, 0);
    }
});


/**
 * 렌더링 초기화 - Store 변화 감지 설정
 */
export function initRender() {
    // 각 Store의 변화를 감지하여 자동 렌더링
    productStore.subscribe(render);
    cartStore.subscribe(render);
    uiStore.subscribe(render);
    
    // [핵심 추가] 라우터 구독은 필수
    router.subscribe(render); // Router.js에서 subscribe 메서드가 추가되었음
}