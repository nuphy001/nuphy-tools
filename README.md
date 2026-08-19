# NuPhy Tools

面向 NuPhy Shopify 店前台的浏览器扩展。在支持的页面上 **双击空白区域**，弹出径向快捷菜单，一键进入 Shopify 后台、Metafields CMS，或复制当前资源的 handle。

技术栈：[WXT](https://wxt.dev/) + React + TypeScript（Chrome MV3）。

## 功能概览

| 菜单项 | 作用 |
| --- | --- |
| **Page** | 根据当前 URL 解析 handle，经 Storefront API 查询 ID 后打开对应 **页面 / 产品** 的 Admin 编辑页 |
| **Shop** | 打开店铺级 Metafields CMS |
| **Admin** | 打开 Shopify 店铺后台首页 |
| **Metafields** | 打开当前页面或产品对应的 Metafields CMS |
| **Files** | 打开后台「内容 → 文件」 |
| **Copy** | 将当前资源的 handle 复制到剪贴板 |

交互说明：

- 点击菜单外区域、按 `Esc`、或点击中心关闭按钮可收起菜单
- 在输入框、文本域等可编辑区域内双击 **不会** 触发菜单
- `/collections/*` 页面下 **Page**、**Metafields** 为禁用状态；**Copy** 仍可用

## 支持的站点

扩展仅在以下页面挂载并响应双击：

1. [https://nuphy.com](https://nuphy.com) → 正式店 `nuphy-store`
2. [https://dev.nuphy.com](https://dev.nuphy.com) → 测试店 `nuphyx`
3. 任意包含品牌标识的页面（默认正式店）：

   ```html
   <meta name="site:brand" content="Nuphy" />
   ```

   `content` 与 `Nuphy` 比较时不区分大小写，便于 Vercel 预览等环境使用。

> Admin 链接与 Storefront API 按当前页 origin 选择店铺：`dev.nuphy.com` 走 `nuphyx.myshopify.com`，其余默认走 `nuphy-store.myshopify.com`（Headless 前台本身不提供 `/api/*/graphql.json`）。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 店铺 Token（可选核对）

Public Storefront Access Token 写在 [`lib/config.ts`](lib/config.ts) 的 `STORE_PROFILES.*.storefrontAccessToken`，API 版本在 `APP_CONFIG.shopify.storefrontApiVersion`。

### 3. 开发调试

```bash
npm run dev
```

在 Chrome 加载 WXT 输出的扩展目录后，于上述支持站点 **双击页面空白处** 打开菜单。

### 4. 构建发布

```bash
npm run build    # 产出 .output/chrome-mv3
npm run zip      # 打包为 zip
```

Firefox：`npm run dev:firefox` / `npm run build:firefox` / `npm run zip:firefox`。

## URL 与 handle 规则

| 当前路径 | 解析结果 | handle 示例 |
| --- | --- | --- |
| `/`（首页） | 页面 | `home` |
| `/pages/{slug}` | 页面 | `about-us` |
| `/products/{slug}` | 产品 | `nuphy-air75-v3` |
| `/collections/{collection}/products/{slug}` | 产品（与 `/products/{slug}` 同页） | `nuphy-node-series-low-profile` |
| `/collections/{slug}` | 集合（Page/Metafields 禁用） | `switches` |
| 其它路径 | 不支持 Page/Metafields | — |

### 各按钮跳转逻辑

**Page**（需配置 Token）

- 首页 → `.../pages/{pageId}`（handle：`home`）
- `/pages/*` → `.../pages/{pageId}`
- `/products/*` 或 `/collections/*/products/*` → `.../products/{productId}`（产品页也走 Page 项，进入产品 Admin）

**Metafields**（需配置 Token）

- 首页或 `/pages/*` → `.../apps/metafields-cms/pages/{pageId}`
- `/products/*` 或 `/collections/*/products/*` → `.../apps/metafields-cms/products/{productId}`

**Admin** → 正式站 `https://admin.shopify.com/store/nuphy-store`；`dev.nuphy.com` → `.../store/nuphyx`

**Shop** → `.../apps/metafields-cms/shop`

**Files** → `.../content/files`

**Copy** → 将上表中的 handle 写入剪贴板（集合页可复制，如 `switches`）

## 项目结构

```
entrypoints/
  background.ts       # Service Worker：开标签页、Storefront API
  nuphy.content.tsx   # Content Script：径向菜单与业务逻辑
lib/
  config.ts           # 店铺与扩展配置
  routing.ts          # 站点准入、URL 解析
  shopify.ts          # GraphQL 查询
  radial-menu/        # 可复用径向菜单组件
```

从零生成或复现扩展时，将 [prompt.md](./prompt.md) 作为 AI 提示词使用。

## 常见问题

**菜单不出现**

- 确认当前站点在「支持的站点」列表内
- 勿在输入框内双击；请在页面空白处双击
- 检查扩展是否已加载、`npm run dev` 是否在运行

**Page / Metafields 报错**

- 确认 `lib/config.ts` 里对应店铺的 `storefrontAccessToken` 已填写
- 确认当前 URL 能解析出 page/product handle（集合页不支持这两项）

**预览站可用但 API 失败**

- Storefront GraphQL 按 origin 切店：正式站 / brand-meta 预览默认 `nuphy-store.myshopify.com`，`dev.nuphy.com` 走 `nuphyx.myshopify.com`；Token 需对应店铺有效
- 若报错为 HTTP 404，多半是 API 域名误配为 Headless 前台域名（无 Storefront 端点）

## 相关文档

- [prompt.md](./prompt.md) — 提示词（非实现细节文档）
