# 阶段 17：会员与优惠券基础版

## 1. 阶段基本信息

- 阶段编号：17
- 阶段名称：会员与优惠券基础版
- 完成时间：2026-06-01
- 阶段状态：已完成基础版
- 当前版本：mock 营销能力，不接真实会员支付

## 2. 本阶段目标

阶段 16 已经补齐财务流水和师傅收益基础，因此阶段 17 开始补齐影响订单实付金额的基础营销能力。目标是在不破坏下单、支付、退款、财务闭环的前提下，支持会员折扣、优惠券领取、下单抵扣、优惠券锁定与核销。

## 3. 本阶段完成内容

- [x] 新增会员方案模型。
- [x] 新增用户会员状态。
- [x] 支持模拟开通 / 续期会员。
- [x] 新增优惠券模板。
- [x] 支持用户领取优惠券。
- [x] 支持下单时后端计算会员优惠和优惠券优惠。
- [x] 创建订单时锁定优惠券。
- [x] mock 支付成功后核销优惠券。
- [x] 取消未支付订单时释放优惠券。
- [x] 订单保存会员和优惠券快照。
- [x] 财务继续基于优惠后的 `pay_amount` 计算。
- [x] 新增用户端会员中心、我的优惠券、领券中心。
- [x] 新增管理员端会员方案与优惠券模板基础页面。
- [x] 修复真机下单对 `promotion` 云函数的强依赖：未选择优惠券时允许按原价创建订单，选择优惠券时仍要求优惠计算成功。
- [x] 修复未满足门槛的优惠券仍可被选择的问题。
- [x] 修复有效年卡被季卡覆盖的会员降级问题。

## 4. 新增文件

| 文件                                               | 作用                      |
| -------------------------------------------------- | ------------------------- |
| `cloudfunctions/promotion/handler.js`              | 会员、优惠券与促销 action |
| `cloudfunctions/promotion/promotion-calculator.js` | 后端金额计算              |
| `cloudfunctions/promotion/repositories.js`         | 云数据库仓储              |
| `cloudfunctions/promotion/index.js`                | 云函数入口                |
| `cloudfunctions/promotion/package.json`            | 云函数依赖                |
| `miniprogram/services/promotion.service.js`        | 前端 promotion 调用       |
| `miniprogram/pages/member/center/*`                | 用户会员中心              |
| `miniprogram/pages/coupon/list/*`                  | 我的优惠券                |
| `miniprogram/pages/coupon/receive/*`               | 领券中心                  |
| `miniprogram/pages/admin/member-plan-list/*`       | 管理员会员方案            |
| `miniprogram/pages/admin/coupon-template-list/*`   | 管理员优惠券模板          |
| `miniprogram/pages/admin/coupon-template-edit/*`   | 管理员优惠券编辑          |
| `tests/phase17.member-coupon.test.js`              | 阶段 17 自动化测试        |

## 5. 修改文件

| 文件                                  | 修改原因                                 |
| ------------------------------------- | ---------------------------------------- |
| `cloudfunctions/order/handler.js`     | 接入促销计算、优惠券锁定、核销与释放     |
| `cloudfunctions/order/index.js`       | 通过 `cloud.callFunction` 调用 promotion |
| `miniprogram/config/constants.js`     | 新增云函数与集合常量                     |
| `miniprogram/config/status.js`        | 新增会员与优惠券状态                     |
| `miniprogram/app.json`                | 注册新增页面                             |
| `miniprogram/pages/profile/*`         | 增加会员中心和我的优惠券入口             |
| `miniprogram/pages/order-submit/*`    | 展示优惠券选择和价格明细                 |
| `miniprogram/pages/order-detail/*`    | 展示订单营销快照                         |
| `miniprogram/pages/admin/dashboard/*` | 增加会员和优惠券管理入口                 |
| `README.md`                           | 更新阶段能力说明                         |
| `docs/dev-records/index.md`           | 更新阶段索引和遗留问题                   |

## 6. 数据库变化

新增集合：

- `member_plans`
- `user_memberships`
- `coupon_templates`
- `user_coupons`

订单新增营销字段：

- `original_amount`
- `member_discount_amount`
- `coupon_discount_amount`
- `total_discount_amount`
- `payable_amount`
- `promotion_source`
- `member_snapshot`
- `coupon_snapshot`

兼容规则：

- `price = original_amount`
- `pay_amount = payable_amount`

## 7. 云函数 / 接口变化

新增 `promotion` 云函数：

- `getMemberPlans`
- `mockOpenMembership`
- `getMyMembership`
- `adminGetMemberPlans`
- `adminUpdateMemberPlan`
- `adminCreateCouponTemplate`
- `adminUpdateCouponTemplate`
- `adminGetCouponTemplates`
- `adminEnableCouponTemplate`
- `adminDisableCouponTemplate`
- `getReceivableCoupons`
- `receiveCoupon`
- `getMyCoupons`
- `getAvailableCouponsForOrder`
- `calculateOrderPromotion`
- `lockCouponForOrder`
- `useCouponForOrder`
- `releaseCouponForOrder`

## 8. 核心会员流程说明

用户查看会员方案 → 模拟开通会员 → 下单时后端识别有效会员 → 计算会员优惠 → 订单保存会员快照。

## 9. 核心优惠券流程说明

管理员创建优惠券 → 用户领取优惠券 → 下单选择优惠券 → 创建订单时锁定优惠券 → 支付成功后核销优惠券 → 订单取消时释放优惠券。

## 10. 订单金额计算说明

服务原价 → 会员优惠 → 优惠券优惠 → 应付金额 → 财务模块基于应付金额生成收益。

满减券门槛按服务原价判断，抵扣金额作用于会员折扣后的金额。

未满足当前订单门槛或无法产生实际优惠的优惠券，不会出现在下单可选优惠券列表中；如果前端绕过列表直接提交该优惠券，后端返回 `COUPON_NOT_APPLICABLE`。

## 11. 关键技术决策

- 金额使用“分”，避免浮点元参与核心计算。
- 前端不能决定最终金额，最终金额以后端计算为准。
- 订单保存会员和优惠券快照，避免规则变化影响历史订单。
- 优惠券增加 `locked` 状态，防止创建订单后重复使用。
- 第一版不支持多张优惠券叠加，降低核销复杂度。
- 退款后优惠券默认不退回，避免退款套利。
- 本阶段不做真实会员支付和自动续费，继续使用 mock。
- 有效高等级会员不能被低等级会员覆盖；例如已开通年卡时，不能再用季卡把等级降为季卡。
- 未选择优惠券的普通下单不应因为营销云函数未上传或临时不可用而失败；但选择优惠券时必须完成后端优惠计算和锁券。

## 12. 安全与风控说明

- 用户只能使用自己的优惠券。
- 管理员接口必须校验管理员权限。
- 已使用优惠券不可重复使用。
- 已过期优惠券不可使用。
- 优惠金额不能超过订单金额。
- 促销规则变化不会影响历史订单。

## 13. 已知问题与遗留事项

- 当前会员为模拟开通。
- 当前不支持真实会员支付。
- 当前不支持自动续费。
- 当前不支持多张优惠券叠加。
- 当前不支持分享裂变领券。
- 当前退款后默认不退回优惠券。
- 当前不支持积分和储值卡。

## 14. 测试记录

新增测试：

- `tests/phase17.member-coupon.test.js`

覆盖会员方案、模拟开通、优惠券模板、领取限制、后端金额计算、优惠券锁定/核销/释放、订单快照、财务口径、页面与文档接线。

补充测试：

- 未满足满减门槛的优惠券不会出现在下单可选列表。
- 手动提交不满足门槛的优惠券会被后端拒绝。
- 有效年卡不能被季卡覆盖。
- 未选择优惠券时，即使 `promotion` 云函数不可用，订单仍可按原价创建。
- 已选择优惠券时，`promotion` 云函数不可用会返回明确错误且不创建订单。
- 订单云函数调用营销云函数时透传用户身份，并只允许云函数内部链路使用该兜底身份。
- 支付结果页展示 `pay_amount / payable_amount`，避免优惠订单显示原价。

实际执行结果：

```bash
npm test
```

结果：

- tests：120
- pass：120
- fail：0

## 15. 运行与验证方式

真机测试前新增集合：

- `member_plans`
- `user_memberships`
- `coupon_templates`
- `user_coupons`

重新上传云函数：

- `promotion`
- `order`

验证流程：

1. 管理员进入优惠券管理，创建 active 优惠券。
2. 用户进入领券中心领取优惠券。
3. 用户进入会员中心模拟开通会员。
4. 用户下单，选择优惠券。
5. 检查下单页展示服务原价、会员优惠、优惠券优惠、应付金额。
6. 创建订单后检查 `user_coupons.status = locked`。
7. mock 支付后检查 `user_coupons.status = used`。
8. 检查订单详情展示营销快照。
9. 完成订单和评价后检查财务金额按优惠后 `pay_amount` 计算。
10. 创建“满 100 减 20”优惠券后，用低于 100 元的服务下单，确认该券不出现在可选列表。
11. 先模拟开通年卡，再尝试开通季卡，确认页面提示失败且会员仍保持年卡。

本次 bug 修复后，真机环境建议重新上传云函数：

- `order`
- `promotion`

如果本地或真机暂未上传 `promotion`，未选择优惠券的普通下单会按原价继续可用；涉及会员折扣、优惠券选择、锁券和核销的流程仍必须上传 `promotion` 后测试。

## 16. 对下一阶段的影响

本阶段为会员日、邀请拉新、营销活动、分销规则和运营配置打下金额快照与核销基础。

## 17. 下一阶段开发计划

建议下一阶段进入：

- 阶段 18：评价、追评、打赏与差评申诉增强

原因：会员与优惠券完成后，用户运营闭环可以继续增强评价、打赏和口碑能力。

## 18. 本阶段复盘

做得好的地方：

- 促销计算独立到 promotion 域，订单只在关键边界调用。
- 订单金额和财务金额保持兼容。
- 优惠券锁定、核销、释放具备幂等保护。

不足的地方：

- 会员方案页面仍较基础。
- 优惠券编辑表单只覆盖基础字段。
- 真实支付和自动续费仍未接入。

## 19. 阶段结论

阶段 17 已完成会员与优惠券基础版。当前可以进入真机 mock 验证，但不能宣称支持真实会员支付、自动续费或复杂营销活动。
