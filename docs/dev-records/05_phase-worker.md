# 阶段 5：师傅入驻、审核与接单

## 1. 阶段基本信息

- 阶段编号：5
- 阶段名称：师傅入驻、审核与接单
- 开始时间：2026-05-30
- 完成时间：2026-05-30
- 当前分支：master
- 当前版本：0.1.0
- 负责人：Codex
- 阶段状态：已完成

---

## 2. 本阶段目标

本阶段目标是完成师傅申请入驻、管理员审核、接单大厅、师傅接单、师傅订单列表和师傅订单详情。完成后，阶段四生成的 `pending_accept` 订单可以被已审核通过的师傅接下，并进入 `accepted` 状态。

---

## 3. 本阶段完成内容

- [x] 阅读 `docs/dev-records/index.md`
- [x] 阅读 `docs/dev-records/04_phase-address-order.md`
- [x] 确认阶段 5 四个问题均按“是”执行
- [x] 编写阶段 5 实施计划
- [x] 编写阶段 5 失败测试
- [x] 实现 `worker.applyWorker`
- [x] 实现 `worker.getWorkerInfo`
- [x] 实现 `worker.getAuditStatus`
- [x] 实现 `worker.getWorkerApplyList`
- [x] 实现 `worker.approveWorker`
- [x] 实现 `worker.rejectWorker`
- [x] 实现 `worker.getOrderHallList`
- [x] 扩展 `order.acceptOrder`
- [x] 扩展 `order.getWorkerOrderList`
- [x] 扩展 `order.getOrderDetail` 支持已分配师傅查看
- [x] 师傅入驻页接入表单和提交审核
- [x] 师傅审核状态页接入状态读取
- [x] 管理员师傅审核页接入待审核列表、通过、拒绝
- [x] 接单大厅页只展示 `pending_accept` 订单
- [x] 师傅接单后订单变为 `accepted`
- [x] 师傅订单列表和详情页接入已接订单
- [x] “我的”页面师傅入口改为先进入审核状态页
- [x] 使用 `npm test` 验证阶段一至阶段五测试

---

## 4. 新增文件

| 文件路径                                             | 说明                                 |
| ---------------------------------------------------- | ------------------------------------ |
| `docs/superpowers/plans/2026-05-30-phase5-worker.md` | 阶段五实施计划                       |
| `tests/phase5.worker.test.js`                        | 师傅入驻、审核、接单和页面接入测试   |
| `cloudfunctions/worker/handler.js`                   | 师傅入驻、审核和接单大厅业务逻辑     |
| `cloudfunctions/worker/worker-repository.js`         | `workers` 集合读写封装               |
| `cloudfunctions/worker/user-repository.js`           | `users` 集合管理员校验和角色更新封装 |
| `cloudfunctions/worker/order-read-repository.js`     | 接单大厅订单只读封装                 |
| `cloudfunctions/order/worker-read-repository.js`     | 订单云函数内师傅审核状态读取封装     |
| `docs/dev-records/05_phase-worker.md`                | 本阶段开发记录与复盘                 |

---

## 5. 修改文件

| 文件路径                                   | 修改内容                                  |
| ------------------------------------------ | ----------------------------------------- |
| `cloudfunctions/worker/index.js`           | 从占位入口改为调用 `handleWorker`         |
| `cloudfunctions/order/handler.js`          | 增加接单、师傅订单列表和师傅详情权限      |
| `cloudfunctions/order/index.js`            | 注入师傅只读仓库                          |
| `cloudfunctions/order/order-repository.js` | 增加按 `worker_id` 查询订单               |
| `miniprogram/pages/worker/apply/*`         | 师傅入驻表单                              |
| `miniprogram/pages/worker/audit-status/*`  | 师傅审核状态页                            |
| `miniprogram/pages/admin/worker-audit/*`   | 管理员师傅审核页                          |
| `miniprogram/pages/worker/order-hall/*`    | 接单大厅页                                |
| `miniprogram/pages/worker/order-list/*`    | 师傅订单列表页                            |
| `miniprogram/pages/worker/order-detail/*`  | 师傅订单详情页                            |
| `miniprogram/pages/profile/profile.js`     | 师傅入口跳转到审核状态或接单大厅          |
| `docs/dev-records/index.md`                | 更新阶段五完成状态、P0 完成情况和遗留问题 |
| `README.md`                                | 补充阶段五说明和验证步骤                  |

---

## 6. 删除或废弃文件

| 文件路径 | 删除 / 废弃原因 |
| -------- | --------------- |
| 无       | 无              |

---

## 7. 数据库变化

本阶段新增真实云数据库集合：

| 集合      | 作用                                 | 当前写入方式    |
| --------- | ------------------------------------ | --------------- |
| `workers` | 保存师傅入驻申请、审核状态和服务信息 | `worker` 云函数 |

### `workers` 主要字段

| 字段                   | 说明                                   |
| ---------------------- | -------------------------------------- |
| `_id`                  | 云数据库文档 ID                        |
| `user_id`              | 当前阶段使用师傅用户 openid            |
| `name`                 | 师傅姓名                               |
| `phone`                | 师傅手机号                             |
| `service_category`     | 服务分类                               |
| `service_area`         | 服务区域                               |
| `intro`                | 个人简介                               |
| `qualification_images` | 资质图片数组，阶段五不上传，默认空数组 |
| `audit_status`         | `pending` / `approved` / `rejected`    |
| `status`               | `enabled` / `disabled`                 |
| `reviewer_id`          | 审核管理员 openid                      |
| `reject_reason`        | 拒绝原因                               |
| `approved_at`          | 通过时间                               |
| `rejected_at`          | 拒绝时间                               |
| `created_at`           | 创建时间                               |
| `updated_at`           | 更新时间                               |

### `orders` 字段变化

阶段五开始使用以下字段推进订单：

| 字段          | 说明                                      |
| ------------- | ----------------------------------------- |
| `worker_id`   | 接单师傅 openid                           |
| `accepted_at` | 师傅接单时间                              |
| `status`      | 接单后从 `pending_accept` 变为 `accepted` |

### 数据库权限说明

小程序端仍不直接访问数据库。师傅申请、审核、接单大厅、接单和师傅订单读取均通过云函数完成。管理员审核依赖 `users.role = admin`，审核通过后会将申请人的 `users.role` 更新为 `worker`。

---

## 8. 云函数 / 接口变化

### `worker`

| 功能                 | 入参                                                         | 出参                       | 权限要求     |
| -------------------- | ------------------------------------------------------------ | -------------------------- | ------------ |
| `applyWorker`        | `name`, `phone`, `service_category`, `service_area`, `intro` | `{ worker }`               | 当前登录用户 |
| `getWorkerInfo`      | 无                                                           | `{ worker }`               | 当前登录用户 |
| `getAuditStatus`     | 无                                                           | `{ audit_status, worker }` | 当前登录用户 |
| `getWorkerApplyList` | 可选 `status`                                                | `{ workers }`              | 管理员       |
| `approveWorker`      | `workerId`                                                   | `{ worker }`               | 管理员       |
| `rejectWorker`       | `workerId`, `reason`                                         | `{ worker }`               | 管理员       |
| `getOrderHallList`   | 无                                                           | `{ orders }`               | 已审核师傅   |

### `order`

| 功能                 | 入参      | 出参         | 权限要求             |
| -------------------- | --------- | ------------ | -------------------- |
| `acceptOrder`        | `orderId` | `{ order }`  | 已审核师傅           |
| `getWorkerOrderList` | 无        | `{ orders }` | 已审核师傅           |
| `getOrderDetail`     | `orderId` | `{ order }`  | 订单用户或已分配师傅 |

### 统一错误码

| 错误码                    | 说明                         |
| ------------------------- | ---------------------------- |
| `OPENID_MISSING`          | 无法获取当前用户 openid      |
| `USER_NOT_FOUND`          | 当前用户不存在               |
| `USER_DISABLED`           | 当前用户被禁用               |
| `PERMISSION_DENIED`       | 无权操作目标资源             |
| `WORKER_REQUIRED`         | 入驻字段不完整               |
| `WORKER_PHONE_INVALID`    | 手机号格式不正确             |
| `WORKER_ALREADY_APPROVED` | 师傅已通过审核，不能重复申请 |
| `WORKER_NOT_APPROVED`     | 当前师傅尚未通过审核         |
| `WORKER_ID_MISSING`       | 缺少师傅申请 ID              |
| `WORKER_NOT_FOUND`        | 师傅申请不存在               |
| `ORDER_ID_MISSING`        | 缺少订单 ID                  |
| `ORDER_NOT_FOUND`         | 订单不存在                   |
| `ORDER_STATUS_INVALID`    | 当前订单状态不能接单         |
| `ACTION_NOT_FOUND`        | 未知 action                  |
| `INTERNAL_ERROR`          | 未预期内部错误               |

---

## 9. 核心逻辑说明

### 师傅入驻逻辑

```text
用户进入师傅入驻页
↓
填写姓名、手机号、服务分类、服务区域、个人简介
↓
调用 worker.applyWorker
↓
云函数校验字段和手机号
↓
写入 workers，audit_status = pending，status = disabled
↓
跳转审核状态页
```

### 管理员审核逻辑

```text
管理员进入师傅审核页
↓
调用 worker.getWorkerApplyList({ status: 'pending' })
↓
点击通过
↓
worker.approveWorker 更新 workers.audit_status = approved、status = enabled
↓
同时将 users.role 更新为 worker
```

### 接单逻辑

```text
用户订单完成模拟支付
↓
订单状态为 pending_accept
↓
已审核师傅进入接单大厅
↓
worker.getOrderHallList 只读取 pending_accept 订单
↓
师傅点击接单
↓
order.acceptOrder 校验师傅已审核、订单仍可接
↓
订单更新为 accepted，写入 worker_id 和 accepted_at
```

---

## 10. 关键技术决策

### 决策 1：审核动作放在 `worker` 云函数

原因：

- 阶段五只做师傅审核，不做完整管理员后台能力
- 管理员审核师傅与师傅资料高度相关
- 避免提前扩展 `admin` 云函数范围

影响：

- 管理员页面调用 `worker.getWorkerApplyList`、`worker.approveWorker`、`worker.rejectWorker`
- `admin` 云函数仍留到阶段七实现管理首页和订单管理

### 决策 2：接单动作放在 `order` 云函数

原因：

- 接单会修改订单状态和 `worker_id`
- 后续开始服务、完成服务也属于订单状态机
- 保持订单状态流转集中在 `order` 云函数

影响：

- 接单大厅读取在 `worker` 云函数
- 实际接单写入在 `order.acceptOrder`

### 决策 3：阶段五不上传资质图片

原因：

- 用户已确认第一版先不上传
- MVP 当前重点是审核和接单流程
- 避免提前引入云存储上传和图片审核

影响：

- `workers.qualification_images` 保留为空数组字段
- 后续优化阶段可接入上传

### 决策 4：阶段五只做到 `accepted`

原因：

- 用户已确认接单大厅只展示 `pending_accept`，接单后变为 `accepted`
- 开始服务、完成服务、评价属于后续订单闭环阶段

影响：

- 师傅订单详情页只展示订单信息
- `serving`、`pending_review` 和 `completed` 状态留到阶段六

---

## 11. 已知问题与遗留事项

| 问题                                           | 影响                               | 后续处理建议                                 | 优先级 |
| ---------------------------------------------- | ---------------------------------- | -------------------------------------------- | ------ |
| 尚未在微信开发者工具中真实编译和预览阶段五页面 | 可能存在小程序运行时细节问题       | 部署 `worker/order` 云函数后做一次微信端验证 | P1     |
| 尚未创建真实 `workers` 集合                    | 微信端无法保存师傅申请             | 微信云开发控制台创建集合                     | P0     |
| 尚未部署 `worker` 云函数                       | 微信端无法申请、审核和读取接单大厅 | 微信开发者工具上传并部署云函数               | P0     |
| 管理员入口仍依赖手动修改 `users.role`          | 普通用户无法自行进入管理员审核页   | 阶段七实现更完整的管理入口                   | P1     |
| 接单没有数据库事务锁                           | 极端并发下可能出现重复接单风险     | 后续用云数据库原子更新或事务强化             | P1     |
| 师傅资质图片未上传                             | 审核依据较弱                       | 优化阶段接入云存储上传                       | P2     |
| 师傅开始服务和完成服务尚未实现                 | 订单接单后不能继续闭环             | 阶段六处理                                   | P0     |

---

## 12. 测试记录

### 已测试

- [x] `applyWorker` 创建 `pending` 师傅申请
- [x] `getAuditStatus` 返回未申请和已有审核状态
- [x] 管理员可以通过师傅申请
- [x] 通过申请会将用户角色更新为 `worker`
- [x] 管理员可以拒绝师傅申请并保存原因
- [x] 已审核师傅可以查看接单大厅
- [x] 接单大厅只返回 `pending_accept` 订单
- [x] 已审核师傅可以接单
- [x] 接单后订单变为 `accepted` 并写入 `worker_id`
- [x] 师傅可以查看自己的订单列表
- [x] 已分配师傅可以查看订单详情
- [x] 阶段五页面接入对应服务方法
- [x] 阶段一至阶段四测试仍然通过

### 未测试

- [ ] 微信开发者工具真实编译
- [ ] 真机预览
- [ ] 云函数真实部署
- [ ] 真实云数据库集合权限
- [ ] 多师傅同时接单的并发冲突

测试命令：

```bash
npm test
```

最近一次测试结果：

```text
tests 38
pass 38
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
pass 38
fail 0
```

### 微信开发者工具验证

1. 打开微信开发者工具
2. 选择当前项目根目录
3. 确认已选择云开发环境
4. 创建 `workers` 集合
5. 确认 `users`、`addresses`、`orders` 集合已存在
6. 上传并部署 `cloudfunctions/login`
7. 上传并部署 `cloudfunctions/user`
8. 上传并部署 `cloudfunctions/service`
9. 上传并部署 `cloudfunctions/address`
10. 上传并部署 `cloudfunctions/order`
11. 上传并部署 `cloudfunctions/worker`
12. 用户账号完成微信授权登录
13. 在“我的 - 师傅入口”提交师傅入驻申请
14. 在云数据库 `users` 集合中把管理员账号 `role` 手动改为 `admin`
15. 管理员进入 `pages/admin/worker-audit/worker-audit` 审核通过师傅
16. 用户侧创建订单并完成模拟支付，让订单进入 `pending_accept`
17. 已审核师傅进入接单大厅
18. 点击接单，确认订单进入 `accepted`
19. 进入师傅订单列表和详情查看已接订单

---

## 14. 对下一阶段的影响

阶段五已经把订单从 `pending_accept` 推进到 `accepted`，并写入了 `worker_id`。阶段六可以直接基于已接订单实现师傅开始服务、师傅完成服务、用户评价和订单闭环，使订单从 `accepted` 继续进入 `serving`、`pending_review`、`completed`。

---

## 15. 下一阶段开发计划

下一阶段名称：

> 阶段 6：用户评价、订单闭环与师傅收入统计

下一阶段目标：

完成师傅开始服务、完成服务、用户评价、订单完成和师傅收入统计，使用户下单到订单闭环的 MVP 主流程完整跑通。

下一阶段任务清单：

- [ ] 阅读 `docs/dev-records/index.md`
- [ ] 阅读 `docs/dev-records/05_phase-worker.md`
- [ ] 实现 `order.startService`
- [ ] 实现 `order.finishService`
- [ ] 实现用户评价页
- [ ] 实现 `review.createReview`
- [ ] 评价后订单进入 `completed`
- [ ] 实现师傅收入统计页
- [ ] 更新阶段 6 记录文件

下一阶段重点注意事项：

- 只有接单师傅可以开始和完成自己的订单
- 只有订单用户可以评价自己的订单
- 模拟收入统计只基于已完成订单金额，不做真实提现和抽佣
- 评价字段保持轻量：评分、文字内容

---

## 16. 下一阶段开始前必须确认的问题

1. 师傅开始服务是否将订单从 `accepted` 改为 `serving`？
2. 师傅完成服务是否将订单从 `serving` 改为 `pending_review`？
3. 用户评价是否先只做 1-5 星评分和文字内容？
4. 师傅收入统计是否先按已完成订单金额汇总，不做提现和平台抽佣？

---

## 17. 本阶段复盘

### 做得好的地方

- 按测试先行补齐阶段五，先看到 7 个测试失败，再逐步转绿。
- 将师傅资料、管理员审核和订单接单分在合适的云函数边界内。
- 管理员审核通过会同步更新用户角色，为师傅端入口打基础。
- 接单大厅只展示 `pending_accept` 订单，避免师傅看到未支付或已接订单。

### 不足的地方

- 接单还没有事务级防重复接单保护。
- 阶段五仍未在微信开发者工具中真实预览。
- 管理员入口依旧需要手动设置 `users.role = admin`。

### 后续改进建议

- 阶段六前部署 `worker` 云函数，在微信开发者工具中用两个账号验证“用户下单、管理员审核、师傅接单”路径。
- 后续对 `acceptOrder` 加原子条件更新，防止同一订单被多个师傅同时接下。
- 阶段七完善管理员入口和管理首页。

---

## 18. 阶段结论

阶段 5 已完成师傅入驻、审核与接单目标。师傅可以提交入驻申请，管理员可以审核通过或拒绝，已审核师傅可以查看待接订单并接单。订单接单后进入 `accepted`，下一步建议进入阶段 6：用户评价、订单闭环与师傅收入统计。
