# 阶段 3：服务浏览

## 1. 阶段基本信息

- 阶段编号：3
- 阶段名称：服务浏览
- 开始时间：2026-05-30
- 完成时间：2026-05-30
- 当前分支：master
- 当前版本：0.1.0
- 负责人：Codex
- 阶段状态：已完成

---

## 2. 本阶段目标

本阶段目标是完成用户端服务浏览能力，包括固定 MVP 三个服务分类、内置种子服务数据、服务分类读取、服务列表读取、服务详情读取，以及首页、服务列表页、服务详情页的基础交互和展示。阶段三不实现管理员服务管理，也不实现下单逻辑。

---

## 3. 本阶段完成内容

- [x] 阅读 `docs/dev-records/index.md`
- [x] 阅读 `docs/dev-records/02_phase-login-user.md`
- [x] 确认阶段 3 四个问题均按“是”执行
- [x] 编写阶段 3 实施计划
- [x] 编写服务浏览失败测试
- [x] 实现 `service.getCategoryList`
- [x] 实现 `service.getServiceList`
- [x] 实现 `service.getServiceDetail`
- [x] 内置三类 MVP 服务分类：家政保洁、维修服务、宠物服务
- [x] 内置种子服务数据
- [x] 服务价格继续使用整数分存储
- [x] 服务封面继续使用样式占位
- [x] 首页展示静态 Banner 文案
- [x] 首页展示服务分类入口
- [x] 首页展示推荐服务
- [x] 服务列表按分类展示服务
- [x] 服务详情展示名称、价格、时长、分类、介绍和服务流程
- [x] 服务详情页保留“立即预约”按钮，占位提示阶段四开放
- [x] 列表和详情页增加加载、空状态和错误提示
- [x] 使用 `npm test` 验证阶段一、阶段二和阶段三测试

---

## 4. 新增文件

| 文件路径 | 说明 |
|---|---|
| `docs/superpowers/plans/2026-05-30-phase3-service-browse.md` | 阶段三实施计划 |
| `tests/phase3.service-browse.test.js` | 服务分类、服务列表、服务详情和页面接入测试 |
| `cloudfunctions/service/seed-data.js` | MVP 服务分类和服务项目种子数据 |
| `cloudfunctions/service/handler.js` | 服务浏览云函数业务逻辑 |
| `docs/dev-records/03_phase-service-browse.md` | 本阶段开发记录与复盘 |

---

## 5. 修改文件

| 文件路径 | 修改内容 |
|---|---|
| `cloudfunctions/service/index.js` | 从占位入口改为调用 `handleService` |
| `miniprogram/pages/index/index.js` | 首页接入分类和推荐服务读取 |
| `miniprogram/pages/index/index.json` | 注册首页需要的基础组件 |
| `miniprogram/pages/index/index.wxml` | 增加静态 Banner、服务分类和推荐服务展示 |
| `miniprogram/pages/index/index.wxss` | 增加首页服务浏览样式 |
| `miniprogram/pages/service-list/service-list.js` | 接入分类筛选和服务列表读取 |
| `miniprogram/pages/service-list/service-list.json` | 注册组件并开启下拉刷新 |
| `miniprogram/pages/service-list/service-list.wxml` | 增加分类 tab、服务卡片和空状态 |
| `miniprogram/pages/service-list/service-list.wxss` | 增加服务列表样式 |
| `miniprogram/pages/service-detail/service-detail.js` | 接入服务详情读取和预约占位提示 |
| `miniprogram/pages/service-detail/service-detail.json` | 注册加载和空状态组件 |
| `miniprogram/pages/service-detail/service-detail.wxml` | 增加服务详情、服务流程和立即预约按钮 |
| `miniprogram/pages/service-detail/service-detail.wxss` | 增加服务详情页样式 |
| `docs/dev-records/index.md` | 更新阶段三完成状态、P0 完成情况和遗留问题 |
| `README.md` | 补充阶段三说明和服务浏览验证步骤 |

---

## 6. 删除或废弃文件

| 文件路径 | 删除 / 废弃原因 |
|---|---|
| 无 | 无 |

---

## 7. 数据库变化

本阶段未新增真实云数据库集合。服务分类和服务项目采用云函数内置种子数据，便于在 MVP 初期不依赖后台管理能力也能浏览服务。

### 计划后续集合

- `service_categories`
- `services`

### 当前种子分类

| 分类 ID | 名称 | 状态 | 说明 |
|---|---|---|---|
| `cat_housekeeping` | 家政保洁 | enabled | 日常保洁、深度清洁 |
| `cat_repair` | 维修服务 | enabled | 水电、门锁等常见维修 |
| `cat_pet` | 宠物服务 | enabled | 遛宠、喂养、基础照看 |

### 当前种子服务

| 服务 ID | 分类 | 名称 | 价格（分） | 状态 | 推荐 |
|---|---|---|---|---|---|
| `svc_home_daily_clean` | 家政保洁 | 日常保洁 | 9900 | on | 是 |
| `svc_home_deep_clean` | 家政保洁 | 深度保洁 | 19900 | on | 否 |
| `svc_repair_water` | 维修服务 | 水电检修 | 6900 | on | 是 |
| `svc_repair_lock` | 维修服务 | 门锁维修 | 8900 | on | 否 |
| `svc_pet_walk` | 宠物服务 | 宠物遛弯 | 3900 | on | 是 |
| `svc_pet_feed` | 宠物服务 | 上门喂养 | 4900 | on | 否 |
| `svc_pet_bath_future` | 宠物服务 | 宠物洗护 | 0 | off | 否 |

### 数据库权限说明

当前阶段服务浏览不访问真实数据库，因此没有新增数据库权限配置。阶段七做管理员服务管理时，需要将种子数据迁移或同步到 `service_categories` 和 `services` 集合，并通过云函数限制管理员写入权限。

---

## 8. 云函数 / 接口变化

| 云函数 | 功能 | 入参 | 出参 | 权限要求 |
|---|---|---|---|---|
| `service` | 获取服务分类 | `action: getCategoryList` | `{ categories }` | 公开读取 |
| `service` | 获取服务列表 | `action: getServiceList`, `categoryId`, `recommended` | `{ services }` | 公开读取 |
| `service` | 获取服务详情 | `action: getServiceDetail`, `serviceId` | `{ service }` | 公开读取 |

### 统一错误码

| 错误码 | 说明 |
|---|---|
| `SERVICE_ID_MISSING` | 缺少服务 ID |
| `SERVICE_NOT_FOUND` | 服务不存在或已下架 |
| `ACTION_NOT_FOUND` | 未知 action |
| `INTERNAL_ERROR` | 未预期内部错误 |

---

## 9. 核心逻辑说明

### 首页服务浏览逻辑

```text
用户进入首页
↓
调用 service.getCategoryList 获取三类服务分类
↓
调用 service.getServiceList({ recommended: true }) 获取推荐服务
↓
首页展示静态 Banner、服务分类和推荐服务
↓
点击分类进入服务列表页
↓
点击推荐服务进入服务详情页
```

### 服务列表逻辑

```text
用户从首页点击分类
↓
进入 service-list，携带 categoryId
↓
调用 service.getCategoryList 获取分类 tab
↓
调用 service.getServiceList({ categoryId }) 获取该分类上架服务
↓
用户可切换分类 tab
↓
点击服务卡片进入服务详情页
```

### 服务详情逻辑

```text
用户进入 service-detail，携带 serviceId
↓
调用 service.getServiceDetail({ serviceId })
↓
展示服务名称、价格、时长、分类、介绍和流程
↓
点击立即预约
↓
提示下单功能将在阶段四开放
```

---

## 10. 关键技术决策

### 决策 1：阶段三使用内置种子数据

原因：

- 用户已确认阶段三先内置种子服务数据
- 不依赖管理员服务管理即可跑通用户浏览
- 阶段七再实现服务管理时更容易替换为数据库数据

影响：

- 当前部署 `service` 云函数即可浏览服务
- 服务数据变更需要改代码和重新部署云函数
- 后续需要在阶段七迁移到 `service_categories` 和 `services` 集合

### 决策 2：服务封面继续使用样式占位

原因：

- 用户已确认暂不上传真实图片
- MVP 当前重点是业务流程而非素材管理
- 避免提前引入云存储和上传流程

影响：

- 服务卡片和详情页使用渐变色块作为封面
- 阶段七或优化阶段可以再接入真实图片

### 决策 3：首页使用静态 Banner 文案

原因：

- 用户已确认不做后台 Banner 管理
- 当前只需要帮助用户理解平台服务范围
- 保持阶段三聚焦服务浏览

影响：

- Banner 文案写在首页 WXML 中
- 后续营销配置阶段再考虑后台化

### 决策 4：下单按钮只做占位提示

原因：

- 下单属于阶段四范围
- 阶段三只负责浏览，不提前写订单逻辑

影响：

- “立即预约”按钮会提示阶段四开放
- 阶段四可直接从服务详情页接入提交订单页

---

## 11. 已知问题与遗留事项

| 问题 | 影响 | 后续处理建议 | 优先级 |
|---|---|---|---|
| 服务数据仍为代码内置种子数据 | 无法在后台动态维护服务 | 阶段七实现管理员服务管理并迁移到数据库 | P1 |
| 尚未在微信开发者工具中真实编译和预览 | 可能存在小程序运行时细节问题 | 阶段四前做一次开发者工具验证 | P1 |
| `address/order/worker/review/admin` 云函数仍是占位 | 下单、师傅、评价和管理流程尚不能运行 | 后续阶段逐步实现 | P0 |
| “立即预约”按钮未进入下单页 | 用户尚不能创建订单 | 阶段四接入提交订单页 | P0 |
| 服务搜索和评价展示未实现 | 不影响 MVP 主流程启动 | P2 阶段再做 | P2 |

---

## 12. 测试记录

### 已测试

- [x] `getCategoryList` 返回家政保洁、维修服务、宠物服务
- [x] 服务分类按 sort 排序
- [x] `getServiceList` 可按分类筛选上架服务
- [x] `getServiceList` 可返回推荐服务
- [x] `getServiceDetail` 可返回完整服务信息
- [x] 未知服务 ID 返回 `SERVICE_NOT_FOUND`
- [x] 首页 JS 调用分类和服务接口
- [x] 首页 WXML 包含服务分类和推荐服务
- [x] 服务列表页调用服务列表接口
- [x] 服务详情页调用服务详情接口
- [x] 阶段一和阶段二测试仍然通过

### 未测试

- [ ] 微信开发者工具真实编译
- [ ] 真机预览
- [ ] 云函数真实部署
- [ ] 页面真实跳转体验
- [ ] 服务卡片在不同机型的视觉效果

### 测试账号 / 测试数据

本阶段不需要真实测试账号。自动化测试使用内置服务种子数据，不记录真实用户数据。

测试命令：

```bash
npm test
```

最近一次测试结果：

```text
tests 24
pass 24
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
pass 24
fail 0
```

### 微信开发者工具验证

1. 打开微信开发者工具
2. 选择当前项目根目录
3. 确认已选择云开发环境
4. 上传并部署 `cloudfunctions/service`
5. 编译小程序
6. 首页应展示静态 Banner、三类服务分类和推荐服务
7. 点击分类进入服务列表页
8. 点击服务卡片进入服务详情页
9. 点击“立即预约”应提示下单功能将在阶段四开放

---

## 14. 对下一阶段的影响

本阶段完成了服务分类、服务列表和服务详情浏览。阶段四可以从服务详情页的“立即预约”按钮接入提交订单页，并基于当前服务详情数据创建订单。由于服务价格已使用整数分，阶段四订单金额字段可以直接复用服务 `price`。

---

## 15. 下一阶段开发计划

下一阶段名称：

> 阶段 4：地址与下单

下一阶段目标：

完成地址管理、提交订单、创建订单、模拟支付、用户订单列表和用户订单详情，为后续师傅接单流程提供订单数据。

下一阶段任务清单：

- [ ] 阅读 `docs/dev-records/index.md`
- [ ] 阅读 `docs/dev-records/03_phase-service-browse.md`
- [ ] 检查阶段 3 遗留问题
- [ ] 实现 `address` 云函数基础 CRUD
- [ ] 实现地址列表和地址编辑页
- [ ] 服务详情页接入提交订单入口
- [ ] 实现提交订单页
- [ ] 实现 `order.createOrder`
- [ ] 实现 `order.mockPayOrder`
- [ ] 实现用户订单列表
- [ ] 实现用户订单详情
- [ ] 增加地址与下单测试
- [ ] 更新阶段 4 记录文件

下一阶段重点注意事项：

- 联系人手机号在阶段四开始强制填写
- 订单金额从服务 `price` 快照保存
- 创建订单后状态为 `pending_pay`
- 模拟支付后状态变为 `pending_accept`
- 仍不接入真实微信支付

---

## 16. 下一阶段开始前必须确认的问题

1. 地址字段是否按联系人、手机号、城市、小区、详细地址、默认地址实现？
2. 预约时间第一版是否使用普通文本/日期时间选择器，不接复杂日历排班？
3. 提交订单后是否先进入待付款，再由用户点击模拟支付？
4. 用户订单列表是否先只展示自己的订单，不做分页？

---

## 17. 本阶段复盘

### 做得好的地方

- 服务浏览逻辑集中在 `service` 云函数，页面没有直接访问数据库。
- 服务数据结构包含后续下单需要的价格、分类、名称和服务流程。
- 首页、列表、详情都具备加载和空状态，用户路径完整。
- 使用测试覆盖服务分类、服务列表、详情和页面接入，降低后续误删风险。

### 不足的地方

- 尚未在微信开发者工具中真实验证页面跳转和视觉效果。
- 服务数据仍是代码内置，后续后台管理阶段需要迁移。
- 服务详情页的“立即预约”还是占位提示，用户尚不能下单。

### 后续改进建议

- 阶段四前在微信开发者工具中部署 `service` 云函数并试跑浏览路径。
- 阶段四订单创建时复用本阶段服务详情数据，不要在页面里拼订单核心字段。
- 阶段七再将服务种子数据迁移为可管理的云数据库数据。

---

## 18. 阶段结论

阶段 3 已完成服务浏览目标，用户可以从首页看到服务分类和推荐服务，进入服务列表并查看服务详情。当前服务数据采用内置种子数据，适合 MVP 快速跑通浏览路径。阶段 3 可以结束，下一步建议进入阶段 4：地址与下单。
