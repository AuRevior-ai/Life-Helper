# 阶段 13：微信支付轻量接入与支付日志

## 1. 阶段基本信息

- 阶段编号：13
- 阶段名称：微信支付轻量接入与支付日志
- 开始时间：2026-05-31
- 完成时间：2026-05-31
- 阶段状态：已完成代码准备，等待真实商户资料联调
- 当前版本：MVP phase 13

## 2. 本阶段目标

本阶段将原有“模拟支付”升级为可配置的支付体系：默认仍可使用模拟支付完整跑通 MVP，具备商户号后可切换到真实微信支付流程。本阶段只做轻量接入、支付日志、回调业务逻辑和结果页，不做退款、提现、分佣和财务对账，避免破坏已通过真机验证的核心闭环。

## 3. 本阶段完成内容

- [x] 新增支付模式配置，默认 `mock`。
- [x] 新增 `payment` 云函数骨架。
- [x] 新增 `createPayment`、`handlePayNotify`、`queryPaymentStatus`。
- [x] 新增 `payment_logs` 日志设计与写入。
- [x] 扩展订单支付字段。
- [x] 保留原有模拟支付。
- [x] 新增支付结果页。
- [x] 新增微信支付配置文档和配置示例。
- [x] 新增阶段 13 测试。

## 4. 新增文件

| 文件 | 作用 |
| --- | --- |
| `cloudfunctions/payment/index.js` | 支付云函数入口 |
| `cloudfunctions/payment/handler.js` | 支付业务逻辑 |
| `cloudfunctions/payment/order-repository.js` | 支付云函数订单读写 |
| `cloudfunctions/payment/payment-repository.js` | 支付日志写入 |
| `cloudfunctions/payment/message-repository.js` | 支付成功消息写入 |
| `cloudfunctions/payment/wechat-pay-client.js` | 微信支付客户端占位封装 |
| `cloudfunctions/payment/config.example.js` | 云函数支付配置示例 |
| `miniprogram/config/payment.js` | 小程序支付模式配置 |
| `miniprogram/services/payment.service.js` | 小程序支付服务调用 |
| `miniprogram/pages/pay-result/*` | 支付结果页 |
| `docs/wechat-pay-setup.md` | 微信支付接入说明 |
| `docs/wechat-pay-config.example.md` | 支付配置示例 |
| `tests/phase13.wechat-pay-lite.test.js` | 阶段 13 测试 |

## 5. 修改文件

| 文件 | 修改原因 |
| --- | --- |
| `miniprogram/app.json` | 注册支付结果页 |
| `miniprogram/config/constants.js` | 新增 `PAYMENT` 云函数和 `PAYMENT_LOGS` 集合 |
| `miniprogram/config/status.js` | 扩展支付状态 |
| `miniprogram/pages/order-detail/order-detail.js` | 接入统一支付入口 |
| `miniprogram/pages/order-detail/order-detail.wxml` | 支付按钮调用新入口 |
| `cloudfunctions/order/handler.js` | 创建订单时补齐支付字段 |
| `docs/dev-records/index.md` | 更新阶段索引 |
| `docs/wechat-mvp-verification.md` | 更新集合和云函数清单 |
| `docs/release-package-checklist.md` | 增加支付敏感信息检查 |
| `README.md` | 更新当前阶段说明 |

## 6. 数据库变化

`orders` 新增兼容字段：`out_trade_no`、`transaction_id`、`prepay_id`、`pay_amount`、`pay_error`、`notify_received_at`、`last_pay_attempt_at`。新增集合 `payment_logs`，用于记录创建预支付、支付通知、支付成功、支付失败、重复通知和查询记录。

## 7. 云函数 / 接口变化

新增云函数 `payment`，包含 action：`createPayment`、`handlePayNotify`、`queryPaymentStatus`。默认 `PAY_MODE=mock` 时不调用真实微信支付接口。

## 8. 核心支付流程说明

用户点击支付  
↓  
后端创建预支付单  
↓  
小程序调起微信支付  
↓  
微信回调  
↓  
后端确认支付成功  
↓  
订单进入待接单

## 9. 关键技术决策

- 保留模拟支付：没有商户号和回调地址时仍能开发和真机验证核心闭环。
- 新增支付日志：支付链路涉及前端、云函数、微信回调，需要可追踪证据。
- 支付成功以后端回调为准：前端 `wx.requestPayment success` 不直接改订单。
- 暂不做退款和分佣：避免引入财务复杂度，下一阶段再扩展。

## 10. 安全与合规说明

- 密钥不进前端。
- 密钥不进 Git。
- 金额以后端订单金额为准。
- 回调必须幂等。
- 支付日志用于追踪问题。

## 11. 人工配置清单

- 真实小程序 AppID。
- 微信支付商户号 mchid。
- APIv3 密钥。
- 商户 API 私钥。
- 商户 API 证书序列号。
- 支付回调 notify_url。
- 云环境 ID。
- 云函数环境变量 `PAY_MODE=wechat`。

## 12. 已知问题与遗留事项

- 尚未提供真实商户号。
- 尚未完成真实支付小额测试。
- 回调地址尚未配置。
- 当前默认仍处于 mock 模式。
- `wechat-pay-client.js` 已保留封装点，真实签名和请求需在提供商户资料后接入。

## 13. 测试记录

新增测试覆盖：支付配置文档、`payment_logs` 集合声明、创建支付校验、金额以后端为准、重复支付拦截、支付回调成功、重复回调幂等、支付成功消息、支付结果页注册、前端密钥扫描、模拟支付保留。

验证命令：

```bash
npm test
```

结果：86 个测试全部通过。

## 14. 运行与验证方式

开发环境保持 `miniprogram/config/payment.js` 中 `CURRENT_PAY_MODE = PAY_MODE.MOCK`，继续点击订单详情的“模拟支付”。真实环境准备好商户资料后，切换为 `PAY_MODE.WECHAT`，部署 `payment` 云函数并配置云函数环境变量。

## 15. 对下一阶段的影响

支付日志和支付回调幂等能力为后续退款、售后、财务流水和对账提供基础。

## 16. 下一阶段开发计划

阶段 14：退款与售后基础版。

## 17. 本阶段复盘

### 做得好的地方

保留 mock 闭环，新增支付能力没有破坏已验证流程。

### 不足的地方

真实微信支付签名、请求和回调验签需要等待商户资料后继续联调。

### 后续改进建议

商户资料准备好后，优先补齐真实 WeChat Pay v3 客户端和真实回调验签测试。

## 18. 阶段结论

本阶段已完成代码准备和本地自动化验证，可以等待商户资料后进入真实支付联调。
