# 阶段 24B-3：管理员端财务 / 商家 / 资质 / 保证金 / 风控 / 用户管理页面 UI 收口

## 阶段名称

阶段 24B-3：管理员端财务 / 商家 / 资质 / 保证金 / 风控 / 用户管理页面 UI 收口。

## 本轮目标

1. 使用既有 `miniprogram/styles/admin-theme.wxss` 作为管理员端视觉基线。
2. 收口管理员端财务、商家、资质、保证金、风控和用户管理相关 10 个二级页面。
3. 统一页面壳、顶部标题区、浅灰背景、白色圆角卡片、状态标签、筛选条、列表卡片、详情信息分组、财务说明卡、审核操作卡和高风险边界说明。
4. 补齐 loading、empty、error、submitting 状态。
5. 保留现有 service 调用、按钮行为、状态流转、权限判断、页面跳转和接口参数语义，不修改业务逻辑。
6. 强化 mock、内部模拟、人工审核、资料留档边界，避免误导为真实资金、真实认证或真实风控能力。
7. 新增阶段结构保护测试，防止后续破坏管理员端高风险边界页面的 UI 与文案。

## 本轮页面清单

- `miniprogram/pages/admin/finance-log-list/finance-log-list`
- `miniprogram/pages/admin/worker-earning-list/worker-earning-list`
- `miniprogram/pages/admin/order-finance-detail/order-finance-detail`
- `miniprogram/pages/admin/tip-log-list/tip-log-list`
- `miniprogram/pages/admin/merchant-list/merchant-list`
- `miniprogram/pages/admin/merchant-detail/merchant-detail`
- `miniprogram/pages/admin/qualification-review/qualification-review`
- `miniprogram/pages/admin/deposit-review/deposit-review`
- `miniprogram/pages/admin/risk-control/risk-control`
- `miniprogram/pages/admin/user-list/user-list`

## 修改范围

- 修改本轮 10 个页面的 `.js`、`.wxml`、`.wxss`，以及必要页面组件声明。
- 新增 `tests/phase24b3_admin_finance_merchant_risk_ui.test.js`。
- 新增本阶段文档并同步 `docs/PHASE_CURRENT.md`、`docs/PROJECT_STATUS.md`、`docs/dev-records/index.md` 和 `docs/ui-refactor-guardrails.md`。

## 未修改的业务逻辑

- 不修改云函数。
- 不修改 `cloudfunctions/**`。
- 不修改 `miniprogram/services/**`。
- 不修改 `schema/**`。
- 不修改 `miniprogram/config/status.js`、`miniprogram/config/constants.js` 或 `miniprogram/utils/request.js`。
- 不修改订单状态机。
- 不修改支付状态、退款状态、售后状态、财务状态、收益状态、保证金状态、资质状态或风控状态。
- 不修改管理员权限模型。
- 不修改数据库字段语义。
- 不修改云函数 action 名称或返回结构。
- 不让前端直接决定财务结算、收益提现、商家审核、资质审核、保证金退还、风控处置或用户角色状态。

## mock / 真实能力边界

| 能力 | 当前边界 |
| ---- | -------- |
| 财务流水 | 内部模拟流水，无真实清算、分账、提现或真实对账能力 |
| 服务方收益 | 只读展示既有收益记录，历史命名兼容师傅收益，无真实提现 |
| 订单财务详情 | 只读展示订单财务快照、流水、收益和回冲记录，不在前端生成或回冲财务 |
| 打赏记录 | mock 打赏和内部模拟流水，无真实打赏支付、分账或提现 |
| 商家管理 | 人工审核和启停操作仍以后端为准，不新增多门店、员工排班、商家分账或连锁商家 |
| 资质审核 | 资料留档和人工审核，不接入真实身份证认证、营业执照认证、OCR 或保险核验 |
| 保证金审核 | mock 保证金，不产生真实扣款、真实退款、真实冻结或真实保证金支付 |
| 风控 | 内部模拟风控和人工设置，不代表真实合规审核、自动风控、AI 裁决或自动处罚 |
| 用户管理 | 只读展示角色和账号状态，禁用操作走后端权限校验，不新增角色或权限模型 |

## 财务 / 商家 / 资质 / 保证金 / 风控 / 用户管理能力边界

- 财务页面只展示后端返回的内部模拟记录，金额展示沿用既有单位转换规则。
- 商家页面只做人工审核和经营状态操作入口，前端不直接决定商家经营状态。
- 资质页面只做资料留档和人工审核说明，不承诺真实认证能力。
- 保证金页面只做 mock 保证金审核说明，不触发真实资金能力。
- 风控页面只做内部模拟风险等级人工设置，不做自动处罚或 AI 裁决。
- 用户管理页面不新增权限模型，不把前端按钮隐藏作为权限控制。

## 测试 RED / GREEN 记录

RED：

- 新增 `tests/phase24b3_admin_finance_merchant_risk_ui.test.js` 后，首次运行 10 个测试中 3 个通过、7 个失败。
- 失败点符合预期：阶段文档不存在、旧页面未导入管理员主题、旧结构仍使用 `page-shell/page/panel`、缺少边界卡、筛选区、error 状态、submitting 状态和高风险边界说明。

阶段性 GREEN：

- 页面结构改造后再次运行，10 个测试中 9 个通过、1 个失败。
- 剩余失败点为本阶段文档尚未创建。

最终 GREEN：

- `node --test tests/phase24b3_admin_finance_merchant_risk_ui.test.js`：10/10 通过。
- `node --test tests/phase24b2_admin_service_area_dispatch_ui.test.js`：9/9 通过。
- `node --test tests/phase24b_admin_secondary_ui.test.js`：7/7 通过。
- `node --test tests/phase23a_admin_primary_ui.test.js`：13/13 通过。
- `npm test`：324/324 通过。
- `npm run check:shared-sync`：通过，`cloudfunctions/_shared` 与各云函数 `_shared` 副本一致。
- `npm run check:cloudfunction-deps`：通过，云函数 `wx-server-sdk` 版本一致。
- `git diff --check`：通过。

## 遗留问题

- 本轮未做微信开发者工具真机视觉验收。
- 本轮高风险页面仍基于既有后端能力展示，不新增真实资金、真实认证、真实风控或权限模型能力。
- 资质、保证金、风控页面仍存在阶段 20 的 mock 文案与 reason 参数，本轮仅统一 UI 和边界说明。

## 下一批建议

阶段 24B-4 可考虑管理员端会员 / 优惠券 / 营销配置页面 UI 收口，或者进入管理员端二级页面真机视觉抽查与全量验收阶段。

若进入真实支付、退款、提现、分账、认证、保证金或风控阶段，必须另起独立高风险阶段，不得在 UI 收口任务中顺手接入。
