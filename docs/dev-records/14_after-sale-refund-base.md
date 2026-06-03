# 阶段 14：售后与退款基础版

## 1. 阶段基本信息

- 阶段编号：14
- 阶段名称：售后与退款基础版
- 开始时间：2026-05-31
- 完成时间：2026-05-31
- 阶段状态：已完成基础版，真实退款等待商户资料联调
- 当前版本：MVP phase 14

## 2. 本阶段目标

本阶段在不破坏已有下单、接单、服务、评价闭环的前提下，补齐用户售后申请、管理员审核、模拟退款和退款日志。当前只实现全额退款基础流程，不接入真实微信退款、不做部分退款、仲裁、提现、分佣或财务对账。

## 3. 本阶段完成内容

- [x] 新增 `refund` 云函数。
- [x] 新增售后申请创建、列表、详情和日志查询。
- [x] 新增管理员售后审核。
- [x] 管理员审核通过后执行模拟退款。
- [x] 新增 `after_sales` 和 `refund_logs` 数据设计。
- [x] 订单增加售后和退款状态字段。
- [x] 用户订单详情增加售后入口和状态展示。
- [x] 新增用户售后申请页和售后详情页。
- [x] 新增管理员售后列表页和售后详情页。
- [x] 新增售后、退款相关站内消息。
- [x] 新增阶段 14 自动化测试。

## 4. 新增文件

| 文件                                                          | 作用                 |
| ------------------------------------------------------------- | -------------------- |
| `cloudfunctions/refund/index.js`                              | 退款云函数入口       |
| `cloudfunctions/refund/handler.js`                            | 售后与退款业务逻辑   |
| `cloudfunctions/refund/order-repository.js`                   | 订单读写封装         |
| `cloudfunctions/refund/after-sale-repository.js`              | 售后单读写封装       |
| `cloudfunctions/refund/refund-repository.js`                  | 退款日志写入         |
| `cloudfunctions/refund/message-repository.js`                 | 售后与退款消息写入   |
| `cloudfunctions/refund/user-repository.js`                    | 管理员身份校验       |
| `cloudfunctions/refund/refund-adapter.js`                     | 真实退款适配器占位   |
| `cloudfunctions/refund/package.json`                          | 云函数依赖声明       |
| `miniprogram/services/refund.service.js`                      | 小程序退款服务调用层 |
| `miniprogram/pages/after-sale/apply/*`                        | 用户售后申请页       |
| `miniprogram/pages/after-sale/detail/*`                       | 用户售后详情页       |
| `miniprogram/pages/admin/after-sale-list/*`                   | 管理员售后列表页     |
| `miniprogram/pages/admin/after-sale-detail/*`                 | 管理员售后详情页     |
| `docs/superpowers/plans/2026-05-31-after-sale-refund-base.md` | 本阶段执行计划       |
| `tests/phase14.after-sale-refund.test.js`                     | 阶段 14 测试         |

## 5. 修改文件

| 文件                                               | 修改原因                                                  |
| -------------------------------------------------- | --------------------------------------------------------- |
| `miniprogram/config/constants.js`                  | 新增 `REFUND` 云函数、`after_sales` 和 `refund_logs` 集合 |
| `miniprogram/config/status.js`                     | 新增售后、退款状态和消息类型                              |
| `cloudfunctions/order/handler.js`                  | 创建订单时补齐售后与退款默认字段                          |
| `miniprogram/pages/order-detail/order-detail.js`   | 增加售后状态、退款状态和页面跳转                          |
| `miniprogram/pages/order-detail/order-detail.wxml` | 展示售后信息和售后入口                                    |
| `miniprogram/pages/admin/dashboard/dashboard.js`   | 增加售后管理入口跳转                                      |
| `miniprogram/pages/admin/dashboard/dashboard.wxml` | 增加售后管理入口                                          |
| `miniprogram/app.json`                             | 注册售后相关页面                                          |
| `tests/phase1.scaffold.test.js`                    | 同步新增页面路由断言                                      |
| `README.md`                                        | 更新阶段说明和能力边界                                    |
| `docs/release-package-checklist.md`                | 增加退款日志和敏感数据检查                                |

## 6. 数据库变化

新增集合：

| 集合          | 用途                                         |
| ------------- | -------------------------------------------- |
| `after_sales` | 保存用户售后申请、审核结果和退款关联信息     |
| `refund_logs` | 保存模拟退款、重复退款拦截和后续真实退款日志 |

`orders` 新增兼容字段：`after_sale_status`、`refund_status`、`refund_amount`、`refunded_at`、`after_sale_id`、`refund_no`。

## 7. 云函数 / 接口变化

新增云函数 `refund`，包含 action：`createAfterSale`、`listMyAfterSales`、`getAfterSaleDetail`、`adminListAfterSales`、`adminReviewAfterSale`、`mockRefund`、`getRefundLogs`。

## 8. 核心流程说明

用户发起售后申请  
↓  
后端校验订单归属、订单状态、重复售后和退款金额  
↓  
写入 `after_sales` 并更新订单售后状态  
↓  
管理员审核通过  
↓  
执行模拟退款并写入 `refund_logs`  
↓  
更新售后单和订单退款状态  
↓  
发送站内消息

## 9. 关键技术决策

- 当前只做全额退款：避免在 MVP 阶段引入部分退款和复杂财务拆分。
- 退款金额以后端订单金额为准：前端不传可信金额。
- 管理员审核通过后立即模拟退款：先跑通售后闭环，真实退款等待商户配置。
- 重复退款强拦截：订单已成功退款时再次退款会写入重复拦截日志并返回错误。
- 真实退款放入适配器：后续接入微信退款时不需要改动页面和主流程。

## 10. 安全与合规说明

- 退款密钥、商户号和证书不进入前端。
- 当前代码仓库不包含真实微信退款密钥。
- 售后详情权限限制为订单用户、接单师傅或管理员。
- 管理员审核需要校验 `users.role === 'admin'`。
- 退款日志用于追踪退款操作和重复退款风险。

## 11. 人工配置清单

真实环境验证前需创建集合：

- `after_sales`
- `refund_logs`

需上传部署云函数：

- `cloudfunctions/refund`

真实退款联调仍需：

- 微信支付商户号。
- APIv3 密钥。
- 商户 API 私钥。
- 商户 API 证书序列号。
- 退款回调地址或可用的云函数 HTTP 触发路径。

## 12. 已知问题与遗留事项

- 当前退款为模拟退款，不会真实退钱。
- 当前只支持全额退款，不支持部分退款。
- 当前没有退款回调验签和真实退款状态查询。
- 当前没有平台仲裁、师傅申诉和复杂售后协商。
- 售后图片当前只保存选择结果数组，未做完整云存储上传链路。

## 13. 测试记录

新增测试覆盖：用户售后申请、重复售后拦截、非法订单状态拦截、管理员权限校验、审核通过后的模拟退款、退款日志、售后与退款消息、重复退款拦截、页面注册、服务调用层、前端密钥扫描和文档更新。

验证命令：

```bash
npm test
```

结果：92 个测试全部通过。

## 14. 运行与验证方式

本阶段不需要真实微信支付资料即可验证。用户完成模拟支付后，订单进入可售后状态，可在订单详情发起售后；管理员进入“售后管理”审核，通过后订单会进入模拟退款成功状态，并在 `refund_logs` 中留下记录。

## 15. 对下一阶段的影响

本阶段为后续真实微信退款、售后协商、财务流水、对账和结算打下基础。后续接入真实退款时，应优先替换 `refund-adapter.js` 并补充真实退款回调和幂等测试。

## 16. 下一阶段开发计划

阶段 15：财务流水与结算基础能力，或在商户资料齐全后优先进入真实微信支付/退款小额联调。

## 17. 本阶段复盘

### 做得好的地方

售后和退款状态独立于订单服务状态，减少了对既有闭环的影响。

### 不足的地方

真实微信退款仍缺少商户资料和回调配置，当前只能验证模拟退款。

### 后续改进建议

商户资料准备好后，先做小额支付与退款联调，再考虑部分退款、售后协商和财务对账。

## 18. 阶段结论

本阶段已完成售后与模拟退款基础闭环，可以进入真机验证和后续真实支付退款联调准备。
