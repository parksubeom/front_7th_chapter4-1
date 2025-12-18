import type { StringRecord } from "@hanghae-plus/lib";
import type { FC } from "react";

interface ServerParams {
  query: StringRecord;
  params: StringRecord;
}

export interface ServerOptions {
  ssr: ({ query }: ServerParams) => Promise<unknown>;
  metadata: ({ query }: ServerParams) => Promise<{ title: string }>;
}

export const withServer = <P extends Record<string, unknown>>(serverOptions: ServerOptions, Component: FC<P>) => {
  const Page: FC<P> = (props: P) => <Component {...props} />;
  Object.assign(Page, serverOptions);

  return Page;
};
