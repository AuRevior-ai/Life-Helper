# API Action 清单

本文件按云函数整理当前实际存在的 action。后续新增、改名或废弃 action 必须同步本文件、权限矩阵、相关测试和阶段复盘。不得发明不存在的 action，也不得把 mock 能力描述成真实生产能力。

说明：测试覆盖以当前 `tests/*.test.js` 为准，标注“已覆盖”表示至少有阶段测试覆盖主流程；“待补强”表示需要更细粒度契约或权限测试。

## Action 总览

| 云函数 | actions | 调用端 | 权限要求 | 涉及支付/退款/财务/消息 | mock 能力 | 测试覆盖 |
|---|---|---|---|---|---|---|
| `login` | 无 action，直接登录 | 用户端 | 微信 openid | 否 | 否 | 已覆盖 |
| `user` | `getCurrentUser`, `updateUserInfo`, `updateUserRole`, `disableUser`, `claimInitialAdmin` | 用户端/管理员端 | 当前用户；管理员；初始化受环境变量保护 | 否 | 否 | 已覆盖 |
| `service` | `getCategoryList`, `getServiceList`, `getServiceDetail`, `seedServiceData`, `createCategory`, `updateCategory`, `deleteCategory`, `createService`, `updateService`, `updateServiceStatus`, `deleteService` | 用户端/管理员端 | 读公开；写需管理员 | 否 | 种子数据同步 | 已覆盖 |
| `address` | `getAddressList`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress` | 用户端 | openid；只能操作本人地址 | 否 | 否 | 已覆盖 |
| `order` | `createOrder`, `mockPayOrder`, `getUserOrderList`, `getWorkerOrderList`, `getOrderDetail`, `cancelOrder`, `acceptOrder`, `startService`, `finishService`, `getWorkerIncomeStats` | 用户端/师傅端 | 用户订单归属；师傅身份；订单状态机 | 支付、财务、消息 | `mockPayOrder` | 已覆盖 |
| `worker` | `applyWorker`, `getWorkerInfo`, `getAuditStatus`, `getWorkerApplyList`, `approveWorker`, `rejectWorker`, `getOrderHallList`, `getWorkerDetail`, `adminGetWorkerDetail`, `updateWorkerOnlineStatus`, `updateWorkerServiceAreas` | 师傅端/管理员端/用户端 | 本人师傅；管理员审核；公开详情 | 消息 | 否 | 已覆盖 |
| `review` | `createReview`, `getOrderReview`, `getReviewDetail`, `addReviewFollowup`, `workerReplyReview`, `workerCreateReviewAppeal`, `adminHideReview`, `adminRestoreReview`, `adminReviewAppeal`, `adminGetReviewList`, `adminGetReviewDetail`, `adminGetReviewAppealList`, `adminGetReviewAppealDetail`, `getWorkerReviewList`, `getWorkerReviews` | 用户端/师傅端/管理员端 | 订单归属、师傅归属、管理员 | 财务、消息 | 否 | 已覆盖 |
| `admin` | `getDashboard`, `getAllUsers`, `disableUser`, `getAllOrders`, `getOrderDetail`, `adminUpdateOrderStatus`, `getOrderStats`, `getServiceStats` | 管理员端 | 管理员 | 消息/订单状态 | 否 | 已覆盖 |
| `message` | `getMessageList`, `markMessageRead`, `markAllMessagesRead`, `getUnreadCount` | 用户端/师傅端/管理员端 | 本人消息归属 | 消息 | 否 | 已覆盖 |
| `payment` | `createPayment`, `handlePayNotify`, `queryPaymentStatus` | 用户端/支付回调 | 订单归属；回调验签待真实接入 | 支付、消息、日志 | mock 支付 | 已覆盖 |
| `refund` | `createAfterSale`, `getUserAfterSaleList`, `getAfterSaleDetail`, `adminGetAfterSaleList`, `adminReviewAfterSale`, `mockRefund`, `getRefundLogs` | 用户端/管理员端 | 用户订单归属；管理员审核 | 退款、财务、消息 | mock 退款 | 已覆盖 |
| `area` | `getServiceAreaList`, `adminCreateServiceArea`, `adminUpdateServiceArea`, `adminEnableServiceArea`, `adminDisableServiceArea` | 用户端/管理员端 | 读公开；写需管理员 | 否 | 否 | 已覆盖 |
| `dispatch` | `getAssignableWorkers`, `adminAssignOrder`, `adminUnassignOrder`, `getDispatchLogs` | 管理员端 | 管理员 | 消息、派单日志 | 否 | 已覆盖 |
| `finance` | `generateOrderFinance`, `reverseOrderFinance`, `getWorkerIncomeSummary`, `getWorkerEarningList`, `adminGetFinanceLogs`, `adminGetWorkerEarnings`, `adminGetOrderFinanceDetail`, `mockUnlockSettlement` | 系统内部/师傅端/管理员端 | 内部调用、本人收益、管理员 | 财务、退款回冲 | mock 解冻 | 已覆盖 |
| `promotion` | `getMemberPlans`, `mockOpenMembership`, `getMyMembership`, `adminGetMemberPlans`, `adminUpdateMemberPlan`, `adminCreateCouponTemplate`, `adminUpdateCouponTemplate`, `adminGetCouponTemplates`, `adminEnableCouponTemplate`, `adminDisableCouponTemplate`, `getReceivableCoupons`, `receiveCoupon`, `getMyCoupons`, `getAvailableCouponsForOrder`, `calculateOrderPromotion`, `lockCouponForOrder`, `useCouponForOrder`, `releaseCouponForOrder` | 用户端/管理员端/订单内部 | 用户本人；管理员；订单内部 | 支付金额计算 | mock 会员 | 已覆盖 |
| `tip` | `createMockTip`, `getUserTipList`, `getWorkerTipList`, `adminGetTipLogs`, `getTipDetail` | 用户端/师傅端/管理员端 | 订单归属、收益归属、管理员 | 财务、消息 | mock 打赏 | 已覆盖 |
| `merchant` | `applyMerchant`, `getMyMerchantInfo`, `getMerchantAuditStatus`, `createMerchantService`, `getMerchantServiceList`, `enableMerchantService`, `disableMerchantService`, `getStoreList`, `getStoreDetail`, `getStoreServices`, `getMerchantOrderList`, `getMerchantOrderDetail`, `merchantAcceptOrder`, `merchantStartService`, `merchantFinishService`, `adminGetMerchantList`, `adminGetMerchantDetail`, `adminApproveMerchant`, `adminRejectMerchant`, `adminEnableMerchant`, `adminDisableMerchant`, `adminGetMerchantOrders`, `adminGetMerchantActionLogs` | 商家端/用户端/管理员端 | 商家本人、公开店铺、管理员 | 财务、消息、商家日志 | 否 | 已覆盖 |

## 关键 action 说明

### 订单与支付

- `order.createOrder`：用户端创建订单。入参包括服务、地址、预约、服务方选择和营销信息；出参为订单。状态变化为创建 `pending_pay/unpaid`。涉及消息和优惠券锁定，测试已覆盖主流程。
- `order.mockPayOrder`：订单模块早期模拟支付能力。只推进业务状态，无真实扣款。后续更推荐使用 `payment.createPayment` 的 mock 模式，但不能删除旧 action。
- `payment.createPayment`：创建支付请求；mock 模式下生成模拟支付结果。真实模式需商户号、APIv3 密钥、证书、JSAPI 权限和回调验签。
- `payment.handlePayNotify`：支付回调入口。当前 mock/测试环境验证业务流，真实验签待上线条件满足。
- `payment.queryPaymentStatus`：用户只能查询自己的订单支付状态。

### 售后、退款与财务

- `refund.createAfterSale`：用户提交售后。必须校验订单归属和订单可售后状态。
- `refund.adminReviewAfterSale`：管理员审核售后，通过后可触发 mock 退款。
- `refund.mockRefund`：模拟退款，不代表微信退款成功。
- `finance.generateOrderFinance`：订单完成后生成财务流水和服务方收益，需幂等。
- `finance.reverseOrderFinance`：退款回冲财务流水和收益。
- `finance.mockUnlockSettlement`：管理员 mock 解冻收益，无真实提现。

### 商家与服务方

- `merchant.applyMerchant`：商家提交入驻资料，当前是业务流程验证版，不包含真实营业执照认证、资质认证和保证金。
- `merchant.adminApproveMerchant`/`adminRejectMerchant`：管理员审核并同步 `service_providers`。
- `merchant.createMerchantService`、`enableMerchantService`、`disableMerchantService`：商家只能管理自己的服务项目。
- `merchant.merchantAcceptOrder`、`merchantStartService`、`merchantFinishService`：商家只能操作归属自己的商家订单，不能冒充个人师傅。

### 评价、打赏与消息

- `review.createReview`：用户评价完成后推进订单闭环并触发财务生成。
- `review.workerReplyReview`、`workerCreateReviewAppeal`：师傅侧操作需校验订单/评价归属。
- `tip.createMockTip`：仅模拟打赏，生成 `tip_logs`、`finance_logs` 和 `worker_earnings`，无真实扣款。
- `message.*`：所有读取和标记已读必须限制在当前 openid 的消息范围。

## 命名问题记录

- `worker_earnings` 已兼容商家收益，但集合名仍沿用 worker 历史命名，后续迁移需单独阶段处理。
- `mockPayOrder` 与 `payment.createPayment` 都能表达支付推进，当前为历史兼容并存，不在阶段 19.5 合并。
- `getWorkerReviews` 与 `getWorkerReviewList` 语义接近，当前保持不变，只记录为后续治理点。
