# 服务区域与派单规则增强 V1 设计

## 背景

当前 MVP 已完成用户下单、模拟支付、师傅接单、服务完成、评价、售后和模拟退款。真实微信支付因商户主体资质暂时搁置，本阶段转向不依赖真实支付的核心运营能力：服务区域与派单规则增强。

现有系统已有基础字段：地址保存 `city`、`community`、`detail_address`，订单创建保存地址快照，师傅入驻保存 `service_category` 和 `service_area`，接单大厅已有简单分类和文本区域过滤。本阶段不推倒重写，而是在现有模型上补齐标准服务区域、师傅接单状态、管理员指派、取消指派回流和派单日志。

## 阶段编号

本阶段编号调整为阶段 15：服务区域与派单规则增强 V1。

## 范围

本阶段实现：

- 区域基础数据管理。
- 用户地址区域字段标准化。
- 师傅服务区域配置。
- 师傅接单状态。
- 接单大厅按服务分类、服务小区、师傅状态过滤。
- 管理员手动指派订单。
- 管理员取消指派并回流订单。
- 派单日志。
- 自动化测试和阶段开发记录。

本阶段不实现：

- 真实地图定位。
- 经纬度距离计算。
- 腾讯地图 SDK。
- 自动智能派单。
- AI 派单。
- 超时自动派单。
- 多城市合伙人收益。
- 真实支付、真实退款、真实提现、真实分账。

## 数据模型

### service_areas

```js
{
  _id,
  city,
  district,
  street,
  community,
  full_name,
  status, // enabled / disabled
  sort,
  created_at,
  updated_at
}
```

`community` 是第一版派单匹配核心字段。禁用区域不能用于新地址和新服务区域配置。老数据仍按兼容逻辑展示。

### dispatch_logs

```js
{
  _id,
  order_id,
  order_no,
  action, // worker_accept / admin_assign / admin_unassign / order_reflow
  operator_id,
  operator_role, // worker / admin
  from_worker_id,
  to_worker_id,
  from_status,
  to_status,
  reason,
  created_at
}
```

师傅主动接单、管理员指派、管理员取消指派和订单回流都必须写入日志。

### addresses

新增或规范：

```js
{
  service_area_id,
  city,
  district,
  street,
  community,
  detail_address,
  full_address
}
```

新地址必须选择启用小区。老地址缺少结构化字段时页面不崩溃。

### orders

订单必须保存地址快照：

```js
{
  service_area_id,
  city,
  district,
  street,
  community,
  detail_address,
  full_address
}
```

订单快照不随用户后续地址修改而变化。

### workers

新增或规范：

```js
{
  service_area_ids: [],
  service_communities: [],
  service_city: '',
  service_districts: [],
  online_status: 'available'
}
```

第一版启用 `available` 和 `paused`。`busy` 作为常量保留，暂不引入复杂规则。

## 常量

新增：

```js
SERVICE_AREA_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled'
}

WORKER_ONLINE_STATUS = {
  AVAILABLE: 'available',
  PAUSED: 'paused',
  BUSY: 'busy'
}

DISPATCH_ACTION = {
  WORKER_ACCEPT: 'worker_accept',
  ADMIN_ASSIGN: 'admin_assign',
  ADMIN_UNASSIGN: 'admin_unassign',
  ORDER_REFLOW: 'order_reflow'
}
```

新增集合常量：`SERVICE_AREAS`、`DISPATCH_LOGS`。新增云函数常量：`AREA`、`DISPATCH`。

## 云函数设计

### area 云函数

新增 `cloudfunctions/area`，负责区域基础数据。

Actions：

- `getServiceAreaList`
- `adminCreateServiceArea`
- `adminUpdateServiceArea`
- `adminEnableServiceArea`
- `adminDisableServiceArea`

普通用户只能获取启用区域。管理员可查看全部区域并管理状态。

### worker 云函数扩展

新增 action：

- `updateWorkerServiceAreas`
- `updateWorkerOnlineStatus`

修改：

- `applyWorker` 保存结构化服务区域字段。
- `getOrderHallList` 必须校验师傅审核通过、账号正常、`online_status=available`、订单待接单、分类匹配、小区匹配。

### order 云函数扩展

修改：

- `createOrder` 保存完整区域快照。
- `acceptOrder` 成功后写入 `dispatch_logs`，action 为 `worker_accept`。

### dispatch 云函数

新增 `cloudfunctions/dispatch`，负责管理员派单和回流。

Actions：

- `getAssignableWorkers`
- `adminAssignOrder`
- `adminUnassignOrder`
- `getDispatchLogs`

指派要求：

- 管理员身份。
- 订单仍为 `pending_accept`。
- 订单 `worker_id` 为空。
- 师傅审核通过。
- 师傅账号正常。
- 师傅接单状态为 `available`。
- 服务分类匹配。
- 服务小区匹配。

取消指派要求：

- 管理员身份。
- 订单状态为 `accepted`。
- 必须填写原因。
- 清空 `worker_id`。
- 状态回到 `pending_accept`。

两类操作都写 `dispatch_logs`、`admin_operation_logs`，并发送用户和师傅消息。

## 页面设计

### 用户端

- 地址编辑页增加区县、街道、小区字段。
- 小区从 `service_areas` 启用列表选择。
- 订单详情展示结构化地址。
- 老订单缺失区域时显示“区域未知”。

### 师傅端

- 入驻页选择服务小区。
- 师傅个人中心显示服务小区和接单状态。
- 师傅可切换接单状态。
- 接单大厅顶部显示接单状态。
- 暂停接单时不展示新订单。

### 管理员端

- 管理首页增加“区域管理”和“派单日志”入口。
- 新增区域列表和区域编辑页。
- 订单详情增加“指派师傅”和“取消指派 / 回流”入口。
- 新增符合条件师傅列表页。
- 新增派单日志页。
- 师傅详情展示服务小区和接单状态。

## 错误处理

- 非管理员调用区域管理、派单和日志接口返回 `PERMISSION_DENIED`。
- 禁用区域用于新地址或师傅服务区域返回 `SERVICE_AREA_DISABLED`。
- 指派非待接单订单返回 `ORDER_STATUS_INVALID`。
- 指派已被接走订单返回 `ORDER_ALREADY_ACCEPTED`。
- 指派不匹配师傅返回 `WORKER_NOT_ASSIGNABLE`。
- 取消指派必须有原因，否则返回 `DISPATCH_REASON_REQUIRED`。
- 服务中及之后状态不能回流，返回 `ORDER_STATUS_INVALID`。

## 测试计划

新增 `tests/phase15.service-area-dispatch.test.js` 覆盖：

- 管理员创建、启用、禁用服务区域。
- 普通用户只看到启用区域。
- 禁用区域不能用于新地址。
- 地址保存结构化区域字段。
- 订单创建保存区域快照。
- 师傅入驻保存服务小区。
- 师傅切换接单状态。
- 暂停接单后看不到新订单。
- 接单大厅按分类过滤。
- 接单大厅按小区过滤。
- 老订单缺区域不崩溃。
- 管理员获取可指派师傅。
- 管理员不能指派不匹配区域师傅。
- 管理员指派订单后变为 `accepted`。
- 指派写入 `dispatch_logs`。
- 指派写入 `admin_operation_logs`。
- 用户和师傅收到消息。
- 管理员取消指派后订单回流。
- 服务中订单不能回流。
- 师傅主动接单写入 `dispatch_logs`。
- 普通用户不能调用管理员派单接口。

## 文档

新增：

- `docs/dev-records/15_service-area-dispatch-v1.md`
- `docs/superpowers/plans/2026-05-31-service-area-dispatch-v1.md`

更新：

- `README.md`
- `docs/dev-records/index.md`
- `docs/release-package-checklist.md`
- `docs/wechat-mvp-verification.md`

## 已确认决策

- 阶段编号使用阶段 15。
- 师傅服务区域允许自助修改。
- 新地址小区必须来自启用的 `service_areas`，老数据兼容。
- 管理员第一版不能强制指派不匹配师傅。
- 派单日志记录师傅主动接单。
