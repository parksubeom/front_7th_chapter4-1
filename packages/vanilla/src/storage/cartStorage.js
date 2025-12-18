import { createMemoryStorage, createStorage } from "../lib";
import { isServer } from "../utils";

export const cartStorage = createStorage("shopping_cart", isServer ? createMemoryStorage() : window.localStorage);
