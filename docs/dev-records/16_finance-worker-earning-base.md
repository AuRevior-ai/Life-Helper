# 阶段 16：财务流水与服务方收益基础版

## 阶段基本信息

- 阶段名称：财务流水与服务方收益基础版
- 完成日期：2026-06-01
- 阶段状态：已完成基础版
- 真实支付状态：仍受商户资质限制，当前继续使用 mock 支付与 mock 退款

## 本阶段目标

本阶段目标是在不改变现有 MVP 主流程的前提下，补齐内部财务底座：

- 订单完成后生成平台财务流水。
- 订单完成后生成师傅收益记录。
- 师傅端收益页改为读取收益明细，而不是直接按完成订单粗算。
- 管理员可查看财务流水、师傅收益和订单财务详情。
- mock 退款成功后可回冲未结算收益。
- 保持幂等，避免重复生成财务记录。

## 本阶段不做什么

- 不做真实微信提现。
- 不做真实微信支付分账。
- 不做合伙人分佣。
- 不做会员、优惠券或打赏。
- 不做动态抽佣比例后台配置。

## 新增文件

- `cloudfunctions/finance/handler.js`
- `cloudfunctions/finance/index.js`
- `cloudfunctions/finance/repositories.js`
- `cloudfunctions/finance/finance-config.js`
- `cloudfunctions/finance/package.json`
- `miniprogram/services/finance.service.js`
- `miniprogram/pages/admin/finance-log-list/*`
- `miniprogram/pages/admin/worker-earning-list/*`
- `miniprogram/pages/admin/order-finance-detail/*`
- `tests/phase16.finance-worker-earning.test.js`
- `docs/superpowers/specs/2026-06-01-finance-worker-earning-base-design.md`
- `docs/superpowers/plans/2026-06-01-finance-worker-earning-base.md`
- `docs/dev-records/16_finance-worker-earning-base.md`

## 修改文件

- `cloudfunctions/review/handler.js`
- `cloudfunctions/review/index.js`
- `cloudfunctions/refund/handler.js`
- `cloudfunctions/refund/index.js`
- `miniprogram/app.json`
- `miniprogram/config/constants.js`
- `miniprogram/config/status.js`
- `miniprogram/pages/worker/income/income.js`
- `miniprogram/pages/worker/income/income.wxml`
- `miniprogram/pages/worker/income/income.wxss`
- `miniprogram/pages/admin/dashboard/dashboard.js`
- `miniprogram/pages/admin/dashboard/dashboard.wxml`
- `README.md`
- `docs/dev-records/index.md`

## 数据库变化

新增集合：

- `finance_logs`
- `worker_earnings`

订单集合新增或规范快照字段：

- `finance_generated`
- `finance_generated_at`
- `finance_no`
- `earning_no`
- `settlement_status`
- `commission_rate`
- `commission_rate_bps`
- `platform_commission_amount`
- `worker_earning_amount`
- `finance_reverse_status`
- `finance_reversed_at`

## 云函数变化

新增 `finance` 云函数，支持：

- `generateOrderFinance`
- `reverseOrderFinance`
- `getWorkerIncomeSummary`
- `getWorkerEarningList`
- `adminGetFinanceLogs`
- `adminGetWorkerEarnings`
- `adminGetOrderFinanceDetail`
- `mockUnlockSettlement`

`review` 云函数在评价成功、订单变为 `completed` 后，会尝试调用财务生成。该调用为可重试的补充动作，不会反向破坏评价成功结果。

`refund` 云函数在 mock 退款成功后，会尝试调用财务回冲。该调用为可重试补充动作，不会反向破坏退款成功结果。

## 核心逻辑说明

默认平台抽佣比例固定为 15%，内部使用 `1500` basis points 计算，避免浮点误差。

订单完成后：

1. 校验订单存在。
2. 校验订单状态为 `completed`。
3. 校验订单 `pay_status` 为 `paid`。
4. 校验订单存在 `worker_id`。
5. 校验尚未生成财务。
6. 写入 3 条 `finance_logs`：订单收入、平台服务费、师傅收益。
7. 写入 1 条 `worker_earnings`，状态为 `frozen`。
8. 回写订单财务快照字段。

mock 退款后：

1. 如果收益未生成，记录需人工关注，不强行扣减。
2. 如果收益为 `frozen` 或 `settleable`，改为 `reversed` 并写入回冲流水。
3. 如果收益已 `settled`，改为 `pending_manual`，提示需要人工处理。

## 权限说明

师傅端：

- 只能读取当前 openid 对应的收益汇总和收益明细。

管理员端：

- 查询财务流水、师傅收益、订单财务详情和 mock 解冻操作均需要管理员权限。

## 测试记录

新增测试文件：

- `tests/phase16.finance-worker-earning.test.js`

覆盖内容：

- 完成且已支付订单生成财务流水和师傅收益。
- 平台抽佣 15% 与师傅收益 85% 计算。
- 重复生成财务保持幂等。
- 未支付、未完成、无师傅订单不能生成财务。
- 师傅只能查询自己的收益。
- 管理员可以查询财务流水、收益和订单财务详情。
- mock 退款回冲未结算收益。
- 已结算收益退款后进入人工处理。
- 评价完成触发财务生成。
- mock 退款触发财务回冲。
- 前端服务、页面、常量和文档接线。

实际执行结果：

```bash
npm test
```

结果：

- tests：108
- pass：108
- fail：0

## 真机测试建议

需要新增集合：

- `finance_logs`
- `worker_earnings`

需要重新上传并部署云函数：

- `finance`
- `review`
- `refund`

建议同时确认已部署：

- `login`
- `user`
- `service`
- `address`
- `order`
- `worker`
- `admin`
- `message`
- `area`
- `dispatch`

真机测试流程：

1. 普通用户创建订单。
2. 使用 mock 支付，让订单进入待接单。
3. 切换师傅身份接单。
4. 师傅开始服务。
5. 师傅完成服务。
6. 普通用户提交评价。
7. 检查订单变为已完成。
8. 打开云数据库，确认 `finance_logs` 有 3 条对应流水。
9. 确认 `worker_earnings` 有 1 条冻结中收益。
10. 师傅进入收入统计页，确认累计收入、冻结金额和收益明细展示正确。
11. 管理员进入管理首页，查看财务流水和师傅收益。
12. 对该订单发起售后并由管理员通过，触发 mock 退款。
13. 检查 `worker_earnings` 状态变为 `reversed` 或 `pending_manual`。
14. 检查 `finance_logs` 出现退款回冲和收益冲回记录。

## 遗留问题

- 当前财务流水基于 mock 支付，不代表微信支付真实清算。
- 当前不支持真实提现。
- 当前不支持合伙人分佣。
- 当前抽佣比例固定为 15%，未开放后台配置。
- 当前收益解冻需要管理员调用 `mockUnlockSettlement`，没有定时任务。
- 多集合索引仍需在云开发控制台配置。

## 下一阶段建议

建议下一阶段进入：

- 阶段 17：会员与优惠券基础版

原因：

1. 阶段 16 已建立订单实付金额、平台服务费、师傅收益和退款回冲基础。
2. 后续优惠券和会员会影响实付金额，必须建立在财务口径之上。
3. 真实支付仍受商户资质限制，继续做 mock 业务骨架更稳妥。

## 阶段结论

阶段 16 已完成内部财务基础版。项目仍不能宣称具备真实资金结算能力，但已经可以在 mock 支付下验证订单完成、收益生成、退款回冲、师傅收益展示和管理员财务审计流程。
