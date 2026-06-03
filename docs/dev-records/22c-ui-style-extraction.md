# 阶段 22C-0：UI 风格提取与设计规范沉淀

## 1. 阶段基本信息

- 阶段编号：22C-0
- 阶段名称：UI 风格提取与设计规范沉淀
- 开始时间：2026-06-03
- 完成时间：2026-06-03
- 阶段状态：已完成基础版

## 2. 本阶段目标

以已完成 UI 重构的三个用户端主页面为唯一视觉基准，提取统一视觉规范并沉淀为文档和公共样式工具，供后续 22C-1 用户端核心页面逐页重构使用。本阶段不做全量页面修改。

视觉基准页面：

- 首页 `miniprogram/pages/index/index`
- 订单中心 `miniprogram/pages/order-list/order-list`
- 我的 `miniprogram/pages/profile/profile`

## 3. 本阶段完成内容

- [x] 新增 `docs/ui-style-guide.md`，沉淀用户端 UI 色彩、字号、间距、卡片、按钮、状态、空状态、加载状态和图片占位规范。
- [x] 新增 `miniprogram/styles/ui-kit.wxss`，提供后续页面按需 `@import` 的公共样式工具类。
- [x] 新增阶段测试，锁定 22C-0 文件、视觉基准、业务边界和组件规范。
- [x] 更新阶段索引，记录 22C-0 已完成，并把下一步明确为 22C-1 用户端核心页面 UI 重构。

## 4. 新增文件

| 文件 | 说明 |
| ---- | ---- |
| `docs/ui-style-guide.md` | 用户端 UI 风格规范 |
| `miniprogram/styles/ui-kit.wxss` | 用户端公共 UI toolkit 样式 |
| `docs/dev-records/22c-ui-style-extraction.md` | 22C-0 阶段记录 |
| `tests/phase22c0.ui-style-extraction.test.js` | 22C-0 文档、样式与边界测试 |

## 5. 修改文件

| 文件 | 说明 |
| ---- | ---- |
| `docs/dev-records/index.md` | 新增 22C-0 阶段记录和 22C-1 下一阶段建议 |

## 6. 删除或废弃文件

无。

## 7. 数据库变化

无数据库变化。

## 8. 云函数 / 接口变化

无云函数、接口和 services 调用层变化。

## 9. 核心逻辑说明

本阶段只做 UI 风格提取和公共样式沉淀，不修改任何业务页面，不改变订单状态机、支付、退款、财务、派单、资质、保证金或 LBS 逻辑。

`miniprogram/styles/ui-kit.wxss` 不在本阶段引入全局 `app.wxss`，后续页面应在逐页重构时按需 `@import`，避免 22C-0 改变现有页面表现。

## 10. 关键技术决策

- 三个基准页面的共同视觉语言沉淀为浅灰背景、白色大圆角卡片、社区绿色主色、暖橙价格、胶囊按钮、柔和阴影和本地/渐变占位。
- 状态展示继续优先使用 `getStatusView(type, status)` 与 `status-tag`。
- 空状态继续优先使用 `empty-state`。
- 加载状态继续优先使用 `loading-view`。
- 缺失图片素材统一使用空白占位或渐变占位，不引入随机网络图片。

## 11. 安全与权限说明

本阶段未新增真实支付、真实退款、真实分账、真实提现、真实身份证认证、真实营业执照认证、真实保险核验、真实保证金支付、自动派单、AI 派单、路径规划、实时轨迹、多门店、分佣或合伙人系统。

## 12. 已知问题与遗留事项

- `ui-kit.wxss` 尚未被旧页面大规模引用，需在 22C-1 按页面逐步接入。
- 既有页面仍有旧版全局样式与新版用户端样式并存的情况，后续需要逐页收敛。
- 图片资产仍不完整，后续继续使用本地图片或渐变占位。

## 13. 测试记录

本阶段已运行：

```bash
npm run check:shared-sync
npm test
```

交付包风险扫描：

```bash
npm run check:release-risk -- <候选交付目录>
```

实际结果：

| 命令 | 结果 |
| ---- | ---- |
| `npm run check:shared-sync` | 通过，共享工具一致性检查通过 |
| `npm test` | 通过，234/234 |
| `npm run check:release-risk -- <候选交付目录>` | 通过，候选交付目录不包含敏感或本地生成文件 |

## 14. 运行与验证方式

阅读 `docs/ui-style-guide.md`，后续用户端页面重构时按需在页面 WXSS 中引入：

```css
@import "../../styles/ui-kit.wxss";
```

路径需按页面目录层级调整。

## 15. 对下一阶段的影响

22C-1 可以基于 `docs/ui-style-guide.md` 和 `miniprogram/styles/ui-kit.wxss` 逐页重构用户端核心页面，而不需要重新从首页、订单中心和我的页推导视觉规则。

## 16. 下一阶段开发计划

阶段 22C-1：用户端核心页面 UI 重构。建议优先顺序：

1. 服务列表 `service-list`
2. 服务详情 `service-detail`
3. 地址列表 `address-list`
4. 消息中心 `message-list`
5. 优惠券、会员等用户端辅助页面

## 17. 下一阶段开始前必须确认的问题

1. 每次只重构少量页面，不直接全量修改所有页面。
2. 严格遵守 `docs/ui-refactor-guardrails.md`。
3. 状态展示优先走 `getStatusView(type, status)` 和 `status-tag`。
4. 空状态优先走 `empty-state`，加载状态优先走 `loading-view`。
5. 不修改 cloudfunctions、services 和核心业务状态流转。

## 18. 本阶段复盘

本阶段把三个已完成用户端页面中的视觉规律提炼成统一规范，并沉淀为可复用样式工具，降低 22C-1 逐页重构时的样式漂移风险。

## 19. 阶段结论

阶段 22C-0 已完成基础版。完成自测后，可以进入阶段 22C-1。
