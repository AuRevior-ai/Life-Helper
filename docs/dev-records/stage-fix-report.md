# 试运营前安全修复与工程收口报告

## 1. 本阶段目标

本阶段不新增大功能，不改变当前 MVP 主流程。目标是修复明确权限风险，收紧管理员初始化入口，更新过期文档，记录公共逻辑、状态常量、数据库索引和分页相关技术债，并通过完整自动化回归，提升项目进入小范围真实试运营前的可靠性。

## 2. 修复问题列表

- [x] 支付状态查询增加订单归属校验。
- [x] 首个管理员初始化增加环境变量开关、openid 白名单和可选初始化码。
- [x] README、验证清单、发布检查清单和开发索引更新到当前阶段。
- [x] 明确真实支付暂不可测原因和 mock/真实支付边界。
- [x] 记录云函数公共逻辑重复风险。
- [x] 标记状态常量权威来源和同步风险。
- [x] 给出数据库建议索引清单。
- [x] 新增权限相关自动化测试。

## 3. 修改文件清单

| 文件                                    | 修改原因                                               |
| --------------------------------------- | ------------------------------------------------------ |
| `cloudfunctions/payment/handler.js`     | `queryPaymentStatus` 增加订单归属权限校验              |
| `cloudfunctions/user/handler.js`        | `claimInitialAdmin` 增加初始化保护                     |
| `cloudfunctions/user/index.js`          | 注入管理员初始化环境变量配置                           |
| `tests/phase13.wechat-pay-lite.test.js` | 增加支付状态查询权限测试                               |
| `tests/mvp.stabilization.test.js`       | 增加管理员初始化保护测试                               |
| `README.md`                             | 更新当前状态、测试数量、真实支付边界和管理员初始化说明 |
| `docs/wechat-mvp-verification.md`       | 更新真机验证、管理员初始化和试运营验收项               |
| `docs/release-package-checklist.md`     | 增加管理员初始化环境变量和敏感信息检查                 |
| `docs/dev-records/index.md`             | 增加本次修复收口状态与遗留问题                         |
| `docs/dev-records/stage-fix-report.md`  | 本报告                                                 |

## 4. 问题原因分析与修复方案

### 4.1 支付状态查询权限问题

原因：`queryPaymentStatus` 原逻辑只按 `orderId` 查询订单，没有判断订单 `user_id` 是否属于当前 openid。少量真机测试中不容易暴露，但一旦前端或请求参数被构造，普通用户可能查询他人订单支付状态。

修复：在 `queryPaymentStatus` 中调用 `requireOpenid(env)`，查询订单后校验 `order.user_id === openid`。不匹配时返回 `PERMISSION_DENIED`。管理员后续如需查询支付信息，应新增管理员专用接口，不复用普通用户查询接口绕过权限。

影响范围：只影响支付状态查询接口；创建支付和支付回调流程不变。

验证方式：新增测试覆盖查询本人订单成功、查询他人订单失败、订单不存在返回 `ORDER_NOT_FOUND`。

### 4.2 首个管理员初始化安全问题

原因：MVP 阶段允许系统无管理员时任意首个普通用户初始化为管理员。这个设计便于早期真机测试，但正式环境存在被抢占管理员的风险。

修复：`claimInitialAdmin` 在确认系统无管理员后，增加初始化保护：

- `ADMIN_BOOTSTRAP_ENABLED=true` 才允许初始化。
- `ADMIN_BOOTSTRAP_ALLOWED_OPENIDS` 可限制允许初始化的 openid，多个 openid 用英文逗号分隔。
- `ADMIN_BOOTSTRAP_CODE` 可配置一次性初始化码；配置后请求需传 `initCode` 或 `adminBootstrapCode`。

影响范围：管理员初始化流程更安全。已有管理员时仍直接返回 `ADMIN_ALREADY_EXISTS`。已初始化管理员的登录和管理功能不受影响。

验证方式：新增测试覆盖符合条件可初始化、开关关闭不可初始化、openid 不在白名单不可初始化、已有管理员后不可重复初始化。

### 4.3 文档过期问题

原因：阶段 15 后工程能力已包含服务区域、派单、售后和模拟退款，但部分文档仍停留在早期阶段或未说明真实支付受商户资质限制。

修复：更新 README、真机验证清单、发布包检查清单和开发记录索引，明确当前自动化测试数量为 100，真实支付暂不可测原因是缺少微信支付商户资质、JSAPI 支付权限和回调配置。

影响范围：只影响文档。

验证方式：运行自动化测试，并人工检查文档关键内容。

## 5. 是否影响旧功能

本阶段不改变下单、模拟支付、师傅接单、服务完成、评价、售后、模拟退款、区域派单主流程。

唯一行为变化：

- 普通用户不能再查询他人订单支付状态。
- 首个管理员初始化默认关闭，必须通过云函数环境变量显式开启。

这两个变化都是安全收紧，不影响已存在管理员账号的使用。

## 6. 测试用例与测试结果

新增或更新测试：

- `payment status query is limited to current user order ownership`
- `claimInitialAdmin requires bootstrap switch and optional openid allowlist`
- 原 `first normal user can claim initial admin when no admin exists` 增加合法环境变量配置。

验证命令：

```bash
npm test
```

测试结果：

```text
tests 100
pass 100
fail 0
```

## 7. 公共逻辑重复评估

检查范围包括云函数中的 `success`、`fail`、`serviceError`、`requireOpenid`、`requireAdmin`、`getPayload`、`getNow` 和分页逻辑。

结论：重复确实存在，但当前云函数已多次真机验证，且不同函数的权限语义略有差异。本阶段不做大规模抽取，避免引入跨函数依赖风险。后续可在单独工程治理阶段新增 `cloudfunctions/_shared/`，先抽取无状态且稳定的响应和错误函数，再逐步迁移鉴权和分页。

建议优先级：

1. `success` / `fail` / `serviceError`
2. `getPayload` / `getNow`
3. `requireOpenid`
4. `paginateList`
5. `requireAdmin`

## 8. 状态常量评估

当前状态常量存在前后端重复定义，尤其是订单、支付、售后、退款、师傅状态。

本阶段不强行统一，因为云函数是独立部署单元，直接引用小程序前端常量会引入部署路径和运行环境风险。

当前约定：

- 前端展示权威来源：`miniprogram/config/status.js`
- 云函数业务判断：各函数内局部常量，必须与前端状态名保持一致
- 新增状态必须同步更新前端常量、云函数判断、测试和开发记录

## 9. 数据库索引建议清单

请在云开发控制台按真实查询情况配置索引。建议如下：

| 集合            | 建议索引                         | 用途                       |
| --------------- | -------------------------------- | -------------------------- |
| `users`         | `openid`                         | 登录、鉴权、管理员判断     |
| `users`         | `role`                           | 查找是否已有管理员         |
| `orders`        | `user_id + updated_at`           | 用户订单列表               |
| `orders`        | `worker_id + updated_at`         | 师傅订单列表               |
| `orders`        | `status + updated_at`            | 接单大厅、管理员筛选       |
| `orders`        | `out_trade_no`                   | 支付回调定位订单           |
| `orders`        | `service_area_id + status`       | 区域派单                   |
| `workers`       | `user_id`                        | 师傅身份查询               |
| `workers`       | `audit_status + status`          | 管理员审核、可派单师傅筛选 |
| `workers`       | `online_status + audit_status`   | 接单状态过滤               |
| `messages`      | `user_id + is_read + created_at` | 消息中心和未读统计         |
| `payment_logs`  | `order_id + created_at`          | 支付问题排查               |
| `refund_logs`   | `order_id + created_at`          | 退款问题排查               |
| `after_sales`   | `order_id + status`              | 售后详情和重复售后拦截     |
| `service_areas` | `status + sort`                  | 地址和师傅服务区域选择     |
| `dispatch_logs` | `order_id + created_at`          | 派单日志查询               |

## 10. 分页与全量读取风险

当前部分管理员统计、服务统计、派单候选和日志读取仍可能使用全量读取。少访问量试运营可接受，但数据增长后需优化。

已记录风险：

- `admin.getDashboard` 聚合统计依赖全量读取。
- `dispatch.getAssignableWorkers` 当前读取师傅列表后内存过滤。
- `message.getUnreadCount` 对当前用户消息做全量读取。
- 部分日志列表在未传 `orderId` 时可能读取全量。

后续建议：先给管理员列表和日志列表补分页，再考虑后台统计预聚合。

## 11. 仍未解决的问题

- 真实微信支付和真实退款仍未联调，原因是缺少商户资质和支付权限。
- 云函数公共逻辑尚未统一抽取。
- 状态常量尚未建立自动一致性校验。
- 数据库索引需要在真实云环境手动配置并验证。
- 尚未完成体验版或更大范围真机压测。

## 12. 后续建议

1. 部署前先关闭管理员初始化开关。
2. 真实云环境配置建议索引。
3. 用 3 个测试账号完成用户、师傅、管理员主链路回归。
4. 持续记录 `docs/wechat-real-env-issues.md`。
5. 真实支付资质准备好后，再单独进入微信支付联调阶段。

## 13. 是否可以进入小范围试运营

可以进入小范围试运营前验证，但建议限定范围：

- 使用 mock 支付，不承诺真实资金流。
- 使用少量测试账号和测试小区。
- 首个管理员初始化完成后关闭环境变量。
- 每次部署后检查 `payment_logs`、`dispatch_logs`、`admin_operation_logs`、`messages` 是否正常写入。

判断：当前工程具备小范围试运营前验证条件，但不具备真实收费上线条件。
