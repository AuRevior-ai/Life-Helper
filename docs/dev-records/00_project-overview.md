# 阶段 0：项目总览

## 1. 阶段基本信息

- 阶段编号：0
- 阶段名称：项目总览
- 开始时间：2026-05-30
- 完成时间：2026-05-30
- 当前分支：master
- 当前版本：0.1.0
- 负责人：Codex
- 阶段状态：已完成

---

## 2. 本阶段目标

本阶段目标是记录同城社区便民综合服务平台 MVP 的基础范围、技术栈、核心业务闭环、角色设计、订单状态机、暂不开发功能和整体开发阶段规划，为后续每个阶段开发提供统一依据。

---

## 3. 本阶段完成内容

- [x] 明确 MVP 只保留普通居民用户、师傅、管理员三类角色
- [x] 明确第一版采用微信原生小程序 + 微信云开发
- [x] 明确核心业务闭环以订单状态流转为主线
- [x] 明确金额统一使用整数分存储，前端展示为元
- [x] 明确管理员初始化方式先采用手动修改数据库角色
- [x] 明确接单大厅第一版只按服务分类一致筛选
- [x] 明确第一阶段先做结构和页面骨架，不写完整业务逻辑
- [x] 明确暂不开发真实支付、提现、分佣、合伙人、AI、地图定位等复杂功能
- [x] 建立阶段记录制度的总览文件

---

## 4. 新增文件

| 文件路径                                  | 说明                                                    |
| ----------------------------------------- | ------------------------------------------------------- |
| `docs/dev-records/00_project-overview.md` | 项目 MVP 总览，记录范围、技术栈、角色、状态机和阶段规划 |
| `docs/dev-records/index.md`               | 阶段记录索引，记录整体进度、阶段文件和遗留问题总表      |

---

## 5. 修改文件

| 文件路径 | 修改内容 |
| -------- | -------- |
| 无       | 无       |

---

## 6. 删除或废弃文件

| 文件路径 | 删除 / 废弃原因 |
| -------- | --------------- |
| 无       | 无              |

---

## 7. 数据库变化

本阶段未创建真实云数据库集合，仅记录后续数据库设计边界。

### 计划新增集合

- `users`
- `service_categories`
- `services`
- `addresses`
- `workers`
- `orders`
- `reviews`

### users 字段说明

| 字段         | 类型   | 说明                            |
| ------------ | ------ | ------------------------------- |
| `_id`        | string | 用户记录 ID                     |
| `openid`     | string | 微信用户 openid                 |
| `nickname`   | string | 用户昵称                        |
| `avatar`     | string | 用户头像                        |
| `phone`      | string | 用户手机号                      |
| `role`       | string | 用户角色：user / worker / admin |
| `status`     | string | 用户状态：normal / disabled     |
| `created_at` | date   | 创建时间                        |
| `updated_at` | date   | 更新时间                        |

### service_categories 字段说明

| 字段         | 类型   | 说明                         |
| ------------ | ------ | ---------------------------- |
| `_id`        | string | 分类 ID                      |
| `name`       | string | 分类名称                     |
| `icon`       | string | 分类图标                     |
| `sort`       | number | 排序值                       |
| `status`     | string | 分类状态：enabled / disabled |
| `created_at` | date   | 创建时间                     |
| `updated_at` | date   | 更新时间                     |

### services 字段说明

| 字段            | 类型   | 说明               |
| --------------- | ------ | ------------------ |
| `_id`           | string | 服务 ID            |
| `category_id`   | string | 所属分类 ID        |
| `category_name` | string | 所属分类名称快照   |
| `name`          | string | 服务名称           |
| `price`         | number | 服务价格，单位：分 |
| `duration`      | string | 服务时长           |
| `cover_image`   | string | 服务封面           |
| `description`   | string | 服务介绍           |
| `status`        | string | 服务状态：on / off |
| `created_at`    | date   | 创建时间           |
| `updated_at`    | date   | 更新时间           |

### addresses 字段说明

| 字段             | 类型    | 说明         |
| ---------------- | ------- | ------------ |
| `_id`            | string  | 地址 ID      |
| `user_id`        | string  | 所属用户 ID  |
| `contact_name`   | string  | 联系人       |
| `phone`          | string  | 联系电话     |
| `city`           | string  | 城市         |
| `community`      | string  | 小区         |
| `detail_address` | string  | 详细地址     |
| `is_default`     | boolean | 是否默认地址 |
| `created_at`     | date    | 创建时间     |
| `updated_at`     | date    | 更新时间     |

### workers 字段说明

| 字段                   | 类型   | 说明                                    |
| ---------------------- | ------ | --------------------------------------- |
| `_id`                  | string | 师傅记录 ID                             |
| `user_id`              | string | 关联用户 ID                             |
| `real_name`            | string | 师傅姓名                                |
| `phone`                | string | 联系电话                                |
| `avatar`               | string | 头像                                    |
| `service_category_ids` | array  | 可服务分类 ID 列表                      |
| `service_communities`  | array  | 可服务小区列表                          |
| `intro`                | string | 个人简介                                |
| `audit_status`         | string | 审核状态：pending / approved / rejected |
| `status`               | string | 账号状态：normal / disabled             |
| `reject_reason`        | string | 拒绝原因                                |
| `created_at`           | date   | 创建时间                                |
| `updated_at`           | date   | 更新时间                                |

### orders 字段说明

| 字段               | 类型   | 说明               |
| ------------------ | ------ | ------------------ |
| `_id`              | string | 订单 ID            |
| `order_no`         | string | 订单编号           |
| `user_id`          | string | 下单用户 ID        |
| `worker_id`        | string | 接单师傅 ID        |
| `service_id`       | string | 服务 ID            |
| `service_name`     | string | 服务名称快照       |
| `category_id`      | string | 服务分类 ID        |
| `category_name`    | string | 服务分类名称快照   |
| `price`            | number | 订单金额，单位：分 |
| `contact_name`     | string | 联系人             |
| `contact_phone`    | string | 联系电话           |
| `city`             | string | 城市               |
| `community`        | string | 小区               |
| `detail_address`   | string | 详细地址           |
| `full_address`     | string | 完整地址           |
| `appointment_time` | string | 预约时间           |
| `remark`           | string | 用户备注           |
| `status`           | string | 订单状态           |
| `pay_status`       | string | 支付状态           |
| `created_at`       | date   | 创建时间           |
| `paid_at`          | date   | 模拟支付时间       |
| `accepted_at`      | date   | 接单时间           |
| `started_at`       | date   | 开始服务时间       |
| `finished_at`      | date   | 师傅完成时间       |
| `completed_at`     | date   | 订单完成时间       |
| `canceled_at`      | date   | 取消时间           |
| `updated_at`       | date   | 更新时间           |

### reviews 字段说明

| 字段         | 类型   | 说明          |
| ------------ | ------ | ------------- |
| `_id`        | string | 评价 ID       |
| `order_id`   | string | 关联订单 ID   |
| `user_id`    | string | 评价用户 ID   |
| `worker_id`  | string | 被评价师傅 ID |
| `rating`     | number | 评分：1-5     |
| `content`    | string | 评价内容      |
| `created_at` | date   | 评价时间      |

### 数据库权限说明

数据库权限后续以云函数为主，不直接依赖前端数据库读写权限。普通用户只能操作自己的用户、地址、订单和评价数据；师傅只能查看和操作自己可接或已接的订单；管理员可查看和管理全量业务数据。第一阶段尚未配置真实数据库权限，阶段 2 起需要逐步补充云函数级权限校验。

---

## 8. 云函数 / 接口变化

本阶段未实现业务接口，仅记录计划云函数边界。

| 云函数    | 功能                           | 入参                | 出参       | 权限要求             |
| --------- | ------------------------------ | ------------------- | ---------- | -------------------- |
| `login`   | 用户登录与初始化               | `action`            | `userInfo` | 所有用户可调用       |
| `user`    | 用户信息获取与更新             | `action`, `payload` | `data`     | 当前用户或管理员     |
| `service` | 分类与服务项目管理             | `action`, `payload` | `data`     | 读取公开，写入管理员 |
| `address` | 地址管理                       | `action`, `payload` | `data`     | 当前用户             |
| `order`   | 订单创建、支付、接单、状态流转 | `action`, `payload` | `data`     | 按角色和订单归属校验 |
| `worker`  | 师傅入驻、审核、接单大厅       | `action`, `payload` | `data`     | 用户、师傅或管理员   |
| `review`  | 评价创建与查询                 | `action`, `payload` | `data`     | 当前用户或公开读取   |
| `admin`   | 管理端统计和列表               | `action`, `payload` | `data`     | 管理员               |

---

## 9. 核心逻辑说明

### MVP 核心业务闭环

```text
用户登录
↓
浏览服务分类
↓
查看服务列表
↓
查看服务详情
↓
填写地址、预约时间、备注
↓
提交订单
↓
模拟支付
↓
订单状态变为待接单
↓
师傅进入接单大厅
↓
师傅接单
↓
订单状态变为已接单
↓
师傅开始服务
↓
订单状态变为服务中
↓
师傅完成服务
↓
订单状态变为待评价
↓
用户提交评分和评价
↓
订单状态变为已完成
```

### 订单状态机

```text
pending_pay
↓ mockPayOrder
pending_accept
↓ acceptOrder
accepted
↓ startService
serving
↓ finishService
pending_review
↓ createReview
completed
```

取消流程：

```text
pending_pay / pending_accept
↓ cancelOrder
canceled
```

状态枚举：

| 枚举             | 值               | 中文含义 |
| ---------------- | ---------------- | -------- |
| `PENDING_PAY`    | `pending_pay`    | 待付款   |
| `PENDING_ACCEPT` | `pending_accept` | 待接单   |
| `ACCEPTED`       | `accepted`       | 已接单   |
| `SERVING`        | `serving`        | 服务中   |
| `PENDING_REVIEW` | `pending_review` | 待评价   |
| `COMPLETED`      | `completed`      | 已完成   |
| `CANCELED`       | `canceled`       | 已取消   |

支付状态：

| 枚举     | 值       | 中文含义 |
| -------- | -------- | -------- |
| `UNPAID` | `unpaid` | 未支付   |
| `PAID`   | `paid`   | 已支付   |

---

## 10. 关键技术决策

### 决策 1：使用微信原生小程序 + 云开发

原因：

- 符合 MVP 快速练手目标
- 不需要先搭建独立服务器
- 登录、云数据库、云函数和云存储集成成本低

影响：

- 后续正式商业化时可以迁移到独立后端
- 第一版需要注意不要把业务逻辑散落在页面中

### 决策 2：金额统一使用整数分存储

原因：

- 避免浮点数金额精度问题
- 方便后续接入真实微信支付
- 统计、结算、退款等后续能力更稳定

影响：

- 前端展示时需要统一格式化为元
- 文档和字段说明必须持续强调单位

### 决策 3：管理员初始化先手动修改数据库角色

原因：

- MVP 阶段不引入复杂后台账号体系
- 可以快速验证管理员入口和权限逻辑

影响：

- 阶段 2 需要说明如何手动把 `users.role` 改为 `admin`
- 后续可在阶段 7 增加更正式的管理员初始化脚本或配置

### 决策 4：接单大厅第一版只按服务分类筛选

原因：

- 避免提前引入地图、距离、小区范围等复杂匹配
- 更适合先跑通下单到接单主流程

影响：

- 师傅服务区域字段仍保留
- 后续可扩展为小区匹配、距离匹配或智能派单

---

## 11. 已知问题与遗留事项

| 问题                                    | 影响                           | 后续处理建议                                            | 优先级 |
| --------------------------------------- | ------------------------------ | ------------------------------------------------------- | ------ |
| 尚未配置真实微信云开发环境 ID           | 无法直接部署真实云函数和数据库 | 阶段 2 开始前在微信开发者工具中创建云环境并确认配置方式 | P1     |
| 管理员初始化方式暂时依赖手动改库        | 不影响 MVP，但不够自动化       | 阶段 2 文档化手动改库步骤，阶段 7 再优化                | P1     |
| 阶段 1 代码骨架已完成但阶段记录尚未补齐 | 阶段记录制度不完整             | 下一步优先补 `01_phase-init.md`                         | P1     |
| 云函数占位入口尚未实现真实业务          | P0 主流程尚不能运行            | 从阶段 2 起按模块逐步实现                               | P0     |

---

## 12. 测试记录

### 已测试

- [x] 阶段一骨架测试已建立
- [x] 小程序路由文件完整性已通过自动化测试
- [x] 核心订单状态、支付状态、用户角色枚举已通过自动化测试
- [x] 金额格式化和地址拼接工具已通过自动化测试
- [x] 云函数目录完整性已通过自动化测试

### 未测试

- [ ] 微信开发者工具真实编译预览
- [ ] 云开发环境部署
- [ ] 登录云函数真实调用
- [ ] 云数据库集合权限
- [ ] 多角色真实登录与入口控制

### 测试账号 / 测试数据

暂无真实测试账号。当前阶段不记录敏感密钥、AppID 或真实 openid。

---

## 13. 运行与验证方式

当前项目可在本地执行：

```bash
npm test
```

阶段一骨架验证通过后，可使用微信开发者工具打开项目根目录。当前 `project.config.json` 使用 `touristappid`，接入真实小程序时需要替换为实际 AppID。

---

## 14. 对下一阶段的影响

本阶段明确了项目范围、角色边界、数据库设计、云函数边界和订单状态机。下一阶段可以基于这些约定实现微信登录、`users` 集合初始化、角色字段、用户状态字段和管理员初始化说明，避免登录与权限逻辑在后续返工。

---

## 15. 下一阶段开发计划

下一阶段名称：

> 阶段 1：架构与初始化阶段记录补齐

下一阶段目标：

补齐 `01_phase-init.md`，把已经完成的项目初始化、目录结构、常量、工具函数、基础组件、页面骨架、云函数占位和测试结果写入阶段记录。

下一阶段任务清单：

- [ ] 阅读 `docs/dev-records/index.md`
- [ ] 阅读 `docs/dev-records/00_project-overview.md`
- [ ] 检查阶段 1 已完成文件清单
- [ ] 创建 `docs/dev-records/01_phase-init.md`
- [ ] 更新 `docs/dev-records/index.md`
- [ ] 明确进入阶段 2 前需要确认的问题

下一阶段重点注意事项：

- 不要把阶段 1 记录写成泛泛总结
- 必须记录新增文件、修改文件、云函数变化和测试结果
- 必须如实记录云函数仍为占位逻辑

---

## 16. 下一阶段开始前必须确认的问题

1. 是否先补齐 `01_phase-init.md`，再进入阶段 2 登录与用户体系？
2. 微信云开发环境 ID 是否已经创建，还是阶段 2 继续使用动态当前环境占位？
3. 管理员初始化是否继续按已确认方案：手动把指定用户 `role` 改为 `admin`？

---

## 17. 本阶段复盘

### 做得好的地方

- MVP 范围收敛清晰，避免第一版过早进入支付、分佣、合伙人、AI、地图等复杂能力。
- 订单状态机和角色权限提前统一，有利于后续云函数集中校验。
- 金额单位提前确定为分，降低后续接真实支付时的返工风险。

### 不足的地方

- 阶段记录制度是在阶段一代码骨架完成后补充的，因此 `01_phase-init.md` 需要回填。
- 当前还没有真实云开发环境配置，无法验证云函数部署和数据库权限。

### 后续改进建议

- 每个阶段开始前严格先读 `index.md` 和上一阶段记录。
- 每个阶段结束后立即生成阶段记录，不再只依赖聊天总结。
- 从阶段 2 开始把权限校验和状态流转放在云函数中，避免页面层承担业务规则。

---

## 18. 阶段结论

阶段 0 已完成项目总览记录，明确了 MVP 开发边界、技术栈、角色、订单状态机和阶段推进方式。当前可以继续补齐阶段 1 初始化记录，然后进入阶段 2 登录与用户体系。进入后续阶段前，必须先阅读本文件和 `docs/dev-records/index.md`，并检查遗留问题是否影响当前阶段。
