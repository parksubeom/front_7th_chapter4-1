import { createStorage } from "@hanghae-plus/lib";
import { isServer } from "../../../utils";
import type { Cart } from "../types";

const memoryStorage: Storage = {
  getItem() {
    return null;
  },
  setItem() {},
  removeItem() {},
  clear() {},
  key() {
    return null;
  },
  length: 0,
};

export const cartStorage = createStorage<{
  items: Cart[];
  selectedAll: boolean;
}>("shopping_cart", isServer ? memoryStorage : window.localStorage);
