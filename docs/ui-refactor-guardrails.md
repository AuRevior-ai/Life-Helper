# UI 重构保护清单

本文档用于阶段 22 UI视觉重构与交互体验统一 V1。UI 阶段只能改善展示、布局、组件复用和交互反馈，不得改变当前业务闭环。

阶段 22 第一批重构页面固定为：首页、订单中心、我的。第一批完成并通过回归后，再按角色端逐页推进。

必须保护的核心流程：

- 登录
- 服务浏览
- 下单
- 模拟支付
- 订单详情
- 师傅接单
- 服务完成
- 用户评价
- 售后申请
- 商家订单
- 管理员审核

## 1. 允许修改的文件类型

- `miniprogram/pages/**/*.wxml`
- `miniprogram/pages/**/*.wxss`
- 仅为展示字段组装而少量修改的 `miniprogram/pages/**/*.js`
- `miniprogram/components/**`
- `miniprogram/app.wxss`
- 静态图片、图标和纯展示资源
- 与 UI 规范相关的文档和测试

如页面 JS 变更涉及接口参数、状态流转、金额计算、权限判断、服务调用顺序，必须退出 UI 范围，单独评审。

## 2. 禁止直接修改的核心文件

- `cloudfunctions/order/handler.js`
- `cloudfunctions/payment/handler.js`
- `cloudfunctions/refund/handler.js`
- `cloudfunctions/finance/handler.js`
- `cloudfunctions/dispatch/handler.js`
- `cloudfunctions/worker/handler.js`
- `cloudfunctions/merchant/handler.js`
- `cloudfunctions/qualification/handler.js`
- `miniprogram/services/order.service.js`
- `miniprogram/services/worker.service.js`
- `miniprogram/services/merchant.service.js`
- `miniprogram/services/finance.service.js`
- `miniprogram/services/qualification.service.js`
- `miniprogram/services/dispatch.service.js`
- `miniprogram/config/status.js`
- `miniprogram/config/constants.js`
- `miniprogram/utils/request.js`

如确需修改上述文件，必须说明业务原因、影响面、回归用例和人工确认结论。

## 3. 云函数修改审批条件

UI 阶段原则上不修改云函数。只有以下情况可以申请例外：

- 当前页面展示所需字段已由后端返回，但字段命名明显错误并导致页面不可用。
- 已有接口存在真实缺陷，且缺陷阻塞 UI 验证。
- 修改不改变订单、支付、退款、财务、派单、商家、资质、保证金和 LBS 的核心语义。

例外修改必须新增或更新自动化测试，并运行 `npm test`。

## 4. 必须运行的测试

每次 UI 阶段提交前至少运行：

```bash
npm run check:shared-sync
npm test
```

涉及发布包时还需运行：

```bash
npm run check:release-risk -- <候选交付目录>
```

## 5. 页面改动边界

- 可以调整布局、字号、间距、颜色、空状态和加载状态。
- 可以将散落状态展示逐步迁移到 `miniprogram/utils/status-view.js`。
- 不允许删除现有按钮背后的服务调用。
- 不允许改变提交订单、支付、退款、接单、完成服务、评价、派单、商家审核、资质审核和保证金审核的业务顺序。
- 不允许绕过 `miniprogram/services` 层直接调用云函数。

## 6. 状态标签、空状态和加载状态规范

- 状态展示优先使用 `getStatusView(type, status)` 获取 `{ text, tone }`。
- `status-tag` 组件只负责展示，不在组件内判断业务状态。
- 空数据使用 `empty-state`，不要在页面内重复手写临时空状态结构。
- 加载过程使用 `loading-view`，避免页面出现空白或误判为无数据。
- 新增 tone 应先评估是否可以复用 `default`、`warning`、`danger`、`success`。

## 7. 禁止新增业务能力

UI 阶段不得新增：

- 真实支付
- 真实退款
- 真实分账
- 真实提现
- 多门店
- 分佣
- 合伙人
- 自动派单
- AI 派单
- 路径规划
- 实时轨迹
- 真实身份证认证
- 真实营业执照认证
- 真实保证金支付

这些能力必须进入独立业务阶段。

## 8. 服务调用保护

- 不允许删除现有 `services` 调用。
- 不允许将服务调用改为页面内直接 `wx.cloud.callFunction`。
- 不允许将后端计算结果改为前端计算。
- 金额、优惠、退款、财务和派单结果仍以后端返回为准。

## 9. 订单状态机保护

UI 阶段不得修改订单状态枚举、流转条件、支付状态、售后状态、退款状态和财务状态。页面只展示状态，不决定状态。

## 10. 阶段 24A 全端 UI 统一性补充

阶段 24A 用于全端 UI 统一性体检与设计规范收口。本阶段不开发新业务，不接入真实支付、退款、提现、分账、真实认证、OCR、保证金支付或真实风控。

全端 UI 收口时必须遵守：

- 用户端继续优先使用 `ui-kit.wxss`、`loading-view`、`empty-state` 和 `status-tag`。
- 师傅端次级页面继续优先使用 `worker-subpage.wxss`。
- 商家端页面继续优先使用 `/styles/merchant-theme.wxss`。
- 管理员端一级页面继续优先使用 `admin-theme.wxss` 和 `admin-tab-bar`。
- 状态标签优先使用共享 `status-tag`；本地 `.status-tag` 只允许作为待迁移遗留项记录，不应在新 UI 收口中继续扩散。
- 主按钮和次按钮应使用胶囊形态，按钮文字必须完整显示。

## 11. 管理员端二级页面 UI 收口保护清单

下一阶段适合进入管理员端二级页面 UI 收口。建议优先范围：

- `pages/admin/order-detail/order-detail`
- `pages/admin/worker-audit/worker-audit`
- `pages/admin/after-sale-list/after-sale-list`
- `pages/admin/after-sale-detail/after-sale-detail`
- `pages/admin/finance-log-list/finance-log-list`
- `pages/admin/worker-earning-list/worker-earning-list`
- `pages/admin/order-finance-detail/order-finance-detail`
- `pages/admin/qualification-review/qualification-review`
- `pages/admin/deposit-review/deposit-review`
- `pages/admin/risk-control/risk-control`
- `pages/admin/review-list/review-list`
- `pages/admin/review-detail/review-detail`
- `pages/admin/review-appeal-list/review-appeal-list`
- `pages/admin/review-appeal-detail/review-appeal-detail`
- `pages/admin/merchant-list/merchant-list`
- `pages/admin/merchant-detail/merchant-detail`
- `pages/admin/user-list/user-list`

阶段 24B-1 已先收口以下页面：

- `pages/admin/order-detail/order-detail`
- `pages/admin/worker-audit/worker-audit`
- `pages/admin/after-sale-list/after-sale-list`
- `pages/admin/after-sale-detail/after-sale-detail`
- `pages/admin/review-list/review-list`
- `pages/admin/review-detail/review-detail`
- `pages/admin/review-appeal-list/review-appeal-list`
- `pages/admin/review-appeal-detail/review-appeal-detail`

阶段 24B-2 已继续收口以下页面：

- `pages/admin/category-list/category-list`
- `pages/admin/category-edit/category-edit`
- `pages/admin/service-list/service-list`
- `pages/admin/service-edit/service-edit`
- `pages/admin/area-list/area-list`
- `pages/admin/area-edit/area-edit`
- `pages/admin/assign-worker/assign-worker`
- `pages/admin/dispatch-logs/dispatch-logs`

阶段 24B-3 已继续收口以下页面：

- `pages/admin/finance-log-list/finance-log-list`
- `pages/admin/worker-earning-list/worker-earning-list`
- `pages/admin/order-finance-detail/order-finance-detail`
- `pages/admin/tip-log-list/tip-log-list`
- `pages/admin/merchant-list/merchant-list`
- `pages/admin/merchant-detail/merchant-detail`
- `pages/admin/qualification-review/qualification-review`
- `pages/admin/deposit-review/deposit-review`
- `pages/admin/risk-control/risk-control`
- `pages/admin/user-list/user-list`

阶段 24B-4 可考虑继续处理会员 / 优惠券 / 营销配置页面，或进入管理员端二级页面真机视觉抽查与全量验收。

管理员端二级页 UI 收口允许：

- 引入 `admin-theme.wxss` 或抽取管理员二级页展示样式。
- 将旧 `page-shell`、`panel`、本地状态标签迁移为管理员页壳、白色卡片、共享状态标签和统一操作按钮。
- 补充 loading、empty、error 和边界说明。
- 调整 WXML/WXSS 与少量展示字段组装 JS。

管理员端二级页 UI 收口禁止：

- 不得修改云函数。
- 不得修改 `miniprogram/services/*`。
- 不得修改 schema。
- 不得修改订单状态机。
- 不得修改支付、退款、财务、保证金、认证、风控核心逻辑。
- 不得修改数据库字段语义。
- 不得修改云函数 action 名称和返回结构。
- 不得接入真实支付、真实退款、提现、分账、真实认证、OCR、保证金支付或真实风控。
- 不得让前端直接决定订单完成、支付成功、退款成功或收益结算。
- 不得把 mock、内部模拟或人工审核能力包装成真实上线能力。
- 不得在 UI 收口中新增自动派单、AI 派单、路径规划、实时轨迹、ETA、多边形围栏或距离自动加价。

## 12. 阶段结论

阶段 22 可以开展 UI 视觉重构，但必须在上述边界内逐页推进。任何超出展示层的改动，都应拆成独立业务阶段处理。
