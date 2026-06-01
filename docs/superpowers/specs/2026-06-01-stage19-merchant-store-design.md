# 阶段 19 商家端与店铺主页基础版设计

## 目标

在不破坏现有个人师傅模型的前提下，引入“个人师傅 / 商家店铺”双服务方基础模型。阶段 19 只完成商家入驻、审核、店铺主页、商家服务项目、用户指定商家下单、商家订单流转、财务兼容和操作日志，不做连锁商家、多门店、员工排班、真实营业执照认证、保证金、真实分账和真实支付。

## 推荐架构

新增独立 `merchant` 云函数承载商家入驻、服务配置、店铺展示、商家订单操作和管理员商家管理。保留现有 `workers` 集合与师傅端流程，新增 `service_providers` 作为统一服务方索引，用于后续派单、分佣和店铺/师傅统一列表扩展。

订单系统只做兼容字段扩展，不重写状态机。商家订单仍使用 `pending_pay -> pending_accept -> accepted -> serving -> pending_review -> completed`，并在订单中保存 `provider_type`、`provider_id`、`merchant_id`、`provider_snapshot` 和 `merchant_service_snapshot`。

## 数据模型

新增集合：

- `merchants`：商家资料和审核状态。
- `merchant_services`：商家上架的平台服务项目。
- `service_providers`：统一服务方索引，记录 worker / merchant 类型。
- `merchant_action_logs`：商家申请、审核、服务配置和订单操作日志。

兼容扩展：

- `orders` 增加商家服务方字段。
- `finance_logs` 增加 `provider_type/provider_id/merchant_id`。
- `worker_earnings` 保留历史集合名，增加 `provider_type/provider_id/merchant_id` 兼容商家收益。

## 核心流程

商家入驻：

用户提交商家资料，系统限制一个用户一个商家，写入 `merchants` 和 `merchant_action_logs`。管理员审核通过后更新商家状态，创建或更新 `service_providers`，并发送站内消息；拒绝时写拒绝原因和消息。

店铺与下单：

商家审核通过后配置 `merchant_services`。用户查看审核通过且状态正常的店铺和上架服务，选择店铺服务后创建指定商家订单。订单金额以后端商家服务价格为准。

商家订单：

商家只能查看和操作自己的订单。商家接单、开始服务、完成服务复用现有订单状态，写消息和 `merchant_action_logs`。个人师傅不能操作商家订单，商家订单不进入个人师傅接单大厅。

财务、评价、售后：

商家订单完成后复用阶段 16 财务生成能力，通过兼容字段识别商家收益。用户仍可按现有评价和售后流程处理商家订单。本阶段不重写售后、评价、财务模块。

## 页面范围

用户端：

- `pages/merchant/store-list`
- `pages/merchant/store-detail`
- 修改 `pages/order-submit` 支持 `merchantServiceId`
- 修改 `pages/order-detail` 展示商家快照

商家端：

- `pages/merchant/apply`
- `pages/merchant/audit-status`
- `pages/merchant/profile`
- `pages/merchant/service-list`
- `pages/merchant/service-edit`
- `pages/merchant/order-list`
- `pages/merchant/order-detail`
- `pages/merchant/income`

管理员端：

- `pages/admin/merchant-list`
- `pages/admin/merchant-detail`

## 权限规则

- 用户只能提交自己的商家申请。
- 一个用户第一版只能拥有一个商家。
- 只有管理员可以审核、启用、禁用商家。
- 用户只能查看审核通过且状态正常的店铺。
- 商家只能管理自己的服务和订单。
- 个人师傅不能操作商家订单。
- 商家禁用后不能接新订单。
- 所有商家审核、状态变更、服务配置、订单操作必须写日志。

## 测试策略

新增 `tests/phase19.merchant-store-service-provider.test.js` 覆盖：

- 商家申请、重复申请、审核通过/拒绝、权限隔离。
- `service_providers` 同步。
- 商家服务创建、更新、上下架。
- 店铺列表和详情可见性。
- 指定商家下单和订单快照。
- 商家订单接单、开始服务、完成服务。
- 师傅不能操作商家订单，师傅大厅不显示商家订单。
- 商家订单财务兼容字段。
- 页面、服务、常量、文档接线。

## 当前明确不做

- 连锁商家、多门店、员工管理、排班。
- 真实营业执照认证、OCR、保证金。
- 真实商家分账、提现、自动打款。
- PC 后台商家中心。
- 管理员指派给商家。

