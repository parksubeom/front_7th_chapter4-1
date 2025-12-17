// packages/vanilla/src/utils/withLifecycle.js

const lifeCycles = new WeakMap();
const pageState = { current: null, previous: null };
const initLifecycle = { mount: null, unmount: null, watches: [], deps: [], mounted: false };

// 페이지의 생명주기 상태를 가져오거나 초기화
const getPageLifecycle = (page) => {
  if (!lifeCycles.has(page)) {
    lifeCycles.set(page, { ...initLifecycle });
  }
  return lifeCycles.get(page);
};

// 의존성 배열 비교 함수
const depsChanged = (newDeps, oldDeps) => {
  if (!Array.isArray(newDeps) || !Array.isArray(oldDeps)) {
    return false;
  }
  if (newDeps.length !== oldDeps.length) {
    return true;
  }
  return newDeps.some((dep, index) => dep !== oldDeps[index]);
};

// [수정 1] mount 로직을 분리하고, DOM 삽입 후 실행되도록 콜백만 실행합니다.
const executeMount = (page) => {
    const lifecycle = getPageLifecycle(page);
    if (lifecycle.mounted) return;

    // 마운트 콜백들 실행 (onMount)
    lifecycle.mount?.(); 
    lifecycle.mounted = true;
    lifecycle.deps = [];
};

// 페이지 언마운트 처리
const unmount = (pageFunction) => {
  const lifecycle = getPageLifecycle(pageFunction);

  if (!lifecycle.mounted) return;

  // 언마운트 콜백들 실행
  lifecycle.unmount?.();
  lifecycle.mounted = false;
};

export const withLifecycle = ({ onMount, onUnmount, watches } = {}, page) => {
  const lifecycle = getPageLifecycle(page);

    // 훅 등록 (변경 없음)
  if (typeof onMount === "function") {
    lifecycle.mount = onMount;
  }
  if (typeof onUnmount === "function") {
    lifecycle.unmount = onUnmount;
  }
  if (Array.isArray(watches)) {
    lifecycle.watches = typeof watches[0] === "function" ? [watches] : watches;
  }

    // [수정 2] 렌더링 함수 (ComponentWrapper) 정의
    const ComponentWrapper = (...args) => {
        const wasNewPage = pageState.current !== page;

        // [수정 3] 이전 페이지 언마운트 (HTML 반환 전에 즉시 실행)
        if (pageState.current && wasNewPage) {
            unmount(pageState.current);
        }

        // 현재 페이지 설정
        pageState.previous = pageState.current;
        pageState.current = page;

        // [수정 4] mount(page) 호출 제거! 이제 mount는 render.js에서 호출됩니다.

        // 기존 페이지면 업데이트 (watches)
        if (!wasNewPage && lifecycle.watches) { 
            lifecycle.watches.forEach(([getDeps, callback], index) => {
                const newDeps = getDeps();
                if (depsChanged(newDeps, lifecycle.deps[index])) {
                    callback();
                }
                lifecycle.deps[index] = Array.isArray(newDeps) ? [...newDeps] : [];
            });
        }

        // 페이지 함수 실행 (HTML 반환)
        return page(...args);
    };

    // [핵심 추가] render.js에서 DOM 삽입 후 호출할 수 있도록 mount/unmount 함수를 노출합니다.
    // 이 노출된 함수는 withLifecycle이 반환한 렌더링 함수에 붙어 나갑니다.
    ComponentWrapper.mount = () => executeMount(page);
    ComponentWrapper.unmount = () => unmount(page);
    
    // 이 ComponentWrapper가 곧 HomePageComponent(), ProductDetailPage() 함수입니다.
    return ComponentWrapper; 
};