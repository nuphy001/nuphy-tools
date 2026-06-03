export const APP_CONFIG = {
  extension: {
    name: 'NuPhy Tools',
    description: 'Radial shortcuts for NuPhy storefront and Shopify admin workflows.',
    allowedOrigins: ['https://nuphy.com', 'https://vercel.nuphyio.com'],
    /** Injected on http(s) pages; UI mounts only on allowed origins or `site:brand` meta. */
    contentMatches: ['https://*/*', 'http://*/*'],
    hostPermissions: ['https://nuphy.com/*', 'https://vercel.nuphyio.com/*'],
    brandMeta: {
      name: 'site:brand',
      value: 'Nuphy',
    },
  },
  shopify: {
    storeAdminBaseUrl: 'https://admin.shopify.com/store/nuphy-store',
    storefrontBaseUrl: 'https://nuphy.com',
    storefrontApiVersion: import.meta.env.WXT_SHOPIFY_STOREFRONT_API_VERSION || '2025-04',
    defaultPageHandle: 'home',
  },
  routes: {
    pagesSegment: 'pages',
    productsSegment: 'products',
    collectionsSegment: 'collections',
  }
} as const;

export type AppConfig = typeof APP_CONFIG;

export function buildStorefrontGraphqlUrl() {
  const { storefrontBaseUrl, storefrontApiVersion } = APP_CONFIG.shopify;
  return `${storefrontBaseUrl}/api/${storefrontApiVersion}/graphql.json`;
}

export function buildAdminHomeUrl() {
  return APP_CONFIG.shopify.storeAdminBaseUrl;
}

export function buildFilesAdminUrl() {
  return `${APP_CONFIG.shopify.storeAdminBaseUrl}/content/files`;
}

export function buildShopMetafieldsUrl() {
  return `${APP_CONFIG.shopify.storeAdminBaseUrl}/apps/metafields-cms/shop`;
}

export function buildPageAdminUrl(pageId: string) {
  return `${APP_CONFIG.shopify.storeAdminBaseUrl}/pages/${pageId}`;
}

export function buildProductAdminUrl(productId: string) {
  return `${APP_CONFIG.shopify.storeAdminBaseUrl}/products/${productId}`;
}

export function buildPageMetafieldsUrl(pageId: string) {
  return `${APP_CONFIG.shopify.storeAdminBaseUrl}/apps/metafields-cms/pages/${pageId}`;
}

export function buildProductMetafieldsUrl(productId: string) {
  return `${APP_CONFIG.shopify.storeAdminBaseUrl}/apps/metafields-cms/products/${productId}`;
}
