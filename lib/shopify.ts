import { buildStorefrontGraphqlUrl, APP_CONFIG } from './config';
import { cleanGid, type GidType } from './gid';
import type {
  ResolveShopifyResourceMessage,
  ResolveShopifyResourceResponse,
  ShopifyResourceKind,
} from './messages';

const QUERY_BY_RESOURCE: Record<ShopifyResourceKind, string> = {
  page: `
    query PageByHandle($handle: String!) {
      page(handle: $handle) {
        id
      }
    }
  `,
  product: `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
      }
    }
  `,
};

const GID_TYPE_BY_RESOURCE: Record<ShopifyResourceKind, GidType> = {
  page: 'Page',
  product: 'Product',
};

type StorefrontGraphqlResponse = {
  data?: {
    page?: { id: string } | null;
    product?: { id: string } | null;
  };
  errors?: Array<{ message?: string }>;
};

function getStorefrontAccessToken() {
  return import.meta.env.WXT_SHOPIFY_STOREFRONT_TOKEN || '';
}

export async function resolveShopifyResource(
  message: ResolveShopifyResourceMessage,
): Promise<ResolveShopifyResourceResponse> {
  const token = getStorefrontAccessToken();

  if (!token) {
    return {
      ok: false,
      error: 'Missing WXT_SHOPIFY_STOREFRONT_TOKEN in extension environment.',
    };
  }

  const response = await fetch(buildStorefrontGraphqlUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({
      query: QUERY_BY_RESOURCE[message.resource],
      variables: { handle: message.handle },
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `Storefront API request failed: ${response.status} ${response.statusText}`,
    };
  }

  const body = (await response.json()) as StorefrontGraphqlResponse;
  const apiError = body.errors?.map((error) => error.message).filter(Boolean).join('; ');

  if (apiError) {
    return { ok: false, error: apiError };
  }

  const gid = body.data?.[message.resource]?.id;

  if (!gid) {
    return {
      ok: false,
      error: `No ${message.resource} found for handle "${message.handle}".`,
    };
  }

  return {
    ok: true,
    gid,
    id: cleanGid(gid, GID_TYPE_BY_RESOURCE[message.resource]),
  };
}
