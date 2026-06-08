import { APP_CONFIG } from './config';

export type StorefrontResource =
  | { kind: 'page'; handle: string }
  | { kind: 'product'; handle: string }
  | { kind: 'collection'; handle: string }
  | { kind: 'unsupported'; reason: string };

export function isAllowedOrigin(url: URL) {
  return APP_CONFIG.extension.allowedOrigins.includes(url.origin as (typeof APP_CONFIG.extension.allowedOrigins)[number]);
}

export function hasNuphyBrandMeta(doc: Document = document) {
  const { name, value } = APP_CONFIG.extension.brandMeta;
  const meta = doc.querySelector(`meta[name="${name}"]`);
  if (!meta) return false;

  const content = meta.getAttribute('content')?.trim();
  return content?.toLowerCase() === value.toLowerCase();
}

export function isAllowedSite(url: URL, doc: Document = document) {
  return isAllowedOrigin(url) || hasNuphyBrandMeta(doc);
}

export function getStorefrontResource(url: URL, doc: Document = document): StorefrontResource {
  if (!isAllowedSite(url, doc)) {
    return { kind: 'unsupported', reason: 'This shortcut only runs on NuPhy storefronts.' };
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const [firstSegment, secondSegment, thirdSegment, fourthSegment] = segments;

  if (!firstSegment) {
    return { kind: 'page', handle: APP_CONFIG.shopify.defaultPageHandle };
  }

  if (firstSegment === APP_CONFIG.routes.collectionsSegment) {
    // Same product page as /products/{handle}; only the URL shape differs.
    if (
      secondSegment &&
      thirdSegment === APP_CONFIG.routes.productsSegment &&
      fourthSegment
    ) {
      return { kind: 'product', handle: fourthSegment };
    }

    return { kind: 'collection', handle: secondSegment || '' };
  }

  if (firstSegment === APP_CONFIG.routes.pagesSegment && secondSegment) {
    return { kind: 'page', handle: secondSegment };
  }

  if (firstSegment === APP_CONFIG.routes.productsSegment && secondSegment) {
    return { kind: 'product', handle: secondSegment };
  }

  return { kind: 'unsupported', reason: 'No Shopify page or product handle was found for this URL.' };
}
