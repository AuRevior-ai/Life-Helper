# 分页与索引治理契约

阶段 19.6 建立本文件，用于记录 list 类 action 的真实云环境风险。当前代码仍以低风险治理为主，不在本阶段大规模重写数据库查询。

统一规则：

- 默认 `pageSize`：20。
- 最大 `pageSize`：50。
- 非法 `page` 自动回退为 1。
- 非法 `pageSize` 自动回退为 20。
- 已接入 `cloudfunctions/_shared/pagination.js` 的接口应使用 `normalizePage` / `paginateList`。
- 新增 list 接口必须同步本文档，并说明索引建议。

| 云函数 | list action | page/pageSize | 全量读取 | 内存过滤 | 推荐索引 | 最大 pageSize | 真实数据量适配 | 后续优先级 |
|---|---|---|---|---|---|---:|---|---|
| `order` | `getUserOrderList` | 支持 | 是 | 是 | `user_id + created_at`、`user_id + status + created_at` | 50 | 中等数据量可用，大数据量需数据库分页 | P1 |
| `order` | `getWorkerOrderList` | 支持 | 是 | 是 | `worker_id + created_at`、`worker_id + status + created_at` | 50 | 中等数据量可用，大数据量需数据库分页 | P1 |
| `admin` | `getAllUsers` | 当前基础列表 | 是 | 是 | `role + status`、`created_at` | 50 | 需补分页保护和数据库侧过滤 | P1 |
| `admin` | `getAllOrders` / `listOrders` | 支持 | 是 | 是 | `status + created_at`、`user_id + created_at` | 50 | 中等数据量可用，大数据量需数据库分页 | P1 |
| `finance` | `adminGetFinanceLogs` / `listFinanceLogs` | 支持 | 是 | 是 | `type + created_at`、`status + created_at`、`order_id + type` | 50 | 财务流水增长快，真实运营前需改造 | P0 |
| `finance` | `getWorkerEarningList` / `listWorkerEarnings` | 支持 | 是 | 是 | `provider_id + provider_type + status`、`worker_id + status` | 50 | 收益明细增长快，真实运营前需改造 | P0 |
| `finance` | `adminGetWorkerEarnings` | 支持 | 是 | 是 | `status + freeze_until`、`provider_type + created_at` | 50 | 真实结算前需数据库分页 | P0 |
| `review` | `adminGetReviewList` / `listReviews` | 基础过滤 | 是 | 是 | `status + created_at`、`worker_id + created_at`、`order_id` | 50 | 试运营可用，增长后需改造 | P1 |
| `review` | `getWorkerReviewList` / `getWorkerReviews` | 基础过滤 | 是 | 是 | `worker_id + status + created_at` | 50 | 试运营可用，增长后需改造 | P1 |
| `refund` | `getUserAfterSaleList` / `listAfterSales` | 基础列表 | 是 | 是 | `user_id + created_at`、`status + created_at` | 50 | 售后量增长后需改造 | P1 |
| `refund` | `adminGetAfterSaleList` | 基础列表 | 是 | 是 | `status + created_at`、`order_id` | 50 | 运营前需数据库分页 | P1 |
| `dispatch` | `getDispatchLogs` / `listDispatchLogs` | 基础列表 | 是 | 是 | `order_id + created_at`、`worker_id + created_at`、`action + created_at` | 50 | 日志增长快，真实运营前需改造 | P0 |
| `message` | `getMessageList` / `listMessages` | 支持 | 是 | 是 | `user_id + role + is_read + created_at` | 50 | 需要数据库分页和只读未读索引 | P1 |
| `merchant` | `getMerchantOrderList` | 基础列表 | 是 | 是 | `provider_id + provider_type + created_at`、`merchant_id + created_at` | 50 | 商家订单增长后需改造 | P1 |
| `merchant` | `adminGetMerchantOrders` | 基础列表 | 是 | 是 | `merchant_id + status + created_at` | 50 | 运营前需数据库分页 | P1 |
| `merchant` | `adminGetMerchantActionLogs` | 基础列表 | 是 | 是 | `merchant_id + created_at`、`action + created_at` | 50 | 日志增长快，真实运营前需改造 | P0 |
| `tip` | `getUserTipList` | 支持 | 是 | 是 | `user_id + created_at`、`order_id` | 50 | mock 打赏阶段可用 | P2 |
| `tip` | `getWorkerTipList` | 支持 | 是 | 是 | `worker_id + created_at`、`provider_id + provider_type + created_at` | 50 | mock 打赏阶段可用 | P2 |
| `tip` | `adminGetTipLogs` | 支持 | 是 | 是 | `status + created_at`、`channel + created_at` | 50 | 真实打赏前需改造 | P1 |
| `qualification` | `adminListQualifications` | 支持 | 是 | 是 | `qualification_status + updated_at`、`merchant_id + provider_type` | 50 | mock 资质审核基础版可用，运营前需数据库分页 | P1 |
| `qualification` | `adminListDeposits` | 支持 | 是 | 是 | `deposit_status + updated_at`、`merchant_id + provider_type` | 50 | mock 保证金基础版可用，运营前需数据库分页 | P1 |
| `qualification` | `adminListRiskRecords` | 支持 | 是 | 是 | `merchant_id + created_at`、`risk_level + created_at` | 50 | 风控日志增长后需数据库分页 | P1 |

## 低风险代码治理

阶段 19.6 已确认共享分页工具 `normalizePage` 对非法 `page/pageSize` 有保护，`pageSize` 超过 50 会被截断。`order`、`admin`、`finance` 等已分页接口继续保持原返回别名，例如 `orders`、`earnings`、`logs`。

## 后续改造建议

1. 财务流水、收益、派单日志优先改造成数据库侧分页。
2. 管理员用户列表和订单列表应避免一次性读取全集合。
3. 所有日志类集合应按 `created_at` 建倒序索引。
4. 多角色服务方查询应统一索引 `provider_id + provider_type + created_at`。
5. 新增 list action 时，必须同步 `docs/contracts/api-actions.manifest.json` 和本文档。
