# 微信支付配置示例

本文件只展示配置项名称，不包含真实密钥。请把真实配置放在微信云开发环境变量、云函数安全配置或本地私有文档中，不要提交到仓库。

```text
PAY_MODE=mock
WECHAT_PAY_APPID=YOUR_MINIPROGRAM_APPID
WECHAT_PAY_MCHID=YOUR_MCH_ID
WECHAT_PAY_NOTIFY_URL=https://your-domain.example/payment/notify
WECHAT_PAY_SERIAL_NO=YOUR_MERCHANT_CERT_SERIAL_NO
WECHAT_PAY_API_V3_KEY=DO_NOT_COMMIT_REAL_KEY
WECHAT_PAY_PRIVATE_KEY=DO_NOT_COMMIT_REAL_PRIVATE_KEY
```

开发和无商户号环境保持：

```text
PAY_MODE=mock
```

真实小额支付测试前再切换：

```text
PAY_MODE=wechat
```
