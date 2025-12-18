import { Router } from "@hanghae-plus/lib";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { BASE_URL } from "./constants.ts";
import { createProductStore } from "./entities/index.ts";
import { ProductProvider } from "./entities/products/ProductContext.tsx";
import { RouterContext } from "./router/hooks/useRouterContext.ts";
import { routes } from "./router/router.ts";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  const router = new Router(routes, BASE_URL);
  router.start();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initData: any = (window as any).__INITIAL_DATA__;

  const renderApp = () => {
    return (
      <RouterContext value={router}>
        <ProductProvider productStore={createProductStore(initData)}>
          <App />
        </ProductProvider>
      </RouterContext>
    );
  };

  const rootElement = document.getElementById("root")!;
  if (initData) {
    hydrateRoot(rootElement, renderApp());
  } else {
    createRoot(rootElement).render(renderApp());
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
