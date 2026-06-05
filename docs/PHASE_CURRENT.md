# PHASE_CURRENT.md

本文件记录当前正在执行或刚完成的工程阶段。它只描述当前阶段事实，不替代长期协作规则；长期规则见 `AGENT.MD`。

## 阶段名称

阶段 24B-3：管理员端财务 / 商家 / 资质 / 保证金 / 风控 / 用户管理页面 UI 收口

## 阶段状态

阶段 24A：全端 UI 统一性体检与设计规范收口已完成，已沉淀 `docs/ui-style-guide.md`、`docs/ui-refactor-guardrails.md` 和 `tests/phase24a_ui_consistency_audit.test.js`。24A 不开发新业务，不接入真实支付、退款、提现、分账、真实认证、OCR、保证金支付或真实风控，并明确下一阶段适合进入管理员端二级页面 UI 收口。

阶段 23A checkpoint：阶段 23A：管理员端一级导航与五个一级页面 UI 复刻已完成，未修改云函数、services、schema、订单状态机或真实资金/认证/风控能力。

阶段 23B checkpoint：阶段 23B：商家端一级页面 UI 统一已完成、已验收、已提交并推送。

阶段 24B-1 checkpoint：阶段 24B-1：管理员端订单 / 审核 / 售后 / 评价治理二级页面 UI 收口已完成。

阶段 24B-2 checkpoint：阶段 24B-2：管理员端服务 / 分类 / 区域 / 派单页面 UI 收口已完成。

本轮进入阶段 24B-3，只收口管理员端财务、商家、资质、保证金、风控和用户管理相关二级页。不一次性重构全部管理员二级页面。

## 本阶段目标

1. 使用既有 `miniprogram/styles/admin-theme.wxss` 作为管理员端视觉基线。
2. 收口 10 个管理员端二级页面：财务流水、服务方收益、订单财务详情、打赏记录、商家列表、商家详情、资质审核、保证金审核、入驻风控、用户管理。
3. 统一页面壳、顶部标题区、浅灰背景、白色圆角卡片、状态标签、筛选条、列表卡片、详情信息分组、财务说明卡、商家信息卡、审核操作卡、风控边界说明和用户管理操作区。
4. 补齐 loading、empty、error、submitting 状态。
5. 保留现有服务调用、按钮行为、状态流转、权限判断、页面跳转和接口参数语义。
6. 强化页面文案中的 mock、内部模拟、人工审核和资料留档边界，避免误导为真实资金、真实认证或真实风控能力。
7. 新增阶段结构保护测试，防止后续 Agent 破坏管理员端高风险边界页面的 UI 与文案。
8. 新增阶段文档并同步当前状态文档。

## 本阶段页面清单

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

## 本阶段允许

- 修改本阶段 10 个页面的 `.js`、`.wxml`、`.wxss`、必要组件声明。
- 新增 `tests/phase24b3_admin_finance_merchant_risk_ui.test.js`。
- 新增 `docs/dev-records/24b3-admin-finance-merchant-risk-ui.md`。
- 更新 `docs/PHASE_CURRENT.md`、`docs/PROJECT_STATUS.md`、`docs/dev-records/index.md`。
- 必要时仅补充 `docs/ui-refactor-guardrails.md` 中与管理员端财务、商家、资质、保证金、风控、用户管理页面相关的 UI 规则。

## 本阶段禁止

- 不修改云函数。
- 不修改 `cloudfunctions/**`。
- 不修改 services。
- 不修改 `miniprogram/services/**`。
- 不修改 schema。
- 不修改 `schema/**`。
- 不修改 `miniprogram/config/status.js`。
- 不修改 `miniprogram/config/constants.js`。
- 不修改 `miniprogram/utils/request.js`。
- 不修改订单状态机。
- 不修改支付状态、退款状态、售后状态、财务状态、收益状态、保证金状态、资质状态、风控状态。
- 不修改管理员权限模型。
- 不修改数据库字段语义。
- 不修改云函数 action 名称或返回结构。
- 不删除已有页面、已有测试或做全仓无关格式化。
- 不新增真实支付、真实退款、提现、分账、真实对账、真实认证、OCR、真实保证金支付或真实风控。
- 不新增多门店、连锁商家、商家员工排班、真实商家分账或合伙人结算。
- 不新增自动风控、AI 裁决、自动处罚或自动审核。
- 不把 mock、内部模拟、手动配置、人工审核、资料留档或已有财务流水展示包装成真实上线能力。

## 已完成内容

- 10 个页面已迁移到 `admin-page`、`admin-header`、`admin-section-card`、`admin-status-card` 和 `admin-action-card` 结构。
- 财务、保证金、资质、风控页面已补充 `admin-boundary-card` 能力边界说明。
- 列表页已补齐筛选区、加载态、错误态、空状态和列表卡片。
- 详情页已按“基础信息 / 状态信息 / 操作记录 / 管理操作 / 边界说明”分组。
- 页面保留原 service 调用，未出现页面内 `wx.cloud.callFunction`。

## mock/真实能力边界

本节延续既有 mock/真实能力边界 表述，避免旧阶段结构保护测试和后续 Agent 对当前边界产生误读。

| 能力 | 当前状态 |
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

## 验收命令

```bash
node --test tests/phase24b3_admin_finance_merchant_risk_ui.test.js
node --test tests/phase24b2_admin_service_area_dispatch_ui.test.js
node --test tests/phase24b_admin_secondary_ui.test.js
node --test tests/phase23a_admin_primary_ui.test.js
npm test
npm run check:shared-sync
npm run check:cloudfunction-deps
git diff --check
```

如本阶段涉及交付包、发布清单、敏感文件或 clean candidate，再额外运行：

```bash
npm run check:release-risk -- <candidate-dir>
```

## 最近一次验收结果

阶段 24B-3 最终验收结果：

- `node --test tests/phase24b3_admin_finance_merchant_risk_ui.test.js`：10/10 通过。
- `node --test tests/phase24b2_admin_service_area_dispatch_ui.test.js`：9/9 通过。
- `node --test tests/phase24b_admin_secondary_ui.test.js`：7/7 通过。
- `node --test tests/phase23a_admin_primary_ui.test.js`：13/13 通过。
- `npm test`：324/324 通过。
- `npm run check:shared-sync`：通过。
- `npm run check:cloudfunction-deps`：通过。
- `git diff --check`：通过。

## 回滚与降级策略

- 本阶段不改云函数、services、schema、状态枚举或数据库结构，因此无需数据迁移回滚。
- 如某个管理员二级页出现视觉或交互异常，可优先回滚对应页面的 WXML/WXSS/展示字段改动。
- 如页面文案被误解为真实支付、真实退款、真实提现、真实分账、真实认证、自动风控、自动审核或 AI 裁决，应立即回退为 mock、内部模拟、人工处理、资料留档或只读展示表述。

## 下一阶段建议

阶段 24B-4 可考虑管理员端会员 / 优惠券 / 营销配置页面 UI 收口，或者进入管理员端二级页面真机视觉抽查与全量验收阶段。

若进入真实支付、退款、提现、分账、认证、保证金或风控阶段，必须另起独立高风险阶段，不得在 UI 收口任务中顺手接入。
