import type { StoreKey } from './config';

export type ShopifyResourceKind = 'page' | 'product';

export type ResolveShopifyResourceMessage = {
  type: 'resolve-shopify-resource';
  resource: ShopifyResourceKind;
  handle: string;
  storeKey: StoreKey;
};

export type OpenUrlMessage = {
  type: 'open-url';
  url: string;
};

export type ResolveShopifyResourceResponse =
  | { ok: true; id: string; gid: string }
  | { ok: false; error: string };

export type OpenUrlResponse =
  | { ok: true }
  | { ok: false; error: string };

export type ExtensionResponse = ResolveShopifyResourceResponse | OpenUrlResponse;

export type ExtensionMessage = ResolveShopifyResourceMessage | OpenUrlMessage;
