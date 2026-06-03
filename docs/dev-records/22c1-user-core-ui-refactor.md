# 阶段 22C-1：用户端核心页面 UI 重构

## 1. 阶段基本信息

- 阶段编号：22C-1
- 阶段名称：用户端核心页面 UI 重构
- 开始时间：2026-06-03
- 完成时间：2026-06-03
- 阶段状态：已完成基础版

## 2. 本阶段目标

沿用阶段 22A 首页、阶段 22B 订单中心和我的页已经建立的用户端视觉体系，对当前工程真实存在的用户端核心页面进行批量 UI 重构。本阶段只做展示层和公共样式复用，不新增业务能力，不修改核心业务逻辑。

必须遵守：

- `docs/ui-style-guide.md`
- `miniprogram/styles/ui-kit.wxss`
- `docs/ui-refactor-guardrails.md`
- `docs/dev-records/22c-ui-style-extraction.md`

## 3. 本阶段重构页面清单

实际重构页面：

| 批次 | 页面 | 说明 |
| ---- | ---- | ---- |
| 第一批 | `miniprogram/pages/service-list/service-list` | 服务列表 |
| 第一批 | `miniprogram/pages/service-detail/service-detail` | 服务详情 |
| 第一批 | `miniprogram/pages/order-submit/order-submit` | 提交订单 |
| 第一批 | `miniprogram/pages/order-detail/order-detail` | 订单详情 |
| 第一批 | `miniprogram/pages/pay-result/pay-result` | 支付结果 |
| 第二批 | `miniprogram/pages/address-list/address-list` | 地址列表 |
| 第二批 | `miniprogram/pages/address-edit/address-edit` | 地址编辑 |
| 第二批 | `miniprogram/pages/message-list/message-list` | 消息中心 |
| 第二批 | `miniprogram/pages/coupon/list/list` | 我的优惠券 |
| 第二批 | `miniprogram/pages/coupon/receive/receive` | 领券中心 |
| 第二批 | `miniprogram/pages/member/center/center` | 会员中心 |
| 第二批 | `miniprogram/pages/profile-edit/profile-edit` | 完善资料 |
| 第三批 | `miniprogram/pages/after-sale/apply/apply` | 售后申请 |
| 第三批 | `miniprogram/pages/after-sale/detail/detail` | 售后详情 |
| 第三批 | `miniprogram/pages/review/review` | 用户评价 |
| 第三批 | `miniprogram/pages/worker-detail/worker-detail` | 师傅详情 |
| 第三批 | `miniprogram/pages/tip/create/create` | 模拟打赏 |
| 第三批 | `miniprogram/pages/map/pick-location/pick-location` | 地图选点基础页 |

提示词中列出但当前工程不存在的路径：

- `miniprogram/pages/coupon/coupon`
- `miniprogram/pages/after-sale/after-sale`

这些路径未创建新业务页面；改为处理当前工程真实存在的 `coupon/list`、`coupon/receive`、`after-sale/apply` 和 `after-sale/detail`。

## 4. 每个页面的 UI 改动说明

- `service-list`：页面壳切换为 `ui-page`，分类 tab 改为胶囊样式，空状态补充下一步提示。
- `service-detail`：详情封面使用渐变媒体占位，头部和服务流程切换为大圆角白卡，价格使用暖橙，预约按钮改为胶囊主按钮。
- `order-submit`：服务摘要、地址选择、表单、金额与优惠模块统一为白色大圆角卡片，提交按钮改为全宽胶囊主按钮。
- `order-detail`：详情卡和信息卡统一视觉；订单、支付、售后、退款状态迁移到 `getStatusView(type, status)` + `status-tag`；操作按钮统一为胶囊按钮。
- `pay-result`：结果卡统一白卡和柔和状态圆标，刷新和跳转按钮统一为主/次胶囊按钮。
- `address-list`：地址卡统一为白色大圆角卡片，默认标签使用 `ui-pill`，操作按钮统一为次级胶囊按钮。
- `address-edit`：表单卡、输入框、默认地址开关和保存按钮统一为 22C 视觉。
- `message-list`：消息列表改为白色卡片，未读消息用绿色轻描边，已读/未读使用 `ui-pill`。
- `coupon/list`：优惠券卡使用白卡，金额使用暖橙，优惠券状态迁移到 `getStatusView("coupon", status)` + `status-tag`。
- `coupon/receive`：领券卡与领取按钮统一为白卡和绿色胶囊按钮。
- `member/center`：当前会员使用浅绿功能卡，会员状态迁移到 `getStatusView("member", status)` + `status-tag`，开通按钮统一为胶囊按钮。
- `profile-edit`：资料表单卡和保存按钮统一为 22C 视觉。
- `after-sale/apply`：售后申请表单统一为白卡，输入和凭证按钮统一视觉，保留模拟退款说明。
- `after-sale/detail`：售后详情统一为白卡，售后和退款状态迁移到 `status-tag`。
- `review/review`：评分按钮改为胶囊视觉，评价表单和提交按钮统一为 22C 视觉。
- `worker-detail`：师傅资料使用浅绿功能卡，统计和评价卡统一为白卡，头像使用本地样式占位。
- `tip/create`：模拟打赏金额和自定义输入统一为白卡/输入样式，确认按钮为绿色胶囊按钮。
- `map/pick-location`：基础选点入口统一为 22C 页面壳、白卡、输入框和胶囊按钮，不接入真实地图 key。

## 5. 新增文件

| 文件 | 说明 |
| ---- | ---- |
| `docs/dev-records/22c1-user-core-ui-refactor.md` | 阶段 22C-1 开发记录 |
| `tests/phase22c1.user-core-ui-refactor.test.js` | 阶段 22C-1 UI 重构保护测试 |

## 6. 修改文件

| 类型 | 文件 |
| ---- | ---- |
| 公共组件样式 | `miniprogram/components/service-card/service-card.wxss` |
| 第一批页面 | `service-list`、`service-detail`、`order-submit`、`order-detail`、`pay-result` 的 WXML/WXSS，订单详情额外更新 JS/JSON |
| 第二批页面 | `address-list`、`address-edit`、`message-list`、`coupon/list`、`coupon/receive`、`member/center`、`profile-edit` 的 WXML/WXSS，优惠券和会员额外更新 JS/JSON |
| 第三批页面 | `after-sale/apply`、`after-sale/detail`、`review/review`、`worker-detail`、`tip/create`、`map/pick-location` 的 WXML/WXSS，售后详情额外更新 JS/JSON |
| 阶段索引 | `docs/dev-records/index.md` |

## 7. 删除或废弃文件

无。

## 8. 数据库变化

无。

## 9. 云函数 / 接口变化

无。未修改 `cloudfunctions/**`，未修改 `miniprogram/services/**`。

## 10. 核心逻辑说明

本阶段保留所有原有页面事件绑定、表单字段、picker、switch、按钮入口和跳转路径。页面 JS 仅做状态展示字段组装级别的小改动：

- `order-detail`：订单、支付、售后、退款状态使用 `getStatusView` 生成展示对象。
- `coupon/list`：优惠券状态使用 `getStatusView("coupon", status)` 生成展示对象。
- `member/center`：会员状态使用 `getStatusView("member", status)` 生成展示对象。
- `after-sale/detail`：售后和退款状态使用 `getStatusView` 生成展示对象。

这些改动不改变状态枚举、接口参数、金额计算、权限判断或服务调用顺序。

## 11. 安全与权限说明

本阶段未新增真实支付、真实退款、真实分账、真实提现、真实身份证认证、真实营业执照认证、真实保险核验、真实保证金支付、自动派单、AI 派单、路径规划、实时轨迹、多门店、分佣或合伙人系统。

本阶段业务边界保持为：

- 不新增真实支付。
- 不新增真实退款。
- 不新增真实分账。
- 不新增真实提现。
- 不新增真实身份证认证、真实营业执照认证、真实保险核验、真实保证金支付。
- 不新增自动派单。
- 不新增 AI 派单。
- 不新增路径规划、实时轨迹、多门店、分佣、合伙人系统。

## 12. 组件复用情况

- 公共样式：所有实际重构页面均按路径层级引入 `miniprogram/styles/ui-kit.wxss`。
- 状态组件：`order-detail`、`coupon/list`、`member/center`、`after-sale/detail` 使用 `status-tag`。
- 空状态：继续使用 `empty-state`，并在部分页面补充下一步提示文案。
- 加载状态：继续使用 `loading-view`。
- 服务卡：更新 `service-card` 视觉，使服务列表与首页/订单中心视觉一致。
- 顶部导航：全局原生导航栏由深绿色改为白底黑字，避免非 custom 页面继续出现顶部绿色栏；首页、订单中心、我的页继续保留 custom 导航。

## 13. 图片素材占位说明

本阶段未引入随机网络图片和第三方图片 URL。缺失服务图片、头像和地图视觉均使用渐变占位或 `ui-avatar-placeholder`，并保持固定尺寸，方便后续替换为正式本地素材。

## 14. 状态、空状态、加载状态迁移说明

- 状态：核心订单、支付、售后、退款、优惠券、会员状态已优先使用 `getStatusView(type, status)` 与 `status-tag`。
- 空状态：列表和详情缺失态继续使用 `empty-state`。
- 加载状态：页面加载仍使用 `loading-view`，列表页保留 `loading && !list.length` 类判断。

## 15. 已知问题与遗留事项

- `review/detail`、`review/followup`、商家店铺浏览页等用户可访问的补充页面不在本提示词优先清单中，后续可进入 22C-2 做细化统一。
- 当前仍以渐变占位替代部分正式图片资产。
- 本阶段未做微信开发者工具真机视觉截图验证。

## 16. 测试记录

本阶段已运行：

```bash
npm run check:shared-sync
npm test
npm run check:release-risk -- <候选交付目录>
```

实际结果：

| 命令 | 结果 |
| ---- | ---- |
| `npm run check:shared-sync` | 通过，共享工具一致性检查通过 |
| `npm test` | 通过，240/240 |
| `npm run check:release-risk -- C:\Users\28276\AppData\Local\Temp\lcsmvp-22c1-candidate` | 通过，候选交付目录不包含敏感或本地生成文件 |

补充说明：首次候选交付目录包含历史参考资料 `参考/` 下的真实支付相关示例文件，被 release-risk 正确拦截；最终候选交付目录已排除 `参考/`、`.git`、`node_modules`、真实 `project.config.json`、`project.private.config.json`、日志、压缩包和密钥证书类文件。

## 17. 运行与验证方式

1. 使用微信开发者工具打开项目。
2. 重点预览服务列表、服务详情、提交订单、订单详情、支付结果、地址、消息、优惠券、会员、售后、评价、师傅详情、打赏和地图选点页面。
3. 验证点击、跳转、表单输入、picker、switch、模拟支付、售后申请、评价、地图选点确认等原有行为仍可用。

## 18. 对下一阶段的影响

22C-2 可以聚焦用户端剩余页面细节、真机视觉 QA、正式本地素材补齐和跨页面状态标签查漏补缺。

## 19. 下一阶段开发计划

阶段 22C-2 建议处理：

1. `review/detail` 与 `review/followup`。
2. 用户可访问的商家店铺列表/详情页。
3. 用户端页面真机截图走查与边距、按钮文字溢出修正。
4. 本地正式图片素材替换策略。

## 20. 阶段结论

阶段 22C-1 已完成基础版。完成最终验收命令后，可以进入 22C-2。
