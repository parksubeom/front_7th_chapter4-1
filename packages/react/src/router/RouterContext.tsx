import type { RouterInstance } from "@hanghae-plus/lib";
import type { FC } from "react";
import { RouterContext } from "./hooks/useRouterContext";

interface Props {
  router: RouterInstance<FC>;
  children: React.ReactNode;
}

export const RouterProvider = ({ children, router }: Props) => {
  return <RouterContext value={router}>{children}</RouterContext>;
};
