# 阶段 15：服务区域与派单规则增强 V1

## 1. 阶段基本信息

- 阶段编号：15
- 阶段名称：服务区域与派单规则增强 V1
- 开始时间：2026-05-31
- 完成时间：2026-05-31
- 阶段状态：已完成
- 当前版本：MVP phase 15

## 2. 本阶段目标

真实微信支付需要营业执照、商户号和 JSAPI 支付权限，当前暂时无法完成小额真实支付联调。因此本阶段优先增强平台运营能力：用文本小区建立服务区域模型，让订单、师傅和管理员派单围绕分类与小区进行匹配。

## 3. 本阶段完成内容

- [x] 新增服务区域管理。
- [x] 地址支持结构化区域字段。
- [x] 订单保存地址区域快照。
- [x] 师傅支持服务小区配置。
- [x] 师傅支持接单状态。
- [x] 接单大厅按分类、小区和接单状态过滤。
- [x] 管理员可查看可指派师傅。
- [x] 管理员可手动指派订单。
- [x] 管理员可取消指派并回流接单大厅。
- [x] 新增派单日志。
- [x] 师傅主动接单写入派单日志。
- [x] 新增阶段 15 自动化测试。

## 4. 新增文件

| 文件 | 作用 |
| --- | --- |
| `cloudfunctions/area/*` | 服务区域云函数 |
| `cloudfunctions/dispatch/*` | 派单云函数 |
| `cloudfunctions/address/area-read-repository.js` | 地址云函数读取服务区域 |
| `cloudfunctions/order/dispatch-repository.js` | 订单云函数写派单日志 |
| `cloudfunctions/worker/area-read-repository.js` | 师傅云函数读取服务区域 |
| `miniprogram/services/area.service.js` | 小程序区域服务 |
| `miniprogram/services/dispatch.service.js` | 小程序派单服务 |
| `miniprogram/pages/admin/area-list/*` | 管理员区域列表 |
| `miniprogram/pages/admin/area-edit/*` | 管理员区域编辑 |
| `miniprogram/pages/admin/assign-worker/*` | 管理员指派师傅 |
| `miniprogram/pages/admin/dispatch-logs/*` | 派单日志 |
| `tests/phase15.service-area-dispatch.test.js` | 阶段 15 测试 |

## 5. 修改文件

| 文件 | 修改原因 |
| --- | --- |
| `miniprogram/config/constants.js` | 新增区域、派单云函数和集合常量 |
| `miniprogram/config/status.js` | 新增区域状态、师傅接单状态和派单动作常量 |
| `cloudfunctions/address/handler.js` | 保存结构化地址并校验启用区域 |
| `cloudfunctions/order/handler.js` | 保存区域快照，接单写派单日志 |
| `cloudfunctions/worker/handler.js` | 服务小区、接单状态和大厅过滤 |
| `miniprogram/app.json` | 注册管理员区域和派单页面 |
| `miniprogram/pages/address-edit/*` | 地址选择服务小区 |
| `miniprogram/pages/worker/apply/*` | 入驻选择服务小区 |
| `miniprogram/pages/worker/profile/*` | 展示和切换接单状态 |
| `miniprogram/pages/worker/order-hall/*` | 展示接单状态 |
| `miniprogram/pages/admin/dashboard/*` | 增加区域和派单日志入口 |
| `miniprogram/pages/admin/order-detail/*` | 增加指派、回流和日志入口 |
| `README.md` | 更新阶段说明 |
| `docs/dev-records/index.md` | 更新阶段索引 |

## 6. 数据库变化

新增集合 `service_areas`，保存城市、区县、街道、小区、完整名称、启用状态和排序。

新增集合 `dispatch_logs`，保存师傅接单、管理员指派、取消指派和回流记录。

`addresses` 新增或规范 `service_area_id`、`district`、`street`、`full_address`。

`orders` 新增或规范 `service_area_id`、`district`、`street`，订单保存地址快照。

`workers` 新增或规范 `service_area_ids`、`service_communities`、`service_city`、`service_districts`、`online_status`。

## 7. 云函数 / 接口变化

新增 `area` 云函数：`getServiceAreaList`、`adminCreateServiceArea`、`adminUpdateServiceArea`、`adminEnableServiceArea`、`adminDisableServiceArea`。

新增 `dispatch` 云函数：`getAssignableWorkers`、`adminAssignOrder`、`adminUnassignOrder`、`getDispatchLogs`。

扩展 `worker` 云函数：`updateWorkerOnlineStatus`、`updateWorkerServiceAreas`。

扩展 `order.acceptOrder`：师傅主动接单成功后写入 `dispatch_logs`。

## 8. 核心派单流程说明

订单创建  
↓  
保存服务分类与服务区域快照  
↓  
师傅根据服务分类和服务小区看到订单  
↓  
师傅主动接单或管理员指派  
↓  
订单进入已接单  
↓  
派单日志记录

## 9. 管理员指派流程说明

管理员在订单详情点击“指派师傅”，系统只展示审核通过、账号启用、接单状态可用、服务分类匹配、服务小区匹配的师傅。管理员指派后订单进入已接单，写入 `dispatch_logs` 和 `admin_operation_logs`，并通知用户和师傅。已接单但未开始服务的订单可取消指派并回流接单大厅。

## 10. 关键技术决策

- 本阶段不接真实地图，避免引入 SDK、定位授权和经纬度误差。
- 先做文本小区匹配，因为当前业务调试和真机验证重点是运营规则。
- 地址结构化是为了让订单和师傅服务范围可匹配。
- 订单保存地址快照，避免用户修改地址影响历史订单。
- 派单行为写日志，便于排查抢单、人工指派和回流责任。
- 暂停接单不影响已有订单，只影响新订单可见性。

## 11. 已知问题与遗留事项

- 未接入真实地图。
- 不支持经纬度。
- 不支持距离排序。
- 不支持自动派单。
- 不支持超时回流。
- 不支持多城市权限隔离。
- 真实支付仍等待甲方商户资质。

## 12. 测试记录

新增测试覆盖区域管理、地址区域快照、师傅服务小区、接单状态、接单大厅过滤、管理员指派、取消指派、派单日志、权限拦截和页面接线。

验证命令：

```bash
npm test
```

## 13. 运行与验证方式

管理员先进入“区域管理”创建启用小区。用户新增地址时选择启用小区并下单。师傅入驻或进入师傅中心配置服务小区和接单状态。用户模拟支付后，符合分类、小区和接单状态的师傅能在接单大厅看到订单；管理员也可在订单详情指派师傅或取消指派回流。

## 14. 对下一阶段的影响

本阶段为小区合伙人、多城市权限、真实 LBS、距离排序和智能派单打下基础。

## 15. 下一阶段开发计划

建议下一阶段为：阶段 16：会员与优惠券基础版，或阶段 16：小区合伙人基础版。

## 16. 本阶段复盘

### 做得好的地方

在不重写订单系统的基础上补齐了小区匹配和人工派单闭环。

### 不足的地方

区域仍是文本模型，无法解决真实距离和跨街道边界问题。

### 后续改进建议

真实支付完成后，可继续补财务流水；运营侧可继续补 LBS、超时回流和多城市权限。

## 17. 阶段结论

本阶段达成服务区域与派单规则增强目标，可以继续真机验证或进入下一阶段。
