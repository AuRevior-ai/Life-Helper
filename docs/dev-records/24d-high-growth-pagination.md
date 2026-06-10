# 阶段 24D：剩余高增长列表分页治理续收口

日期：2026-06-10

## 本轮目标

- 继续治理阶段 24C 后剩余的高增长 list action，不做大重构。
- 将派单日志、消息、售后、商家订单/操作日志、评价列表和打赏列表从全量读取后内存分页改为仓库侧 `queryPage`。
- 保持 action 名称和旧返回别名不变，补齐或保持 `list/total/page/pageSize/hasMore`。
- 不接入真实支付、真实退款、提现、分账、真实认证、OCR、真实保证金支付或真实风控。

## 已改接口

- `dispatch.getDispatchLogs`：改为 `dispatchLogs.queryPage`，继续返回 `logs`，保留缺集合兼容返回。
- `message.getMessageList`：改为 `messages.queryPage`，`unread_count` 改由 `messages.countUnread` 统计，继续返回 `messages`。
- `refund.getUserAfterSaleList`：改为 `afterSales.queryPage`，固定下推当前 `user_id`，继续返回 `afterSales`。
- `refund.adminGetAfterSaleList`：改为 `afterSales.queryPage`，继续返回 `afterSales`。
- `merchant.getMerchantOrderList`：改为 `orders.queryPage`，固定下推当前商家 `merchant_id` 和 `provider_type=merchant`，继续返回 `orders`。
- `merchant.adminGetMerchantOrders`：改为 `orders.queryPage`，继续返回 `orders`；缺 `merchantId` 时保持旧空列表语义。
- `merchant.adminGetMerchantActionLogs`：改为 `merchantLogs.queryPage`，继续返回 `logs`。
- `review.adminGetReviewList`：改为 `reviews.queryPage`，继续返回 `reviews`。
- `review.getWorkerReviewList` / `review.getWorkerReviews`：改为 `reviews.queryPage`，继续返回 `reviews`。
- `tip.getUserTipList` / `tip.getWorkerTipList` / `tip.adminGetTipLogs`：改为 `tipLogs.queryPage`，继续返回 `tips`。

## 测试补充

- 新增 `tests/phase24d.high-growth-pagination.test.js` 覆盖本轮每个 list action。
- 测试中旧 `findAll/findByUserId/findByWorkerId/findByMerchantId/findByOrderId` 路径会抛错，确保 handler 真的走 `queryPage`。
- 覆盖 `pageSize > 50` 截断、旧返回别名、管理员列表权限拒绝、用户/商家/师傅侧身份隔离。
- 同步更新既有内存仓库测试 helper，补齐 `queryPage` / `countUnread`，保持旧测试语义。

## 未处理

- 未治理 `order.getUserOrderList`、`order.getWorkerOrderList`。
- 未治理 `qualification.adminListQualifications`、`qualification.adminListDeposits`。
- 未新增商家评价回复/申诉、商家打赏收益或商家收益专用接口。
- 未迁移历史集合名，也未做历史数据修复。
- 未生成公开 clean candidate；如进入交付，必须重新生成候选目录并运行 release-risk 扫描。

## 兼容风险

- 消息列表历史兼容逻辑曾允许无 `role` 或 `worker_review_reply` 旧消息通过内存筛选。本轮不迁移历史数据，真实库如存在大量缺失 `role` 的旧消息，可能需要后续数据补齐或专项兼容索引。
- 评价 `badOnly` 历史兼容 `rating <= 2`；本轮仓库侧优先使用 `rating_level=bad` 查询。真实库如存在缺失 `rating_level` 的旧评价，后续应补齐字段。
- 本轮新增多个仓库 `queryPage`，真实云开发索引仍需在控制台按契约补齐并真机验证。

## 验收

本轮当前验收结果：

```bash
node --test tests/phase24d.high-growth-pagination.test.js  # 6/6 通过
npm test                                                   # 336/336 通过
npm run check:shared-sync                                  # 通过
npm run check:cloudfunction-deps                           # 通过
git diff --check                                           # 通过
```

如生成交付候选目录，需额外运行：

```bash
npm run check:release-risk -- <candidate-dir>
```

## 下一步建议

- 下一轮优先治理用户/师傅订单列表和资质/保证金管理员列表。
- 如要开放商家评价回复、申诉或打赏收益，应单独做商家能力阶段，不复用旧 worker 专用 action。
- 真实资金、真实认证、OCR、真实保证金支付和真实风控仍必须另起高风险阶段。
