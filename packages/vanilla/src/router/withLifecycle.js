import { isClient } from "../utils";
import { withServer } from "./withServer";

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
  // 배열이 아니면 변경되지 않은 것으로 처리
  if (!Array.isArray(newDeps) || !Array.isArray(oldDeps)) {
    return false;
  }

  // 길이가 다르면 변경됨
  if (newDeps.length !== oldDeps.length) {
    return true;
  }

  // 각 요소 비교
  return newDeps.some((dep, index) => dep !== oldDeps[index]);
};

// 페이지 마운트 처리
const mount = (page, ...args) => {
  const lifecycle = getPageLifecycle(page);
  if (lifecycle.mounted) return;

  // 마운트 콜백들 실행
  lifecycle.mount?.(...args);
  lifecycle.mounted = true;
  lifecycle.deps = [];
};

// 페이지 언마운트 처리
const unmount = (pageFunction, ...args) => {
  const lifecycle = getPageLifecycle(pageFunction);

  if (!lifecycle.mounted) return;

  // 언마운트 콜백들 실행
  lifecycle.unmount?.(...args);
  lifecycle.mounted = false;
};

export const withIsomorphicLifecycle = ({ onMount, onUnmount, watches, initStore, ssr, metadata } = {}, page) => {
  let init = false;

  return withServer({ ssr, metadata }, (...args) => {
    if (isClient && !init) {
      init = true;
      initStore(...args);
    }

    const lifecycle = getPageLifecycle(page);
    if (typeof onMount === "function") {
      lifecycle.mount = onMount;
    }

    if (typeof onUnmount === "function") {
      lifecycle.unmount = onUnmount;
    }

    if (Array.isArray(watches)) {
      lifecycle.watches = typeof watches[0] === "function" ? [watches] : watches;
    }

    const wasNewPage = pageState.current !== page;

    // 이전 페이지 언마운트
    if (pageState.current && wasNewPage) {
      unmount(pageState.current, ...args);
    }

    // 현재 페이지 설정
    pageState.previous = pageState.current;
    pageState.current = page;

    if (isClient) {
      // 새 페이지면 마운트, 기존 페이지면 업데이트
      if (wasNewPage) {
        mount(page, ...args);
      } else if (lifecycle.watches) {
        lifecycle.watches.forEach(([getDeps, callback], index) => {
          const newDeps = getDeps(...args);

          if (depsChanged(newDeps, lifecycle.deps[index])) {
            callback(...args);
          }

          // deps 업데이트 (이 부분이 중요!)
          lifecycle.deps[index] = Array.isArray(newDeps) ? [...newDeps] : [];
        });
      }
    }

    // 페이지 함수 실행
    return page(...args);
  });
};
