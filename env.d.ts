/// <reference types="wxt/client" />

interface ImportMetaEnv {
  readonly WXT_SHOPIFY_STOREFRONT_TOKEN?: string;
  readonly WXT_SHOPIFY_STOREFRONT_API_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
