# 阶段 11：MVP 体验增强与发布准备

## 1. 阶段基本信息

- 阶段名称：MVP 体验增强与发布准备
- 完成时间：2026-05-30
- 阶段性质：体验增强、发布准备、关键流程补齐

## 2. 本阶段目标

在不推倒重写、不新增复杂商业化能力的前提下，补齐预约时间、完工凭证、站内消息、师傅详情、订单列表筛选分页等真实试用所需能力。

## 3. 本阶段完成内容

- 预约时间规范化：
  - 新增固定预约时间段。
  - 下单页改为日期选择 + 时间段选择。
  - `order.createOrder` 校验预约日期和时间段，禁止过去日期。
  - 订单同时保存 `appointment_date`、`appointment_slot`、`appointment_time`。
- 师傅完工凭证：
  - `order.finishService` 要求完工说明必填。
  - 完工图片允许为空，最多 3 张。
  - 订单保存 `finish_remark`、`finish_images`、`finished_at`。
  - 用户、师傅、管理员订单详情展示完工说明和图片。
- 站内消息中心：
  - 新增 `messages` 集合。
  - 新增 `cloudfunctions/message` 云函数。
  - 用户/师傅共用 `pages/message-list/message-list`。
  - 支持消息列表、未读数量、单条已读、全部已读。
  - 订单支付、接单、开始服务、完成服务、评价完成、师傅审核通过/拒绝会生成消息。
  - 消息写入采用尽力写入，失败不阻断订单和审核主流程。
- 师傅详情页：
  - 新增 `pages/worker-detail/worker-detail`。
  - 从用户订单详情进入。
  - 展示师傅资料、完成订单数、平均评分、评价列表。
- 订单列表增强：
  - 用户订单列表支持状态筛选、分页、下拉刷新。
  - 师傅订单列表支持状态筛选、分页、下拉刷新。
  - 管理员订单列表支持状态筛选、分类 ID 筛选、关键词搜索、分页、下拉刷新。
  - 云函数分页响应兼容旧字段：同时返回 `orders` 和 `list`。

## 4. 新增文件

- `cloudfunctions/message/index.js`
- `cloudfunctions/message/handler.js`
- `cloudfunctions/message/message-repository.js`
- `cloudfunctions/message/package.json`
- `cloudfunctions/order/message-repository.js`
- `cloudfunctions/review/message-repository.js`
- `cloudfunctions/worker/message-repository.js`
- `cloudfunctions/worker/review-read-repository.js`
- `miniprogram/services/message.service.js`
- `miniprogram/pages/message-list/message-list.js`
- `miniprogram/pages/message-list/message-list.wxml`
- `miniprogram/pages/message-list/message-list.wxss`
- `miniprogram/pages/message-list/message-list.json`
- `miniprogram/pages/worker-detail/worker-detail.js`
- `miniprogram/pages/worker-detail/worker-detail.wxml`
- `miniprogram/pages/worker-detail/worker-detail.wxss`
- `miniprogram/pages/worker-detail/worker-detail.json`
- `tests/phase11.experience-release-prep.test.js`
- `docs/dev-records/11_mvp-experience-release-prep.md`

## 5. 修改文件

- `cloudfunctions/order/handler.js`
- `cloudfunctions/order/index.js`
- `cloudfunctions/review/handler.js`
- `cloudfunctions/review/index.js`
- `cloudfunctions/worker/handler.js`
- `cloudfunctions/worker/index.js`
- `cloudfunctions/worker/order-read-repository.js`
- `cloudfunctions/admin/handler.js`
- `miniprogram/app.json`
- `miniprogram/config/constants.js`
- `miniprogram/config/status.js`
- `miniprogram/services/worker.service.js`
- `miniprogram/pages/order-submit/*`
- `miniprogram/pages/order-detail/*`
- `miniprogram/pages/order-list/*`
- `miniprogram/pages/profile/*`
- `miniprogram/pages/worker/order-detail/*`
- `miniprogram/pages/worker/order-list/*`
- `miniprogram/pages/worker/profile/*`
- `miniprogram/pages/admin/order-detail/*`
- `miniprogram/pages/admin/order-list/*`
- `tests/phase1.scaffold.test.js`
- `tests/phase6.review-order-close.test.js`
- `docs/dev-records/index.md`
- `docs/wechat-mvp-verification.md`

## 6. 删除或废弃文件

- 无。

## 7. 数据库变化

新增集合：

| 集合 | 用途 |
|---|---|
| `messages` | 保存用户和师傅站内消息 |

`orders` 新增字段：

| 字段 | 说明 |
|---|---|
| `appointment_date` | 预约日期，格式 `YYYY-MM-DD` |
| `appointment_slot` | 预约时间段 |
| `finish_remark` | 师傅完工说明 |
| `finish_images` | 完工图片 fileID 数组，最多 3 张 |

## 8. 云函数 / 接口变化

### `order.createOrder`

- 入参：`serviceId`、`addressId`、`appointmentDate`、`appointmentSlot`、`remark`
- 出参：`{ order }`
- 权限：当前登录用户

### `order.finishService`

- 入参：`orderId`、`finishRemark`、`finishImages`
- 出参：`{ order }`
- 权限：已审核且已接单师傅

### `order.getUserOrderList`

- 入参：`status`、`page`、`pageSize`
- 出参：`{ list, orders, total, page, pageSize, hasMore }`
- 权限：当前订单用户

### `order.getWorkerOrderList`

- 入参：`status`、`page`、`pageSize`
- 出参：`{ list, orders, total, page, pageSize, hasMore }`
- 权限：已审核师傅

### `admin.getAllOrders`

- 入参：`status`、`category_id`、`keyword`、`page`、`pageSize`
- 出参：`{ list, orders, total, page, pageSize, hasMore }`
- 权限：管理员

### `message.getMessageList`

- 入参：`page`、`pageSize`、`is_read`
- 出参：`{ list, messages, unread_count, total, page, pageSize, hasMore }`
- 权限：当前登录用户，仅可看自己的消息

### `message.markMessageRead`

- 入参：`messageId`
- 出参：`{ message }`
- 权限：消息所属用户

### `message.markAllMessagesRead`

- 入参：无
- 出参：`{ updated: true }`
- 权限：当前登录用户

### `message.getUnreadCount`

- 入参：无
- 出参：`{ unread_count }`
- 权限：当前登录用户

### `worker.getWorkerDetail`

- 入参：`workerId`
- 出参：`{ worker, completed_count, average_rating, reviews }`
- 权限：登录用户可查看

## 9. 核心逻辑说明

- 预约时间使用固定时间段常量，先满足 MVP 真实预约场景，暂不做后台配置。
- 完工图片由小程序端上传到云存储，云函数只保存 fileID 数组。
- 消息系统采用主流程附加写入：消息失败不会回滚支付、接单、开始服务、完工、评价、审核。
- 师傅详情统计从订单和评价读取，当前为 MVP 级聚合。
- 列表分页在 handler 层统一返回兼容字段，降低旧页面调用风险。

## 10. 关键技术决策

- 保留 `appointment_time` 字段，兼容旧订单详情展示。
- 完工说明必填，完工图片可空但最多 3 张。
- 管理员订单列表的分类筛选先使用分类 ID 输入，避免引入复杂选择器。
- 云存储上传逻辑无法在本地 node 测试中真实执行，本阶段通过保存 fileID 数组规则测试覆盖。

## 11. 已知问题与遗留事项

- 消息中心暂未做订单消息点击跳转详情。
- 师傅详情入口当前先从用户订单详情进入，管理员入口后续可补。
- 订单分页的真实云数据库查询后续可进一步下沉到 repository 层做数据库级分页。
- 完工图片上传需要在微信开发者工具或真机中验证云存储权限。

## 12. 测试记录

已执行：

```bash
npm test
```

结果：

- 75 个测试全部通过。

新增测试覆盖：

- 预约日期和时间段校验。
- 禁止过去预约日期。
- 完工说明和完工图片保存。
- 订单关键状态生成站内消息。
- 用户只能查看自己的消息。
- 消息已读。
- 师傅完成订单数和平均评分统计。
- 用户、师傅、管理员订单列表分页和权限。
- 阶段 11 新页面与 service 布线。

## 13. 运行与验证方式

1. 创建云数据库集合：`messages`。
2. 上传并部署云函数：`message`。
3. 重新部署已修改云函数：`order`、`worker`、`review`、`admin`。
4. 在微信开发者工具中重新编译。
5. 验证用户下单、模拟支付、师傅接单、开始服务、提交完工、用户评价、消息中心和师傅详情页。

## 14. 对下一阶段的影响

- 后续可接入微信订阅消息时复用 `messages` 作为站内通知基础。
- 后续可把预约时间段改为后台配置。
- 后续可将师傅详情扩展为收藏、指定师傅下单，但本阶段未引入。

## 15. 下一阶段开发计划

- 微信开发者工具真实端回归。
- 云存储上传权限检查。
- 消息点击跳转订单详情。
- 管理员侧师傅详情入口。
- 服务/分类删除保护。

## 16. 下一阶段开始前必须确认的问题

- 真实云环境是否已创建 `messages` 集合。
- 云存储是否允许当前小程序上传完工图片。
- 是否要将管理员分类筛选改为分类选择器。
- 是否开始接入微信订阅消息。

## 17. 本阶段复盘

本阶段延续了 MVP 小步增强的方式，没有改变核心业务状态机，也没有引入大型框架。主要风险在于消息系统和订单流程耦合，因此实现上采用尽力写入，确保消息失败不会破坏订单闭环。

## 18. 阶段结论

阶段 11 已完成。当前 MVP 在核心闭环之外，具备了更接近真实试用的预约、完工凭证、站内消息、师傅详情和列表分页能力，可以进入微信开发者工具与真机回归验证。
