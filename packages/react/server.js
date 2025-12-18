import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/react/" : "/");

const templateHtml = prod ? await fs.readFile("./dist/react/index.html", "utf-8") : "";

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  base,
});

const { mswServer } = await vite.ssrLoadModule("./src/mocks/node.ts");
mswServer.listen({
  onUnhandledRequest: "bypass",
});

const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
if (!prod) {
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

// 불필요한 요청 무시
app.get("/favicon.ico", (_, res) => {
  res.status(204).end();
});
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(204).end();
});

app.get("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    const pathname = path.normalize(`/${url.split("?")[0]}`);

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;
    if (!prod) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    const rendered = await render(pathname, req.query);

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(
        `<!-- app-data -->`,
        `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.__INITIAL_DATA__)};</script>`,
      );

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
