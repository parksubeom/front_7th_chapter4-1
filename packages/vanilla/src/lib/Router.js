// lib/Router.js (전체 코드)

export class Router {
 constructor(baseUrl = "") { 
    this.routes = [];
    this.target = null; 
    this.subscribers = [];
    // [수정 1] BASE_URL을 저장하고, 끝에 '/'가 없으면 추가하여 정규화합니다.
    // 예: "" -> "/" | "/base" -> "/base/"
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`; 
    
    if (typeof window !== "undefined") {
      window.onpopstate = () => this.checkRoutes();
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    // SSR 하이드레이션 후 target이 있다면 초기 렌더링을 유발합니다.
    if (this.target && typeof window !== "undefined") {
        callback(); 
    }
  }

  notify() {
    this.subscribers.forEach((callback) => callback());
  }

  addRoute(pattern, component) {
    this.routes.push({ pattern, component });
    return this;
  }

  /**
   * [SSR & CSR 공용] URL과 일치하는 라우트 찾기
   */
  match(path) {
    for (const route of this.routes) {
      // ^를 사용하여 문자열의 시작과 일치시키고, $를 사용하여 끝과 일치시켜 정확하게 매칭합니다.
      const regex = new RegExp(`^${route.pattern.replace(/:\w+/g, "([^/]+)")}$`);
      const match = path.match(regex);

      if (match) {
        const params = this._getParams(route.pattern, match);
        return { component: route.component, params, pattern: route.pattern }; 
      }
    }
    return null;
  }

  _getParams(pattern, match) {
    const params = {};
    const keys = pattern.match(/:\w+/g);
    if (keys) {
      keys.forEach((key, index) => {
        params[key.substring(1)] = match[index + 1];
      });
    }
    return params;
  }

  /**
   * [핵심 수정] URL에서 Base Path를 제거하고 경로 매칭
   */
  checkRoutes() {
    if (typeof window === "undefined") return;

    const rawPath = window.location.pathname;
    let currentPath;
    
    // [핵심 수정 2] Base URL이 있다면 제거하고, 경로가 빈 문자열이 되는 경우를 처리
    if (rawPath.startsWith(this.baseUrl)) {
      currentPath = rawPath.substring(this.baseUrl.length);
    } else {
      currentPath = rawPath;
    }

    // Base Path를 제거한 후 경로가 빈 문자열인 경우 (예: /base/ -> '') 루트 경로 '/'로 설정
    const pathForMatch = (currentPath === '' || currentPath === '/') ? '/' : `/${currentPath.replace(/^\//, '')}`; 
    
    const match = this.match(pathForMatch);

    if (match) {
      this.target = match.component;
      this.query = this._parseQuery();
      this.params = match.params;

      this.notify();
    } else {
        // 404 라우트 매칭 시도
        const notFoundMatch = this.match('.*'); 
        if (notFoundMatch) {
            this.target = notFoundMatch.component;
            this.params = {};
            this.query = this._parseQuery();
            this.notify();
        } else {
            this.target = null; 
            this.notify();
        }
    }
  }

  _parseQuery() {
    if (typeof window === "undefined") return {};
    const search = new URLSearchParams(window.location.search);
    return Object.fromEntries(search.entries());
  }

  start() {
    if (typeof window !== "undefined") {
      this.checkRoutes(); 
    }
  }

  /**
   * [핵심 수정] 이동 시 BASE_URL을 붙여서 history에 push
   */
  push(path) {
    if (typeof window !== "undefined") {
      // path가 '/'로 시작하면 첫 '/'를 제거하고 BASE_URL과 합칩니다.
      const pathWithoutLeadingSlash = path.startsWith('/') ? path.substring(1) : path;
      
      // 최종 URL 생성: "/base/" + "product/123"
      const targetPath = `${this.baseUrl}${pathWithoutLeadingSlash}`;
      
      window.history.pushState(null, "", targetPath);
      this.checkRoutes();
    }
  }
}

export const router = new Router();