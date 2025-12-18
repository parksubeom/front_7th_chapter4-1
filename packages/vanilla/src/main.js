import { BASE_URL } from "./constants.js";
import { registerAllEvents } from "./events";
import { initRender } from "./render";
import { router } from "./router/router.js";
import { loadCartFromStorage } from "./services";
import { registerGlobalEvents } from "./utils";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
