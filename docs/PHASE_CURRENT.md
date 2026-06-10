# PHASE_CURRENT.md

本文件记录当前正在执行或刚完成的工程阶段。它只描述当前阶段事实，不替代长期协作规则；长期规则见 `AGENT.MD`。

## 当前维护阶段（2026-06-10）

阶段 24D：剩余高增长列表分页治理续收口。

本轮由用户指令开启，优先于下方阶段 24B-3 UI checkpoint 的“本阶段不改云函数”限制。阶段 24C 已完成第一批工程收口；本轮只允许继续低风险维护剩余高增长列表：派单日志、消息、售后、商家订单/操作日志、评价列表和打赏列表从全量读取后内存分页改为仓库侧分页查询。

本轮已明确禁止接入真实支付、真实退款、提现、分账、真实认证、OCR、真实保证金支付、真实风控、自动审核或 AI 裁决；不修改订单状态机、支付状态、退款状态、售后状态、财务状态、保证金状态、资质状态或风控状态；不修改页面 UI。

本轮改动保持 action 名称和既有返回别名语义：列表仍返回 `logs`、`messages`、`afterSales`、`orders`、`reviews`、`tips`，同时补齐或保持 `list/total/page/pageSize/hasMore` 分页字段。

本轮验收命令：

```bash
node --test tests/phase24d.high-growth-pagination.test.js
npm test
npm run check:shared-sync
npm run check:cloudfunction-deps
git diff --check
```

本轮不生成公开交付候选目录；如后续需要交付，必须重新生成 clean candidate 并运行：

```bash
npm run check:release-risk -- <candidate-dir>
```

本轮最终验收结果：

- `node --test tests/phase24d.high-growth-pagination.test.js`：6/6 通过。
- `npm test`：336/336 通过。
- `npm run check:shared-sync`：通过。
- `npm run check:cloudfunction-deps`：通过。
- `git diff --check`：通过。

## 阶段名称

阶段 24D：剩余高增长列表分页治理续收口

## 阶段状态

阶段 24A：全端 UI 统一性体检与设计规范收口已完成，已沉淀 `docs/ui-style-guide.md`、`docs/ui-refactor-guardrails.md` 和 `tests/phase24a_ui_consistency_audit.test.js`。24A 不开发新业务，不接入真实支付、退款、提现、分账、真实认证、OCR、保证金支付或真实风控，并明确下一阶段适合进入管理员端二级页面 UI 收口。

阶段 23A checkpoint：阶段 23A：管理员端一级导航与五个一级页面 UI 复刻已完成，未修改云函数、services、schema、订单状态机或真实资金/认证/风控能力。

阶段 23B checkpoint：阶段 23B：商家端一级页面 UI 统一已完成、已验收、已提交并推送。

阶段 24B-1 checkpoint：阶段 24B-1：管理员端订单 / 审核 / 售后 / 评价治理二级页面 UI 收口已完成。

阶段 24B-2 checkpoint：阶段 24B-2：管理员端服务 / 分类 / 区域 / 派单页面 UI 收口已完成。

阶段 24B-3 已完成管理员端财务、商家、资质、保证金、风控和用户管理相关二级页 UI 收口。阶段 24C 已完成管理员禁用保护、管理员/财务/风控分页治理和兼容权限测试。本轮阶段 24D 已完成剩余重点高增长列表分页治理，不修改页面 UI。

当前产品策略明确为继续使用 mock 支付，不考虑接入真实支付现金流。真实微信支付、真实退款、提现、分账和真实现金流不是本阶段目标，也不应在当前工程评价中被列为 P0 阻塞项。

## 本阶段目标

1. 将 `dispatch.getDispatchLogs` 改为仓库侧分页，并保留缺集合兼容返回。
2. 将 `message.getMessageList` 改为仓库侧分页，并保留 `messages` 别名和 `unread_count`。
3. 将用户/管理员售后列表、商家订单/操作日志、评价列表、打赏列表改为仓库侧分页。
4. 为每个改造 action 增加 `queryPage` 路径测试，旧 `findAll/findBy*` 在测试中抛错。
5. 保持 pageSize 最大 50，不改变 action 名称和既有返回别名。
6. 不修改 UI、services、状态机、真实资金/认证/风控能力。

## 历史阶段 24B-3 页面清单

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

## 历史阶段 24B-3 允许

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

## 阶段 24B-3 已完成内容

- 10 个页面已迁移到 `admin-page`、`admin-header`、`admin-section-card`、`admin-status-card` 和 `admin-action-card` 结构。
- 财务、保证金、资质、风控页面已补充 `admin-boundary-card` 能力边界说明。
- 列表页已补齐筛选区、加载态、错误态、空状态和列表卡片。
- 详情页已按“基础信息 / 状态信息 / 操作记录 / 管理操作 / 边界说明”分组。
- 页面保留原 service 调用，未出现页面内 `wx.cloud.callFunction`。

## mock/真实能力边界

本节延续既有 mock/真实能力边界 表述，避免旧阶段结构保护测试和后续 Agent 对当前边界产生误读。

工程评价口径：在当前 mock 支付策略下，真实支付、真实退款、提现、分账未接入属于范围外能力，不属于当前 P0。只有 mock 被包装成真实能力、支付/退款/财务状态可被前端伪造，或阶段目标明确进入真实资金接入时，才按 P0 或高风险问题处理。

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
node --test tests/phase24d.high-growth-pagination.test.js
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

阶段 24D 最终验收结果：

- `node --test tests/phase24d.high-growth-pagination.test.js`：6/6 通过。
- `npm test`：336/336 通过。
- `npm run check:shared-sync`：通过。
- `npm run check:cloudfunction-deps`：通过。
- `git diff --check`：通过。

## 回滚与降级策略

- 本阶段不改状态枚举、schema 或真实资金/认证/风控能力，因此无需数据迁移回滚。
- 如某个列表接口出现分页兼容异常，可优先回滚对应 handler 的 `queryPage` 调用和仓库 `queryPage` 方法，恢复上一提交后再做专项修复。
- 如页面文案被误解为真实支付、真实退款、真实提现、真实分账、真实认证、自动风控、自动审核或 AI 裁决，应立即回退为 mock、内部模拟、人工处理、资料留档或只读展示表述。

## 下一阶段建议

下一阶段可继续治理 `order.getUserOrderList`、`order.getWorkerOrderList`、`qualification.adminListQualifications`、`qualification.adminListDeposits` 的数据库侧分页，或进入管理员端会员 / 优惠券 / 营销配置页面 UI 收口。

若进入真实支付、退款、提现、分账、认证、保证金或风控阶段，必须另起独立高风险阶段，不得在 UI 收口任务中顺手接入。
