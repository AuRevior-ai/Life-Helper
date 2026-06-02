# UI 重构保护清单

本文档用于阶段 22 UI视觉重构与交互体验统一 V1。UI 阶段只能改善展示、布局、组件复用和交互反馈，不得改变当前业务闭环。

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
- 真实提现
- 分佣
- 合伙人
- 自动派单
- AI 派单
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

## 10. 阶段结论

阶段 22 可以开展 UI 视觉重构，但必须在上述边界内逐页推进。任何超出展示层的改动，都应拆成独立业务阶段处理。
