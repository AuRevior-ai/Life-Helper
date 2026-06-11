# 阶段 24F：管理员端会员 / 优惠券 / 营销配置页面 UI 收口

## 阶段基本信息

- 阶段：阶段 24F
- 日期：2026-06-11
- 范围：管理员端会员方案、优惠券模板列表、优惠券模板编辑页面 UI 收口
- 状态：已完成基础收口并验收

## 本阶段目标

1. 收口管理员端会员方案管理页面 UI。
2. 收口管理员端优惠券模板列表页面 UI。
3. 收口管理员端优惠券模板编辑页面 UI。
4. 补齐空状态、加载状态、错误状态、操作反馈和按钮层级。
5. 保持 mock 会员、mock 优惠券、mock 支付边界清晰。

## 本阶段完成内容

- 会员方案页迁移到管理员二级页统一结构。
- 优惠券模板列表页迁移到管理员二级页统一结构。
- 优惠券模板编辑页补齐表单状态、错误提示、提交态和主次按钮。
- 优惠券模板列表页复用既有启用 / 停用 action，并补齐 toast 反馈。
- 编辑页从列表页缓存带入模板数据，不新增后端详情 action。
- 三页均补齐 mock / 真实能力边界说明。

## 修改文件

- `miniprogram/pages/admin/member-plan-list/*`
- `miniprogram/pages/admin/coupon-template-list/*`
- `miniprogram/pages/admin/coupon-template-edit/*`
- `tests/phase24f_admin_marketing_ui.test.js`
- `docs/PHASE_CURRENT.md`
- `docs/PROJECT_STATUS.md`
- `docs/dev-records/index.md`
- `docs/dev-records/24f-admin-marketing-ui.md`

## 未修改范围

- 不修改云函数。
- 不修改 `miniprogram/services/*`。
- 不修改 schema。
- 不修改订单、支付、退款、财务、收益、会员或优惠券状态机语义。
- 不新增真实支付、真实退款、提现、分账、真实会员扣款或真实营销结算。

## mock / 真实能力边界

当前仍为 mock MVP：

- mock 会员：会员开通仍为模拟能力，无真实会员扣款。
- mock 优惠券：模板、领券、锁券、核销仍用于 mock 营销闭环。
- mock 支付：订单支付仍为模拟支付，无真实扣款。
- 内部模拟财务流水：无真实清算、无真实提现、无真实分账。

明确未接入：

- 未接入真实支付。
- 未接入真实退款。
- 未接入提现。
- 未接入分账。
- 未接入真实认证。
- 未接入 OCR。
- 未接入真实风控。
- 未接入真实营销结算。

## 接口与权限

- 保留既有 promotion action 名称。
- 会员方案页继续使用 `adminGetMemberPlans`。
- 优惠券模板列表页继续使用 `adminGetCouponTemplates`、`adminEnableCouponTemplate`、`adminDisableCouponTemplate`。
- 优惠券模板编辑页继续使用 `adminCreateCouponTemplate`、`adminUpdateCouponTemplate`。
- 不新增不存在的后端能力。

## 测试记录

本阶段新增结构保护测试：

```bash
node --test tests/phase24f_admin_marketing_ui.test.js
```

验收结果：

- `node --test tests/phase24f_admin_marketing_ui.test.js`：8/8 通过
- `npm test`：349/349 通过
- `git diff --check`：通过

## 已知问题与下一步

- 本阶段不做 clean candidate 交付包整理。
- 后续可进入 clean candidate 交付包整理，并运行 release-risk 扫描。
- 或继续进行管理员端剩余运营配置页面真机视觉抽查。

## 阶段结论

阶段 24F 完成管理员端会员 / 优惠券 / 营销配置页面 UI 收口基础版；页面状态、操作反馈和 mock / 真实能力边界已补齐，未修改云函数、service、schema 或状态机。
