# 阶段 6：用户评价、订单闭环与师傅收入统计

## 1. 阶段基本信息

- 阶段编号：6
- 阶段名称：用户评价、订单闭环与师傅收入统计
- 开始时间：2026-05-30
- 完成时间：2026-05-30
- 当前分支：master
- 当前版本：0.1.0
- 负责人：Codex
- 阶段状态：已完成

---

## 2. 本阶段目标

本阶段目标是完成订单后半段闭环：师傅开始服务、师傅完成服务、用户评价、订单完成，以及师傅端模拟收入统计。完成后，MVP 主流程可以从用户下单一路跑到订单完成。

---

## 3. 本阶段完成内容

- [x] 阅读 `docs/dev-records/index.md`
- [x] 阅读 `docs/dev-records/05_phase-worker.md`
- [x] 确认阶段 6 四个问题均按“是”执行
- [x] 编写阶段 6 实施计划
- [x] 编写阶段 6 失败测试
- [x] 实现 `order.startService`
- [x] 实现 `order.finishService`
- [x] 实现 `order.getWorkerIncomeStats`
- [x] 实现 `review.createReview`
- [x] 实现 `review.getOrderReview`
- [x] 实现 `review.getWorkerReviews`
- [x] 师傅订单详情页接入开始服务和完成服务
- [x] 用户订单详情页接入待评价入口
- [x] 用户评价页接入评分、文字评价和提交
- [x] 师傅收入统计页接入累计收入和已完成订单列表
- [x] 使用 `npm test` 验证阶段一至阶段六测试

---

## 4. 新增文件

| 文件路径                                                         | 说明                                             |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| `docs/superpowers/plans/2026-05-30-phase6-review-order-close.md` | 阶段六实施计划                                   |
| `tests/phase6.review-order-close.test.js`                        | 开始服务、完成服务、评价、收入统计和页面接入测试 |
| `cloudfunctions/review/handler.js`                               | 评价云函数业务逻辑                               |
| `cloudfunctions/review/review-repository.js`                     | `reviews` 集合读写封装                           |
| `cloudfunctions/review/order-repository.js`                      | 评价云函数内订单读写封装                         |
| `docs/dev-records/06_phase-review-order-close.md`                | 本阶段开发记录与复盘                             |

---

## 5. 修改文件

| 文件路径                                  | 修改内容                                         |
| ----------------------------------------- | ------------------------------------------------ |
| `cloudfunctions/order/handler.js`         | 增加开始服务、完成服务、收入统计和阶段六订单状态 |
| `cloudfunctions/review/index.js`          | 从占位入口改为调用 `handleReview`                |
| `miniprogram/services/order.service.js`   | 增加 `getWorkerIncomeStats`                      |
| `miniprogram/pages/worker/order-detail/*` | 师傅订单详情接入开始服务、完成服务               |
| `miniprogram/pages/order-detail/*`        | 用户订单详情接入去评价入口                       |
| `miniprogram/pages/review/*`              | 用户评价页接入评分和评价提交                     |
| `miniprogram/pages/worker/income/*`       | 师傅收入统计页接入累计收入和完成订单列表         |
| `docs/dev-records/index.md`               | 更新阶段六完成状态、P0 完成情况和遗留问题        |
| `README.md`                               | 补充阶段六说明和验证步骤                         |

---

## 6. 删除或废弃文件

| 文件路径 | 删除 / 废弃原因 |
| -------- | --------------- |
| 无       | 无              |

---

## 7. 数据库变化

本阶段新增真实云数据库集合：

| 集合      | 作用                       | 当前写入方式    |
| --------- | -------------------------- | --------------- |
| `reviews` | 保存用户对订单和师傅的评价 | `review` 云函数 |

### `reviews` 主要字段

| 字段           | 说明              |
| -------------- | ----------------- |
| `_id`          | 云数据库文档 ID   |
| `order_id`     | 订单 ID           |
| `user_id`      | 评价用户 openid   |
| `worker_id`    | 被评价师傅 openid |
| `service_id`   | 服务 ID 快照      |
| `service_name` | 服务名称快照      |
| `rating`       | 1-5 星评分        |
| `content`      | 文字评价          |
| `created_at`   | 创建时间          |
| `updated_at`   | 更新时间          |

### `orders` 字段变化

| 字段          | 说明                                                   |
| ------------- | ------------------------------------------------------ |
| `started_at`  | 师傅开始服务时间                                       |
| `finished_at` | 师傅完成服务时间                                       |
| `reviewed_at` | 用户评价时间                                           |
| `status`      | 新增阶段流转：`serving`、`pending_review`、`completed` |

---

## 8. 云函数 / 接口变化

### `order`

| 功能                   | 入参      | 出参                                        | 权限要求           |
| ---------------------- | --------- | ------------------------------------------- | ------------------ |
| `startService`         | `orderId` | `{ order }`                                 | 已审核且已接单师傅 |
| `finishService`        | `orderId` | `{ order }`                                 | 已审核且已接单师傅 |
| `getWorkerIncomeStats` | 无        | `{ completed_count, total_amount, orders }` | 已审核师傅         |

### `review`

| 功能               | 入参                           | 出参                | 权限要求                 |
| ------------------ | ------------------------------ | ------------------- | ------------------------ |
| `createReview`     | `orderId`, `rating`, `content` | `{ review, order }` | 订单用户                 |
| `getOrderReview`   | `orderId`                      | `{ review }`        | 当前阶段不做复杂展示权限 |
| `getWorkerReviews` | 可选 `workerId`                | `{ reviews }`       | 当前阶段用于后续展示扩展 |

### 统一错误码

| 错误码                  | 说明                       |
| ----------------------- | -------------------------- |
| `OPENID_MISSING`        | 无法获取当前用户 openid    |
| `WORKER_NOT_APPROVED`   | 当前师傅尚未通过审核       |
| `ORDER_ID_MISSING`      | 缺少订单 ID                |
| `ORDER_NOT_FOUND`       | 订单不存在                 |
| `ORDER_STATUS_INVALID`  | 当前订单状态不能执行该操作 |
| `PERMISSION_DENIED`     | 无权操作目标资源           |
| `REVIEW_RATING_INVALID` | 评分不在 1-5 范围          |
| `REVIEW_ALREADY_EXISTS` | 订单已评价                 |
| `ACTION_NOT_FOUND`      | 未知 action                |
| `INTERNAL_ERROR`        | 未预期内部错误             |

---

## 9. 核心逻辑说明

### 服务流转逻辑

```text
师傅已接单，订单状态 accepted
↓
师傅点击开始服务
↓
order.startService 校验师傅归属和状态
↓
订单变为 serving
↓
师傅点击完成服务
↓
order.finishService 校验师傅归属和状态
↓
订单变为 pending_review
```

### 用户评价逻辑

```text
用户进入待评价订单详情
↓
点击去评价
↓
选择 1-5 分，填写文字评价
↓
review.createReview 校验订单归属、状态和重复评价
↓
写入 reviews
↓
订单变为 completed
```

### 师傅收入统计逻辑

```text
师傅进入收入统计页
↓
order.getWorkerIncomeStats 读取当前师傅订单
↓
筛选 completed 订单
↓
汇总 completed_count 和 total_amount
```

---

## 10. 关键技术决策

### 决策 1：服务状态流转继续放在 `order` 云函数

原因：

- 开始服务、完成服务和接单一样都是订单状态机
- 统一在 `order` 云函数里校验师傅归属和状态更清晰

影响：

- `startService` 只允许 `accepted -> serving`
- `finishService` 只允许 `serving -> pending_review`

### 决策 2：评价创建放在 `review` 云函数

原因：

- 评价有独立集合和后续展示场景
- 创建评价后再更新订单完成状态，职责边界清楚

影响：

- `review.createReview` 同时写 `reviews` 并更新订单为 `completed`
- 后续若要做评价展示，可复用 `getOrderReview` 和 `getWorkerReviews`

### 决策 3：收入统计只做模拟汇总

原因：

- 用户已确认不做提现和平台抽佣
- MVP 当前只需要证明订单完成后可统计师傅收益

影响：

- 收入金额直接按已完成订单 `price` 求和
- 不生成提现单、结算单或平台分账记录

---

## 11. 已知问题与遗留事项

| 问题                                           | 影响                                   | 后续处理建议                                 | 优先级 |
| ---------------------------------------------- | -------------------------------------- | -------------------------------------------- | ------ |
| 尚未在微信开发者工具中真实编译和预览阶段六页面 | 可能存在小程序运行时细节问题           | 部署 `review/order` 云函数后做一次微信端验证 | P1     |
| 尚未创建真实 `reviews` 集合                    | 微信端无法保存评价                     | 微信云开发控制台创建集合                     | P0     |
| 尚未部署 `review` 云函数                       | 微信端无法提交评价                     | 微信开发者工具上传并部署云函数               | P0     |
| 评价创建与订单完成不是事务                     | 极端失败时可能出现评价写入但订单未完成 | 后续用事务或补偿逻辑强化                     | P1     |
| 收入统计不含提现、抽佣和结算状态               | 不适合真实经营                         | 商业化前重做财务模型                         | P1     |
| 管理员订单管理尚未实现                         | 管理端无法统一查看订单                 | 阶段七处理                                   | P0     |

---

## 12. 测试记录

### 已测试

- [x] `startService` 将已接单订单从 `accepted` 改为 `serving`
- [x] `finishService` 将服务中订单从 `serving` 改为 `pending_review`
- [x] `createReview` 创建评价并将订单改为 `completed`
- [x] 重复评价会被拒绝
- [x] `getWorkerIncomeStats` 只汇总当前师傅已完成订单
- [x] 阶段六页面接入对应服务方法
- [x] 阶段一至阶段五测试仍然通过

### 未测试

- [ ] 微信开发者工具真实编译
- [ ] 真机预览
- [ ] 云函数真实部署
- [ ] 真实云数据库集合权限
- [ ] 评价创建和订单完成的事务一致性

测试命令：

```bash
npm test
```

最近一次测试结果：

```text
tests 44
pass 44
fail 0
```

---

## 13. 运行与验证方式

### 本地自动化验证

```bash
npm test
```

期望结果：

```text
pass 44
fail 0
```

### 微信开发者工具验证

1. 打开微信开发者工具
2. 选择当前项目根目录
3. 确认已选择云开发环境
4. 创建 `reviews` 集合
5. 确认 `users`、`addresses`、`orders`、`workers` 集合已存在
6. 上传并部署 `cloudfunctions/order`
7. 上传并部署 `cloudfunctions/review`
8. 确认 `login`、`user`、`service`、`address`、`worker` 云函数也已部署
9. 用户创建订单并完成模拟支付
10. 已审核师傅接单
11. 师傅进入订单详情，点击“开始服务”
12. 师傅点击“完成服务”
13. 用户进入订单详情，点击“去评价”
14. 用户提交评分和文字评价
15. 用户订单状态应变为“已完成”
16. 师傅进入收入统计页，确认累计收入包含该订单

---

## 14. 对下一阶段的影响

阶段六已经跑通了用户下单到订单完成的 MVP 主流程。阶段七可以在此基础上实现管理员管理首页、订单管理、用户管理和服务管理，将当前依赖手动操作的管理能力收拢到后台页面。

---

## 15. 下一阶段开发计划

下一阶段名称：

> 阶段 7：管理员管理能力

下一阶段目标：

完成管理首页、服务管理、订单管理、用户管理，使管理员可以从小程序内查看关键数据、维护服务和管理订单/用户。

下一阶段任务清单：

- [ ] 阅读 `docs/dev-records/index.md`
- [ ] 阅读 `docs/dev-records/06_phase-review-order-close.md`
- [ ] 实现 `admin.getDashboard`
- [ ] 实现管理员订单列表和订单详情
- [ ] 实现管理员用户列表
- [ ] 实现服务分类和服务管理基础能力
- [ ] 更新阶段 7 记录文件

下一阶段重点注意事项：

- 管理员权限继续基于 `users.role = admin`
- 不接真实资金管理
- 服务管理可先围绕现有种子数据或最小数据库化策略做取舍

---

## 16. 下一阶段开始前必须确认的问题

1. 管理首页是否先展示用户数、订单数、待审核师傅数和完成订单金额？
2. 管理员订单管理是否先只做查看和手动改状态，不做退款？
3. 用户管理是否先只做列表和禁用用户，不做复杂画像？
4. 服务管理是否要在阶段七把服务种子数据迁移到云数据库？

---

## 17. 本阶段复盘

### 做得好的地方

- 继续用测试先行约束状态机、评价和收入统计。
- 订单状态从 `accepted` 到 `completed` 的路径已经完整。
- 评价创建会防重复，避免一个订单多次评价。
- 收入统计基于完成订单，和 MVP 当前财务边界保持一致。

### 不足的地方

- 评价和订单完成不是事务级一致。
- 仍未在微信开发者工具中真实验证页面。
- 收入统计还不是可用于真实经营的财务系统。

### 后续改进建议

- 阶段七前在微信开发者工具中验证完整闭环。
- 后续优化评价创建与订单完成的一致性。
- 管理后台阶段补齐订单管理和用户管理入口。

---

## 18. 阶段结论

阶段 6 已完成用户评价、订单闭环与师傅收入统计目标。用户下单、模拟支付、师傅接单、开始服务、完成服务、用户评价、订单完成和师傅收入统计的 MVP 主流程已具备。下一步建议进入阶段 7：管理员管理能力。
