# 用户端 UI 风格规范

本文档用于阶段 22C-0：UI 风格提取与设计规范沉淀。视觉基准只来自三个已完成 UI 重构的用户端主页面：

- 首页：`miniprogram/pages/index/index`
- 订单中心：`miniprogram/pages/order-list/order-list`
- 我的：`miniprogram/pages/profile/profile`

阶段 22C-1 及后续用户端页面 UI 重构，应先遵守本文档和 `docs/ui-refactor-guardrails.md`，再按页面实际内容做局部调整。

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
