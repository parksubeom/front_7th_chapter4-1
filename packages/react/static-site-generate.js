import fs from "fs";
import path from "node:path";
import { createServer } from "vite";

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

const { mswServer } = await vite.ssrLoadModule("./src/mocks/node.ts");
mswServer.listen({
  onUnhandledRequest: "bypass",
});

const { render } = await vite.ssrLoadModule("./src/main-server.tsx");

const joinDist = (...pathnames) => path.join("../../dist/react", ...pathnames);

const template = fs.readFileSync(joinDist("/index.html"), "utf-8");

async function generateStaticSite(pathname) {
  const fullPathname = pathname.endsWith(".html") ? joinDist(pathname) : joinDist(pathname, "/index.html");
  const parsedPath = path.parse(fullPathname);

  const rendered = await render(pathname, {});

  const html = template
    .replace(`<!--app-head-->`, rendered.head ?? "")
    .replace(`<!--app-html-->`, rendered.html ?? "")
    .replace(
      `<!-- app-data -->`,
      `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.__INITIAL_DATA__)};</script>`,
    );

  if (!fs.existsSync(parsedPath.dir)) {
    fs.mkdirSync(parsedPath.dir, { recursive: true });
  }

  fs.writeFileSync(fullPathname, html);
}

// 404 생성
await generateStaticSite("/404.html");

// 홈 생성
await generateStaticSite("/");

// 상세페이지 생성
const { getProducts } = await vite.ssrLoadModule("./src/api/productApi.ts");
const { products } = await getProducts();
await Promise.all(products.map(async ({ productId }) => await generateStaticSite(`/product/${productId}/`)));

mswServer.close();
vite.close();
