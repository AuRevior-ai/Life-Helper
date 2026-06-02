# 权限矩阵

本文件记录多角色 action 权限边界。后续新增 action、状态流转、集合字段或资金相关能力必须同步本矩阵。当前角色包括游客、普通用户、师傅、商家、管理员和系统内部调用。

## 角色定义

| 角色 | 说明 | 身份来源 |
|---|---|---|
| 游客 | 未登录或仅浏览公开内容 | 无 openid 或未完成登录 |
| 普通用户 | 下单、地址、评价、售后、优惠券、消息 | `users.openid` |
| 师傅 | 已入驻并审核通过的个人服务方 | `workers.user_id` + `audit_status=approved` |
| 商家 | 已审核通过且正常的商家门店 | `merchants.user_id` + `audit_status=approved` + `status=normal` |
| 管理员 | 平台管理人员 | `users.role=admin` 且未禁用 |
| 系统内部调用 | 云函数之间的内部流程 | 受云函数代码路径和 env 注入约束 |

## 权限矩阵

| 模块/action | 游客 | 普通用户 | 师傅 | 商家 | 管理员 | 系统内部 | 关键边界 |
|---|---|---|---|---|---|---|---|
| `login` | 允许 | 允许 | 允许 | 允许 | 允许 | 否 | 只创建/返回当前 openid 用户 |
| `service.getCategoryList/getServiceList/getServiceDetail` | 允许 | 允许 | 允许 | 允许 | 允许 | 否 | 只读公开服务 |
| `service.*` 管理 action | 否 | 否 | 否 | 否 | 允许 | 否 | 服务删除需保护已有订单 |
| `address.*` | 否 | 仅本人 | 仅本人 | 仅本人 | 不建议代操作 | 否 | 用户只能访问自己的地址 |
| `order.createOrder` | 否 | 允许 | 允许作为用户 | 允许作为用户 | 不建议 | 否 | 金额以后端计算，前端不得决定实付 |
| `order.getUserOrderList/getOrderDetail/cancelOrder` | 否 | 仅本人订单 | 仅本人用户订单或相关订单 | 仅本人用户订单或相关商家订单 | 允许查看 | 否 | 必须校验 `user_id`、`worker_id`、`merchant_id` |
| `order.acceptOrder/startService/finishService` | 否 | 否 | 仅相关师傅订单 | 否 | 不建议代操作 | 否 | 师傅不能操作商家订单 |
| `worker.applyWorker/getWorkerInfo/getAuditStatus/updateWorker*` | 否 | 本人 | 本人 | 可作为普通用户申请但不代表商家权限 | 管理查看 | 否 | 师傅状态不能由前端伪造 |
| `worker.approveWorker/rejectWorker/getWorkerApplyList/adminGetWorkerDetail` | 否 | 否 | 否 | 否 | 允许 | 否 | 管理员校验必需 |
| `merchant.applyMerchant/getMyMerchantInfo/getMerchantAuditStatus` | 否 | 本人 | 本人也可申请商家但需独立审核 | 本人 | 管理查看 | 否 | 商家身份独立于师傅身份 |
| `merchant.createMerchantService/enableMerchantService/disableMerchantService` | 否 | 否 | 否 | 仅本人商家 | 管理查看 | 否 | 商家不能操作其他商家的服务项目 |
| `merchant.getStoreList/getStoreDetail/getStoreServices` | 允许 | 允许 | 允许 | 允许 | 允许 | 否 | 仅展示审核通过且正常店铺 |
| `merchant.getMerchantOrder* / merchantAcceptOrder / merchantStartService / merchantFinishService` | 否 | 否 | 否 | 仅本人商家订单 | 管理查看 | 否 | 商家不能冒充个人师傅操作订单 |
| `merchant.admin*` | 否 | 否 | 否 | 否 | 允许 | 否 | 审核、启停、查看日志 |
| `review.createReview/addReviewFollowup/getOrderReview` | 否 | 仅本人订单 | 相关订单只读/回复 | 相关商家订单待补强 | 管理查看 | 订单完成触发 | 用户只能评价自己的订单 |
| `review.workerReplyReview/workerCreateReviewAppeal` | 否 | 否 | 仅相关师傅评价 | 商家评价能力待补强 | 管理审核 | 否 | 当前主要面向师傅 |
| `review.admin*` | 否 | 否 | 否 | 否 | 允许 | 否 | 隐藏/恢复/申诉审核需日志 |
| `message.*` | 否 | 仅本人消息 | 仅本人消息 | 仅本人消息 | 仅本人或管理消息待核实 | 系统写入 | 用户只能访问自己的消息 |
| `payment.createPayment/queryPaymentStatus` | 否 | 仅本人订单 | 作为用户仅本人订单 | 作为用户仅本人订单 | 不建议代付 | 否 | 重复支付必须拦截，当前 mock 无真实资金 |
| `payment.handlePayNotify` | 否 | 否 | 否 | 否 | 否 | 支付回调 | 真实模式必须验签，当前未接真实支付 |
| `refund.createAfterSale/getUserAfterSaleList/getAfterSaleDetail/getRefundLogs` | 否 | 仅本人订单/售后 | 相关订单待核实 | 相关商家订单待核实 | 允许查看 | 否 | 用户不能申请他人订单退款 |
| `refund.adminGetAfterSaleList/adminReviewAfterSale/mockRefund` | 否 | 否 | 否 | 否 | 允许 | 财务回冲 | 重复退款必须拦截，当前为模拟退款 |
| `finance.getWorkerIncomeSummary/getWorkerEarningList` | 否 | 否 | 仅本人收益 | 商家收益兼容待核实 | 允许查看 | 否 | 收益集合历史命名为 worker |
| `finance.generateOrderFinance/reverseOrderFinance` | 否 | 否 | 否 | 否 | 不建议手动 | 允许 | 幂等，防重复生成/回冲 |
| `finance.admin* / mockUnlockSettlement` | 否 | 否 | 否 | 否 | 允许 | 否 | mock 解冻无真实提现 |
| `promotion.getMemberPlans/getReceivableCoupons` | 允许 | 允许 | 允许 | 允许 | 允许 | 否 | 只读可领信息 |
| `promotion.mockOpenMembership/receiveCoupon/getMyCoupons` | 否 | 仅本人 | 仅本人 | 仅本人 | 不建议代操作 | 否 | mock 会员无真实支付 |
| `promotion.lock/use/release/calculateOrderPromotion` | 否 | 本人订单流程 | 本人订单流程 | 本人订单流程 | 否 | 订单内部 | 优惠金额不能由前端决定 |
| `promotion.admin*` | 否 | 否 | 否 | 否 | 允许 | 否 | 模板和会员方案配置 |
| `area.getServiceAreaList` | 允许 | 允许 | 允许 | 允许 | 允许 | 否 | 公开可用区域 |
| `area.admin*` | 否 | 否 | 否 | 否 | 允许 | 否 | 服务区域配置 |
| `dispatch.*` | 否 | 否 | 否 | 否 | 允许 | 否 | 管理员指派、取消、日志 |
| `tip.createMockTip/getUserTipList/getTipDetail` | 否 | 仅本人订单/打赏 | 相关收益可见 | 商家打赏待核实 | 查看 | 财务写入 | mock 打赏无真实扣款 |
| `tip.getWorkerTipList/adminGetTipLogs` | 否 | 否 | 仅本人收益 | 商家待核实 | 允许 | 否 | 打赏收益归属校验 |

## 必须保持的硬边界

- 用户只能访问自己的订单、地址、评价、售后、优惠券和消息。
- 师傅只能访问自己可接、已接或相关订单；不得操作商家订单。
- 商家只能访问自己的店铺、服务项目和商家订单；不得操作其他商家资源。
- 管理员接口必须有 `requireAdmin` 或等价校验。
- 支付、退款、财务接口必须有归属校验、状态校验和幂等拦截。
- mock 支付、mock 退款、mock 打赏、mock 解冻不能被误认为真实资金流。
- 重复支付、重复退款、重复财务生成、重复核销必须被拦截。

## 当前风险记录

- P1：`worker_earnings` 对商家收益的兼容仍基于历史命名，权限说明和页面展示后续需要专门迁移。
- P1：真实支付回调验签未接入，当前 `payment.handlePayNotify` 不能作为生产真实资金入口。
- P1：商家评价、商家打赏收益的精细权限仍待后续商家体验增强阶段补齐。
- P2：`requireOpenid`、`requireAdmin` 仍在多个云函数重复定义，本阶段未强行抽取，避免改变语义。
- P2：部分管理员“代操作”边界依赖业务流程约束，后续 PC 后台阶段应拆菜单权限和数据权限。
