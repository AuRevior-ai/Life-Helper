# 微信支付轻量接入配置说明

本文记录微信支付接入边界。当前工程默认且明确只使用模拟支付，未准备商户资料时不影响 MVP 业务闭环。当前产品策略是不考虑接入真实支付现金流；真实微信支付、真实退款、提现和分账仅作为后续条件阶段保留。阶段 19.6 起，真实微信支付尚未实现时必须 fail-fast，不允许返回空 `prepay_id` 或空 `payParams`。

工程评价口径：在当前 mock 支付策略下，未接入真实微信支付、真实退款、提现、分账或真实现金流，不应被列为当前工程 P0 阻塞项。审批时应检查 mock 支付是否明确标注、支付状态是否以后端为准、真实能力是否被误包装、敏感支付配置是否泄露。

## 需要人工准备

| 配置项               | 说明                                             | 是否提交仓库 |
| -------------------- | ------------------------------------------------ | ------------ |
| 小程序 AppID         | 真实小程序账号 AppID                             | 否           |
| 微信支付商户号 mchid | 已绑定当前小程序的商户号                         | 否           |
| APIv3 密钥           | 微信支付 APIv3 密钥                              | 否           |
| 商户 API 私钥        | 商户平台下载或生成的私钥                         | 否           |
| 商户 API 证书序列号  | 用于请求签名                                     | 否           |
| 支付回调 notify_url  | 微信支付异步通知地址                             | 否           |
| 云环境 ID            | 部署 `payment` 云函数的云环境                    | 否           |
| 是否启用真实支付     | 当前不启用；`PAY_MODE=wechat` 仅为占位，真实支付尚未实现 | 否           |

## 云数据库集合

阶段 13 需要新增集合：

```text
payment_logs
```

`payment_logs` 用于记录创建预支付单、前端请求支付、支付回调、支付成功、支付失败、重复支付拦截、重复回调和主动查询支付状态。

## 云函数

新增云函数：

```text
cloudfunctions/payment
```

支持 action：

```text
createPayment
handlePayNotify
queryPaymentStatus
```

默认 `PAY_MODE=mock`。当前只能使用 mock 支付。`PAY_MODE=wechat` 但真实 JSAPI 下单、签名、证书、APIv3 密钥和回调验签未完整实现时，`payment.createPayment` 必须返回 `WECHAT_PAY_NOT_IMPLEMENTED` 或等价错误：`真实微信支付尚未实现，请使用 mock 支付或完成正式支付接入`。

## 支付模式

小程序端配置位于：

```text
miniprogram/config/payment.js
```

默认：

```js
CURRENT_PAY_MODE = PAY_MODE.MOCK;
```

真实支付测试前，不能只切换为 `PAY_MODE.WECHAT`。必须完成 JSAPI 下单、请求签名、前端支付参数签名、支付回调验签、退款、退款回调和对账流程后，才能进入真实交易联调。该真实交易联调不属于当前 mock 支付阶段，也不作为当前工程 P0 验收条件。

## 回调说明

微信支付成功必须以后端回调或主动查询结果为准。前端 `wx.requestPayment success` 只代表用户完成了支付动作，不直接修改订单状态。

如果当前云开发环境暂未配置 HTTP 回调地址，本阶段先保留 `handlePayNotify` 的业务处理结构，但它当前只用于测试支付回调后的业务结构，不是生产真实资金回调入口。默认 `PAY_MODE=mock` 会拒绝生产式 notify；`PAY_MODE=wechat` 如果没有真实回调验签器也会拒绝处理 notify。测试模拟 notify 必须显式注入 `env.notifyVerifier` 或 `env.allowMockNotify === true`，避免无验签路径被误认为生产可用。

真实上线前必须完成 JSAPI 下单、请求签名、前端支付参数签名、支付回调验签、退款、退款回调和对账流程。前端 `wx.requestPayment success` 只代表用户完成了支付动作，不直接修改订单支付状态。

当前测试结构只验证：

1. 根据 `out_trade_no` 查找订单。
2. 校验金额一致。
3. 幂等更新订单为 `pending_accept / paid`。
4. 写入 `payment_logs`。
5. 创建用户站内消息。
6. 重复回调只记日志，不重复发消息。

## 禁止提交内容

- 真实 APIv3 密钥
- 商户私钥
- 商户证书
- 真实商户号截图
- 真实用户 openid 列表
- 真实支付订单数据导出
