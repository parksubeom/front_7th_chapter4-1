import { Router } from "@hanghae-plus/lib";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { createProductStore } from "./entities";
import { ProductProvider } from "./entities/products/ProductContext";
import { routes } from "./router";
import { RouterProvider } from "./router/RouterContext";
import type { ServerOptions } from "./router/withServer";

const fallback = () => {};

export const render = async (url: string, query: Record<string, string>) => {
  console.log({ url, query });

  const router = new Router(routes);
  router.start(url);
  router.query = query;

  const { ssr = fallback, metadata = fallback } = router.target as unknown as ServerOptions;
  const params = { query, params: router.params };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = (await ssr(params)) ?? {};
  const { title = "" } = (await metadata(params)) ?? {};

  const html = renderToString(
    <RouterProvider router={router}>
      <ProductProvider productStore={createProductStore(data)}>
        <App />
      </ProductProvider>
    </RouterProvider>,
  );

  return {
    head: `<title>${title}</title>`,
    html,
    __INITIAL_DATA__: data,
  };
};
