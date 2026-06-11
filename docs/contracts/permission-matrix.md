# 权限矩阵

本文件记录多角色 action 权限边界。后续新增 action、状态流转、集合字段、list 接口或资金相关能力必须同步本矩阵。当前角色包括游客、普通用户、师傅、商家、管理员和系统内部调用。新增 action 还必须同步 `docs/contracts/api-actions.manifest.json`；新增 list action 还必须同步 `docs/contracts/pagination-and-indexes.md`。

## 角色定义

| 角色         | 说明                                 | 身份来源                                                        |
| ------------ | ------------------------------------ | --------------------------------------------------------------- |
| 游客         | 未登录或仅浏览公开内容               | 无 openid 或未完成登录                                          |
| 普通用户     | 下单、地址、评价、售后、优惠券、消息 | `users.openid`                                                  |
| 师傅         | 已入驻并审核通过的个人服务方         | `workers.user_id` + `audit_status=approved`                     |
| 商家         | 已审核通过且正常的商家门店           | `merchants.user_id` + `audit_status=approved` + `status=normal` |
| 管理员       | 平台管理人员                         | `users.role=admin` 且未禁用                                     |
| 系统内部调用 | 云函数之间的内部流程                 | 受云函数代码路径和 env 注入约束                                 |

## 权限矩阵

| 模块/action                                                                                         | 游客 | 普通用户        | 师傅                         | 商家                               | 管理员                 | 系统内部     | 关键边界                                       |
| --------------------------------------------------------------------------------------------------- | ---- | --------------- | ---------------------------- | ---------------------------------- | ---------------------- | ------------ | ---------------------------------------------- |
| `login`                                                                                             | 允许 | 允许            | 允许                         | 允许                               | 允许                   | 否           | 只创建/返回当前 openid 用户                    |
| `service.getCategoryList/getServiceList/getServiceDetail`                                           | 允许 | 允许            | 允许                         | 允许                               | 允许                   | 否           | 只读公开服务                                   |
| `service.*` 管理 action                                                                             | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 服务删除需保护已有订单                         |
| `address.*`                                                                                         | 否   | 仅本人          | 仅本人                       | 仅本人                             | 不建议代操作           | 否           | 用户只能访问自己的地址                         |
| `order.createOrder`                                                                                 | 否   | 允许            | 允许作为用户                 | 允许作为用户                       | 不建议                 | 否           | 金额以后端计算，前端不得决定实付               |
| `order.getUserOrderList/getOrderDetail/cancelOrder`                                                 | 否   | 仅本人订单      | 仅本人用户订单或相关订单     | 仅本人用户订单或相关商家订单       | 允许查看               | 否           | 必须校验 `user_id`、`worker_id`、`merchant_id` |
| `order.acceptOrder/startService/finishService`                                                      | 否   | 否              | 仅相关师傅订单               | 否                                 | 不建议代操作           | 否           | 师傅不能操作商家订单                           |
| `worker.applyWorker/getWorkerInfo/getAuditStatus/updateWorker*`                                     | 否   | 本人            | 本人                         | 可作为普通用户申请但不代表商家权限 | 管理查看               | 否           | 师傅状态不能由前端伪造                         |
| `worker.approveWorker/rejectWorker/getWorkerApplyList/adminGetWorkerDetail`                         | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 管理员校验必需                                 |
| `merchant.applyMerchant/getMyMerchantInfo/getMerchantAuditStatus`                                   | 否   | 本人            | 本人也可申请商家但需独立审核 | 本人                               | 管理查看               | 否           | 商家身份独立于师傅身份                         |
| `merchant.createMerchantService/enableMerchantService/disableMerchantService`                       | 否   | 否              | 否                           | 仅本人商家                         | 管理查看               | 否           | 商家不能操作其他商家的服务项目                 |
| `merchant.getStoreList/getStoreDetail/getStoreServices`                                             | 允许 | 允许            | 允许                         | 允许                               | 允许                   | 否           | 仅展示审核通过且正常店铺                       |
| `merchant.getMerchantOrder* / merchantAcceptOrder / merchantStartService / merchantFinishService`   | 否   | 否              | 否                           | 仅本人商家订单                     | 管理查看               | 否           | 商家不能冒充个人师傅操作订单                   |
| `merchant.admin*`                                                                                   | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 审核、启停、查看日志                           |
| `qualification.getMyQualification/saveQualificationDraft/submitQualification/resubmitQualification` | 否   | 本人商家/服务方 | 本人服务方待扩展             | 仅本人商家                         | 管理查看               | 否           | 不保存真实完整身份证号、营业执照号或保单号     |
| `qualification.getMyDeposit/mockPayDeposit/applyDepositRefund`                                      | 否   | 本人商家/服务方 | 本人服务方待扩展             | 仅本人商家                         | 管理查看               | 否           | 模拟保证金，不产生真实扣款、退款或分账         |
| `qualification.getMyRiskStatus/getOnboardingStatus`                                                 | 否   | 本人简要状态    | 本人简要状态待扩展           | 仅本人简要状态                     | 允许查看详情           | 否           | 商家端不展示内部风控标签和管理员备注           |
| `qualification.adminListQualifications/adminGetQualificationDetail/adminReviewQualification`        | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 管理员审核资质并写操作日志                     |
| `qualification.adminListDeposits/adminFreezeDeposit/adminReviewDepositRefund`                       | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 管理员处理 mock 保证金，不接真实退款           |
| `qualification.adminSetRiskLevel/adminAddRiskTag/adminListRiskRecords/adminGetOnboardingDetail/adminSetOnboardingLimit` | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 管理员手动 mock 风控和人工经营限制，不接真实风控模型 |
| `review.createReview/addReviewFollowup/getOrderReview`                                              | 否   | 仅本人订单      | 相关订单只读/回复            | 相关商家订单待补强                 | 管理查看               | 订单完成触发 | 用户只能评价自己的订单                         |
| `review.workerReplyReview/workerCreateReviewAppeal`                                                 | 否   | 否              | 仅相关师傅评价               | 不允许走师傅专用入口               | 管理审核               | 否           | 商家评价回复/申诉需后续独立设计                |
| `review.admin*`                                                                                     | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 隐藏/恢复/申诉审核需日志                       |
| `message.*`                                                                                         | 否   | 仅本人消息      | 仅本人消息                   | 仅本人消息                         | 仅本人或管理消息待核实 | 系统写入     | 用户只能访问自己的消息                         |
| `payment.createPayment/queryPaymentStatus`                                                          | 否   | 仅本人订单      | 作为用户仅本人订单           | 作为用户仅本人订单                 | 不建议代付             | 否           | `createPayment` 为真实预支付入口且默认未启用；当前 mock 支付无真实资金 |
| `payment.handlePayNotify`                                                                           | 否   | 否              | 否                           | 否                                 | 否                     | 支付回调     | 真实模式必须验签，当前未接真实支付             |
| `refund.createAfterSale/getUserAfterSaleList/getAfterSaleDetail/getRefundLogs`                      | 否   | 仅本人订单/售后 | 相关订单待核实               | 相关商家订单待核实                 | 允许查看               | 否           | 用户不能申请他人订单退款                       |
| `refund.adminGetAfterSaleList/adminReviewAfterSale/mockRefund`                                      | 否   | 否              | 否                           | 否                                 | 允许                   | 财务回冲     | 重复退款必须拦截，当前为模拟退款               |
| `finance.getWorkerIncomeSummary/getWorkerEarningList`                                               | 否   | 否              | 仅本人收益                   | 不通过旧 worker 入口暴露           | 允许查看               | 否           | `worker_earnings` 兼容商家数据但不迁移集合名   |
| `finance.generateOrderFinance/reverseOrderFinance`                                                  | 否   | 否              | 否                           | 否                                 | 不建议手动             | 允许         | 幂等，防重复生成/回冲                          |
| `finance.admin* / mockUnlockSettlement`                                                             | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | mock 解冻无真实提现                            |
| `promotion.getMemberPlans/getReceivableCoupons`                                                     | 允许 | 允许            | 允许                         | 允许                               | 允许                   | 否           | 只读可领信息                                   |
| `promotion.mockOpenMembership/receiveCoupon/getMyCoupons`                                           | 否   | 仅本人          | 仅本人                       | 仅本人                             | 不建议代操作           | 否           | mock 会员无真实支付                            |
| `promotion.lock/use/release/calculateOrderPromotion`                                                | 否   | 本人订单流程    | 本人订单流程                 | 本人订单流程                       | 否                     | 订单内部     | 优惠金额不能由前端决定                         |
| `promotion.admin*`                                                                                  | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 模板和会员方案配置                             |
| `area.getServiceAreaList`                                                                           | 允许 | 允许            | 允许                         | 允许                               | 允许                   | 否           | 公开可用区域                                   |
| `area.admin*`                                                                                       | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 服务区域配置                                   |
| `dispatch.*`                                                                                        | 否   | 否              | 否                           | 否                                 | 允许                   | 否           | 管理员指派、取消、日志                         |
| `tip.createMockTip/getUserTipList/getTipDetail`                                                     | 否   | 仅本人订单/打赏 | 相关收益可见                 | 不通过旧 worker 详情入口暴露       | 查看                   | 财务写入     | mock 打赏无真实扣款                            |
| `tip.getWorkerTipList/adminGetTipLogs`                                                              | 否   | 否              | 仅本人收益                   | 不通过旧 worker 列表入口暴露       | 允许                   | 否           | 商家打赏收益需后续独立入口                     |

## 必须保持的硬边界

- 用户只能访问自己的订单、地址、评价、售后、优惠券和消息。
- 师傅只能访问自己可接、已接或相关订单；不得操作商家订单。
- 商家只能访问自己的店铺、服务项目和商家订单；不得操作其他商家资源。
- 管理员接口必须有 `requireAdmin` 或等价校验。
- 管理员禁用用户必须禁止禁用当前管理员自己，也必须禁止禁用最后一个正常管理员。
- 支付、退款、财务接口必须有归属校验、状态校验和幂等拦截。
- mock 支付、mock 退款、mock 打赏、mock 解冻不能被误认为真实资金流。
- mock 保证金、mock 资质认证、mock 保险信息和 mock 入驻风控不能被误认为真实支付、真实退款、真实身份认证、真实营业执照认证、真实 OCR 或真实保险核验。
- `qualification.adminSetOnboardingLimit` 仅保留为管理员人工设置 mock 入驻经营限制的后端 action，不代表自动风控、真实合规风控或处罚系统。
- 重复支付、重复退款、重复财务生成、重复核销必须被拦截。
- 当前工程明确只使用 mock 支付，不考虑接入真实支付现金流；真实支付、真实退款、提现、分账未接入不得作为当前工程 P0 阻塞项。只有真实资金阶段启动、mock 被误包装成真实能力、状态可被伪造或敏感配置泄露时，才按 P0 / 高风险问题处理。

## 当前风险记录

- P1：`worker_earnings` 对商家收益的兼容仍基于历史命名，本轮仅补充“不通过旧 worker 收益入口暴露”的权限测试，集合迁移需独立阶段处理。
- 条件阶段：真实支付回调验签未接入，当前 `payment.handlePayNotify` 不能作为生产真实资金入口；该项仅在真实支付阶段作为专项验收，不阻塞当前 mock MVP。
- P1：商家评价、商家打赏收益的精细权限仍待后续商家体验增强阶段补齐；本轮仅补充旧 worker action 不暴露商家兼容数据的测试。
- P2：`requireOpenid`、`requireAdmin` 仍在多个云函数重复定义，本阶段未强行抽取，避免改变语义。
- P2：部分管理员“代操作”边界依赖业务流程约束，后续 PC 后台阶段应拆菜单权限和数据权限。
