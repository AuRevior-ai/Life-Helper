# 阶段 18：评价、追评、打赏与差评申诉增强

## 1. 阶段基本信息

- 阶段编号：18
- 阶段名称：评价、追评、打赏与差评申诉增强
- 开始时间：2026-06-01
- 完成时间：2026-06-01
- 阶段状态：已完成基础版
- 当前版本：mock 打赏与评价治理基础版，不接真实打赏支付

## 2. 本阶段目标

阶段 17 已经完成会员与优惠券，订单金额和财务口径开始更接近试运营状态。阶段 18 在不破坏订单、支付、售后、财务主链路的前提下，增强评价可信度和服务互动能力，补齐追评、师傅回复、差评申诉、管理员评价管理和模拟打赏闭环。

## 3. 本阶段完成内容

- [x] 扩展 `reviews` 评价字段。
- [x] 支持评价标签、图片和匿名评价。
- [x] 支持按评分生成 `rating_level`。
- [x] 支持用户追评。
- [x] 支持师傅回复评价。
- [x] 支持师傅对差评发起申诉。
- [x] 支持管理员隐藏和恢复评价。
- [x] 支持管理员处理差评申诉。
- [x] 新增评价操作日志。
- [x] 新增模拟打赏云函数。
- [x] 新增 `tip_logs` 打赏记录。
- [x] 打赏成功后生成财务流水和师傅打赏收益。
- [x] 新增用户端、师傅端、管理员端基础页面入口。
- [x] 新增阶段 18 自动化测试。

## 4. 新增文件

| 文件 | 作用 |
|---|---|
| `cloudfunctions/review/appeal-repository.js` | 差评申诉仓储 |
| `cloudfunctions/review/review-log-repository.js` | 评价操作日志仓储 |
| `cloudfunctions/review/user-repository.js` | 管理员权限校验用户仓储 |
| `cloudfunctions/tip/handler.js` | 模拟打赏核心逻辑 |
| `cloudfunctions/tip/index.js` | tip 云函数入口 |
| `cloudfunctions/tip/repositories.js` | 打赏、财务、收益仓储 |
| `cloudfunctions/tip/package.json` | tip 云函数依赖 |
| `miniprogram/services/tip.service.js` | 前端打赏服务 |
| `miniprogram/pages/review/detail/*` | 用户评价详情 |
| `miniprogram/pages/review/followup/*` | 用户追评 |
| `miniprogram/pages/tip/create/*` | 用户模拟打赏 |
| `miniprogram/pages/worker/review-list/*` | 师傅评价列表 |
| `miniprogram/pages/worker/review-detail/*` | 师傅评价详情、回复和申诉 |
| `miniprogram/pages/worker/tip-list/*` | 师傅打赏记录 |
| `miniprogram/pages/admin/review-list/*` | 管理员评价列表 |
| `miniprogram/pages/admin/review-detail/*` | 管理员评价详情与隐藏恢复 |
| `miniprogram/pages/admin/review-appeal-list/*` | 管理员申诉列表 |
| `miniprogram/pages/admin/review-appeal-detail/*` | 管理员申诉处理 |
| `miniprogram/pages/admin/tip-log-list/*` | 管理员打赏记录 |
| `tests/phase18.review-tip-appeal.test.js` | 阶段 18 自动化测试 |

## 5. 修改文件

| 文件 | 修改原因 |
|---|---|
| `cloudfunctions/review/handler.js` | 扩展评价、追评、回复、申诉和管理员评价管理 action |
| `cloudfunctions/review/index.js` | 注入申诉、日志和用户仓储 |
| `cloudfunctions/review/review-repository.js` | 增加评价详情、全量列表和更新方法 |
| `miniprogram/config/constants.js` | 增加 tip 云函数和新增集合常量 |
| `miniprogram/config/status.js` | 增加评价、申诉、打赏、消息状态常量 |
| `miniprogram/services/review.service.js` | 增加阶段 18 review action |
| `miniprogram/app.json` | 注册阶段 18 页面 |
| `miniprogram/pages/order-detail/*` | 增加打赏师傅入口 |
| `miniprogram/pages/admin/dashboard/*` | 增加评价管理、差评申诉和打赏记录入口 |
| `README.md` | 更新当前阶段、能力说明和测试数量 |
| `docs/dev-records/index.md` | 更新阶段索引、P0 完成项和遗留问题 |

## 6. 数据库变化

`reviews` 扩展字段：

- `order_no`
- `rating_level`
- `tags`
- `images`
- `is_anonymous`
- `followup_content`
- `followup_images`
- `followup_at`
- `worker_reply_content`
- `worker_reply_at`
- `status`
- `hidden_reason`
- `hidden_by`
- `hidden_at`
- `appeal_status`
- `appeal_id`

新增集合：

- `review_appeals`
- `review_action_logs`
- `tip_logs`

`finance_logs` 扩展使用：

- `tip_id`
- `type = tip_platform_commission`
- `type = tip_worker_earning`
- `source = mock_tip`

`worker_earnings` 扩展使用：

- `earning_type = tip`
- `source_type = tip`
- `tip_id`

## 7. 云函数 / 接口变化

`review` 新增或扩展 action：

- `getReviewDetail`
- `addReviewFollowup`
- `workerReplyReview`
- `workerCreateReviewAppeal`
- `adminGetReviewList`
- `adminGetReviewDetail`
- `adminHideReview`
- `adminRestoreReview`
- `adminGetReviewAppealList`
- `adminGetReviewAppealDetail`
- `adminReviewAppeal`
- `getWorkerReviewList`

新增 `tip` 云函数 action：

- `createMockTip`
- `getUserTipList`
- `getWorkerTipList`
- `adminGetTipLogs`
- `getTipDetail`

## 8. 核心评价流程说明

用户评价
↓
师傅收到消息
↓
用户追评
↓
师傅回复
↓
管理员可管理评价

评价创建仍沿用原订单闭环：用户只能评价自己的 `pending_review` 订单；评价创建成功后，订单变为 `completed`，并触发阶段 16 的订单财务生成。

## 9. 差评申诉流程说明

用户差评
↓
师傅提交申诉
↓
管理员审核
↓
通过后隐藏评价 / 拒绝后保留评价
↓
记录评价操作日志

申诉只处理评价展示状态，不处理退款、售后或财务争议。

## 10. 模拟打赏流程说明

用户选择已完成订单
↓
选择打赏金额
↓
后端校验订单和金额
↓
生成 `tip_logs`
↓
生成财务流水
↓
生成师傅打赏收益
↓
通知师傅

本阶段限制一个订单只能模拟打赏一次，金额范围为 1 元到 200 元，金额单位为分。

## 11. 关键技术决策

- 评价隐藏不等于删除：隐藏只改变展示状态，保留历史记录和日志，便于复核。
- 差评申诉只处理评价展示：售后、退款和服务纠纷仍走售后流程，避免评价治理越权。
- 打赏使用模拟模式：当前无真实支付资质，不做真实打赏支付。
- 打赏不计入订单服务金额：避免影响订单售后、退款、服务收入和原订单分佣口径。
- 打赏收益与订单服务收益区分：`worker_earnings.earning_type = tip`，方便后续结算和报表。
- 打赏必须写财务流水：任何资金类动作都必须留痕，即使当前是 mock。
- 本阶段不接真实打赏支付：真实支付、退款、提现仍受商户资质限制。

## 12. 安全与风控说明

- 用户只能评价自己的订单。
- 一个订单只能创建一次主评价。
- 用户只能追评自己的评价，且只能追评一次。
- 师傅只能回复自己的评价。
- 师傅只能申诉自己的差评。
- 管理员才能隐藏评价、恢复评价和处理申诉。
- 管理员隐藏评价必须填写原因。
- 管理员处理申诉必须填写审核备注。
- 打赏金额以后端校验为准。
- 打赏记录不包含真实支付密钥。
- 评价操作必须写入 `review_action_logs`。

## 13. 已知问题与遗留事项

- 当前不支持真实打赏支付。
- 当前不支持打赏退款。
- 当前不支持 AI 内容审核。
- 当前不支持复杂内容风控。
- 当前不支持评价积分奖励。
- 当前不支持 PC 后台评价中心。
- 当前不支持自动差评处罚。
- 当前追评未限制 30 天窗口，后续可增加时间规则。
- 当前打赏限制为一个订单一次，后续可按运营规则扩展多次打赏。

## 14. 测试记录

新增测试：

- `tests/phase18.review-tip-appeal.test.js`

测试覆盖：

- 增强评价字段。
- 评价权限和重复评价。
- 评价标签、图片、匿名字段。
- `bad` 评分等级。
- 用户追评和重复追评拦截。
- 师傅回复和权限隔离。
- 师傅差评申诉。
- 好评不可申诉。
- 重复进行中申诉拦截。
- 管理员通过和拒绝申诉。
- 管理员隐藏和恢复评价。
- 普通用户不能隐藏评价。
- 模拟打赏。
- 他人订单、未完成订单、退款订单打赏拦截。
- `tip_logs`、`finance_logs`、`worker_earnings` 写入。
- 师傅打赏记录权限和管理员全量查看。
- 页面路由、常量、服务和文档接线。

实际执行结果：

```bash
npm test
```

结果：

- tests：128
- pass：128
- fail：0

## 15. 运行与验证方式

真机测试前新增集合：

- `review_appeals`
- `review_action_logs`
- `tip_logs`

重新上传云函数：

- `review`
- `tip`

验证流程：

1. 用户完成订单并提交评价，检查评价标签、图片、匿名字段。
2. 用户进入评价详情并追加评价。
3. 师傅进入评价列表，查看评价详情并回复。
4. 师傅对差评提交申诉。
5. 管理员进入评价管理，隐藏和恢复评价。
6. 管理员进入差评申诉，分别测试通过和拒绝。
7. 用户对已完成订单进行模拟打赏。
8. 检查 `tip_logs`、`finance_logs` 和 `worker_earnings` 是否生成对应记录。
9. 师傅查看打赏记录。
10. 管理员查看全量打赏记录。

## 16. 对下一阶段的影响

本阶段为商家信誉体系、服务排行、师傅评分、打赏收益、评价风控和后续 PC 后台评价中心打下基础。

## 17. 下一阶段开发计划

建议下一阶段进入：

- 阶段 19：商家端与店铺主页基础版

原因：评价、打赏和收益基础具备后，可以从个人师傅扩展到商家/店铺模型，为后续资质认证、保证金和服务商主页做准备。

## 18. 本阶段复盘

### 做得好的地方

- 评价增强没有破坏原有订单完成和财务生成逻辑。
- 打赏独立为 `tip` 云函数，避免污染订单和支付主流程。
- 差评申诉、隐藏评价和恢复评价都有日志记录。
- 打赏财务与订单服务收益区分，便于后续结算。

### 不足的地方

- 页面仍是基础版，偏验证和运营入口，不是最终精细 UI。
- 内容风控仍依赖管理员人工处理。
- 打赏退款和真实支付尚未实现。

### 后续改进建议

- 增加评价内容敏感词和图片审核。
- 增加评价统计和师傅评分聚合。
- 增加打赏退款和真实支付适配。
- 在 PC 后台建设更完整的评价治理台。

## 19. 阶段结论

阶段 18 已完成评价、追评、师傅回复、差评申诉、管理员评价管理和模拟打赏基础闭环。当前可以进入真机 mock 验证，但不能宣称支持真实打赏支付、真实分账、真实提现或自动内容风控。
