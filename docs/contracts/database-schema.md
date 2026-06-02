# 数据库 Schema 契约

本文件基于当前 `cloudfunctions/`、`miniprogram/config/status.js` 与测试中的内存集合整理。字段未在代码中稳定出现时标注“待核实”。阶段 19.6 起，核心集合同步维护机器可读 JSON schema：`schema/orders.schema.json`、`schema/users.schema.json`、`schema/merchants.schema.json`、`schema/service-providers.schema.json`、`schema/finance-logs.schema.json`、`schema/worker-earnings.schema.json`、`schema/payment-logs.schema.json`、`schema/refund-logs.schema.json`。后续 Agent 新增集合或字段必须同步本文件和对应 JSON schema，不能在页面或云函数里临时写入未记录字段。

## 总规则

- 金额统一使用“分”，以前端展示层转换为元。
- `openid`/`user_id` 归属字段由后端根据 `env.openid` 写入，前端不得伪造。
- `created_at`、`updated_at` 默认由后端 `getNow` 生成。
- 审核、支付、退款、财务、收益字段只能由云函数或管理员动作写入。
- mock 支付、mock 退款、mock 打赏、mock 会员和 mock 解冻产生的流水不代表真实清算。
- 阶段 20 的 mock 保证金、mock 资质认证、mock 保险信息和 mock 入驻风控不代表真实认证、真实支付、真实退款、真实 OCR 或真实保险核验。

## 集合清单

### `users`

用途：登录用户、角色与账号状态。

| 字段 | 类型 | 必填 | 写入来源 | 前端可传 | 用户可修改 | 关联 | 说明 |
|---|---|---|---|---|---|---|---|
| `_id` | string | 是 | 数据库 | 否 | 否 | 多集合 `user_id` | 待核实是否等于 openid |
| `openid` | string | 是 | `login` 云函数 | 否 | 否 | 当前登录身份 | 权限基础 |
| `nickname`/`avatar_url` | string | 否 | 登录/资料更新 | 是 | 是 | 展示 | 默认值兼容 |
| `phone` | string | 否 | 用户资料/地址 | 是 | 是 | 地址/订单 | 格式校验待加强 |
| `role` | string | 是 | 后端/管理员 | 否 | 否 | 权限矩阵 | `user`、`admin`、`worker` 等 |
| `status` | string | 是 | 后端/管理员 | 否 | 否 | 权限矩阵 | `normal`/`disabled` |

索引建议：`openid` 唯一索引，`role + status` 普通索引。mock 差异：管理员初始化可由受环境变量保护的 `claimInitialAdmin` 完成。

### `orders`

用途：订单主表，覆盖用户下单、mock 支付、师傅/商家接单、服务流转、售后与财务关联。

| 字段 | 类型 | 必填 | 写入来源 | 前端可传 | 用户可修改 | 关联 | 说明 |
|---|---|---|---|---|---|---|---|
| `_id` | string | 是 | 数据库 | 否 | 否 | 各日志 | 主键 |
| `order_no` | string | 是 | `order` | 否 | 否 | 财务/支付 | 后端生成 |
| `user_id` | string | 是 | `env.openid` | 否 | 否 | `users` | 归属校验 |
| `service_id`/`service_snapshot` | string/object | 是 | 前端选择 + 后端快照 | 是 | 否 | `services` | 价格以后端快照为准 |
| `address_snapshot` | object | 是 | 地址集合快照 | 间接 | 否 | `addresses` | 下单时固化 |
| `status` | string | 是 | 后端状态机 | 否 | 否 | 状态契约 | `ORDER_STATUS` |
| `pay_status` | string | 是 | `order`/`payment` | 否 | 否 | 支付 | `PAY_STATUS` |
| `amount`/`pay_amount`/`discount_amount` | number | 是 | 后端计算 | 否 | 否 | 财务/营销 | 字段名以当前代码为准，待继续核实 |
| `worker_id` | string | 否 | 师傅接单/指派 | 否 | 否 | `workers` | 个人师傅订单 |
| `provider_type` | string | 否 | 下单/服务方选择 | 是 | 否 | `service_providers` | `worker`/`merchant` |
| `merchant_id` | string | 否 | 指定商家下单 | 是 | 否 | `merchants` | 商家订单归属 |
| `after_sale_status`/`refund_status` | string | 否 | `refund` | 否 | 否 | 售后/退款 | mock 退款边界 |
| `finish_images`/`finish_remark` | array/string | 否 | 师傅/商家完工 | 是 | 否 | 评价 | 云存储权限待真机核实 |

索引建议：`user_id + created_at`、`worker_id + status`、`merchant_id + status`、`status + pay_status`、`provider_type + merchant_id`。mock 差异：`mockPayOrder` 和 `payment` mock 模式会直接推进支付状态，无真实扣款。

### `workers`

用途：个人师傅入驻、审核、服务范围、接单状态。

核心字段：`_id`、`user_id`、`name`、`phone`、`service_category_ids`、`service_communities`、`service_area_ids`、`audit_status`、`online_status`、`status`、`created_at`、`updated_at`。前端可传姓名、手机号、服务品类、小区和资质描述；审核状态、账号状态和接单状态由后端或管理员控制。关联 `users`、`orders`、`service_areas`。索引建议：`user_id` 唯一、`audit_status + online_status`。真实环境差异：身份证、保险、资质图片还未进入阶段 19.5 范围。

### `merchants`

用途：商家入驻、审核、启停、店铺主页基础资料。

核心字段：`_id`、`user_id`、`store_name`、`contact_name`、`contact_phone`、`store_intro`、`logo_file_id`、`service_category_ids`、`service_communities`、`full_address`、`business_hours`、`audit_status`、`status`、`created_at`、`updated_at`。前端可传店铺资料；`audit_status`、`status`、审核备注由管理员写入。关联 `users`、`merchant_services`、`service_providers`、`orders`。索引建议：`user_id` 唯一、`audit_status + status`。mock 差异：营业执照、保证金、资质认证当前仅记录为后续阶段，不在本阶段新增。

### `merchant_services`

用途：商家自有服务项目。

字段：`_id`、`merchant_id`、`service_id`、`name`、`price`、`duration`、`description`、`cover_image`、`status`、`created_at`、`updated_at`。商家可创建/上下架自己的服务项目，不能操作其他商家的服务。关联 `merchants`、`services`、`orders`。索引建议：`merchant_id + status`、`service_id`。价格仍需以后端校验，避免前端篡改。

### `merchant_qualifications`

用途：阶段 20 商家/服务方资质认证 mock 信息。机器契约：`schema/merchant-qualifications.schema.json`。

核心字段：`_id`、`merchant_id`、`provider_id`、`provider_type`、`subject_type`、`qualification_status`、`onboarding_status`、`real_name_mock`、`id_card_masked`、`id_card_last4`、`business_name`、`business_license_no_masked`、`legal_person_name_mock`、`legal_person_id_masked`、`service_categories`、`experience_years`、`certificate_files`、`license_files`、`storefront_files`、`insurance_info`、`agreement_checked`、`submit_count`、`reviewer_openid`、`reviewed_at`、`reject_reason`、`supplement_required_fields`、`created_at`、`updated_at`。不保存真实完整身份证号、营业执照号、法人证件号。

### `merchant_deposits`

用途：阶段 20 模拟保证金状态和流水。机器契约：`schema/merchant-deposits.schema.json`。

核心字段：`_id`、`merchant_id`、`provider_id`、`provider_type`、`required_amount`、`paid_amount`、`currency`、`deposit_status`、`mock_pay_no`、`mock_paid_at`、`frozen_reason`、`refund_apply_reason`、`refund_review_result`、`refund_reject_reason`、`operator_openid`、`created_at`、`updated_at`。不调用真实微信支付，不返回真实支付参数，不写入真实可提现余额。

### `merchant_risk_records`

用途：阶段 20 入驻风控 mock 记录。机器契约：`schema/merchant-risk-records.schema.json`。

核心字段：`_id`、`merchant_id`、`provider_id`、`provider_type`、`risk_level`、`risk_tags`、`risk_reason`、`action`、`operator_openid`、`created_at`、`updated_at`。仅管理员可写，商家端只展示简化风险提示。

### `merchant_onboarding_logs`

用途：阶段 20 入驻流程、资质审核、保证金和风控操作日志。机器契约：`schema/merchant-onboarding-logs.schema.json`。

核心字段：`_id`、`merchant_id`、`provider_id`、`provider_type`、`event_type`、`before_status`、`after_status`、`operator_role`、`operator_openid`、`remark`、`created_at`。

### `service_providers`

用途：统一服务方索引，兼容个人师傅和商家店铺。

字段：`_id`、`provider_type`、`ref_id`、`name`、`avatar`/`logo`、`audit_status`、`status`、`service_category_ids`、`service_communities`、`rating`、`sales_count`、`created_at`、`updated_at`。写入来源为 `merchant` 审核同步及后续 worker 同步，前端不可直接写。索引建议：`provider_type + ref_id` 唯一、`status + audit_status`。历史兼容：个人师傅仍主要读取 `workers`。

### `reviews`

用途：订单评价、追评、师傅回复、展示隐藏。

字段：`_id`、`order_id`、`user_id`、`worker_id`/`provider_id`、`rating`、`rating_level`、`content`、`images`、`followup_content`、`worker_reply`、`status`、`appeal_status`、`created_at`、`updated_at`。用户可创建评价和追评；师傅可回复；管理员可隐藏/恢复。关联 `orders`、`users`、`workers`、`review_appeals`。索引建议：`order_id` 唯一、`worker_id + status`。

### `messages`

用途：站内消息和业务通知。

字段：`_id`、`user_id`、`role`、`title`、`content`、`type`、`related_type`、`related_id`、`is_read`、`created_at`、`updated_at`。写入来源为云函数内部 `safeCreateMessage`，用户只允许读自己的消息和标记已读。索引建议：`user_id + is_read + created_at`。

### `payment_logs`

用途：支付创建、支付通知、查询、重复支付记录。

字段：`_id`、`order_id`、`user_id`、`payment_no`、`type`、`pay_mode`、`status`、`amount`、`raw_data`、`created_at`。仅 `payment` 云函数写入。索引建议：`order_id + type`、`payment_no`。mock 差异：当前默认 mock 支付，无真实微信交易号和回调验签结果。

### `refund_logs`

用途：售后审核、mock 退款和退款查询记录。

字段：`_id`、`after_sale_id`、`order_id`、`user_id`、`refund_no`、`refund_status`、`refund_channel`、`amount`、`raw_data`、`created_at`。仅 `refund` 云函数写入。索引建议：`after_sale_id`、`order_id`、`refund_no`。mock 差异：`mock_success` 不代表微信退款成功。

### `finance_logs`

用途：平台财务流水、订单收入、平台佣金、收益回冲。

字段：`_id`、`finance_no`、`order_id`、`type`、`direction`、`amount`、`user_id`、`worker_id`、`provider_type`、`merchant_id`、`remark`、`created_at`。写入来源为 `finance`、`tip` 和退款回冲。前端不可写。索引建议：`order_id + type`、`worker_id + created_at`。mock 差异：仅验证账务流程，不代表真实分账或对账。

### `worker_earnings`

用途：服务方收益，历史命名仍为 worker，但阶段 19 已兼容商家服务方。

字段：`_id`、`earning_no`、`order_id`、`worker_id`、`provider_type`、`merchant_id`、`amount`、`status`、`settlement_status`、`frozen_until`、`source_type`、`created_at`、`updated_at`。写入来源为 `finance` 和 `tip`。索引建议：`worker_id + status`、`order_id`。历史兼容：后续可迁移为 `provider_earnings`，当前不改集合名。

### 优惠券/活动相关集合

- `member_plans`：会员档位配置，字段含 `level`、`name`、`price`、`duration_days`、`status`、权益描述。管理员可改。
- `user_memberships`/代码环境名 `memberships`：用户会员状态，字段含 `user_id`、`level`、`status`、`started_at`、`expired_at`。mock 开通写入。
- `coupon_templates`：优惠券模板，字段含 `name`、`type`、`amount`、`discount`、`threshold_amount`、`status`、有效期。管理员写入。
- `user_coupons`：用户领券与核销，字段含 `user_id`、`template_id`、`status`、`locked_order_id`、`used_order_id`。用户领取，后端锁定/核销/释放。

索引建议：`user_id + status`、`template_id`、`status + valid_time`。mock 差异：会员购买为 mock，无自动续费和真实支付。

### 打赏相关集合

`tip_logs` 用于模拟打赏记录。字段含 `_id`、`tip_no`、`order_id`、`user_id`、`worker_id`、`amount`、`status`、`channel`、`commission_rate`、`worker_tip_income`、`platform_tip_commission`、`created_at`。写入来源为 `tip.createMockTip`，用户不可直接写收益分配字段。索引建议：`user_id + created_at`、`worker_id + created_at`、`order_id`。mock 差异：无真实打赏支付。

### 售后/退款相关集合

`after_sales` 用于售后申请。字段含 `_id`、`after_sale_no`、`order_id`、`user_id`、`type`、`reason`、`images`、`status`、`review_remark`、`refund_amount`、`created_at`、`updated_at`。用户可提交原因和图片；管理员审核；退款状态由 `refund` 写入订单和日志。索引建议：`user_id + created_at`、`status + created_at`、`order_id`。

### 其他集合

- `service_categories`/环境名 `categories`：服务分类，管理员维护。
- `services`：平台服务目录，管理员维护，订单保存快照。
- `addresses`：用户地址，用户只能管理自己的地址。
- `service_areas`/环境名 `areas`：服务区域，管理员维护。
- `dispatch_logs`：派单、取消指派、回流日志。
- `admin_operation_logs`：管理员操作日志。
- `merchant_action_logs`/环境名 `merchantLogs`：商家申请、审核、订单操作日志。
- `review_appeals`、`review_action_logs`：差评申诉和评价操作日志。

以上字段以当前代码为准，真实云数据库创建、索引配置和权限规则仍需在微信云开发控制台真机验证。
