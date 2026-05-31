# 微信支付轻量接入配置说明

本文记录阶段 13 的微信支付接入方式。当前工程默认仍使用模拟支付，未准备商户资料时不影响 MVP 业务闭环。

## 需要人工准备

| 配置项 | 说明 | 是否提交仓库 |
| --- | --- | --- |
| 小程序 AppID | 真实小程序账号 AppID | 否 |
| 微信支付商户号 mchid | 已绑定当前小程序的商户号 | 否 |
| APIv3 密钥 | 微信支付 APIv3 密钥 | 否 |
| 商户 API 私钥 | 商户平台下载或生成的私钥 | 否 |
| 商户 API 证书序列号 | 用于请求签名 | 否 |
| 支付回调 notify_url | 微信支付异步通知地址 | 否 |
| 云环境 ID | 部署 `payment` 云函数的云环境 | 否 |
| 是否启用真实支付 | `PAY_MODE=wechat` 时启用真实支付 | 否 |

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

默认 `PAY_MODE=mock`。未配置真实商户资料时，`payment.createPayment` 会返回 `REAL_PAY_DISABLED` 或配置缺失错误，小程序端继续使用模拟支付。

## 支付模式

小程序端配置位于：

```text
miniprogram/config/payment.js
```

默认：

```js
CURRENT_PAY_MODE = PAY_MODE.MOCK
```

真实支付测试前，需要在小程序端切换为 `PAY_MODE.WECHAT`，并在云函数环境变量或安全配置中提供商户资料。

## 回调说明

微信支付成功必须以后端回调或主动查询结果为准。前端 `wx.requestPayment success` 只代表用户完成了支付动作，不直接修改订单状态。

如果当前云开发环境暂未配置 HTTP 回调地址，本阶段先保留 `handlePayNotify` 的业务处理结构，并通过测试模拟回调数据验证：

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
