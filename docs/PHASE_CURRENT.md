# PHASE_CURRENT.md

本文件记录当前正在执行或刚完成的工程阶段。它只描述当前阶段事实，不替代长期协作规则；长期规则见 `AGENT.MD`。

## 当前维护阶段（2026-06-11）

阶段 24E 后交付契约收口：修复公开仓库测试边界、schema 与真实写入字段、API action 契约、分页治理文档和支付 mock/真实语义。

上一轮阶段 24E 已完成阶段 24C / 24D 后剩余四个列表接口的分页治理：

- `order.getUserOrderList`
- `order.getWorkerOrderList`
- `qualification.adminListQualifications`
- `qualification.adminListDeposits`

本轮已明确禁止接入真实支付、真实退款、提现、分账、真实认证、OCR、真实保证金支付、真实风控、自动审核或 AI 裁决；不修改订单状态机、支付状态、退款状态、售后状态、财务状态、收益状态、保证金状态、资质状态或风控状态；不修改页面 UI 或 `miniprogram/pages/**`。允许小范围修改 tests、docs/contracts、schema，以及补齐 `adminSetOnboardingLimit` 必需的 `miniprogram/services/qualification.service.js` action 出口。

本轮改动保持 action 名称和既有返回别名语义：订单列表继续返回 `orders`，资质列表继续返回 `qualifications`，保证金列表继续返回 `deposits`，同时补齐或保持 `list/total/page/pageSize/hasMore` 分页字段。

本轮验收命令：

```bash
node --test tests/phase20.risk.test.js
node --test tests/phase20.contracts.test.js
node --test tests/phase24e.order-qualification-pagination.test.js
npm test
npm run check:shared-sync
npm run check:cloudfunction-deps
git diff --check
```

本轮不生成公开交付候选目录；如后续意外涉及交付包、发布清单、敏感文件或 clean candidate，必须额外运行：

```bash
npm run check:release-risk -- <candidate-dir>
```

本轮最终验收状态：已完成并验收通过。

## 阶段名称

阶段 24E：剩余订单 / 资质 / 保证金列表分页治理

## 阶段状态

阶段 24E 已完成并验收。当前已按 TDD 写入 `tests/phase24e.order-qualification-pagination.test.js`，并将四个目标列表接口改为仓库侧 `queryPage`。

阶段 24A：全端 UI 统一性体检与设计规范收口已完成，已沉淀 `docs/ui-style-guide.md`、`docs/ui-refactor-guardrails.md` 和 `tests/phase24a_ui_consistency_audit.test.js`。24A 不开发新业务，不接入真实支付、退款、提现、分账、真实认证、OCR、保证金支付或真实风控，并明确下一阶段适合进入管理员端二级页面 UI 收口。

阶段 23A checkpoint：阶段 23A：管理员端一级导航与五个一级页面 UI 复刻已完成，未修改云函数、services、schema、订单状态机或真实资金/认证/风控能力。

阶段 23B checkpoint：阶段 23B：商家端一级页面 UI 统一已完成、已验收、已提交并推送；该阶段不修改云函数、不修改 services。

阶段 24B-1 checkpoint：阶段 24B-1：管理员端订单 / 审核 / 售后 / 评价治理二级页面 UI 收口已完成。

阶段 24B-2 checkpoint：阶段 24B-2：管理员端服务 / 分类 / 区域 / 派单页面 UI 收口已完成。

阶段 24B-3 checkpoint：阶段 24B-3 已完成管理员端财务、商家、资质、保证金、风控和用户管理相关二级页 UI 收口。阶段 24C 已完成管理员禁用保护、管理员/财务/风控分页治理和兼容权限测试。阶段 24D 已完成剩余重点高增长列表分页治理，不修改页面 UI。

当前产品策略明确为继续使用 mock 支付，不考虑接入真实支付现金流。真实微信支付、真实退款、提现、分账和真实现金流不是本阶段目标，也不应在当前工程评价中被列为 P0 阻塞项。

## 本阶段目标

1. 将 `order.getUserOrderList` 改为 `orders.queryPage(filters, pageInfo)`。
2. 将 `order.getWorkerOrderList` 改为 `orders.queryPage(filters, pageInfo)`。
3. 将 `qualification.adminListQualifications` 改为 `qualifications.queryPage(filters, pageInfo)`。
4. 将 `qualification.adminListDeposits` 改为 `deposits.queryPage(filters, pageInfo)`。
5. 保持 page 最小为 1，pageSize 最大为 50，缺省 pageSize 使用既有 20。
6. 保留旧返回别名，并补齐 `list/total/page/pageSize/hasMore`。
7. 保持用户订单、师傅订单、管理员资质列表、管理员保证金列表的既有权限与归属边界。
8. 分页治理阶段不修改 UI、services、schema、状态机、真实资金/认证/风控能力；2026-06-11 契约收口仅允许同步 tests、docs/contracts、schema 和 qualification service action 出口，不改变业务状态机。

## 本阶段允许

- 修改 `cloudfunctions/order/**`。
- 修改 `cloudfunctions/qualification/**`。
- 必要时修改 `cloudfunctions/_shared/**`。
- 新增或修改 `tests/**` 中与本阶段相关的测试和测试 helper。
- 2026-06-11 契约收口可修改 `schema/**`、`docs/contracts/**`、`README.md`、`docs/PROJECT_STATUS.md`，并补齐 `miniprogram/services/qualification.service.js` 中已有后端 action 的前端 service 出口。
- 新增 `docs/dev-records/24e-order-qualification-pagination.md`。
- 更新 `docs/PHASE_CURRENT.md`、`docs/PROJECT_STATUS.md`、`docs/dev-records/index.md`。

## 本阶段禁止

- 不修改页面 UI。
- 不修改 `miniprogram/pages/**`。
- 不在 `miniprogram/services/**` 中新增不存在的后端能力；仅允许补齐已存在 action 的 service 出口。
- 不改变 schema 字段语义；仅允许让 schema 与当前真实持久化字段对齐。
- 不修改订单状态机。
- 不修改支付状态、退款状态、售后状态、财务状态、收益状态、保证金状态、资质状态或风控状态语义。
- 不修改云函数 action 名称。
- 不删除旧返回别名。
- 不接入真实支付、真实退款、提现、分账、真实认证、OCR、真实保证金支付、真实风控或 AI。
- 不做全仓格式化或无关重构。

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
node --test tests/phase24e.order-qualification-pagination.test.js
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

阶段 24E 最终验收结果：

- `node --test tests/phase24e.order-qualification-pagination.test.js`：4/4 通过。
- `npm test`：340/340 通过。
- `npm run check:shared-sync`：通过。
- `npm run check:cloudfunction-deps`：通过。
- `git diff --check`：通过。

2026-06-11 交付契约收口验收结果：

- `node --test tests/phase19_5.engineering-governance.test.js`：8/8 通过。
- `node --test tests/phase20.contracts.test.js`：1/1 通过。
- `node --test tests/phase20.risk.test.js`：3/3 通过。
- `node --test tests/phase24e.order-qualification-pagination.test.js`：4/4 通过。
- `npm test`：341/341 通过。
- `npm run check:shared-sync`：通过。
- `npm run check:cloudfunction-deps`：通过。
- `git diff --check`：通过。

## 回滚与降级策略

- 本阶段不改状态枚举或真实资金/认证/风控能力；schema 仅做契约描述对齐，不做数据迁移，因此无需数据迁移回滚。
- 如某个列表接口出现分页兼容异常，可优先回滚对应 handler 的 `queryPage` 调用和仓库 `queryPage` 方法，恢复上一提交后再做专项修复。
- 如页面文案被误解为真实支付、真实退款、真实提现、真实分账、真实认证、自动风控、自动审核或 AI 裁决，应立即回退为 mock、内部模拟、人工处理、资料留档或只读展示表述。

## 下一阶段建议

下一阶段建议进入阶段 26 试运营前真机与云端部署验证，或阶段 24F 管理员端会员 / 优惠券 / 营销配置页面 UI 收口。

若进入真实支付、退款、提现、分账、认证、保证金或风控阶段，必须另起独立高风险阶段，不得在普通维护或 UI 收口任务中顺手接入。
