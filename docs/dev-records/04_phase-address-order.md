# 阶段 4：地址与下单

## 1. 阶段基本信息

- 阶段编号：4
- 阶段名称：地址与下单
- 开始时间：2026-05-30
- 完成时间：2026-05-30
- 当前分支：master
- 当前版本：0.1.0
- 负责人：Codex
- 阶段状态：已完成

---

## 2. 本阶段目标

本阶段目标是完成用户端地址管理、服务下单、订单创建、模拟支付、用户订单列表和订单详情。完成后，用户可以从服务详情进入提交订单页，使用自己的服务地址创建订单，并通过模拟支付把订单推进到待师傅接单状态，为阶段五的师傅入驻和接单流程提供数据基础。

---

## 3. 本阶段完成内容

- [x] 阅读 `docs/dev-records/index.md`
- [x] 阅读 `docs/dev-records/03_phase-service-browse.md`
- [x] 确认阶段 4 四个问题均按“是”执行
- [x] 编写阶段 4 实施计划
- [x] 编写地址与订单失败测试
- [x] 实现 `address.getAddressList`
- [x] 实现 `address.createAddress`
- [x] 实现 `address.updateAddress`
- [x] 实现 `address.deleteAddress`
- [x] 实现 `address.setDefaultAddress`
- [x] 实现 `order.createOrder`
- [x] 实现 `order.mockPayOrder`
- [x] 实现 `order.getUserOrderList`
- [x] 实现 `order.getOrderDetail`
- [x] 实现 `order.cancelOrder`
- [x] 地址列表页接入地址读取、默认地址、编辑和删除
- [x] 地址编辑页接入表单校验、新增和更新
- [x] 服务详情页“立即预约”进入提交订单页
- [x] 提交订单页接入服务详情、地址选择、预约时间、备注和创建订单
- [x] 订单列表页展示当前用户订单
- [x] 订单详情页展示订单快照、模拟支付和取消订单
- [x] “我的”页面订单和地址入口支持跳转
- [x] 使用 `npm test` 验证阶段一至阶段四测试

---

## 4. 新增文件

| 文件路径                                                    | 说明                       |
| ----------------------------------------------------------- | -------------------------- |
| `docs/superpowers/plans/2026-05-30-phase4-address-order.md` | 阶段四实施计划             |
| `tests/phase4.address-order.test.js`                        | 地址、订单和页面接入测试   |
| `cloudfunctions/address/handler.js`                         | 地址云函数业务逻辑         |
| `cloudfunctions/address/address-repository.js`              | 地址集合读写封装           |
| `cloudfunctions/order/handler.js`                           | 订单云函数业务逻辑         |
| `cloudfunctions/order/order-repository.js`                  | 订单集合读写和地址只读封装 |
| `cloudfunctions/order/service-data.js`                      | 下单用服务快照种子数据     |
| `docs/dev-records/04_phase-address-order.md`                | 本阶段开发记录与复盘       |

---

## 5. 修改文件

| 文件路径                                             | 修改内容                                   |
| ---------------------------------------------------- | ------------------------------------------ |
| `cloudfunctions/address/index.js`                    | 从占位入口改为调用 `handleAddress`         |
| `cloudfunctions/order/index.js`                      | 从占位入口改为调用 `handleOrder`           |
| `miniprogram/app.wxss`                               | 增加阶段四复用的按钮、表单、标签和标题样式 |
| `miniprogram/pages/address-list/*`                   | 地址管理页接入真实数据与交互               |
| `miniprogram/pages/address-edit/*`                   | 地址表单页接入新增和编辑                   |
| `miniprogram/pages/order-submit/*`                   | 提交订单页接入服务、地址和订单创建         |
| `miniprogram/pages/order-list/*`                     | 我的订单页接入订单列表                     |
| `miniprogram/pages/order-detail/*`                   | 订单详情页接入详情、模拟支付和取消         |
| `miniprogram/pages/profile/profile.js`               | 增加订单、地址、师傅、管理员入口跳转       |
| `miniprogram/pages/profile/profile.wxml`             | 菜单项绑定跳转事件                         |
| `miniprogram/pages/service-detail/service-detail.js` | “立即预约”跳转提交订单页                   |
| `docs/dev-records/index.md`                          | 更新阶段四完成状态、P0 完成情况和遗留问题  |
| `README.md`                                          | 补充阶段四说明和验证步骤                   |

---

## 6. 删除或废弃文件

| 文件路径 | 删除 / 废弃原因 |
| -------- | --------------- |
| 无       | 无              |

---

## 7. 数据库变化

本阶段开始使用两个真实云数据库集合：

| 集合        | 作用                   | 当前写入方式     |
| ----------- | ---------------------- | ---------------- |
| `addresses` | 保存用户服务地址       | `address` 云函数 |
| `orders`    | 保存用户订单和状态流转 | `order` 云函数   |

### `addresses` 主要字段

| 字段             | 说明                    |
| ---------------- | ----------------------- |
| `_id`            | 云数据库文档 ID         |
| `user_id`        | 当前阶段使用用户 openid |
| `contact_name`   | 联系人                  |
| `phone`          | 手机号                  |
| `city`           | 城市                    |
| `community`      | 小区                    |
| `detail_address` | 详细地址                |
| `is_default`     | 是否默认地址            |
| `created_at`     | 创建时间                |
| `updated_at`     | 更新时间                |

### `orders` 主要字段

| 字段                                                     | 说明                    |
| -------------------------------------------------------- | ----------------------- |
| `_id`                                                    | 云数据库文档 ID         |
| `order_no`                                               | 订单号                  |
| `user_id`                                                | 当前阶段使用用户 openid |
| `worker_id`                                              | 师傅 ID，阶段四为空     |
| `service_id`                                             | 服务 ID                 |
| `service_name`                                           | 服务名称快照            |
| `service_duration`                                       | 服务时长快照            |
| `category_id`                                            | 分类 ID 快照            |
| `category_name`                                          | 分类名称快照            |
| `price`                                                  | 订单金额，单位分        |
| `address_id`                                             | 地址 ID                 |
| `contact_name`                                           | 联系人快照              |
| `contact_phone`                                          | 联系电话快照            |
| `city` / `community` / `detail_address` / `full_address` | 地址快照                |
| `appointment_time`                                       | 预约时间文本            |
| `remark`                                                 | 用户备注                |
| `status`                                                 | 订单状态                |
| `pay_status`                                             | 支付状态                |
| `paid_at`                                                | 模拟支付时间            |
| `canceled_at`                                            | 取消时间                |
| `created_at`                                             | 创建时间                |
| `updated_at`                                             | 更新时间                |

### 数据库权限说明

小程序端不直接访问数据库。地址和订单均通过云函数读写。阶段四使用 openid 做用户归属字段，后续如果需要严格关联 `users._id`，可以在云函数中通过 openid 查询用户后再写入内部用户 ID。

---

## 8. 云函数 / 接口变化

### `address`

| 功能                | 入参                                                                         | 出参            | 权限要求     |
| ------------------- | ---------------------------------------------------------------------------- | --------------- | ------------ |
| `getAddressList`    | 无                                                                           | `{ addresses }` | 当前登录用户 |
| `createAddress`     | `contact_name`, `phone`, `city`, `community`, `detail_address`, `is_default` | `{ address }`   | 当前登录用户 |
| `updateAddress`     | `addressId` 和地址字段                                                       | `{ address }`   | 地址所属用户 |
| `deleteAddress`     | `addressId`                                                                  | `{ addressId }` | 地址所属用户 |
| `setDefaultAddress` | `addressId`                                                                  | `{ address }`   | 地址所属用户 |

### `order`

| 功能               | 入参                                                   | 出参         | 权限要求     |
| ------------------ | ------------------------------------------------------ | ------------ | ------------ |
| `createOrder`      | `serviceId`, `addressId`, `appointment_time`, `remark` | `{ order }`  | 当前登录用户 |
| `mockPayOrder`     | `orderId`                                              | `{ order }`  | 订单所属用户 |
| `getUserOrderList` | 可选 `status`                                          | `{ orders }` | 当前登录用户 |
| `getOrderDetail`   | `orderId`                                              | `{ order }`  | 订单所属用户 |
| `cancelOrder`      | `orderId`                                              | `{ order }`  | 订单所属用户 |

### 统一错误码

| 错误码                     | 说明                       |
| -------------------------- | -------------------------- |
| `OPENID_MISSING`           | 无法获取当前用户 openid    |
| `ADDRESS_REQUIRED`         | 地址字段不完整             |
| `ADDRESS_PHONE_INVALID`    | 手机号格式不正确           |
| `ADDRESS_ID_MISSING`       | 缺少地址 ID                |
| `ADDRESS_NOT_FOUND`        | 地址不存在                 |
| `SERVICE_ID_MISSING`       | 缺少服务 ID                |
| `SERVICE_NOT_FOUND`        | 服务不存在或已下架         |
| `APPOINTMENT_TIME_MISSING` | 缺少预约时间               |
| `ORDER_ID_MISSING`         | 缺少订单 ID                |
| `ORDER_NOT_FOUND`          | 订单不存在                 |
| `ORDER_STATUS_INVALID`     | 当前订单状态不能执行该操作 |
| `PERMISSION_DENIED`        | 无权操作目标资源           |
| `ACTION_NOT_FOUND`         | 未知 action                |
| `INTERNAL_ERROR`           | 未预期内部错误             |

---

## 9. 核心逻辑说明

### 地址管理逻辑

```text
用户进入地址管理页
↓
调用 address.getAddressList 获取当前 openid 下的地址
↓
用户新增或编辑地址
↓
前端校验联系人、手机号、城市、小区、详细地址
↓
调用 address.createAddress 或 address.updateAddress
↓
如果 is_default 为 true，云函数清空当前用户其他默认地址
```

### 下单逻辑

```text
用户在服务详情页点击立即预约
↓
进入 order-submit，携带 serviceId
↓
读取服务详情和当前用户地址列表
↓
用户选择地址，填写预约时间和备注
↓
调用 order.createOrder
↓
云函数校验服务、地址归属和预约时间
↓
写入订单快照，状态 pending_pay，支付状态 unpaid
↓
跳转订单详情页
```

### 模拟支付逻辑

```text
用户进入订单详情页
↓
如果 status = pending_pay 且 pay_status = unpaid
↓
展示模拟支付按钮
↓
点击后调用 order.mockPayOrder
↓
云函数将订单更新为 pending_accept / paid
↓
阶段五师傅端可读取 pending_accept 订单
```

---

## 10. 关键技术决策

### 决策 1：阶段四使用 openid 作为地址和订单的用户归属

原因：

- 云函数天然可以从 `cloud.getWXContext()` 获取 openid
- 当前阶段重点是跑通微信端主流程
- 避免每个地址和订单接口都先查询 `users` 集合

影响：

- `addresses.user_id` 和 `orders.user_id` 当前保存 openid
- 后续如果要统一成 `users._id`，需要做一次迁移或兼容查询

### 决策 2：订单保存服务和地址快照

原因：

- 订单创建后不应受服务名称、价格、地址修改影响
- 后续师傅端和管理员端展示订单时可以直接读取订单数据

影响：

- `orders` 集合保存服务名称、分类、价格、联系人和完整地址
- 后续服务管理变更不会影响历史订单展示

### 决策 3：阶段四继续使用内置服务快照

原因：

- 服务数据仍由阶段三内置种子提供
- 订单云函数部署时不应依赖其他云函数目录
- 阶段七才做服务管理和数据库化

影响：

- `cloudfunctions/order/service-data.js` 与 `cloudfunctions/service/seed-data.js` 存在一份阶段性重复
- 阶段七迁移服务管理时需要统一服务数据来源

### 决策 4：模拟支付只改状态，不接真实资金链路

原因：

- MVP 明确不接微信支付、退款、提现和平台抽佣
- 当前目标是验证订单业务流转

影响：

- `mockPayOrder` 只把订单更新为 `pending_accept` 和 `paid`
- 不生成真实支付单、退款单或交易流水

---

## 11. 已知问题与遗留事项

| 问题                                           | 影响                               | 后续处理建议                                  | 优先级 |
| ---------------------------------------------- | ---------------------------------- | --------------------------------------------- | ------ |
| 尚未在微信开发者工具中真实编译和预览阶段四页面 | 可能存在小程序运行时细节问题       | 部署 `address/order` 云函数后做一次微信端验证 | P1     |
| 尚未创建真实 `addresses` 和 `orders` 集合      | 微信端无法保存地址和订单           | 微信云开发控制台创建集合                      | P0     |
| 尚未部署 `address` 和 `order` 云函数           | 微信端无法调用阶段四接口           | 微信开发者工具上传并部署云函数                | P0     |
| 地址和订单当前使用 openid 作为 `user_id`       | 与后续内部用户 ID 体系可能需要兼容 | 阶段七或优化阶段评估是否迁移                  | P2     |
| 订单云函数有一份服务快照种子数据               | 与服务浏览种子数据可能产生重复维护 | 阶段七服务管理数据库化时统一来源              | P1     |
| 取消已模拟支付订单不会走退款                   | 不适合真实支付场景                 | 接入真实支付前重做支付和退款流                | P1     |
| 订单列表未分页                                 | 数据多时列表可能变慢               | 优化阶段加入分页                              | P2     |

---

## 12. 测试记录

### 已测试

- [x] 地址创建会校验必填字段并保存当前用户归属
- [x] 默认地址只在当前用户范围内互斥
- [x] 地址列表只返回当前用户地址
- [x] 地址更新和删除校验资源归属
- [x] 创建订单会保存服务快照和地址快照
- [x] 创建订单后状态为 `pending_pay`，支付状态为 `unpaid`
- [x] 模拟支付后状态为 `pending_accept`，支付状态为 `paid`
- [x] 用户订单列表只返回当前用户订单
- [x] 订单详情只允许订单所属用户读取
- [x] 阶段四页面接入地址、服务和订单服务
- [x] 阶段一、阶段二、阶段三测试仍然通过

### 未测试

- [ ] 微信开发者工具真实编译
- [ ] 真机预览
- [ ] 云函数真实部署
- [ ] 真实云数据库集合权限
- [ ] 多地址、多订单在真实设备上的视觉体验

测试命令：

```bash
npm test
```

最近一次测试结果：

```text
tests 31
pass 31
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
pass 31
fail 0
```

### 微信开发者工具验证

1. 打开微信开发者工具
2. 选择当前项目根目录
3. 确认已选择云开发环境
4. 创建 `addresses` 集合
5. 创建 `orders` 集合
6. 上传并部署 `cloudfunctions/login`
7. 上传并部署 `cloudfunctions/user`
8. 上传并部署 `cloudfunctions/service`
9. 上传并部署 `cloudfunctions/address`
10. 上传并部署 `cloudfunctions/order`
11. 编译小程序
12. 进入“我的”页面完成微信授权登录
13. 进入“我的 - 地址管理”新增一个默认地址
14. 从首页进入服务详情，点击“立即预约”
15. 在提交订单页选择地址，填写预约时间，提交订单
16. 在订单详情页点击“模拟支付”
17. 返回“我的订单”，确认订单状态为“待接单”

---

## 14. 对下一阶段的影响

阶段四已经把订单推进到 `pending_accept`。阶段五可以围绕这个状态实现师傅入驻、管理员审核、接单大厅和师傅接单。师傅接单后可更新 `orders.worker_id` 并把订单状态改为 `accepted`，后续再进入开始服务和完成服务。

---

## 15. 下一阶段开发计划

下一阶段名称：

> 阶段 5：师傅入驻、审核与接单

下一阶段目标：

完成师傅申请入驻、管理员审核师傅、接单大厅、师傅接单、师傅订单列表和师傅订单详情，使已支付订单从 `pending_accept` 进入 `accepted`。

下一阶段任务清单：

- [ ] 阅读 `docs/dev-records/index.md`
- [ ] 阅读 `docs/dev-records/04_phase-address-order.md`
- [ ] 实现 `worker` 云函数入驻申请
- [ ] 实现师傅申请页
- [ ] 实现管理员师傅审核能力
- [ ] 实现接单大厅读取 `pending_accept` 订单
- [ ] 实现师傅接单
- [ ] 实现师傅订单列表和订单详情
- [ ] 更新阶段 5 记录文件

下一阶段重点注意事项：

- 只展示已模拟支付的 `pending_accept` 订单给师傅
- 接单时要防止同一订单被重复接单
- 师傅资料和用户角色需要保持一致
- 管理员审核仍以 MVP 简化流程为主

---

## 16. 下一阶段开始前必须确认的问题

1. 师傅入驻字段是否先按姓名、手机号、服务分类、服务区域、个人简介实现？
2. 师傅资质图片是否先不上传，只保留字段或后续再做？
3. 管理员审核师傅是否先做通过/拒绝两个动作，不做复杂审核流？
4. 接单大厅是否只展示 `pending_accept` 订单，师傅点击接单后状态变为 `accepted`？

---

## 17. 本阶段复盘

### 做得好的地方

- 继续采用测试先行，先看到 7 个阶段四测试失败，再实现功能并转绿。
- 地址、订单云函数保持用户归属校验，页面不直接访问数据库。
- 订单创建保存服务和地址快照，为后续师傅端、管理员端展示打基础。
- 页面从占位状态变成可操作流程，用户已经可以完成地址、下单、模拟支付和订单查看。

### 不足的地方

- 尚未在真实微信开发者工具中验证阶段四页面。
- 服务数据仍有种子数据重复，后续管理后台阶段要统一。
- 支付仍为模拟状态，不适合真实交易。

### 后续改进建议

- 阶段五前部署 `address` 和 `order` 云函数，在微信开发者工具中完成一次完整点击流。
- 阶段七统一服务数据来源，避免服务浏览和订单快照种子长期分叉。
- 接入真实支付前重做支付、退款、订单取消和状态机边界。

---

## 18. 阶段结论

阶段 4 已完成地址与下单目标。用户可以维护地址，从服务详情提交订单，并通过模拟支付把订单推进到待接单状态。当前本地自动化测试全部通过，下一步建议进入阶段 5：师傅入驻、审核与接单。
