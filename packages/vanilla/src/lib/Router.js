export class Router {
  constructor(baseUrl = "") {
    this.routes = [];
    this.target = null;
    this.subscribers = [];
    this.params = {};
    this.query = {};

    // [수정] baseUrl 정규화:
    // 1. 빈 값이면 "" 유지
    // 2. 끝에 '/'가 있다면 제거하여 경로 결합 시 중복 슬래시 방지
    // 예: "/shop/" -> "/shop"
    this.baseUrl = baseUrl === "/" ? "" : baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

    if (typeof window !== "undefined") {
      window.onpopstate = () => this.checkRoutes();
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    // 초기 렌더링 시 target이 있다면 알림
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
   * [핵심] URL 매칭 로직
   * CSR에서는 checkRoutes가 BaseUrl을 떼고 호출하고,
   * SSR에서는 server.js가 BaseUrl을 떼고 호출한다고 가정합니다.
   * 즉, path는 항상 순수한 경로(예: "/product/1")여야 합니다.
   */
  match(path) {
    // 1. 쿼리 스트링 분리 (혹시 path에 포함되어 들어올 경우 대비)
    const [pathname] = path.split("?");

    // 2. 트레일링 슬래시 제거 (루트 '/' 제외)
    // 예: '/product/1/' -> '/product/1'
    const normalizedPath = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

    for (const route of this.routes) {
      // 정규식 매칭 로직: :id 등을 ([^/]+)로 치환
      // ^와 $를 사용하여 정확히 일치하는지 확인
      const regex = new RegExp(`^${route.pattern.replace(/:\w+/g, "([^/]+)")}$`);
      const match = normalizedPath.match(regex);

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
   * [CSR 전용] 브라우저 환경에서 현재 URL을 확인하고 라우팅 처리
   */
  checkRoutes() {
    if (typeof window === "undefined") return;

    // 1. 현재 브라우저의 전체 경로 가져오기
    const rawPath = window.location.pathname;
    let currentPath = rawPath;

    // 2. Base URL 제거 로직 강화
    // baseUrl이 설정되어 있고, 현재 경로가 그 baseUrl로 시작한다면 잘라냅니다.
    if (this.baseUrl && currentPath.startsWith(this.baseUrl)) {
      currentPath = currentPath.slice(this.baseUrl.length);
    }

    // 3. 경로가 비었거나 슬래시가 누락된 경우 보정
    if (!currentPath || currentPath === "") {
      currentPath = "/";
    }
    if (!currentPath.startsWith("/")) {
      currentPath = "/" + currentPath;
    }

    // 4. 매칭 실행
    const match = this.match(currentPath);

    if (match) {
      this.target = match.component;
      this.query = this._parseQuery();
      this.params = match.params;
      this.notify();
    } else {
      // 404 처리 (와일드카드 라우트 '.*' 등이 있다면 매칭)
      // 정규표현식 라우트를 위해 '.*' 패턴을 사용하는 경우를 대비
      // 주의: addRoute(".*", NotFoundPage) 형태로 등록되어 있어야 함
      const notFoundMatch = this.routes.find((r) => r.pattern === ".*" || r.pattern === "*");

      if (notFoundMatch) {
        this.target = notFoundMatch.component;
        this.params = {};
        this.query = this._parseQuery();
        this.notify();
      } else {
        // 등록된 404 핸들러도 없으면 null
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
   * [CSR 전용] 페이지 이동
   */
  push(path) {
    if (typeof window !== "undefined") {
      // 1. 이동할 경로 정규화 (앞의 슬래시 제거)
      const pathWithoutLeadingSlash = path.startsWith("/") ? path.substring(1) : path;

      // 2. Base URL과 결합
      // this.baseUrl은 생성자에서 끝의 '/'를 제거했으므로, 중간에 '/'를 넣어줍니다.
      // 예: baseUrl="/shop", path="/cart" -> "/shop/cart"
      const separator =
        this.baseUrl && pathWithoutLeadingSlash ? "/" : !this.baseUrl && pathWithoutLeadingSlash ? "/" : "";

      let targetPath = `${this.baseUrl}${separator}${pathWithoutLeadingSlash}`;

      // 루트 경로("/")로 이동하는 경우 처리
      if (targetPath === "") targetPath = "/";

      // 3. History API 호출
      window.history.pushState(null, "", targetPath);

      // 4. 라우트 체크 트리거
      this.checkRoutes();
    }
  }
}
