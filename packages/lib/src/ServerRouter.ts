import type { AnyFunction, StringRecord } from "./types";

export type ServerRoute<Handler extends AnyFunction> = Route<Handler>;

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

type QueryPayload = Record<string, string | number | undefined>;

export type ServerRouterInstance<T extends AnyFunction> = InstanceType<typeof ServerRouter<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ServerRouter<Handler extends (...args: any[]) => any> {
  readonly #routes: Map<string, Route<Handler>>;
  query: StringRecord = {};

  #route: null | (Route<Handler> & { params: StringRecord; path: string });

  constructor() {
    this.#routes = new Map();
    this.#route = null;
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  addRoute(path: string, handler: Handler) {
    // 경로 패턴을 정규식으로 변환
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  #findRoute(url: string) {
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

  push() {}

  start(url = "/") {
    this.#route = this.#findRoute(url);
  }

  static parseQuery = (search = "") => {
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

  static getUrl = () => {
    return "";
  };

  subscribe() {
    return () => {};
  }
}
