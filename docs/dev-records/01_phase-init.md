# 阶段 1：架构与初始化

## 1. 阶段基本信息

- 阶段编号：1
- 阶段名称：架构与初始化
- 开始时间：2026-05-30
- 完成时间：2026-05-30
- 当前分支：master
- 当前版本：0.1.0
- 负责人：Codex
- 阶段状态：已完成

---

## 2. 本阶段目标

本阶段目标是完成微信原生小程序 + 云开发项目的初始骨架，包括项目配置、目录结构、常量文件、工具函数、前端服务调用层、基础组件、用户端 / 师傅端 / 管理员端页面骨架、云函数占位目录和基础验收测试。阶段一不实现完整业务逻辑，只为后续阶段提供清晰、可维护的开发边界。

---

## 3. 本阶段完成内容

- [x] 初始化 Git 仓库
- [x] 创建微信小程序项目配置 `project.config.json`
- [x] 创建小程序入口文件 `app.js`、`app.json`、`app.wxss`
- [x] 配置 26 个页面路由
- [x] 配置用户端基础 tabBar：首页、订单、我的
- [x] 创建 `config` 常量目录
- [x] 创建订单状态、支付状态、师傅审核状态、用户角色等枚举
- [x] 创建 `utils` 工具目录
- [x] 创建请求、登录缓存、格式化、日期、表单校验、toast 工具
- [x] 创建 `services` 前端服务调用层
- [x] 创建 `components` 基础组件目录
- [x] 创建空状态、加载、状态标签、服务卡片、订单卡片、师傅卡片组件
- [x] 创建用户端页面骨架
- [x] 创建师傅端页面骨架
- [x] 创建管理员端页面骨架
- [x] 创建 8 个云函数占位目录
- [x] 创建阶段一骨架自动化测试
- [x] 使用 `npm test` 验证骨架完整性
- [x] 创建 README 初版说明
- [x] 创建阶段一设计与计划文档

---

## 4. 新增文件

### 项目根目录

| 文件路径              | 说明                                             |
| --------------------- | ------------------------------------------------ |
| `.gitignore`          | 忽略依赖、日志、环境变量、worktree 等本地文件    |
| `README.md`           | 项目说明、当前阶段、运行检查和微信开发者工具说明 |
| `package.json`        | Node 测试脚本和项目基础信息                      |
| `project.config.json` | 微信开发者工具项目配置                           |

### 阶段设计、计划与测试

| 文件路径                                                     | 说明               |
| ------------------------------------------------------------ | ------------------ |
| `docs/superpowers/specs/2026-05-30-mvp-phase1-design.md`     | 阶段一设计说明     |
| `docs/superpowers/plans/2026-05-30-phase1-initialization.md` | 阶段一实施计划     |
| `tests/phase1.scaffold.test.js`                              | 阶段一骨架验收测试 |

### 小程序入口

| 文件路径                   | 说明                              |
| -------------------------- | --------------------------------- |
| `miniprogram/app.js`       | 小程序入口，初始化云开发          |
| `miniprogram/app.json`     | 小程序路由、窗口样式、tabBar 配置 |
| `miniprogram/app.wxss`     | 全局基础样式                      |
| `miniprogram/sitemap.json` | 小程序页面索引规则                |

### 配置文件

| 文件路径                          | 说明                               |
| --------------------------------- | ---------------------------------- |
| `miniprogram/config/constants.js` | 应用名、价格单位、集合名、云函数名 |
| `miniprogram/config/roles.js`     | 用户角色枚举和展示文案             |
| `miniprogram/config/status.js`    | 订单、支付、师傅审核、通用状态枚举 |
| `miniprogram/config/index.js`     | 配置统一导出入口                   |

### 工具函数

| 文件路径                         | 说明                             |
| -------------------------------- | -------------------------------- |
| `miniprogram/utils/request.js`   | 前端云函数调用封装和统一错误处理 |
| `miniprogram/utils/auth.js`      | 当前用户本地缓存和角色判断工具   |
| `miniprogram/utils/format.js`    | 金额、地址、状态文案格式化       |
| `miniprogram/utils/validator.js` | 必填字段、手机号、地址表单校验   |
| `miniprogram/utils/date.js`      | 日期格式化和当前时间工具         |
| `miniprogram/utils/toast.js`     | toast、loading 统一封装          |

### 前端服务调用层

| 文件路径                                  | 说明                               |
| ----------------------------------------- | ---------------------------------- |
| `miniprogram/services/_base.service.js`   | 根据云函数名和 action 创建服务方法 |
| `miniprogram/services/login.service.js`   | 登录相关前端调用封装               |
| `miniprogram/services/user.service.js`    | 用户相关前端调用封装               |
| `miniprogram/services/service.service.js` | 分类与服务相关前端调用封装         |
| `miniprogram/services/address.service.js` | 地址相关前端调用封装               |
| `miniprogram/services/order.service.js`   | 订单相关前端调用封装               |
| `miniprogram/services/worker.service.js`  | 师傅相关前端调用封装               |
| `miniprogram/services/review.service.js`  | 评价相关前端调用封装               |
| `miniprogram/services/admin.service.js`   | 管理端统计和列表相关前端调用封装   |

### 基础组件

| 文件路径                                | 说明         |
| --------------------------------------- | ------------ |
| `miniprogram/components/empty-state/*`  | 空状态组件   |
| `miniprogram/components/loading-view/*` | 加载状态组件 |
| `miniprogram/components/status-tag/*`   | 状态标签组件 |
| `miniprogram/components/service-card/*` | 服务卡片组件 |
| `miniprogram/components/order-card/*`   | 订单卡片组件 |
| `miniprogram/components/worker-card/*`  | 师傅卡片组件 |

### 用户端页面骨架

| 文件路径                             | 说明                 |
| ------------------------------------ | -------------------- |
| `miniprogram/pages/index/*`          | 首页页面骨架         |
| `miniprogram/pages/service-list/*`   | 服务列表页面骨架     |
| `miniprogram/pages/service-detail/*` | 服务详情页面骨架     |
| `miniprogram/pages/order-submit/*`   | 提交订单页面骨架     |
| `miniprogram/pages/order-list/*`     | 用户订单列表页面骨架 |
| `miniprogram/pages/order-detail/*`   | 用户订单详情页面骨架 |
| `miniprogram/pages/review/*`         | 用户评价页面骨架     |
| `miniprogram/pages/address-list/*`   | 地址列表页面骨架     |
| `miniprogram/pages/address-edit/*`   | 地址编辑页面骨架     |
| `miniprogram/pages/profile/*`        | 我的页面骨架         |

### 师傅端页面骨架

| 文件路径                                  | 说明                 |
| ----------------------------------------- | -------------------- |
| `miniprogram/pages/worker/apply/*`        | 师傅入驻申请页面骨架 |
| `miniprogram/pages/worker/audit-status/*` | 师傅审核状态页面骨架 |
| `miniprogram/pages/worker/order-hall/*`   | 接单大厅页面骨架     |
| `miniprogram/pages/worker/order-list/*`   | 师傅订单列表页面骨架 |
| `miniprogram/pages/worker/order-detail/*` | 师傅订单详情页面骨架 |
| `miniprogram/pages/worker/income/*`       | 师傅收入统计页面骨架 |
| `miniprogram/pages/worker/profile/*`      | 师傅个人中心页面骨架 |

### 管理员端页面骨架

| 文件路径                                  | 说明                   |
| ----------------------------------------- | ---------------------- |
| `miniprogram/pages/admin/dashboard/*`     | 管理首页页面骨架       |
| `miniprogram/pages/admin/category-list/*` | 分类管理页面骨架       |
| `miniprogram/pages/admin/category-edit/*` | 分类编辑页面骨架       |
| `miniprogram/pages/admin/service-list/*`  | 服务管理页面骨架       |
| `miniprogram/pages/admin/service-edit/*`  | 服务编辑页面骨架       |
| `miniprogram/pages/admin/worker-audit/*`  | 师傅审核页面骨架       |
| `miniprogram/pages/admin/order-list/*`    | 管理员订单列表页面骨架 |
| `miniprogram/pages/admin/order-detail/*`  | 管理员订单详情页面骨架 |
| `miniprogram/pages/admin/user-list/*`     | 用户管理页面骨架       |

### 云函数占位目录

| 文件路径                              | 说明                 |
| ------------------------------------- | -------------------- |
| `cloudfunctions/login/index.js`       | 登录云函数占位入口   |
| `cloudfunctions/login/package.json`   | 登录云函数依赖配置   |
| `cloudfunctions/user/index.js`        | 用户云函数占位入口   |
| `cloudfunctions/user/package.json`    | 用户云函数依赖配置   |
| `cloudfunctions/service/index.js`     | 服务云函数占位入口   |
| `cloudfunctions/service/package.json` | 服务云函数依赖配置   |
| `cloudfunctions/address/index.js`     | 地址云函数占位入口   |
| `cloudfunctions/address/package.json` | 地址云函数依赖配置   |
| `cloudfunctions/order/index.js`       | 订单云函数占位入口   |
| `cloudfunctions/order/package.json`   | 订单云函数依赖配置   |
| `cloudfunctions/worker/index.js`      | 师傅云函数占位入口   |
| `cloudfunctions/worker/package.json`  | 师傅云函数依赖配置   |
| `cloudfunctions/review/index.js`      | 评价云函数占位入口   |
| `cloudfunctions/review/package.json`  | 评价云函数依赖配置   |
| `cloudfunctions/admin/index.js`       | 管理员云函数占位入口 |
| `cloudfunctions/admin/package.json`   | 管理员云函数依赖配置 |

### 阶段记录文件

| 文件路径                            | 说明                 |
| ----------------------------------- | -------------------- |
| `docs/dev-records/01_phase-init.md` | 本阶段开发记录与复盘 |

---

## 5. 修改文件

| 文件路径                    | 修改内容                                                     |
| --------------------------- | ------------------------------------------------------------ |
| `docs/dev-records/index.md` | 更新阶段 1 状态为已完成，切换下一阶段为阶段 2 登录与用户体系 |

---

## 6. 删除或废弃文件

| 文件路径 | 删除 / 废弃原因 |
| -------- | --------------- |
| 无       | 无              |

---

## 7. 数据库变化

本阶段未创建真实云数据库集合，未新增索引，未配置数据库权限。

### 新增集合

无。

### 计划集合

本阶段仅在配置和文档层面保留以下集合边界：

- `users`
- `service_categories`
- `services`
- `addresses`
- `workers`
- `orders`
- `reviews`

### 数据库权限说明

本阶段没有真实数据库读写逻辑。后续阶段必须通过云函数进行数据库访问和权限校验，不应在页面中直接操作数据库。阶段 2 开始需要优先实现 `users` 集合的创建、读取和角色字段管理。

---

## 8. 云函数 / 接口变化

本阶段新增 8 个云函数目录，但均为占位入口，尚未实现真实业务逻辑。

| 云函数    | 功能                 | 入参     | 出参         | 权限要求                   |
| --------- | -------------------- | -------- | ------------ | -------------------------- |
| `login`   | 登录与用户初始化占位 | `action` | 统一失败响应 | 后续所有用户可调用         |
| `user`    | 用户信息占位         | `action` | 统一失败响应 | 后续按用户归属或管理员校验 |
| `service` | 服务分类与项目占位   | `action` | 统一失败响应 | 后续读取公开，写入管理员   |
| `address` | 地址管理占位         | `action` | 统一失败响应 | 后续仅当前用户             |
| `order`   | 订单流转占位         | `action` | 统一失败响应 | 后续按角色、状态、归属校验 |
| `worker`  | 师傅入驻和审核占位   | `action` | 统一失败响应 | 后续用户、师傅、管理员分权 |
| `review`  | 评价占位             | `action` | 统一失败响应 | 后续当前用户或公开读取     |
| `admin`   | 管理端统计占位       | `action` | 统一失败响应 | 后续仅管理员               |

占位返回格式：

```js
{
  success: false,
  errorCode: 'ACTION_NOT_IMPLEMENTED',
  message: '<function>.<action> 尚未实现'
}
```

---

## 9. 核心逻辑说明

### 小程序启动逻辑

```text
小程序启动
↓
执行 app.js onLaunch
↓
如果 wx.cloud 存在
↓
使用 wx.cloud.DYNAMIC_CURRENT_ENV 初始化云开发
↓
预留 globalData.currentUser
```

### 前端服务调用逻辑

```text
页面或模块调用 service 方法
↓
service 方法通过 _base.service.js 统一生成
↓
调用 utils/request.js
↓
request.js 调用 wx.cloud.callFunction
↓
云函数返回 success / errorCode / message
↓
前端统一处理成功数据或错误
```

### 页面骨架逻辑

```text
app.json 统一注册页面路由
↓
用户端页面放在 pages 根目录
↓
师傅端页面放在 pages/worker
↓
管理员端页面放在 pages/admin
↓
每个页面先保留 js/json/wxml/wxss 四件套
```

### 骨架测试逻辑

```text
npm test
↓
读取 miniprogram/app.json
↓
检查页面路由是否与设计一致
↓
检查每个页面是否具备 js/json/wxml/wxss
↓
检查核心枚举是否稳定
↓
检查格式化工具是否符合金额单位约定
↓
检查云函数目录是否完整
```

---

## 10. 关键技术决策

### 决策 1：页面只建骨架，不写完整业务逻辑

原因：

- 阶段一目标是稳定结构边界
- 避免还未完成云函数和数据模型时把临时逻辑写进页面
- 后续可以按模块逐步填充业务能力

影响：

- 当前小程序页面只能显示基础占位内容
- 主业务闭环需要从阶段 2 起继续开发

### 决策 2：tabBar 第一版只放用户端入口

原因：

- 普通居民用户是最高频入口
- 师傅端和管理员端后续从“我的”按角色进入更清晰
- 避免 tabBar 混合多个角色造成导航混乱

影响：

- 阶段 2 需要在“我的”页面开始承接角色入口
- 阶段 5 和阶段 7 再补师傅端、管理员端入口控制

### 决策 3：前端请求统一走 services 层

原因：

- 页面不直接调用云函数，便于维护和测试
- 后续若迁移独立后端，可以优先替换 services 层
- 业务动作名称集中，降低魔法字符串散落风险

影响：

- 每个业务域都有对应 service 文件
- 云函数 action 命名需要与 service 方法保持一致

### 决策 4：云函数按业务域拆分，并使用 action 分发

原因：

- 避免一个巨大的云函数承载全部业务
- 每个域的权限、数据和状态流转更容易维护
- 适合微信云开发的部署和调试方式

影响：

- 后续每个云函数内部需要建立 action 白名单
- 共享常量和响应格式需要保持一致

### 决策 5：使用 Node 内置测试框架验证骨架

原因：

- 当前阶段没有复杂前端运行环境
- Node 内置测试无需额外安装测试依赖
- 可以快速验证路由、文件和常量是否被破坏

影响：

- 当前测试以结构检查和纯函数检查为主
- 后续业务逻辑测试需要随云函数实现逐步增强

---

## 11. 已知问题与遗留事项

| 问题                                     | 影响                         | 后续处理建议                                    | 优先级 |
| ---------------------------------------- | ---------------------------- | ----------------------------------------------- | ------ |
| 云函数目前只有占位入口，没有真实业务逻辑 | 主流程无法运行               | 阶段 2 起逐步实现登录、用户、服务、订单等云函数 | P0     |
| 未配置真实微信云开发环境 ID              | 无法部署云函数和真实数据库   | 阶段 2 开始前在微信开发者工具中确认云环境       | P1     |
| 未在微信开发者工具中做真实编译预览       | 可能存在小程序运行时细节问题 | 阶段 2 开始时打开项目并修正编译问题             | P1     |
| 页面当前只有占位展示                     | 无法完成真实用户操作         | 各业务阶段按页面逐步补功能                      | P0     |
| 管理员初始化方式仍为手动改库             | 后续管理端入口依赖人工配置   | 阶段 2 记录操作方式，阶段 7 再考虑优化          | P1     |
| 当前仓库尚无首次提交                     | 不影响开发，但不利于版本回溯 | 阶段记录补齐后建议提交初始版本                  | P1     |

---

## 12. 测试记录

### 已测试

- [x] `app.json` 路由列表与阶段一设计一致
- [x] tabBar 包含首页、订单、我的
- [x] 每个页面都有 `.js`、`.json`、`.wxml`、`.wxss`
- [x] 订单状态枚举包含 `pending_pay`、`pending_accept`、`accepted`、`serving`、`pending_review`、`completed`、`canceled`
- [x] 支付状态枚举包含 `unpaid`、`paid`
- [x] 用户角色枚举包含 `user`、`worker`、`admin`
- [x] `formatPrice(9900)` 输出 `¥99.00`
- [x] 地址拼接工具能输出完整地址
- [x] 8 个云函数目录都包含 `index.js` 和 `package.json`

### 未测试

- [ ] 微信开发者工具真实编译
- [ ] 手机预览
- [ ] 云函数部署
- [ ] 云数据库创建和权限配置
- [ ] 登录接口真实调用
- [ ] 页面跳转与角色入口

### 测试账号 / 测试数据

暂无真实测试账号。本阶段测试为本地结构测试，不涉及真实 openid、手机号、订单编号或敏感密钥。

测试命令：

```bash
npm test
```

最近一次测试结果：

```text
tests 5
pass 5
fail 0
```

---

## 13. 运行与验证方式

### 本地结构验证

1. 在项目根目录执行：

```bash
npm test
```

2. 期望结果：

```text
pass 5
fail 0
```

### 微信开发者工具验证

1. 打开微信开发者工具
2. 选择当前项目根目录
3. 确认 `project.config.json` 中：
   - `miniprogramRoot` 为 `miniprogram/`
   - `cloudfunctionRoot` 为 `cloudfunctions/`
4. 当前 `appid` 为 `touristappid`
5. 如需连接真实账号，替换为实际 AppID
6. 创建或选择云开发环境
7. 编译预览小程序页面骨架

---

## 14. 对下一阶段的影响

本阶段已经为登录与用户体系准备好小程序入口、用户角色常量、前端登录服务、用户服务、云函数目录和页面骨架。阶段 2 可以直接实现 `login` 云函数、`users` 集合初始化、当前用户缓存、角色读取和管理员初始化说明。由于前端请求层已经存在，阶段 2 应继续保持页面薄、业务逻辑集中在云函数和 service 层的结构。

---

## 15. 下一阶段开发计划

下一阶段名称：

> 阶段 2：登录与用户体系

下一阶段目标：

完成微信登录、`users` 集合设计与初始化、用户首次登录自动注册、用户信息获取、用户角色字段、用户状态字段、管理员初始化方式和基础前端登录入口。

下一阶段任务清单：

- [ ] 阅读 `docs/dev-records/index.md`
- [ ] 阅读 `docs/dev-records/01_phase-init.md`
- [ ] 检查阶段 1 遗留问题
- [ ] 实现 `cloudfunctions/login`
- [ ] 实现 `cloudfunctions/user` 的基础用户信息接口
- [ ] 创建 `users` 集合字段说明和权限策略说明
- [ ] 在前端接入登录服务
- [ ] 在“我的”页面展示当前用户基础信息
- [ ] 记录管理员初始化方式
- [ ] 增加登录与用户体系测试
- [ ] 更新阶段 2 记录文件

下一阶段重点注意事项：

- 不要把 openid、角色判断、用户初始化逻辑写散在页面里
- 管理员角色只能作为调试和管理入口，不能让普通用户前端自行设置
- 用户禁用状态需要在云函数层预留拦截能力
- 继续保持云函数统一响应格式

---

## 16. 下一阶段开始前必须确认的问题

1. 阶段 2 是否继续使用 `wx.cloud.DYNAMIC_CURRENT_ENV`，等你在微信开发者工具里选择真实云环境？
2. 用户昵称和头像第一版是否先允许使用默认值，后续再补微信头像昵称授权？
3. 管理员初始化是否按已确认方案执行：首次登录后手动在 `users` 集合把指定用户 `role` 改为 `admin`？
4. 用户手机号是否阶段 2 只保留字段，等下单或地址阶段再要求填写？

---

## 17. 本阶段复盘

### 做得好的地方

- 项目结构按用户端、师傅端、管理员端拆开，后续不会把多角色逻辑挤在同一批页面里。
- 订单状态、支付状态、角色、集合和云函数名提前集中管理，降低后续魔法字符串扩散风险。
- 前端调用层和云函数目录已经按业务域分开，适合逐阶段实现。
- 阶段一建立了自动化骨架测试，后续改路由或删文件会被及时发现。

### 不足的地方

- 页面仍是占位内容，尚不能支撑真实业务操作。
- 云函数仍是 `ACTION_NOT_IMPLEMENTED` 占位，不能连接真实云数据库。
- 尚未通过微信开发者工具做真实编译，可能存在需要在小程序环境中微调的细节。
- 阶段记录制度是在阶段一编码后补充的，本记录属于回填。

### 后续改进建议

- 从阶段 2 开始，每个阶段结束立即更新 `docs/dev-records`，避免再回填。
- 登录和权限必须先在云函数层打底，再做页面入口。
- 每个阶段继续保留自动化验证命令，至少覆盖核心常量、状态流转和云函数纯逻辑。
- 在微信开发者工具中尽早做一次真实编译，减少后续堆积运行时问题。

---

## 18. 阶段结论

阶段 1 已完成架构与初始化目标，项目已经具备微信小程序基础结构、云函数目录、常量、工具函数、服务层、基础组件、页面骨架和本地骨架测试。当前尚不能运行完整业务闭环，因为登录、数据库和订单云函数仍未实现。阶段 1 可以结束，下一步建议进入阶段 2：登录与用户体系，同时先确认云开发环境、头像昵称策略、管理员初始化方式和手机号填写时机。
