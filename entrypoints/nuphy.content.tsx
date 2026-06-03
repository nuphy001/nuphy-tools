import '../styles/index.css';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import {
  APP_CONFIG,
  buildAdminHomeUrl,
  buildFilesAdminUrl,
  buildPageAdminUrl,
  buildPageMetafieldsUrl,
  buildProductAdminUrl,
  buildProductMetafieldsUrl,
  buildShopMetafieldsUrl,
} from '../lib/config';
import type {
  ResolveShopifyResourceMessage,
  ResolveShopifyResourceResponse,
  ShopifyResourceKind,
  OpenUrlResponse,
} from '../lib/messages';
import {
  RadialMenu,
  type MenuItem,
  type RadialMenuHandle,
} from '../lib/radial-menu';
import {
  PixelCopy,
  PixelEdit,
  PixelFile,
  PixelPage,
  PixelShopify,
  PixelStore,
} from '../lib/radial-menu/icons';
import {
  getStorefrontResource,
  isAllowedSite,
  type StorefrontResource,
} from '../lib/routing';

type ShortcutAction = 'page' | 'shop' | 'admin' | 'metafields' | 'files' | 'copy';

const MENU_ITEMS: MenuItem[] = [
  { id: 1, label: 'Page', icon: PixelPage },
  { id: 2, label: 'Shop', icon: PixelStore },
  { id: 3, label: 'Admin', icon: PixelShopify },
  { id: 4, label: 'Metafields', icon: PixelEdit },
  { id: 5, label: 'Files', icon: PixelFile },
  { id: 6, label: 'Copy', icon: PixelCopy },
];

const ACTION_BY_ID: Record<number, ShortcutAction> = {
  1: 'page',
  2: 'shop',
  3: 'admin',
  4: 'metafields',
  5: 'files',
  6: 'copy',
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'),
  );
}

async function resolveResource(resource: ShopifyResourceKind, handle: string) {
  const message: ResolveShopifyResourceMessage = {
    type: 'resolve-shopify-resource',
    resource,
    handle,
  };

  return browser.runtime.sendMessage(message) as Promise<ResolveShopifyResourceResponse>;
}

async function openUrl(url: string) {
  return browser.runtime.sendMessage({ type: 'open-url', url }) as Promise<OpenUrlResponse>;
}

function getPageDisabledState(resource: StorefrontResource) {
  return resource.kind === 'collection' || resource.kind === 'unsupported';
}

function useCurrentResource() {
  const [resource, setResource] = useState(() => getStorefrontResource(new URL(window.location.href)));

  useEffect(() => {
    let lastHref = window.location.href;
    const intervalId = window.setInterval(() => {
      if (window.location.href === lastHref) return;

      lastHref = window.location.href;
      setResource(getStorefrontResource(new URL(lastHref)));
    }, 400);

    return () => window.clearInterval(intervalId);
  }, []);

  return resource;
}

function ErrorToast({
  message,
  portalContainer,
}: {
  message: string;
  portalContainer: HTMLElement;
}) {
  return createPortal(
    <div className="nuphy-tools-toast" role="status">
      {message}
    </div>,
    portalContainer,
  );
}

function NuphyToolsApp({ portalContainer }: { portalContainer: HTMLElement }) {
  const menuRef = useRef<RadialMenuHandle>(null);
  const [busy, setBusy] = useState<ShortcutAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentResource = useCurrentResource();

  const menuItems = useMemo(
    () =>
      MENU_ITEMS.map((item) => {
        const action = ACTION_BY_ID[item.id];
        return {
          ...item,
          disabled:
            (action === 'page' || action === 'metafields') &&
            getPageDisabledState(currentResource),
        };
      }),
    [currentResource],
  );

  const canOpen = useCallback((event: MouseEvent) => {
    if (isEditableTarget(event.target)) return false;

    const url = new URL(window.location.href);
    return isAllowedSite(url);
  }, []);

  const goToResource = useCallback(
    async (
      itemId: Extract<ShortcutAction, 'page' | 'metafields'>,
      resource: Exclude<StorefrontResource, { kind: 'collection' | 'unsupported' }>,
    ) => {
      setBusy(itemId);
      setError(null);

      const response = await resolveResource(resource.kind, resource.handle);

      if (!response.ok) {
        setError(response.error);
        setBusy(null);
        return false;
      }

      const url =
        itemId === 'page'
          ? resource.kind === 'page'
            ? buildPageAdminUrl(response.id)
            : buildProductAdminUrl(response.id)
          : resource.kind === 'page'
            ? buildPageMetafieldsUrl(response.id)
            : buildProductMetafieldsUrl(response.id);

      const openResponse = await openUrl(url);
      if (!openResponse.ok) {
        setError(openResponse.error);
        setBusy(null);
        return false;
      }

      setBusy(null);
      return true;
    },
    [],
  );

  const handleSelect = useCallback(
    async (item: MenuItem) => {
      const action = ACTION_BY_ID[item.id];
      if (!action || item.disabled || busy) return;

      setError(null);
      const resource = getStorefrontResource(new URL(window.location.href));

      if (action === 'admin') {
        const response = await openUrl(buildAdminHomeUrl());
        if (!response.ok) {
          setError(response.error);
          return;
        }
        menuRef.current?.close();
        return;
      }

      if (action === 'shop') {
        const response = await openUrl(buildShopMetafieldsUrl());
        if (!response.ok) {
          setError(response.error);
          return;
        }
        menuRef.current?.close();
        return;
      }

      if (action === 'files') {
        const response = await openUrl(buildFilesAdminUrl());
        if (!response.ok) {
          setError(response.error);
          return;
        }
        menuRef.current?.close();
        return;
      }

      if (action === 'copy') {
        if (resource.kind === 'unsupported') {
          setError(resource.reason);
          return;
        }

        try {
          await navigator.clipboard.writeText(resource.handle);
          menuRef.current?.close();
        } catch {
          setError('Failed to copy handle.');
        }
        return;
      }

      if (resource.kind === 'collection') {
        setError('Collections pages are ignored.');
        return;
      }

      if (resource.kind === 'unsupported') {
        setError(resource.reason);
        return;
      }

      const ok = await goToResource(action, resource);
      if (ok) menuRef.current?.close();
    },
    [busy, goToResource],
  );

  return (
    <div className="nuphy-tools">
      <RadialMenu
        ref={menuRef}
        menuItems={menuItems}
        closeOnSelect={false}
        canOpen={canOpen}
        portalContainer={portalContainer}
        onOpenChange={(open) => {
          if (!open) setError(null);
        }}
        onSelect={(item) => {
          void handleSelect(item);
        }}
      />
      {error ? <ErrorToast message={error} portalContainer={portalContainer} /> : null}
    </div>
  );
}

export default defineContentScript({
  matches: [...APP_CONFIG.extension.contentMatches],
  cssInjectionMode: 'ui',
  runAt: 'document_idle',
  async main(ctx) {
    if (!isAllowedSite(new URL(window.location.href))) return;

    const ui = await createShadowRootUi(ctx, {
      name: 'nuphy-tools-ui',
      // overlay = 0×0 anchor; modal stretches shadow <html> to full viewport and blocks the page.
      position: 'overlay',
      alignment: 'top-left',
      zIndex: 2_147_483_647,
      onMount(container) {
        const root = createRoot(container);
        root.render(
          <React.StrictMode>
            <NuphyToolsApp portalContainer={container} />
          </React.StrictMode>,
        );
        return root;
      },
      onRemove(mounted) {
        mounted?.unmount();
      },
    });

    ui.mount();
  },
});
