# 状态契约

本文件记录前端 `miniprogram/config/status.js` 与云函数局部状态常量的契约。后续新增状态必须同步本文件、前端状态常量、相关云函数、页面展示文案和测试。禁止为了单个阶段临时新增后端状态而不更新前端。

## 维护规则

- 前端状态展示以 `miniprogram/config/status.js` 为当前权威来源。
- 后端状态值不得随意改名，历史订单、售后、收益和商家记录依赖这些字符串。
- 新增状态必须说明业务模块、中文含义、允许新增原因、影响页面、影响云函数和兼容策略。
- 状态一致性由 `tests/phase19_5.engineering-governance.test.js` 约束核心状态。

## 核心状态表

| 模块 | 常量 | 状态值 | 中文含义 | 前端使用位置 | 云函数使用位置 | 兼容说明 | 是否允许新增 |
|---|---|---|---|---|---|---|---|
| 订单 | `ORDER_STATUS.PENDING_PAY` | `pending_pay` | 待付款 | 订单列表、订单详情、管理员订单 | `order`、`admin`、`payment` | 历史订单核心状态 | 允许，但需同步状态机 |
| 订单 | `ORDER_STATUS.PENDING_ACCEPT` | `pending_accept` | 待接单 | 用户/师傅/管理员订单 | `order`、`worker`、`merchant`、`dispatch`、`payment` | 支付后进入接单池 | 谨慎新增 |
| 订单 | `ORDER_STATUS.ACCEPTED` | `accepted` | 已接单 | 订单列表、师傅订单 | `order`、`merchant`、`dispatch` | 师傅/商家接单后状态 | 谨慎新增 |
| 订单 | `ORDER_STATUS.SERVING` | `serving` | 服务中 | 订单详情 | `order`、`merchant` | 服务开始后状态 | 谨慎新增 |
| 订单 | `ORDER_STATUS.PENDING_REVIEW` | `pending_review` | 待评价 | 订单详情、评价入口 | `order`、`merchant`、`refund` | 完工后等待评价 | 谨慎新增 |
| 订单 | `ORDER_STATUS.COMPLETED` | `completed` | 已完成 | 订单列表、财务、评价 | `order`、`review`、`finance`、`refund`、`tip` | 评价完成或完成确认后 | 谨慎新增 |
| 订单 | `ORDER_STATUS.CANCELED` | `canceled` | 已取消 | 订单列表 | `order`、`admin`、`payment` | 取消终态 | 谨慎新增 |
| 支付 | `PAY_STATUS.UNPAID` | `unpaid` | 未支付 | 订单详情、支付结果 | `order`、`payment` | 下单默认 | 允许，需同步支付文档 |
| 支付 | `PAY_STATUS.PAYING` | `paying` | 支付中 | 支付结果页 | `payment` | 预支付/模拟支付过程中 | 允许 |
| 支付 | `PAY_STATUS.PAID` | `paid` | 已支付 | 订单详情、财务 | `order`、`payment`、`finance`、`tip` | 当前多为 mock 支付结果 | 谨慎新增 |
| 支付 | `PAY_STATUS.FAILED` | `failed` | 支付失败 | 支付结果页 | `payment` | 支付失败 | 允许 |
| 支付 | `PAY_STATUS.REFUNDED` | `refunded` | 已退款 | 售后/订单展示 | `payment`、`refund` 相关逻辑待核实 | 阶段 19.5 补齐 payment 常量一致性 | 谨慎新增 |
| 售后 | `AFTER_SALE_STATUS.NONE` | `none` | 无售后 | 订单详情 | 订单字段默认 | 历史兼容字段 | 不建议新增 |
| 售后 | `AFTER_SALE_STATUS.PENDING` | `pending` | 售后待审核 | 售后列表 | `refund` | 申请后状态 | 允许 |
| 售后 | `AFTER_SALE_STATUS.APPROVED` | `approved` | 售后已通过 | 售后详情 | `refund` | 管理员审核通过 | 允许 |
| 售后 | `AFTER_SALE_STATUS.REJECTED` | `rejected` | 售后未通过 | 售后详情 | `refund` | 管理员驳回 | 允许 |
| 售后 | `AFTER_SALE_STATUS.CANCELED` | `canceled` | 售后已取消 | 状态展示 | 待核实 | 前端已有，后端当前未重点使用 | 谨慎新增 |
| 售后 | `AFTER_SALE_STATUS.REFUNDED` | `refunded` | 已退款 | 售后详情 | `refund` | mock 退款完成 | 谨慎新增 |
| 退款 | `REFUND_STATUS.NONE` | `none` | 未退款 | 订单/售后详情 | 订单字段默认 | 历史兼容 | 不建议新增 |
| 退款 | `REFUND_STATUS.PENDING` | `pending` | 退款处理中 | 售后详情 | `refund` | 审核通过后 | 允许 |
| 退款 | `REFUND_STATUS.SUCCESS` | `success` | 退款成功 | 售后详情 | `refund` 预留真实退款 | 真实退款接入后使用 | 允许 |
| 退款 | `REFUND_STATUS.FAILED` | `failed` | 退款失败 | 售后详情 | `refund` | 真实或 mock 失败 | 允许 |
| 退款 | `REFUND_STATUS.MOCK_SUCCESS` | `mock_success` | 模拟退款成功 | 售后详情 | `refund` | 当前默认退款成功状态 | 保留 |
| 会员 | `MEMBER_STATUS.INACTIVE` | `inactive` | 未开通 | 会员中心 | `promotion` | 默认状态 | 允许 |
| 会员 | `MEMBER_STATUS.ACTIVE` | `active` | 生效中 | 会员中心、优惠计算 | `promotion` | mock 开通后 | 允许 |
| 会员 | `MEMBER_STATUS.EXPIRED` | `expired` | 已过期 | 会员中心 | `promotion` | 到期后自动降级 | 允许 |
| 会员 | `MEMBER_STATUS.DISABLED` | `disabled` | 已停用 | 管理配置 | `promotion` | 管理停用 | 允许 |
| 收益 | `WORKER_EARNING_STATUS.FROZEN` | `frozen` | 冻结中 | 收益页、财务详情 | `finance`、`tip` | 订单完成后冻结 | 谨慎新增 |
| 收益 | `WORKER_EARNING_STATUS.SETTLEABLE` | `settleable` | 可结算 | 收益页、管理员财务 | `finance` | mock 解冻后 | 谨慎新增 |
| 收益 | `WORKER_EARNING_STATUS.SETTLED` | `settled` | 已结算 | 管理员财务 | `finance` | 当前无真实提现 | 谨慎新增 |
| 收益 | `WORKER_EARNING_STATUS.REVERSED` | `reversed` | 已冲回 | 财务详情 | `finance` | 退款回冲 | 谨慎新增 |
| 收益 | `WORKER_EARNING_STATUS.PENDING_MANUAL` | `pending_manual` | 需人工处理 | 财务详情 | `finance` | 已结算后退款等异常 | 允许 |
| 服务方 | `SERVICE_PROVIDER_TYPE.WORKER` | `worker` | 个人师傅 | 店铺/服务方展示 | `merchant`、`order` | 历史 worker 模型 | 不建议改名 |
| 服务方 | `SERVICE_PROVIDER_TYPE.MERCHANT` | `merchant` | 商家店铺 | 店铺主页、商家端 | `merchant`、`order` | 阶段 19 新增 | 允许新增类型但需迁移 |
| 商家 | `MERCHANT_STATUS.NORMAL` | `normal` | 正常 | 商家端/管理员 | `merchant` | 可经营状态 | 允许 |
| 商家 | `MERCHANT_STATUS.DISABLED` | `disabled` | 已停用 | 管理员商家详情 | `merchant` | 停用后不可管理服务/订单 | 允许 |

## 新增状态同步清单

新增或修改任何状态时，必须同步：

1. `miniprogram/config/status.js`
2. 相关云函数局部常量
3. 本文件
4. 页面状态展示文案
5. `tests/phase19_5.engineering-governance.test.js`
6. 相关阶段复盘文档

当前已知差异：阶段 19.5 已补齐 `payment` 云函数的 `PAY_STATUS.REFUNDED` 常量；复杂状态自动生成机制暂不引入。
