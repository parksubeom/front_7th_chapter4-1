// 글로벌 라우터 인스턴스
import type { FC } from "react";
import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const routes: Record<string, FC<any>> = {
  "/": HomePage,
  "/product/:id/": ProductDetailPage,
  ".*": NotFoundPage,
};
