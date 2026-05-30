# 阶段 10：MVP 稳定化与关键风险修补

## 阶段目标

在不推倒初版 MVP、不中断现有用户下单到评价闭环的前提下，集中修补接单、评价完成、管理员状态调整和云函数依赖版本等关键业务风险。

## 本阶段完成内容

- 修复师傅接单并发风险：
  - `order.acceptOrder` 改为优先使用仓储层条件更新。
  - 仅当订单仍为 `pending_accept` 且 `worker_id` 为空时才能接单。
  - 订单已被接走时返回 `ORDER_ALREADY_ACCEPTED`。
- 优化接单大厅筛选：
  - 接单大厅只展示 `pending_accept` 且未被接走的订单。
  - 按师傅 `service_category` 与订单分类匹配。
  - 当订单有 `community`、`service_area`、`city` 或 `full_address` 等区域信息时，同时按师傅 `service_area` 过滤。
- 优化评价与订单完成：
  - 保留重复评价检查。
  - 评价写入成功后才会推进订单到 `completed`。
  - 订单完成更新失败时，若仓储支持删除，会删除刚创建的评价作为补偿，避免留下孤儿评价。
  - `reviews` 仓储写入时使用订单 ID 作为评价记录 `_id`，减少同一订单重复评价风险。
- 管理员订单状态调整增加操作日志：
  - 新增 `admin_operation_logs` 集合使用约定。
  - 记录管理员 ID、订单 ID、原状态、新状态、操作原因、是否强制调整、操作时间。
  - 管理员状态修改时必须提供日志仓储，真实云函数已接入。
- 限制管理员订单状态乱跳：
  - 目标状态必须属于订单状态枚举。
  - 默认按订单状态机限制流转。
  - 保留 `force: true` 作为调试强制调整能力，并在日志中标记 `force`。
- 锁定云函数依赖版本：
  - 所有云函数的 `wx-server-sdk` 从 `latest` 固定为 `3.0.4`。
  - 原因：避免云函数重新安装依赖时拉取到不可预期版本，导致真实环境行为与本地验证不一致。

## 新增文件

- `docs/dev-records/10_mvp-stabilization.md`

## 修改文件

- `cloudfunctions/order/handler.js`
- `cloudfunctions/order/order-repository.js`
- `cloudfunctions/worker/handler.js`
- `cloudfunctions/review/handler.js`
- `cloudfunctions/review/order-repository.js`
- `cloudfunctions/review/review-repository.js`
- `cloudfunctions/admin/handler.js`
- `cloudfunctions/admin/index.js`
- `cloudfunctions/admin/repositories.js`
- `cloudfunctions/*/package.json`
- `tests/mvp.stabilization.test.js`
- `tests/phase5.worker.test.js`
- `tests/phase7.admin.test.js`
- `docs/wechat-mvp-verification.md`
- `docs/dev-records/index.md`

## 本阶段测试

已执行：

```bash
npm test
```

结果：

- 67 个测试全部通过。

新增或强化测试覆盖：

- 已接走订单再次接单返回明确错误。
- 接单大厅按师傅服务分类和服务区域过滤。
- 评价创建失败时订单不会被完成。
- 管理员非法状态跳转被拒绝。
- 管理员状态调整写入操作日志。
- 所有云函数 `wx-server-sdk` 依赖版本已固定。

## 遗留问题

- 评价创建与订单完成目前采用“先写评价、再条件完成订单、失败后补偿删除评价”的方式；未引入云数据库事务封装，后续如真实环境需要更强一致性，可升级为 `db.runTransaction` 统一提交。
- 管理员强制调整订单状态保留为调试能力，正式运营前建议在前端入口隐藏或仅允许超级管理员使用。
- 接单大厅区域匹配当前基于文本字段做轻量匹配，后续如果服务区域结构化，可升级为更严格的区域编码匹配。

## 下一阶段建议

- 在微信开发者工具中重新部署受影响云函数：`order`、`worker`、`review`、`admin`。
- 在云数据库新增 `admin_operation_logs` 集合。
- 真实端回归验证用户下单、师傅接单、评价完成、管理员订单调整四条链路。
- 继续处理服务快照来源统一、服务/分类删除保护和真实环境错误提示优化。
