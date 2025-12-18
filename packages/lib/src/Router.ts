import type { FC } from "react";
import { createObserver } from "./createObserver";
import type { AnyFunction, StringRecord } from "./types";

interface Route<Handler extends FC> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

type QueryPayload = Record<string, string | number | undefined>;

export type RouterInstance<T extends AnyFunction> = InstanceType<typeof Router<T>>;

export class Router<Handler extends FC> {
  readonly #routes: Map<string, Route<Handler>>;
  readonly #observer = createObserver();
  readonly #baseUrl;
  #ssrQuery: StringRecord = {};

  #route: null | (Route<Handler> & { params: StringRecord; path: string });

  constructor(initRoutes: Record<string, Handler>, baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");

    Object.entries(initRoutes).forEach(([path, page]) => {
      this.addRoute(path, page);
    });

    if (typeof window !== "undefined") {
      window.addEventListener("popstate", () => {
        this.#route = this.#findRoute();
        this.#observer.notify();
      });

      document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target?.closest("[data-link]")) {
          return;
        }
        e.preventDefault();
        const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
        if (url) {
          this.push(url);
        }
      });
    }
  }

  get query(): StringRecord {
    if (typeof window !== "undefined") {
      return Router.parseQuery(window.location.search);
    }
    return this.#ssrQuery;
  }

  set query(newQuery: QueryPayload) {
    if (typeof window !== "undefined") {
      const newUrl = Router.getUrl(newQuery, this.#baseUrl);
      this.push(newUrl);
    } else {
      this.#ssrQuery = Object.entries(newQuery).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          acc[key] = String(value);
          return acc;
        }
        return acc;
      }, {} as StringRecord);
    }
  }

  get params() {
    return this.#route?.params ?? {};
  }

  set params(newParams: StringRecord) {
    this.#route ??= {} as Route<Handler> & { params: StringRecord; path: string };
    this.#route.params = newParams;
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  readonly subscribe = this.#observer.subscribe;

  addRoute<T>(path: string, handler: FC<T>) {
    // 경로 패턴을 정규식으로 변환
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex =
      typeof window !== "undefined" ? new RegExp(`^${this.#baseUrl}${regexPath}$`) : new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler: handler as Handler,
    });
  }

  #findRoute(url = window.location.pathname) {
    // pathname 만 쓰기 때문에 임시 값 설정
    const { pathname } = new URL(url, "http://localhost");
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params: StringRecord = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }

  push(url: string) {
    try {
      // baseUrl이 없으면 자동으로 붙여줌
      const fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 히스토리 업데이트
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.#route = this.#findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  start(url?: string) {
    this.#route = this.#findRoute(url);
    this.#observer.notify();
  }

  static parseQuery = (search = window.location.search) => {
    const params = new URLSearchParams(search);
    const query: StringRecord = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  static stringifyQuery = (query: QueryPayload) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery: QueryPayload, baseUrl = "") => {
    const currentQuery = Router.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);
    return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
