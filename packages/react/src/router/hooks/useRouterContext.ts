import type { RouterInstance } from "@hanghae-plus/lib";
import { createContext, useContext, type FC } from "react";

export const RouterContext = createContext<RouterInstance<FC> | null>(null);

export const useRouterContext = () => {
  const router = useContext(RouterContext);

  if (!router) {
    throw new Error("Router context not found");
  }

  return router;
};
