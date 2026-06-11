# PHASE_CURRENT.md

本文件记录当前正在执行或刚完成的工程阶段。它只描述当前阶段事实，不替代长期协作规则；长期规则见 `AGENT.MD`。

## 当前维护阶段（2026-06-11）

阶段 24F：管理员端会员 / 优惠券 / 营销配置页面 UI 收口。

阶段 26 已由人工完成真实环境基础验证：云函数已上传成功，开发者工具 / 真机体验未发现明显 bug，真实云环境基础验证通过。当前暂不做 clean candidate 交付包整理。

本阶段只收口管理员端会员方案、优惠券模板列表、优惠券模板编辑页面 UI，不修改云函数、service、schema 或状态机，不接入真实支付、真实退款、提现、分账、真实会员扣款或真实营销结算。

## 阶段状态

阶段 24F 已完成基础收口。

已处理：

- 会员方案管理页统一为管理员二级页结构。
- 优惠券模板列表页统一为管理员二级页结构。
- 优惠券模板编辑页补齐表单、错误提示、提交态和按钮层级。
- 列表页复用既有优惠券启用 / 停用 action，并补齐操作反馈。
- 三页补齐加载、错误、空状态和 mock / 真实能力边界说明。

## 历史 UI checkpoint 摘要

以下为已完成 checkpoint，保留在当前阶段文档中用于维护阶段交接与结构保护测试：

- 阶段 23B：商家端一级页面 UI 统一。该阶段不修改云函数，不修改 services，保留 mock/真实能力边界。
- 阶段 24A：全端 UI 统一性体检与设计规范收口。该阶段不开发新业务，不接入真实支付、退款、提现、分账、真实认证、OCR、保证金支付或真实风控，下一阶段适合进入管理员端二级页面 UI 收口。
- 阶段 24B-1：管理员端订单 / 审核 / 售后 / 评价治理二级页面 UI 收口。该阶段不修改云函数、不修改 `miniprogram/services/*`、不修改 schema、不修改订单状态机。
- 阶段 26：真实环境基础验证已完成，云函数上传成功，真实云环境基础验证通过。

维护验证命令继续保留：

```bash
npm run check:cloudfunction-deps
```

## mock / 真实能力边界

当前仍为 mock MVP 能力边界：

| 能力 | 当前状态 |
| ---- | -------- |
| 支付 | mock 支付，真实微信支付未接入 |
| 退款 | mock 退款，真实微信退款未接入 |
| 会员 | mock 会员，真实会员扣款未接入 |
| 优惠券 | mock 优惠券，真实营销结算未接入 |
| 保证金 | mock 保证金，真实保证金支付 / 退款未接入 |
| 资质认证 | mock 资质认证 / 人工审核，无真实认证或 OCR |
| 财务流水 | 内部模拟财务流水，无真实清算、提现或分账 |
| 风控 | 内部模拟 / 人工设置，无真实风控系统 |

明确未接入：

- 真实支付。
- 真实退款。
- 提现。
- 分账。
- 真实会员扣款。
- 真实营销结算。
- 真实认证。
- OCR。
- 真实风控。

## 本轮修改范围

允许并已使用的范围：

- `miniprogram/pages/admin/member-plan-list/**`
- `miniprogram/pages/admin/coupon-template-list/**`
- `miniprogram/pages/admin/coupon-template-edit/**`
- `tests/phase24f_admin_marketing_ui.test.js`
- `docs/dev-records/24f-admin-marketing-ui.md`
- `docs/PROJECT_STATUS.md`
- `docs/PHASE_CURRENT.md`
- `docs/dev-records/index.md`

未修改：

- 云函数业务逻辑。
- `miniprogram/services/**`。
- `schema/**`。
- 订单、支付、退款、财务、收益、会员、优惠券状态机语义。
- 已通过验证的用户端、师傅端、商家端核心流程。

## 验收记录

本阶段新增结构保护测试：

```bash
node --test tests/phase24f_admin_marketing_ui.test.js
```

完整验收需运行：

```bash
npm test
git diff --check
```

## 下一步建议

下一步建议进入 clean candidate 交付包整理，或继续做管理员端剩余运营配置页面真机视觉抽查。

若未来进入真实支付、真实退款、提现、分账、真实认证、OCR 或真实风控阶段，必须另起独立高风险阶段，不得在普通维护或 UI 收口任务中顺手接入。
