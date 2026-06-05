# 全端 UI 风格规范

本文档用于阶段 22C-0：UI 风格提取与设计规范沉淀。视觉基准只来自三个已完成 UI 重构的用户端主页面：

- 首页：`miniprogram/pages/index/index`
- 订单中心：`miniprogram/pages/order-list/order-list`
- 我的：`miniprogram/pages/profile/profile`

阶段 22C-1 及后续用户端页面 UI 重构，应先遵守本文档和 `docs/ui-refactor-guardrails.md`，再按页面实际内容做局部调整。

阶段 24A 将本文档扩展为全端 UI 统一性体检与设计规范收口文档。后续用户端、师傅端、商家端、管理员端页面都应优先遵守本规范，再结合角色主题做局部差异化。

## 1. 设计方向

用户端页面整体气质是“社区便民、清爽可信、重复使用不累”。界面应优先服务用户快速浏览、比较、下单、查看状态，不做营销站式大面积装饰。

核心视觉关键词：

- 浅灰页面背景
- 白色大圆角卡片
- 社区绿色主色
- 暖橙价格与金额
- 胶囊按钮和状态标签
- 柔和阴影
- 统一空状态与加载状态
- 本地图片或渐变占位，不引入随机网络图片

## 2. 色彩规范

| 用途 | 推荐色值 | 来源与说明 |
| ---- | -------- | ---------- |
| 页面背景 | `#f7f8fa` | 首页、订单中心主背景；我的页可使用接近的 `#f8fafb` |
| 主文字 | `#111827` | 首页、订单中心标题与主要内容 |
| 深色主文字变体 | `#152323` / `#122020` | 我的页标题与账号信息 |
| 次级文字 | `#6b7280` / `#64716d` / `#5f6770` | 描述、地址、说明、辅助信息 |
| 弱提示文字 | `#9ca3af` / `#8a8f98` | placeholder、箭头、低优先级提示 |
| 主绿色 | `#16a34a` | 主按钮、激活 tab、重点状态 |
| 社区绿色 | `#18a058` / `#19a64a` | 图标、边框、我的页按钮 |
| 深绿色 | `#128a43` / `#15803d` | Banner 标题、保障条标题 |
| 暖橙价格 | `#ff6a00` | 价格、待支付/待接单类金额强调 |
| 卡片边线 | `#eef0f2` / `#edf0f2` / `#d1d5db` | 轻边框与列表分隔线 |
| 浅绿底 | `#eaf8e8` / `#eefbea` | 功能卡、状态底、头像底 |
| 占位底 | `#eef2f3` / `#dfe8e3` | 缺失图片或媒体占位 |

使用规则：

- 一个页面应以浅灰背景、白卡和绿色动作为主，不要把整页做成单一绿色。
- 金额、价格、待支付提醒使用暖橙，不要使用红色制造风险感。
- 红色只用于错误、危险、审核驳回等真实风险状态。

## 3. 字体与字号

统一使用系统中文字体栈：

```css
-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif
```

字号层级：

| 层级 | 推荐字号 | 字重 | 用途 |
| ---- | -------- | ---- | ---- |
| 页面标题 | `42rpx` - `44rpx` | `800` | 首页问候、订单中心标题、我的页标题 |
| Banner 大标题 | `46rpx` | `900` | 首页主 Banner |
| 卡片标题 | `30rpx` - `32rpx` | `700` - `800` | 区块标题、服务名、账号资料 |
| 正文 | `28rpx` - `30rpx` | `500` - `700` | 菜单行、服务分类、用户昵称 |
| 辅助文案 | `23rpx` - `26rpx` | `400` - `600` | 描述、地址、时间、hint |
| 按钮 | `24rpx` - `30rpx` | `700` | 操作按钮 |
| 状态标签 | `23rpx` | `700` | `status-tag` |

文本布局规则：

- 紧凑卡片内的长文本必须使用 `min-width: 0`、`overflow: hidden`、`text-overflow: ellipsis` 和 `white-space: nowrap`。
- 标题不要使用 viewport 自适应字号。
- 字间距保持默认，不使用负 letter-spacing。

## 4. 页面壳与间距

用户端主页面推荐页面壳：

```css
min-height: 100vh;
box-sizing: border-box;
padding: 90rpx 32rpx 170rpx;
background: #f7f8fa;
color: #111827;
font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
```

横向 padding：

- 首页、我的页：`40rpx`，适合入口型页面和账号页。
- 订单中心、列表页：`32rpx`，适合更高信息密度。

垂直节奏：

- 顶部安全留白：`90rpx` - `96rpx`。
- 区块间距：`22rpx` - `34rpx`。
- 卡片内边距：`24rpx` - `30rpx`。
- 原生或自定义 tabbar 兼容底部：`170rpx`，必要时叠加 `env(safe-area-inset-bottom)`。

## 5. 卡片规范

基础白卡：

- 背景：`#ffffff`
- 圆角：`24rpx` - `28rpx`
- 内边距：`24rpx` - `30rpx`
- 阴影：`0 8rpx 28rpx rgba(31, 41, 55, 0.06)` 或 `0 12rpx 36rpx rgba(0, 0, 0, 0.06)`

紧凑列表卡：

- 圆角可降到 `16rpx`
- 边框使用 `1rpx solid #eef0f2`
- 媒体图圆角 `10rpx` - `14rpx`

浅绿功能卡：

- 用于账号信息、Banner、保障条。
- 推荐渐变：`linear-gradient(135deg, #eefbea 0%, #e4f8e4 55%, #ddf4dd 100%)`
- 只用于强调入口，不要连续堆叠多个大面积浅绿卡。

## 6. 按钮规范

主按钮：

- 背景：`#16a34a`
- 文字：`#ffffff`
- 圆角：`999rpx`
- 高度：`50rpx` - `72rpx`
- 字重：`700`

次级按钮：

- 背景：`#ffffff`
- 文字：`#4b5563` 或 `#19a64a`
- 边框：`1rpx solid #d1d5db` 或 `2rpx solid #19a64a`
- 操作密度高的订单卡片中优先使用胶囊次级按钮。

按钮规则：

- 所有微信 `button` 重置 `::after { border: 0; }`。
- 按钮文字必须完整显示，紧凑按钮需要固定高度和 `white-space: nowrap`。
- 页面级主操作可更高，卡片内操作应保持紧凑。

## 7. 状态、空状态与加载

状态展示：

- 页面 JS 中优先使用 `getStatusView(type, status)` 获取 `{ text, tone }`。
- WXML 中优先使用 `status-tag` 展示。
- `status-tag` 只负责展示，不在组件内判断业务状态。
- 新增 tone 前先确认是否可以复用 `default`、`warning`、`danger`、`success` 或订单中心已有 tone。

空状态：

- 优先使用 `empty-state`。
- 空状态文案应告诉用户下一步，例如“去首页看看需要的服务吧”。
- 页面内不要重复手写临时空状态结构。

加载状态：

- 优先使用 `loading-view`。
- 列表页建议在 `loading && !list.length` 时展示，避免刷新时闪烁清空旧内容。

## 8. 图片与占位

图片来源规则：

- 优先使用本地托管图片资源。
- 缺失图片素材统一使用空白占位或渐变占位。
- 不引入随机网络图片、远程 stock 图或不可控第三方图片。

占位规范：

- 媒体占位底色：`linear-gradient(135deg, #eef2f3 0%, #dfe8e3 100%)`
- 头像占位底色：`#f4fff2`
- Banner 可使用浅绿渐变底。

## 9. 后续页面使用方式

阶段 22C-1 开始，用户端页面可以按需引入：

```css
@import "../../styles/ui-kit.wxss";
```

路径层级不同的页面按实际相对路径调整。`ui-kit.wxss` 只提供公共 class，不自动改全局页面样式。页面重构时应优先复用：

- `.ui-page`
- `.ui-page--dense`
- `.ui-header`
- `.ui-title`
- `.ui-subtitle`
- `.ui-card`
- `.ui-feature-card`
- `.ui-section-head`
- `.ui-section-title`
- `.ui-primary-button`
- `.ui-secondary-button`
- `.ui-price`
- `.ui-media-placeholder`
- `.ui-safe-tabbar`

## 10. 22C-1 页面优先级

22C-1 不全量修改所有页面。建议顺序：

1. 服务列表 `service-list`
2. 服务详情 `service-detail`
3. 地址列表 `address-list`
4. 消息中心 `message-list`
5. 优惠券与会员等用户端辅助页面

我的页 `profile` 已作为本规范基准之一，本轮不重复改造。

## 11. 禁止事项

UI 阶段不得新增或修改以下业务能力：

- 真实支付
- 真实退款
- 真实分账
- 真实提现
- 真实身份证认证
- 真实营业执照认证
- 真实保险核验
- 真实保证金支付
- 自动派单
- AI 派单
- 路径规划
- 实时轨迹
- 多门店
- 分佣
- 合伙人系统

不得修改 cloudfunctions、services、订单状态机、支付、退款、财务、派单、资质、保证金和 LBS 核心逻辑。

## 12. 阶段 24A 全端 UI 统一性体检

阶段 24A 的目标是记录已经完成 UI 重构的页面、沉淀全端共用规则，并为后续管理员端二级页面收口建立保护清单。本阶段不开发新业务，不接入真实支付、退款、提现、分账、真实认证、OCR、保证金支付或真实风控。

设计系统方向采用“可访问、克制、可重复操作”的运营型小程序界面：高对比文字、稳定触控尺寸、清晰层级、浅灰背景、白色卡片、胶囊按钮和明确状态反馈。角色端可以保留不同主题色和导航结构，但页面结构、状态表达和操作反馈应一致。

### 12.1 用户端已完成 UI 重构页面

| 页面组 | 页面 |
| ---- | ---- |
| 一级与基准页 | `pages/index/index`、`pages/order-list/order-list`、`pages/profile/profile` |
| 服务与交易 | `pages/service-list/service-list`、`pages/service-detail/service-detail`、`pages/order-submit/order-submit`、`pages/order-detail/order-detail`、`pages/pay-result/pay-result` |
| 账户与消息 | `pages/address-list/address-list`、`pages/address-edit/address-edit`、`pages/message-list/message-list`、`pages/profile-edit/profile-edit` |
| 营销与会员 | `pages/coupon/list/list`、`pages/coupon/receive/receive`、`pages/member/center/center` |
| 售后与评价 | `pages/after-sale/apply/apply`、`pages/after-sale/detail/detail`、`pages/review/review`、`pages/review/detail/detail`、`pages/review/followup/followup` |
| 补充用户可访问页 | `pages/worker-detail/worker-detail`、`pages/tip/create/create`、`pages/map/pick-location/pick-location`、`pages/merchant/store-list/store-list`、`pages/merchant/store-detail/store-detail` |

用户端页面优先使用 `miniprogram/styles/ui-kit.wxss`，加载态和空状态优先使用 `loading-view` 与 `empty-state`，复杂状态优先使用 `status-tag`。

### 12.2 师傅端已完成 UI 重构页面

| 页面组 | 页面 |
| ---- | ---- |
| 一级页 | `pages/worker/order-hall/order-hall`、`pages/worker/order-list/order-list`、`pages/worker/profile/profile` |
| 次级页 | `pages/worker/order-detail/order-detail`、`pages/worker/income/income`、`pages/worker/review-list/review-list`、`pages/worker/review-detail/review-detail`、`pages/worker/apply/apply`、`pages/worker/audit-status/audit-status`、`pages/worker/tip-list/tip-list` |
| 服务范围 | `pages/provider/service-range/service-range` |

师傅端一级页使用 `worker-tab-bar`，次级页优先使用 `miniprogram/styles/worker-subpage.wxss`。收益、评价、服务范围等页面必须继续说明内部模拟、人工审核、基础 LBS 边界。

### 12.3 商家端已完成 UI 重构页面

| 页面组 | 页面 |
| ---- | ---- |
| 一级页 | `pages/merchant/profile/profile`、`pages/merchant/order-list/order-list`、`pages/merchant/service-list/service-list`、`pages/merchant/income/income`、`pages/merchant/audit-status/audit-status` |
| 二级页 | `pages/merchant/apply/apply`、`pages/merchant/service-edit/service-edit`、`pages/merchant/order-detail/order-detail`、`pages/merchant/qualification/qualification`、`pages/merchant/deposit/deposit`、`pages/merchant/risk-status/risk-status` |

商家端页面优先使用 `/styles/merchant-theme.wxss` 绝对路径，并保留 mock 保证金、资料留档、人工审核和内部模拟风控边界。`store-list` 与 `store-detail` 是用户访问商家店铺浏览页，仍归入用户端补充页面样式。

### 12.4 管理员端已完成 UI 重构页面

| 页面组 | 页面 |
| ---- | ---- |
| 一级聚合页 | `pages/admin/dashboard/dashboard`、`pages/admin/order-list/order-list`、`pages/admin/review-center/review-center`、`pages/admin/operation-center/operation-center`、`pages/admin/profile/profile` |
| 24B-1 二级页 | `pages/admin/order-detail/order-detail`、`pages/admin/worker-audit/worker-audit`、`pages/admin/after-sale-list/after-sale-list`、`pages/admin/after-sale-detail/after-sale-detail`、`pages/admin/review-list/review-list`、`pages/admin/review-detail/review-detail`、`pages/admin/review-appeal-list/review-appeal-list`、`pages/admin/review-appeal-detail/review-appeal-detail` |

管理员端一级页使用 `admin-tab-bar` 和 `miniprogram/styles/admin-theme.wxss`。阶段 24B-1 起，管理员二级页按小批次迁移到 `admin-page`、`admin-header`、`admin-section-card`、`admin-status-card`、`admin-filter-card`、`admin-list-card` 和 `admin-action-card` 结构；页面必须保留人工审核、mock 退款、内部模拟和后端为准的能力边界说明。

### 12.5 全端统一规则

| 检查项 | 规则 |
| ---- | ---- |
| 页面壳 | 页面必须有明确角色壳：用户端 `ui-page`，师傅次级页 `worker-subpage`，商家端 `merchant-page`，管理员一级页 `admin-page`。 |
| 背景色 | 使用浅灰或轻微角色色相浅底，不使用大面积深色背景，不使用单一高饱和色铺满页面。 |
| 卡片 | 信息分组优先使用白色圆角卡片，圆角通常为 `24rpx` - `32rpx`，阴影柔和，不做嵌套卡片堆叠。 |
| 标题 | 页面标题与副标题形成稳定头部；二级页应说明页面任务和真实能力边界。 |
| 按钮 | 主按钮、次按钮、底部操作按钮使用胶囊形态 `border-radius: 999rpx`，固定高度，文字不换行不溢出。 |
| 状态标签 | 状态优先使用 `getStatusView(type, status)` 和 `status-tag`；角色本地 pill 仅用于非状态的分类/说明。 |
| 空状态 | 列表为空优先使用 `empty-state` 或角色主题空态，文案给出下一步。 |
| 加载态 | 优先使用 `loading-view`，商家端可使用 `merchant-loading`，避免加载时误显示空数据。 |
| 错误态 | 错误态应使用轻量卡片或角色主题错误态，避免只弹 toast 后页面空白。 |
| 底部操作栏 | 交易或审核类页面可使用固定底部操作栏；按钮数量控制在 1-2 个主操作，危险操作必须降级为次级或警示样式。 |

### 12.6 本轮 UI 问题清单

| 优先级 | 问题 | 处理 |
| ---- | ---- | ---- |
| P1 | 管理员端二级页面仍多为旧 `page-shell` / `panel` 风格，与管理员一级页不一致。 | 记录为下一阶段主要范围。 |
| P1 | 管理员端部分二级页仍使用本地 `.status-tag`，尚未统一到共享 `status-tag`。 | 下一阶段迁移，避免本轮大范围重写。 |
| P2 | 商家端和管理员端主题主按钮圆角曾为 `16rpx`，与全端胶囊按钮规则不一致。 | 阶段 24A 已修复为 `999rpx`。 |
| P2 | 商家端错误态使用角色内置 `merchant-error`，用户/师傅/管理员多为页面内提示，错误态还未完全组件化。 | 暂不修复，后续按角色逐页收敛。 |
| P2 | 本轮未做真机截图验收，宽屏或极窄屏细节仍需人工抽查。 | 保留为后续视觉 QA 项。 |

### 12.7 管理员端二级页面下一阶段建议

阶段 24B-1 已进入管理员端二级页面 UI 收口，第一批处理：

1. `pages/admin/order-detail/order-detail`
2. `pages/admin/worker-audit/worker-audit`
3. `pages/admin/after-sale-list/after-sale-list`
4. `pages/admin/after-sale-detail/after-sale-detail`
5. `pages/admin/review-list/review-list`
6. `pages/admin/review-detail/review-detail`
7. `pages/admin/review-appeal-list/review-appeal-list`
8. `pages/admin/review-appeal-detail/review-appeal-detail`

下一批 24B-2 建议处理：

1. `pages/admin/category-list/category-list`
2. `pages/admin/category-edit/category-edit`
3. `pages/admin/service-list/service-list`
4. `pages/admin/service-edit/service-edit`
5. `pages/admin/area-list/area-list`
6. `pages/admin/area-edit/area-edit`
7. `pages/admin/assign-worker/assign-worker`
8. `pages/admin/dispatch-logs/dispatch-logs`

管理员二级页收口必须继续禁止修改云函数、services、schema、订单状态机、支付、退款、财务、保证金、认证、风控核心逻辑和数据库字段语义。
