# NuPhy Tools Prompt

---

## 任务

使用 [WXT](https://wxt.dev/) + React + TypeScript 构建 **Chrome MV3 浏览器扩展**「NuPhy Tools」。

在 NuPhy 店前台页面上，用户 **双击页面空白处** 弹出 **径向菜单（radial menu）**，提供 6 个快捷操作；支持 **点击菜单外关闭**、按 `Esc` 关闭、中心关闭按钮；菜单有关闭动画。

径向菜单用 **SVG + CSS** 实现，不要引入 UI 组件库。

---

## 生效页面

扩展只在以下页面工作（其它页面不挂载、不响应双击）：

1. `https://nuphy.com`
2. `https://dev.nuphy.com`
3. 任意页面若包含：`<meta name="site:brand" content="Nuphy" />`（`content` 与 `Nuphy` 比较不区分大小写，便于预览环境）

在输入框、文本域、`contenteditable` 等可编辑区域内双击 **不要** 弹出菜单。

---

## 径向菜单（6 项）

| 菜单 | 行为 |
| --- | --- |
| **Page** | 根据当前 URL 解析 handle，调用 Shopify Storefront API 查 id，打开 Shopify Admin 对应编辑页 |
| **Shop** | 打开 `https://admin.shopify.com/store/nuphy-store/apps/metafields-cms/shop` |
| **Admin** | 打开 `https://admin.shopify.com/store/nuphy-store` |
| **Metafields** | 同 Page 的解析规则，打开 Metafields CMS 中对应 page/product |
| **Files** | 打开 `https://admin.shopify.com/store/nuphy-store/content/files` |
| **Copy** | 将当前资源的 handle 复制到剪贴板 |

### 设计风格

整体气质：**深色工具面板 + 像素风图标 + NuPhy 黄绿点缀**，简洁、游戏装备快捷键（遵循Radial Menu设计），不要做成花哨的消费级弹窗。

**布局与形态**

- 圆环形径向菜单，约 6 等分扇区，默认直径约 260px，在双击位置附近弹出，靠近视口边缘时自动偏移避免裁切
- 每个扇区：上方像素风线性图标（SVG，`currentColor`），下方短英文标签（Page / Shop / Admin 等）
- 中心为圆形关闭按钮，与外围扇区视觉分离

**配色**

- 扇区底色：近黑（如 `#0a0a0a`），描边为半透明白线
- Hover：扇区略提亮（如 `#1a1a1a`），外环可加一层深色高亮（如 `#141414`）
- 图标与文字：白色；Hover 时文字可略降透明度
- **关闭按钮**：黄绿渐变（如 `#d6f54a` → `#c5ea2c`），作为全菜单唯一高饱和色，呼应 NuPhy 品牌
- 禁用项：整体约 50% 透明度，`not-allowed` 光标，不可点击

**动画效果**

- 打开：约 200ms，自中心轻微放大（scale ≈ 0.72 → 1）并带小角度旋转归正（如 -8° → 0°），同时淡入
- 关闭：反向淡出缩小；菜单未完全关闭前仍可显示错误 toast

**图标素材**

- 统一 8-bit / 像素网格 风格（24×24 viewBox），线条硬朗，不要圆润的 Heroicons / Lucide 风格
- 六项各配一个语义图标：页面、店铺、后台、编辑/字段、文件、复制；关闭按钮单独像素 × 图标

**错误 Toast**

- 屏幕底部居中，深底（如 `#141414`）白字、圆角小条，不遮挡径向菜单主体

**交互细节**

- 菜单未展开时不拦截页面点击；展开后仅菜单区域可点
- 扇区 Hover 有即时填充反馈；禁用扇区无 Hover 高亮
- `clickOutSide` 效果

---

## URL 与 handle 规则

| 路径 | handle | Page / Metafields | Copy |
| --- | --- | --- | --- |
| 首页 `/` | `home` | ✅ | ✅ |
| `/pages/{slug}` | slug | ✅ | ✅ |
| `/products/{slug}` | slug | ✅（产品进 products Admin） | ✅ |
| `/collections/{collection}/products/{slug}` | slug | ✅（同 `/products/{slug}`） | ✅ |
| `/collections/{slug}` | slug | ❌ 禁用 | ✅ |
| 其它 | — | ❌ 禁用 | — |

**Page 跳转：**

- 首页或 `/pages/*` → `.../pages/{pageId}`
- `/products/*` → `.../products/{productId}`

**Metafields 跳转：**

- 首页或 `/pages/*` → `.../apps/metafields-cms/pages/{pageId}`
- `/products/*` → `.../apps/metafields-cms/products/{productId}`

**Copy：** 将上表 handle 写入剪贴板。

API 查 id：首页 handle 为 `home`；其余从路径解析。查不到或缺 token 时用页面底部 toast 提示错误。

---

## 实现约束

- 配置集中管理：新建一个 `config.ts` 维护
- 兼容 http(s) URL，并且仅在生效页面挂载 Tools
- UI 最好放在 Shadow DOM，平时不阻挡页面点击；错误处理可以使用 toast
- 如果是SPA，URL 变更后后菜单禁用状态从新判断
- TypeScript strict；`npm run build` 保证能通过
- build 后自测，调用 MCP 工具安装本地浏览器插件并测试完整流程
- 避免 content script CORS 问题

---

## 自测验收

- 在 `nuphy.com`、`dev.nuphy.com`、带品牌 meta 的预览页：双击空白处出现 6 项菜单
- 菜单外点击 / Esc / 中心按钮可关闭
- 各按钮跳转与 Copy 行为符合上表
- `/collections/*` 上 Page、Metafields 为灰色不可点，Copy 仍可用
- 未配置 token 时 Page/Metafields 有明确错误提示（或tools禁用）
