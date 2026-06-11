# 分页与索引治理契约

阶段 19.6 建立本文件，用于记录 list 类 action 的真实云环境风险。当前代码仍以低风险治理为主，不在本阶段大规模重写数据库查询。

统一规则：

- 默认 `pageSize`：20。
- 最大 `pageSize`：50。
- 非法 `page` 自动回退为 1。
- 非法 `pageSize` 自动回退为 20。
- 已接入 `cloudfunctions/_shared/pagination.js` 的接口应使用 `normalizePage` / `paginateList`。
- 新增 list 接口必须同步本文档，并说明索引建议。

| 云函数          | list action                                   | page/pageSize | 全量读取 | 内存过滤 | 推荐索引                                                                 | 最大 pageSize | 真实数据量适配                              | 后续优先级 |
| --------------- | --------------------------------------------- | ------------- | -------- | -------- | ------------------------------------------------------------------------ | ------------: | ------------------------------------------- | ---------- |
| `order`         | `getUserOrderList`                            | 支持          | 否       | 否       | `user_id + created_at`、`user_id + status + created_at`                  |            50 | 已改为 `orders.queryPage`，固定下推 `user_id` | 已处理     |
| `order`         | `getWorkerOrderList`                          | 支持          | 否       | 否       | `worker_id + created_at`、`worker_id + status + created_at`              |            50 | 已改为 `orders.queryPage`，固定下推 `worker_id` | 已处理     |
| `admin`         | `getAllUsers`                                 | 支持          | 否       | 否       | `role + status`、`created_at`                                            |            50 | 已改为 `users.queryPage` 数据库侧过滤分页   | 已处理     |
| `admin`         | `getAllOrders` / `listOrders`                 | 支持          | 否       | 否       | `status + created_at`、`category_id + created_at`、`user_id + created_at` |            50 | 已改为 `orders.queryPage` 数据库侧过滤分页  | 已处理     |
| `finance`       | `adminGetFinanceLogs` / `listFinanceLogs`     | 支持          | 否       | 否       | `type + created_at`、`status + created_at`、`order_id + type`            |            50 | 已改为 `financeLogs.queryPage`              | 已处理     |
| `finance`       | `getWorkerEarningList` / `listWorkerEarnings` | 支持          | 否       | 否       | `worker_id + status`、`provider_id + provider_type + status`             |            50 | 已改为 `workerEarnings.queryPageByWorkerId` | 已处理     |
| `finance`       | `adminGetWorkerEarnings`                      | 支持          | 否       | 否       | `status + freeze_until`、`provider_type + created_at`                    |            50 | 已改为 `workerEarnings.queryPage`           | 已处理     |
| `review`        | `adminGetReviewList` / `listReviews`          | 支持          | 否       | 否       | `status + created_at`、`rating_level + created_at`、`worker_id + created_at` |            50 | 已改为 `reviews.queryPage`                  | 已处理     |
| `review`        | `getWorkerReviewList` / `getWorkerReviews`    | 支持          | 否       | 否       | `worker_id + created_at`、`worker_id + status + created_at`              |            50 | 已改为 `reviews.queryPage`                  | 已处理     |
| `refund`        | `getUserAfterSaleList` / `listAfterSales`     | 支持          | 否       | 否       | `user_id + created_at`、`user_id + status + created_at`                  |            50 | 已改为 `afterSales.queryPage`               | 已处理     |
| `refund`        | `adminGetAfterSaleList`                       | 支持          | 否       | 否       | `status + created_at`、`order_id + created_at`                           |            50 | 已改为 `afterSales.queryPage`               | 已处理     |
| `dispatch`      | `getDispatchLogs` / `listDispatchLogs`        | 支持          | 否       | 否       | `order_id + created_at`、`action + created_at`                           |            50 | 已改为 `dispatchLogs.queryPage`             | 已处理     |
| `message`       | `getMessageList` / `listMessages`             | 支持          | 否       | 否       | `user_id + role + is_read + created_at`                                  |            50 | 已改为 `messages.queryPage/countUnread`     | 已处理     |
| `merchant`      | `getMerchantOrderList`                        | 支持          | 否       | 否       | `merchant_id + provider_type + created_at`、`merchant_id + status + created_at` |            50 | 已改为 `orders.queryPage`                   | 已处理     |
| `merchant`      | `adminGetMerchantOrders`                      | 支持          | 否       | 否       | `merchant_id + status + created_at`、`provider_type + created_at`        |            50 | 已改为 `orders.queryPage`                   | 已处理     |
| `merchant`      | `adminGetMerchantActionLogs`                  | 支持          | 否       | 否       | `merchant_id + created_at`、`action + created_at`                        |            50 | 已改为 `merchantLogs.queryPage`             | 已处理     |
| `tip`           | `getUserTipList`                              | 支持          | 否       | 否       | `user_id + created_at`、`user_id + status + created_at`                  |            50 | 已改为 `tipLogs.queryPage`                  | 已处理     |
| `tip`           | `getWorkerTipList`                            | 支持          | 否       | 否       | `worker_id + created_at`、`worker_id + status + created_at`              |            50 | 已改为 `tipLogs.queryPage`                  | 已处理     |
| `tip`           | `adminGetTipLogs`                             | 支持          | 否       | 否       | `status + created_at`、`channel + created_at`                            |            50 | 已改为 `tipLogs.queryPage`                  | 已处理     |
| `qualification` | `adminListQualifications`                     | 支持          | 否       | 否       | `qualification_status + updated_at`、`merchant_id + provider_type`       |            50 | 已改为 `qualifications.queryPage`            | 已处理     |
| `qualification` | `adminListDeposits`                           | 支持          | 否       | 否       | `deposit_status + updated_at`、`merchant_id + provider_type`             |            50 | 已改为 `deposits.queryPage`                  | 已处理     |
| `qualification` | `adminListRiskRecords`                        | 支持          | 否       | 否       | `merchant_id + created_at`、`risk_level + created_at`                    |            50 | 已改为 `riskRecords.queryPage`              | 已处理     |

## 低风险代码治理

阶段 19.6 已确认共享分页工具 `normalizePage` 对非法 `page/pageSize` 有保护，`pageSize` 超过 50 会被截断。`order`、`admin`、`finance` 等已分页接口继续保持原返回别名，例如 `orders`、`users`、`earnings`、`logs`、`riskRecords`。

## 2026-06-10 低风险收口记录

- `admin.getAllUsers` 新增 `role/status` 可选过滤和分页返回字段，保留 `users` 别名；仓库层使用 `where/orderBy/skip/limit/count`。
- `admin.getAllOrders` 保留 `orders` 别名和既有 `status/category/keyword` 入参语义；仓库层改为分页查询，keyword 由数据库正则能力承载。
- `finance.getWorkerEarningList`、`finance.adminGetFinanceLogs`、`finance.adminGetWorkerEarnings` 已从 handler 层内存过滤分页改为仓库侧分页查询。
- `qualification.adminListRiskRecords` 已从全量 `findAll` 改为 `riskRecords.queryPage`，并兼容 `merchantId/merchant_id` 与 `riskLevel/risk_level` 过滤。
- 本轮未改订单、支付、退款、售后、收益、保证金、资质或风控状态枚举；真实资金、真实认证、OCR、保证金真实支付和真实风控仍属于后续独立阶段。

## 2026-06-10 剩余高增长列表分页续收口记录

- `dispatch.getDispatchLogs` 改为 `dispatchLogs.queryPage`，保留 `logs` 别名和缺集合友好返回。
- `message.getMessageList` 改为 `messages.queryPage`，未读数改由 `messages.countUnread` 统计，保留 `messages` 别名。
- `refund.getUserAfterSaleList`、`refund.adminGetAfterSaleList` 改为 `afterSales.queryPage`，用户列表固定下推 `user_id`。
- `merchant.getMerchantOrderList`、`merchant.adminGetMerchantOrders` 改为 `orders.queryPage`；商家端固定下推当前商家 `merchant_id`，管理员端缺 `merchantId` 时仍保持空列表兼容。
- `merchant.adminGetMerchantActionLogs` 改为 `merchantLogs.queryPage`，保留 `logs` 别名。
- `review.adminGetReviewList`、`review.getWorkerReviewList`、`review.getWorkerReviews` 改为 `reviews.queryPage`，保留 `reviews` 别名。
- `tip.getUserTipList`、`tip.getWorkerTipList`、`tip.adminGetTipLogs` 改为 `tipLogs.queryPage`，保留 `tips` 别名。
- 为上述 action 新增 `tests/phase24d.high-growth-pagination.test.js`，测试中旧 `findAll/findBy*` 路径会抛错，确保 handler 走仓库分页查询。

兼容说明：

- 消息列表历史上允许少量无 `role` 或 `worker_review_reply` 旧消息通过内存兼容筛选。本轮不迁移历史数据，数据库侧分页优先使用 `user_id/role/is_read` 精确过滤；如真实库存在大量缺失 `role` 的旧消息，后续应补一次低风险数据修复或增加专门兼容索引方案。
- 评价 `badOnly` 历史上兼容 `rating <= 2`；本轮仓库侧查询优先下推 `rating_level = bad`。如真实库存在缺失 `rating_level` 的旧评价，后续应补齐字段或另做差评索引方案。

## 2026-06-10 阶段 24E 订单 / 资质 / 保证金列表分页收口记录

- `order.getUserOrderList` 改为 `orders.queryPage`，固定下推当前 `openid` 对应的 `user_id`，保留 `orders` 别名并补齐 `list/total/page/pageSize/hasMore`。
- `order.getWorkerOrderList` 保持师傅身份校验，改为 `orders.queryPage`，固定下推当前 `openid` 对应的 `worker_id`，保留 `orders` 别名并补齐分页字段。
- `qualification.adminListQualifications` 保持管理员权限校验，改为 `qualifications.queryPage`，下推 `qualification_status` 筛选，保留 `qualifications` 别名并补齐分页字段。
- `qualification.adminListDeposits` 保持管理员权限校验，改为 `deposits.queryPage`，下推 `deposit_status` 筛选，保留 `deposits` 别名并补齐分页字段。

## 后续改造建议

1. 所有日志类集合应按 `created_at` 建倒序索引。
2. 多角色服务方查询应统一索引 `provider_id + provider_type + created_at`。
3. 新增 list action 时，必须同步 `docs/contracts/api-actions.manifest.json` 和本文档。
