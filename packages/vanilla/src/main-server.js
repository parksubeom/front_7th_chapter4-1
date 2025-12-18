import { ServerRouter } from "./lib";
import { routerMatches } from "./router/router";

export const render = async (pathname, query) => {
  console.log({ pathname, query });
  const router = new ServerRouter(routerMatches);
  router.start(pathname, query);
  const params = { pathname, query, params: router.params };
  const data = (await router.target?.ssr?.(params)) ?? {};
  const metadata = await router.target?.metadata?.(params);

  return {
    head: `<title>${metadata?.title ?? ""}</title>`,
    html: router.target({ ...params, data }),
    __INITIAL_DATA__: data,
  };
};
