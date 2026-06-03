import { browser } from 'wxt/browser';
import type {
  ExtensionMessage,
  ExtensionResponse,
} from '../lib/messages';
import { resolveShopifyResource } from '../lib/shopify';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      _sender,
      sendResponse: (response: ExtensionResponse) => void,
    ) => {
      if (message.type === 'open-url') {
        browser.tabs
          .create({ url: message.url })
          .then(() => sendResponse({ ok: true }))
          .catch((error: unknown) => {
            sendResponse({
              ok: false,
              error: error instanceof Error ? error.message : 'Failed to open admin tab.',
            });
          });

        return true;
      }

      if (message.type !== 'resolve-shopify-resource') return false;

      resolveShopifyResource(message)
        .then(sendResponse)
        .catch((error: unknown) => {
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown Storefront API error.',
          });
        });

      return true;
    },
  );
});
