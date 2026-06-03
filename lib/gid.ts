export type GidType = 'Page' | 'Product';

export const makeGid = (id: string, type: GidType = 'Product') => {
  return id.startsWith('gid://shopify/') ? id : `gid://shopify/${type}/${id}`;
};

export const cleanGid = (id: string, type: GidType = 'Product') => {
  return id.replace(`gid://shopify/${type}/`, '');
};
