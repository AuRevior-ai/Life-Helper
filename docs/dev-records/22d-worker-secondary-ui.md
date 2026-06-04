# 阶段 22D：师傅端次级页面 UI 收口

## 阶段目标

阶段 22D 承接阶段 22C3，继续统一师傅端次级页面体验。目标是在不改变业务逻辑、云函数接口、订单状态机、金额单位和数据库字段语义的前提下，让师傅订单详情、收益、评价、资料/审核/服务范围和消息入口体验与 22C3 一级页面保持基本一致。

本阶段优先保证工程可维护、diff 可审查、测试稳定和 mock/真实能力边界清楚。视觉优化不得覆盖业务语义。

## 修改范围

计划收口页面：

- `miniprogram/pages/worker/order-detail/*`
- `miniprogram/pages/worker/income/*`
- `miniprogram/pages/worker/review-list/*`
- `miniprogram/pages/worker/review-detail/*`
- `miniprogram/pages/worker/apply/*`
- `miniprogram/pages/worker/audit-status/*`
- `miniprogram/pages/provider/service-range/*`

计划补充：

- `tests/phase22d_worker_secondary_ui.test.js`
- `docs/PHASE_CURRENT.md`
- `docs/PROJECT_STATUS.md`
- `docs/dev-records/22d-worker-secondary-ui.md`

消息中心 `miniprogram/pages/message-list/*` 已在阶段 22C-1 使用 `ui-kit` 收口，且最近工程维护已完成 active role 过滤和商家消息边界。本阶段只保护师傅端消息入口，不重构统一消息页。

## 不做事项

- 不接入真实微信支付。
- 不接入真实退款。
- 不接入提现。
- 不接入分账。
- 不接入真实会员支付。
- 不接入真实打赏支付。
- 不接入真实保证金支付或退款。
- 不接入真实身份证认证、营业执照认证、OCR、保险核验或真实风控。
- 不新增自动派单。
- 不新增 AI 派单。
- 不新增路径规划、实时轨迹或 ETA。
- 不修改订单状态机。
- 不修改金额单位。
- 不修改数据库字段语义。
- 不修改云函数 action 名称或返回结构。
- 不让前端直接决定支付成功、退款成功、订单完成、收益结算、财务流水生成、资质审核通过或风控解除。
- 不为了 UI 效果硬编码假数据覆盖真实数据。
- 不改商家端、管理端或用户端无关页面。

## 页面清单

| 页面 | app.json 注册 | 本阶段处理 |
| ---- | ------------- | ---------- |
| 师傅订单详情 | `pages/worker/order-detail/order-detail` | 统一标题区、状态卡、服务信息卡、用户与地址卡、金额卡、操作区 |
| 师傅收益 | `pages/worker/income/income` | 强化收益概览、明细卡片和内部模拟流水边界 |
| 师傅评价列表 | `pages/worker/review-list/review-list` | 增加评分概览、评价列表卡和空状态 |
| 师傅评价详情 | `pages/worker/review-detail/review-detail` | 统一评价内容、回复、申诉和人工审核说明 |
| 师傅入驻资料 | `pages/worker/apply/apply` | 统一基础资料、服务范围、人工审核和认证边界文案 |
| 师傅审核状态 | `pages/worker/audit-status/audit-status` | 统一状态卡和资料概览卡 |
| 服务范围配置 | `pages/provider/service-range/service-range` | 统一接单范围配置页面，说明不含路径规划、实时轨迹或 ETA |
| 消息入口 | `pages/message-list/message-list` | 不重构页面，只保护师傅端入口继续指向统一消息中心 |

## 数据库变化

无。

本阶段不新增集合、不新增字段、不修改 schema，不做数据迁移。

## 云函数变化

无。

本阶段不修改任何云函数 handler，不新增 action，不改变返回结构。

## Service 变化

无。

页面继续使用既有 service：

- `miniprogram/services/order.service.js`
- `miniprogram/services/worker.service.js`
- `miniprogram/services/finance.service.js`
- `miniprogram/services/review.service.js`
- `miniprogram/services/message.service.js`

## 核心逻辑说明

- 订单详情仍通过 `orderService.getOrderDetail` 获取数据，通过 `orderService.startService` 和 `orderService.finishService` 触发原有业务操作。
- 收益页仍通过 `financeService.getWorkerIncomeSummary` 和 `financeService.getWorkerEarningList` 读取内部模拟收益数据。
- 评价页仍通过 `reviewService.getWorkerReviewList`、`reviewService.getReviewDetail`、`reviewService.workerReplyReview` 和 `reviewService.workerCreateReviewAppeal` 处理原有评价能力。
- 服务范围页仍通过 `workerService.updateWorkerServiceRange` 保存配置。
- 页面层新增的字段只用于展示归一化，例如金额、时间、手机号脱敏、状态文案、空值兜底，不改原始数据语义。

## mock/真实能力边界

本阶段涉及财务展示、评价申诉、人工审核和服务范围配置，但都保持原有 mock/内部模拟/人工审核边界：

- 收益和明细为内部模拟流水，不代表真实提现、真实清结算或自动打款。
- 打赏如有展示仍为 mock 打赏，不代表真实打赏支付。
- 资料、审核和认证相关文案仅表示平台内人工审核或资料留档，不代表真实身份证认证、营业执照认证、OCR 或保险核验。
- 服务范围仅用于当前基础 LBS/行政区匹配，不代表路径规划、实时轨迹、ETA、自动派单或 AI 派单上线。

## 测试记录

新增结构保护测试：

```bash
node --test tests/phase22d_worker_secondary_ui.test.js
```

初始 RED 结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase22d_worker_secondary_ui.test.js` | 失败，6 个测试中 1 个通过、5 个预期失败 |

最终验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase22d_worker_secondary_ui.test.js` | 通过，6/6 |
| `node --test tests/phase22d_worker_secondary_ui.test.js tests/phase23_worker_profile_navigation.test.js tests/role-ui-separation.test.js tests/phase16.finance-worker-earning.test.js tests/phase18.review-tip-appeal.test.js tests/phase6.review-order-close.test.js` | 通过，38/38 |
| `npm test` | 通过，262/262 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本阶段不涉及交付包、发布清单、敏感文件或 clean candidate，默认不运行 `npm run check:release-risk -- <candidate-dir>`。

## 遗留事项

- 阶段 22D 不处理商家端、管理端 UI 收口。
- 阶段 22D 不补真实服务品类图片素材。
- 阶段 22D 不做真实提现、真实结算、真实认证或真实风控。
- 阶段 22D 不做微信开发者工具截图验收记录；如需发布前视觉验收，建议后续单独补真机抽查。

## 下一阶段建议

1. 如继续 UI，建议进入商家端或管理端 UI 统一阶段。
2. 如继续师傅端，建议补充真机视觉验收、图片素材和更完整的服务范围编辑体验，但仍不要混入真实资金和认证能力。
3. 如进入真实支付、退款、提现、认证或风控，必须另起高风险阶段，补齐专项 contract、验签、对账、回滚和人工验证方案。
