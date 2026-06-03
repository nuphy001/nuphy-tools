'use client';

import { RadialMenu } from './index';
import { PixelPage, PixelStore, PixelShopify, PixelEdit, PixelFile, PixelCopy } from './icons';


const MENU_ITEMS_2 = [
  { id: 1, label: 'Page', icon: PixelPage },
  { id: 2, label: 'Shop', icon: PixelStore },
  { id: 3, label: 'Admin', icon: PixelShopify },
  { id: 4, label: 'Metafields', icon: PixelEdit },
  { id: 5, label: 'Files', icon: PixelFile },
  { id: 6, label: 'Copy', icon: PixelCopy },
];

export default function Home() {
  return (
    <RadialMenu
      menuItems={MENU_ITEMS_2}
      onSelect={(item) => {
        console.log(item);
      }}
    />
  );
}
