# 阶段 24E：剩余订单 / 资质 / 保证金列表分页治理

日期：2026-06-10

## 本轮目标

- 治理 `order.getUserOrderList`
- 治理 `order.getWorkerOrderList`
- 治理 `qualification.adminListQualifications`
- 治理 `qualification.adminListDeposits`
- 保持旧 action 名称、旧返回别名和 mock / 真实能力边界不变

## 已改接口

- `order.getUserOrderList`：改为 `orders.queryPage`，固定下推当前 `openid` 对应的 `user_id`，支持原有 `status` 筛选，继续返回 `orders`，并补齐 `list/total/page/pageSize/hasMore`。
- `order.getWorkerOrderList`：保持当前用户必须先通过个人师傅身份校验，再改为 `orders.queryPage`，固定下推当前 `openid` 对应的 `worker_id`，支持原有 `status` 筛选，继续返回 `orders`，并补齐 `list/total/page/pageSize/hasMore`。
- `qualification.adminListQualifications`：保持管理员权限校验，改为 `qualifications.queryPage`，下推 `qualification_status` 筛选，继续返回 `qualifications`，并补齐 `list/total/page/pageSize/hasMore`。
- `qualification.adminListDeposits`：保持管理员权限校验，改为 `deposits.queryPage`，下推 `deposit_status` 筛选，继续返回 `deposits`，并补齐 `list/total/page/pageSize/hasMore`。

## 测试补充

- 新增 `tests/phase24e.order-qualification-pagination.test.js`。
- 覆盖 `queryPage` 调用路径，旧 `findAll/findByUserId/findByWorkerId` 路径在测试中抛错。
- 覆盖用户/师傅订单归属边界、管理员资质/保证金权限、普通用户无权限、`pageSize > 50` 截断、旧返回别名、统一分页字段和空列表兼容语义。
- 同步补充既有订单测试 helper 的 `queryPage`，避免旧内存仓库测试夹具停留在全量读取语义。

## 未处理

- 未修改 UI。
- 未修改状态机。
- 未接入真实支付。
- 未接入真实退款。
- 未接入提现。
- 未接入分账。
- 未接入真实认证 / OCR / 真实保证金支付 / 真实风控。
- 未处理商家高级收益、AI、PC 后台、规则派单等后续阶段能力。

## 验收

本轮最终验收结果：

```bash
node --test tests/phase24e.order-qualification-pagination.test.js  # 4/4 通过
npm test                                                           # 340/340 通过
npm run check:shared-sync                                          # 通过
npm run check:cloudfunction-deps                                   # 通过
git diff --check                                                   # 通过
```

## 下一步建议

建议进入阶段 26 试运营前真机与云端部署验证，或阶段 24F 管理员端会员 / 优惠券 / 营销配置页面 UI 收口。
