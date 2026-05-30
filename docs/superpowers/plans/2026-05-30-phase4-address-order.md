# 阶段 4 地址与下单实施计划

## 目标

完成用户端地址管理、提交订单、模拟支付、用户订单列表和用户订单详情，让阶段五可以基于 `pending_accept` 订单继续实现师傅接单。

## 用户确认

- 地址字段：联系人、手机号、城市、小区、详细地址、默认地址。
- 预约时间：第一版使用普通文本输入，不接复杂排班。
- 支付流程：提交订单后进入 `pending_pay`，用户点击模拟支付后进入 `pending_accept`。
- 订单列表：第一版只展示当前用户自己的订单，不做分页。

## 实施步骤

1. 阶段开始检查
   - 阅读 `docs/dev-records/index.md`
   - 阅读 `docs/dev-records/03_phase-service-browse.md`
   - 确认阶段三遗留问题中与阶段四直接相关的 `address/order` 占位项本阶段处理

2. 测试先行
   - 新增 `tests/phase4.address-order.test.js`
   - 覆盖地址创建、默认地址、更新、删除和当前用户隔离
   - 覆盖订单创建、服务快照、地址快照、模拟支付、订单详情和用户订单列表
   - 覆盖页面已经接入地址服务、订单服务和服务详情页预约跳转

3. 云函数实现
   - 新增 `cloudfunctions/address/handler.js`
   - 新增 `cloudfunctions/address/address-repository.js`
   - 接入 `cloudfunctions/address/index.js`
   - 新增 `cloudfunctions/order/handler.js`
   - 新增 `cloudfunctions/order/order-repository.js`
   - 新增 `cloudfunctions/order/service-data.js`
   - 接入 `cloudfunctions/order/index.js`

4. 小程序页面实现
   - 地址列表页：加载地址、空状态、新增、编辑、删除、设为默认
   - 地址编辑页：表单校验、保存地址、默认地址开关
   - 服务详情页：`立即预约` 跳转到提交订单页
   - 提交订单页：加载服务、加载地址、填写预约时间和备注、创建订单
   - 订单列表页：展示当前用户订单，支持下拉刷新和跳转详情
   - 订单详情页：展示订单快照，支持待付款订单模拟支付和可取消订单取消
   - 我的页：菜单项跳转订单和地址页面

5. 阶段收尾
   - 更新 `docs/dev-records/04_phase-address-order.md`
   - 更新 `docs/dev-records/index.md`
   - 更新 `README.md`
   - 运行 `npm test`
   - 检查文档占位和 git 状态
   - 提交 Git：`feat: add address and order phase`

## 不做范围

- 不接真实微信支付。
- 不接退款、提现、平台抽佣。
- 不实现师傅接单、服务开始、服务完成。
- 不实现后台订单管理。
- 不做分页和复杂时间排班。

## 验收标准

- 自动化测试全部通过。
- 新用户登录后可以在小程序内维护地址。
- 用户可以从服务详情进入提交订单。
- 创建订单后订单状态为 `pending_pay`，支付状态为 `unpaid`。
- 用户可以在订单详情点击模拟支付，订单状态变为 `pending_accept`，支付状态变为 `paid`。
- 用户订单列表只返回当前 openid 关联的订单。
