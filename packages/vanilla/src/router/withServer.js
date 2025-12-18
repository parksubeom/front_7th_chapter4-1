import { isServer } from "../utils";
import { router } from "./router";

export const withServer = (options, page) => {
  const pageWithSSR = ({ pathname, query, params, data } = {}) => {
    const pageParams = isServer
      ? { pathname, query, params, data }
      : {
          pathname: window.location.pathname,
          query: router.query,
          params: router.params,
          data: window.__INITIAL_DATA__,
        };
    return page(pageParams);
  };

  Object.assign(pageWithSSR, options);

  return pageWithSSR;
};
