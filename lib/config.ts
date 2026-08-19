export const STORE_PROFILES = {
  production: {
    storeHandle: 'nuphy-store',
    storeAdminBaseUrl: 'https://admin.shopify.com/store/nuphy-store',
    storefrontBaseUrl: 'https://nuphy-store.myshopify.com',
    /** Public Storefront API access token */
    storefrontAccessToken: 'fa75348dfb0a5fd51824297acbdd704d',
  },
  dev: {
    storeHandle: 'nuphyx',
    storeAdminBaseUrl: 'https://admin.shopify.com/store/nuphyx',
    storefrontBaseUrl: 'https://nuphyx.myshopify.com',
    /** Public Storefront API access token */
    storefrontAccessToken: '50ebe48673548c659c22e42e3d75ffc7',
  },
} as const;

export type StoreKey = keyof typeof STORE_PROFILES;
export type StoreProfile = (typeof STORE_PROFILES)[StoreKey];

const ORIGIN_STORE_MAP: Record<string, StoreKey> = {
  'https://nuphy.com': 'production',
  'https://dev.nuphy.com': 'dev',
};

export const APP_CONFIG = {
  extension: {
    name: 'NuPhy Tools',
    description: 'Radial shortcuts for NuPhy storefront and Shopify admin workflows.',
    allowedOrigins: ['https://nuphy.com', 'https://dev.nuphy.com'],
    /** Injected on http(s) pages; UI mounts only on allowed origins or `site:brand` meta. */
    contentMatches: ['https://*/*', 'http://*/*'],
    hostPermissions: [
      'https://nuphy.com/*',
      'https://dev.nuphy.com/*',
      'https://nuphy-store.myshopify.com/*',
      'https://nuphyx.myshopify.com/*',
    ],
    brandMeta: {
      name: 'site:brand',
      value: 'Nuphy',
    },
  },
  shopify: {
    storefrontApiVersion: '2025-07',
    defaultPageHandle: 'home',
  },
  routes: {
    pagesSegment: 'pages',
    productsSegment: 'products',
    collectionsSegment: 'collections',
  },
} as const;

export type AppConfig = typeof APP_CONFIG;

export function resolveStoreKey(origin: string): StoreKey {
  return ORIGIN_STORE_MAP[origin] ?? 'production';
}

export function resolveStoreProfile(origin: string): StoreProfile {
  return STORE_PROFILES[resolveStoreKey(origin)];
}

export function getStoreProfile(storeKey: StoreKey): StoreProfile {
  return STORE_PROFILES[storeKey];
}

export function buildStorefrontGraphqlUrl(profile: StoreProfile) {
  const { storefrontApiVersion } = APP_CONFIG.shopify;
  return `${profile.storefrontBaseUrl}/api/${storefrontApiVersion}/graphql.json`;
}

export function buildAdminHomeUrl(profile: StoreProfile) {
  return profile.storeAdminBaseUrl;
}

export function buildFilesAdminUrl(profile: StoreProfile) {
  return `${profile.storeAdminBaseUrl}/content/files`;
}

export function buildShopMetafieldsUrl(profile: StoreProfile) {
  return `${profile.storeAdminBaseUrl}/apps/metafields-cms/shop`;
}

export function buildPageAdminUrl(profile: StoreProfile, pageId: string) {
  return `${profile.storeAdminBaseUrl}/pages/${pageId}`;
}

export function buildProductAdminUrl(profile: StoreProfile, productId: string) {
  return `${profile.storeAdminBaseUrl}/products/${productId}`;
}

export function buildPageMetafieldsUrl(profile: StoreProfile, pageId: string) {
  return `${profile.storeAdminBaseUrl}/apps/metafields-cms/pages/${pageId}`;
}

export function buildProductMetafieldsUrl(profile: StoreProfile, productId: string) {
  return `${profile.storeAdminBaseUrl}/apps/metafields-cms/products/${productId}`;
}
