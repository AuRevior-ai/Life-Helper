# 阶段 7：管理员管理能力

## 1. 阶段基本信息

- 阶段编号：7
- 阶段名称：管理员管理能力
- 开始时间：2026-05-30
- 完成时间：2026-05-30
- 当前分支：master
- 当前版本：0.1.0
- 负责人：Codex
- 阶段状态：已完成

---

## 2. 本阶段目标

本阶段目标是把管理员能力从占位页推进到可操作状态：管理员可以查看运营看板、查看并手动调整订单状态、查看并禁用用户，同时把服务分类和服务数据从代码种子扩展为可同步到云数据库的目录数据。

---

## 3. 本阶段完成内容

- [x] 阅读 `docs/dev-records/index.md`
- [x] 阅读 `docs/dev-records/06_phase-review-order-close.md`
- [x] 确认阶段 7 四个问题均按“是”执行
- [x] 编写阶段 7 实施计划
- [x] 编写阶段 7 失败测试
- [x] 实现 `admin.getDashboard`
- [x] 实现 `admin.getAllOrders`
- [x] 实现 `admin.getOrderDetail`
- [x] 实现 `admin.adminUpdateOrderStatus`
- [x] 实现 `admin.getAllUsers`
- [x] 实现 `admin.disableUser`
- [x] 实现 `service.seedServiceData`
- [x] 服务浏览优先读取云数据库，空数据时回退内置种子数据
- [x] 管理首页、订单管理、订单详情、用户管理、服务管理、分类管理页面接入真实 API
- [x] 使用 `npm test` 验证阶段一至阶段七测试

---

## 4. 新增文件

| 文件路径                                            | 说明                                   |
| --------------------------------------------------- | -------------------------------------- |
| `docs/superpowers/plans/2026-05-30-phase7-admin.md` | 阶段七实施计划                         |
| `tests/phase7.admin.test.js`                        | 管理端、服务目录数据库化和页面接入测试 |
| `cloudfunctions/admin/handler.js`                   | 管理员云函数业务逻辑                   |
| `cloudfunctions/admin/repositories.js`              | 管理员云函数集合读写封装               |
| `cloudfunctions/service/repositories.js`            | 服务分类、服务和用户只读仓储           |
| `docs/dev-records/07_phase-admin.md`                | 本阶段开发记录与复盘                   |

---

## 5. 修改文件

| 文件路径                                  | 修改内容                                            |
| ----------------------------------------- | --------------------------------------------------- |
| `cloudfunctions/admin/index.js`           | 从占位入口改为注入真实仓储并调用 `handleAdmin`      |
| `cloudfunctions/service/handler.js`       | 增加服务数据同步、管理端上下架、数据库优先读取      |
| `cloudfunctions/service/index.js`         | 注入 `users`、`service_categories`、`services` 仓储 |
| `miniprogram/services/admin.service.js`   | 增加订单详情、订单状态更新、禁用用户等管理 API      |
| `miniprogram/services/service.service.js` | 增加 `seedServiceData`                              |
| `miniprogram/pages/admin/dashboard/*`     | 管理首页接入统计看板和管理入口                      |
| `miniprogram/pages/admin/order-list/*`    | 管理员订单列表                                      |
| `miniprogram/pages/admin/order-detail/*`  | 管理员订单详情和手动状态调整                        |
| `miniprogram/pages/admin/user-list/*`     | 管理员用户列表和禁用用户                            |
| `miniprogram/pages/admin/service-list/*`  | 服务列表、同步种子、上下架                          |
| `miniprogram/pages/admin/category-list/*` | 分类列表和同步种子入口                              |
| `docs/dev-records/index.md`               | 更新阶段七状态、P0 完成情况和遗留问题               |
| `README.md`                               | 补充阶段七说明和验证步骤                            |

---

## 6. 删除或废弃文件

| 文件路径 | 删除 / 废弃原因 |
| -------- | --------------- |
| 无       | 无              |

---

## 7. 数据库变化

本阶段新增两个服务目录集合：

| 集合                 | 作用         | 当前写入方式                                            |
| -------------------- | ------------ | ------------------------------------------------------- |
| `service_categories` | 保存服务分类 | 管理员调用 `service.seedServiceData` 或后续分类管理写入 |
| `services`           | 保存服务项目 | 管理员调用 `service.seedServiceData` 或后续服务管理写入 |

### 主要字段

| 集合                 | 字段                                                                                    | 说明                                   |
| -------------------- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| `service_categories` | `_id`, `name`, `icon`, `status`, `sort`                                                 | 分类标识、名称、状态与排序             |
| `services`           | `_id`, `category_id`, `category_name`, `name`, `price`, `status`, `recommended`, `sort` | 服务标识、分类、价格、状态、推荐与排序 |

---

## 8. 云函数 / 接口变化

### `admin`

| 功能                     | 入参                | 出参                                                  | 权限要求 |
| ------------------------ | ------------------- | ----------------------------------------------------- | -------- |
| `getDashboard`           | 无                  | `{ stats }`                                           | 管理员   |
| `getAllUsers`            | 无                  | `{ users }`                                           | 管理员   |
| `disableUser`            | `userId`            | `{ user }`                                            | 管理员   |
| `getAllOrders`           | 无                  | `{ orders }`                                          | 管理员   |
| `getOrderDetail`         | `orderId`           | `{ order }`                                           | 管理员   |
| `adminUpdateOrderStatus` | `orderId`, `status` | `{ order }`                                           | 管理员   |
| `getOrderStats`          | 无                  | `{ total, status_counts }`                            | 管理员   |
| `getServiceStats`        | 无                  | `{ category_count, service_count, on_service_count }` | 管理员   |

### `service`

| 功能                  | 入参                                           | 出参                                | 权限要求 |
| --------------------- | ---------------------------------------------- | ----------------------------------- | -------- |
| `seedServiceData`     | 无                                             | `{ category_count, service_count }` | 管理员   |
| `getCategoryList`     | 可选 `includeDisabled`                         | `{ categories }`                    | 无       |
| `getServiceList`      | 可选 `categoryId`, `recommended`, `includeOff` | `{ services }`                      | 无       |
| `getServiceDetail`    | `serviceId`                                    | `{ service }`                       | 无       |
| `updateServiceStatus` | `serviceId`, `status`                          | `{ service }`                       | 管理员   |

---

## 9. 核心逻辑说明

### 管理员权限

```text
管理员调用 admin 或 service 管理动作
↓
云函数读取当前 openid
↓
查询 users 集合
↓
校验 status 未禁用且 role = admin
↓
执行看板、订单、用户或服务管理动作
```

### 服务目录读取

```text
用户浏览服务
↓
service 云函数尝试读取 service_categories / services
↓
如果集合已有数据，使用数据库数据
↓
如果集合为空，回退内置种子数据
```

### 种子服务同步

```text
管理员进入服务管理或分类管理
↓
点击同步种子服务
↓
service.seedServiceData 校验管理员权限
↓
把内置分类与服务 upsert 到云数据库
```

---

## 10. 关键技术决策

### 决策 1：阶段七实现独立 `admin` 云函数

原因：

- 管理首页、订单管理和用户管理属于后台聚合能力
- 避免继续把管理动作分散在业务云函数中

影响：

- `admin` 云函数统一校验管理员身份
- 阶段五的师傅审核仍保留在 `worker` 云函数，阶段七首页只提供入口

### 决策 2：服务浏览优先读数据库，空数据回退种子

原因：

- 真实微信验证前可以先不阻塞在数据初始化上
- 管理员同步后立刻切换到数据库数据

影响：

- 未同步种子时服务浏览仍能跑通
- 同步后可用管理页控制上下架

### 决策 3：订单管理先只做人工状态调整

原因：

- 用户已确认阶段七不做退款
- MVP 当前需要运营侧兜底处理订单状态

影响：

- 管理员可以把订单状态改为任一合法状态
- 真实经营前需要增加状态流转约束和操作日志

---

## 11. 已知问题与遗留事项

| 问题                                                 | 影响                             | 后续处理建议                                             | 优先级 |
| ---------------------------------------------------- | -------------------------------- | -------------------------------------------------------- | ------ |
| 尚未在微信开发者工具中真实编译和预览阶段七页面       | 可能存在小程序运行时细节问题     | 八阶段结束后统一做真实微信验证                           | P1     |
| 尚未创建真实 `service_categories` 和 `services` 集合 | 服务目录无法持久化管理           | 微信端验证前创建集合并点击同步种子服务                   | P0     |
| 尚未部署 `admin` 云函数                              | 管理首页、订单和用户管理无法使用 | 微信端验证前上传并部署                                   | P0     |
| 管理员初始化仍依赖手动修改 `users.role`              | 无自助管理员创建流程             | 微信端验证时手动设置首个管理员，优化阶段再设计初始化脚本 | P1     |
| 管理员订单状态调整缺少操作日志                       | 不适合真实审计                   | 后续增加 `admin_logs` 或订单状态变更记录                 | P1     |
| 订单云函数仍保留阶段性服务快照种子数据               | 数据源存在重复维护               | 后续让下单读取 `services` 集合中的服务快照               | P1     |

---

## 12. 测试记录

### 已测试

- [x] 管理员看板返回用户数、订单数、待审核师傅数、完成订单金额
- [x] 非管理员访问管理 API 会被拒绝
- [x] 管理员可以读取和禁用用户
- [x] 管理员可以读取订单列表并手动更新订单状态
- [x] 管理员可以把种子分类和服务同步到仓储
- [x] 服务浏览优先读取仓储数据
- [x] 服务管理可以更新服务上下架状态
- [x] 管理页面接入真实服务方法
- [x] 阶段一至阶段六测试仍然通过

### 未测试

- [ ] 微信开发者工具真实编译
- [ ] 真机预览
- [ ] 云函数真实部署
- [ ] 真实云数据库集合权限
- [ ] 管理员状态调整的审计和回滚

测试命令：

```bash
npm test
```

最近一次测试结果：

```text
tests 51
pass 51
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
pass 51
fail 0
```

### 微信开发者工具验证

1. 打开微信开发者工具
2. 选择当前项目根目录
3. 确认已选择云开发环境
4. 创建 `service_categories` 和 `services` 集合
5. 确认 `users`、`addresses`、`orders`、`workers`、`reviews` 集合已存在
6. 上传并部署 `cloudfunctions/admin`
7. 重新上传并部署 `cloudfunctions/service`
8. 确认 `login`、`user`、`address`、`order`、`worker`、`review` 云函数也已部署
9. 完成微信授权登录
10. 在 `users` 集合中把管理员账号 `role` 改为 `admin`
11. 进入 `pages/admin/dashboard/dashboard` 查看管理看板
12. 进入服务管理，点击“同步种子服务”
13. 回到首页确认服务浏览仍正常
14. 进入订单管理，查看订单并测试手动状态调整
15. 进入用户管理，测试禁用普通用户

---

## 14. 对下一阶段的影响

阶段七完成后，MVP 的核心角色和后台管理路径已经具备。阶段八可以集中处理 UI 细节、表单体验、空状态、错误提示、README 和真实微信验证准备清单。

---

## 15. 下一阶段开发计划

下一阶段名称：

> 阶段 8：优化、验证准备与文档收口

下一阶段目标：

统一检查用户端、师傅端、管理员端的页面体验和错误处理，补齐微信端验证前的文档、部署清单与已知风险说明。

下一阶段任务清单：

- [ ] 阅读 `docs/dev-records/index.md`
- [ ] 阅读 `docs/dev-records/07_phase-admin.md`
- [ ] 检查主要页面空状态、加载状态和错误提示
- [ ] 检查 README 与微信验证步骤
- [ ] 汇总真实微信验证前必须创建的集合和部署的云函数
- [ ] 更新阶段 8 记录文件

---

## 16. 下一阶段开始前必须确认的问题

1. 阶段八是否以真实微信验证准备、UI 细节和文档收口为主，不继续扩展新业务功能？
2. 是否需要把“管理员入口”仍保持通过页面路径进入，真实验证时手动访问？
3. 是否需要在阶段八补一个统一的云数据库集合清单和部署清单？
4. 是否需要阶段八结束后再由你在微信开发者工具中统一验证八个阶段？

---

## 17. 本阶段复盘

### 做得好的地方

- 测试先行覆盖了管理端权限、看板、订单、用户和服务目录迁移。
- 管理页从占位变成了可操作页面，八阶段验证前已经能看到后台主路径。
- 服务目录支持数据库化，但保留空库回退种子，降低真实验证的启动门槛。

### 不足的地方

- 管理员初始化仍需手动改数据库字段。
- 订单状态人工调整还没有操作日志和严格流转规则。
- 阶段七仍未在微信开发者工具中真实预览。

### 后续改进建议

- 阶段八整理统一验证清单，避免真实微信验证时漏建集合或漏部署云函数。
- 后续增加管理员操作日志。
- 后续让下单服务快照也从 `services` 集合读取，减少种子数据重复维护。

---

## 18. 阶段结论

阶段 7 已完成管理员管理能力目标。管理员现在可以查看运营看板、管理订单、管理用户、同步服务目录并调整服务上下架。下一步建议进入阶段 8：优化、验证准备与文档收口。
