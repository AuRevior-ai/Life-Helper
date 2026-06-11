# PROJECT_STATUS.md

最后更新：2026-06-11

本文件记录当前工程的真实状态。长期 Agent 行为规则见 `AGENT.MD`；当前阶段执行边界见 `docs/PHASE_CURRENT.md`。

## 当前阶段

阶段名称：阶段 24E：剩余订单 / 资质 / 保证金列表分页治理

阶段状态：阶段 24C 已完成低风险工程收口，覆盖管理员禁用用户保护、管理员/财务/风控高增长列表分页治理和商家收益/评价/打赏兼容权限测试；阶段 24D 已完成派单日志、消息、售后、商家订单/操作日志、评价列表和打赏列表的仓库侧分页治理；阶段 24E 已完成剩余订单 / 资质 / 保证金列表分页治理，`order.getUserOrderList`、`order.getWorkerOrderList`、`qualification.adminListQualifications`、`qualification.adminListDeposits` 均改为仓库侧分页查询。不接入真实支付、真实退款、提现、分账、真实认证、OCR、真实保证金支付或真实风控，不改变订单、支付、退款、售后、财务、收益、保证金、资质或风控状态机。

阶段 24A：全端 UI 统一性体检与设计规范收口已完成，已更新 `docs/ui-style-guide.md` 与 `docs/ui-refactor-guardrails.md`，新增 UI 结构保护测试，并修复管理员/商家主题按钮圆角这类明显样式不一致。24A 不开发新业务，不接入真实支付、退款、提现、分账、真实认证、OCR、保证金支付或真实风控，并明确下一阶段适合进入管理员端二级页面 UI 收口。

阶段 23B checkpoint：商家端一级页面 UI 统一已完成、已验收、已提交并推送。

阶段 24B-1：管理员端订单 / 审核 / 售后 / 评价治理二级页面 UI 收口已完成，作为 checkpoint 保留。

阶段 24B-2：管理员端服务 / 分类 / 区域 / 派单页面 UI 收口已完成，作为 checkpoint 保留。

阶段 24E 分页治理本身不修改页面 UI、订单状态机、支付、退款、财务、收益、保证金、资质、风控状态语义或云函数 action 名称；列表接口保持既有返回别名，并补充分页字段。2026-06-11 交付契约收口允许小范围同步 tests、docs/contracts、schema 和 qualification service action 出口，用于修复公开仓库测试边界、schema 与真实持久化字段、`adminSetOnboardingLimit` 契约和支付 mock/真实语义，不接入真实支付或真实风控。当前产品策略明确为继续使用 mock 支付，不考虑接入真实支付现金流。

最近提交：

- `1b38af6`：feat: polish admin service area dispatch ui。
- `7e17aab`：feat: polish admin secondary ui。
- `8f4ad68`：feat: complete merchant secondary ui polish。
- `fa2b4a5`：docs: sync phase 23B handoff status。
- `364b240`：fix: use absolute merchant theme imports。

## 当前工程概况

这是“同城社区便民综合服务平台 MVP”，基于微信原生小程序 + 微信云开发。当前已覆盖普通用户、个人师傅、商家、管理员四类主要角色，核心 mock 闭环为：

```text
用户登录 -> 浏览服务 -> 地址/下单 -> mock 支付 -> 师傅/商家接单 -> 开始服务 -> 完成服务 -> 用户评价 -> 售后/退款 mock -> 管理员管理
```

阶段 22C3 已完成师傅端一级页面 UI 阶段性重构，阶段 22D 已完成师傅端次级页面 UI 收口。阶段 23A 已完成管理员端一级导航与五个一级页面 UI 复刻，并在后续复核中移除无真实接口支撑的运营趋势文案、扩展管理员系统边界说明。阶段 23B 已完成商家端一级导航与“我的 / 订单 / 服务 / 收益 / 入驻”五个低密度一级聚合页，并保留旧二级页面作为实际业务入口。阶段 23C 已完成商家端二级页面基础收口，覆盖商家入驻申请、服务编辑、订单详情、资质认证、保证金和风控状态六个页面。阶段 24A 已完成全端 UI 统一性体检、设计规范收口和管理员端二级页保护清单准备。阶段 24B-1 已完成管理员端订单、审核、售后、评价治理相关二级页 UI 收口。阶段 24B-2 已完成管理员端服务、分类、区域、派单相关二级页 UI 收口。阶段 24B-3 已完成管理员端财务、商家、资质、保证金、风控和用户管理相关二级页 UI 收口。阶段 24C 已完成第一批工程收口和分页治理，阶段 24D 已完成剩余重点高增长列表分页续收口，阶段 24E 已完成剩余订单 / 资质 / 保证金列表分页治理。

## 当前真实能力边界

当前工程的支付策略是：仅使用 mock 支付、mock 退款和内部模拟财务流水。真实微信支付、真实退款、提现、分账和真实现金流不是当前阶段目标，也不作为当前工程审批的 P0 阻塞项。后续 Agent 评价工程时，应重点检查 mock 边界是否清楚、状态是否以后端为准、支付/退款/财务状态是否不可被前端伪造；不得仅因未接入真实支付现金流而判定当前工程 P0。

| 能力 | 当前状态 |
| ---- | -------- |
| 支付 | mock 支付，真实微信支付未接入 |
| 支付回调 | `handlePayNotify` 仅用于测试业务结构；默认拒绝无验签 notify |
| 退款 | mock 退款，真实微信退款未接入 |
| 打赏 | mock 打赏，真实打赏支付未接入 |
| 会员 | mock 会员开通，真实会员支付未接入 |
| 保证金 | mock 保证金，真实支付/退款未接入 |
| 财务流水 | 内部模拟流水，无真实清算、分账或提现 |
| 资质认证 | mock/人工审核，无真实身份证认证、营业执照认证或 OCR |
| 保险 | mock/资料留档，无真实保险核验 |
| 风控 | 内部模拟/人工设置，无真实合规风控系统 |
| 地图/LBS | 基础地图选点和距离过滤，未接实时轨迹、路径规划、ETA 或自动派单 |

明确不存在：

- 真实扣款。
- 真实退款。
- 真实分账。
- 真实提现。
- 真实身份证认证。
- 真实营业执照认证。
- 真实 OCR。
- 真实保险核验。
- 真实保证金支付或退款。
- 真实合规风控。

`PAY_MODE=wechat` 仍是占位入口。真实微信支付上线前必须完成 JSAPI 下单、请求签名、前端支付参数签名、支付回调验签、退款、退款回调和对账。但在当前 mock 支付策略下，真实支付未接入只表示范围外能力，不表示当前 mock MVP 阻塞。

## 当前测试基线

阶段 23B 新增结构保护测试：

```bash
node --test tests/phase23b_merchant_primary_ui.test.js
```

初始 RED 结果：7 个测试按预期失败，失败点为商家端导航组件、共享样式、五个一级页和阶段文档尚未完成。

阶段 23C 新增并扩展结构保护测试：

```bash
node --test tests/phase23c_merchant_secondary_ui.test.js
```

RED 记录：第一批 6 个测试中 3 个通过、3 个按预期失败；第二批 7 个测试中 6 个通过、1 个按预期失败；第三批 8 个测试中 6 个通过、2 个按预期失败。最终 GREEN 结果：8/8 通过。

阶段 22D 最近验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `npm test` | 262/262 通过 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

阶段 23B 本轮定向验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase23a_admin_primary_ui.test.js` | 通过，13/13 |
| `node --test tests/phase23b_merchant_primary_ui.test.js` | 通过，8/8 |
| `npm test` | 通过，285/285 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮未涉及交付包、发布清单、敏感文件或 clean candidate，未运行 `npm run check:release-risk -- <candidate-dir>`。

阶段 23C 本轮验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase23c_merchant_secondary_ui.test.js` | 通过，8/8 |
| `node --test tests/phase23b_merchant_primary_ui.test.js` | 通过，8/8 |
| `npm test` | 通过，293/293 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不涉及交付包、发布清单、敏感文件或 clean candidate，未运行 `npm run check:release-risk -- <candidate-dir>`。

阶段 24A 本轮验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase24a_ui_consistency_audit.test.js` | 通过，5/5 |
| `npm test` | 通过，298/298 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不涉及交付包、发布清单、敏感文件或 clean candidate，默认不运行 `npm run check:release-risk -- <candidate-dir>`。

阶段 24B-1 本轮验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase24b_admin_secondary_ui.test.js` | 通过，7/7 |
| `node --test tests/phase23a_admin_primary_ui.test.js` | 通过，13/13 |
| `npm test` | 通过，305/305 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不涉及交付包、发布清单、敏感文件或 clean candidate，默认不运行 `npm run check:release-risk -- <candidate-dir>`。

阶段 24B-2 本轮验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase24b2_admin_service_area_dispatch_ui.test.js` | 通过，9/9 |
| `node --test tests/phase24b_admin_secondary_ui.test.js` | 通过，7/7 |
| `node --test tests/phase23a_admin_primary_ui.test.js` | 通过，13/13 |
| `npm test` | 通过，314/314 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不涉及交付包、发布清单、敏感文件或 clean candidate，默认不运行 `npm run check:release-risk -- <candidate-dir>`。

阶段 24B-3 本轮验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase24b3_admin_finance_merchant_risk_ui.test.js` | 通过，10/10 |
| `node --test tests/phase24b2_admin_service_area_dispatch_ui.test.js` | 通过，9/9 |
| `node --test tests/phase24b_admin_secondary_ui.test.js` | 通过，7/7 |
| `node --test tests/phase23a_admin_primary_ui.test.js` | 通过，13/13 |
| `npm test` | 通过，324/324 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不涉及交付包、发布清单、敏感文件或 clean candidate，默认不运行 `npm run check:release-risk -- <candidate-dir>`。

阶段 24C 本轮验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase7.admin.test.js` | 通过，9/9 |
| `node --test tests/phase16.finance-worker-earning.test.js` | 通过，10/10 |
| `node --test tests/phase18.review-tip-appeal.test.js` | 通过，9/9 |
| `node --test tests/phase20.risk.test.js` | 通过，2/2 |
| `npm test` | 通过，330/330 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过；仅提示既有 `AGENT.MD` 工作区换行转换 warning |

本轮不生成公开交付候选目录，未运行 `npm run check:release-risk -- <candidate-dir>`。如后续需要交付，必须重新生成 clean candidate 并运行发布风险扫描。

阶段 24D 本轮验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase24d.high-growth-pagination.test.js` | 通过，6/6 |
| `npm test` | 通过，336/336 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不生成公开交付候选目录，未运行 `npm run check:release-risk -- <candidate-dir>`。如后续需要交付，必须重新生成 clean candidate 并运行发布风险扫描。

阶段 24E 本轮验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase24e.order-qualification-pagination.test.js` | 通过，4/4 |
| `npm test` | 通过，340/340 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不生成公开交付候选目录；如后续需要交付，必须重新生成 clean candidate 并运行发布风险扫描。

2026-06-11 交付契约收口验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase19_5.engineering-governance.test.js` | 通过，8/8 |
| `node --test tests/phase20.contracts.test.js` | 通过，1/1 |
| `node --test tests/phase20.risk.test.js` | 通过，3/3 |
| `node --test tests/phase24e.order-qualification-pagination.test.js` | 通过，4/4 |
| `npm test` | 通过，341/341 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不生成公开交付候选目录，未运行 `npm run check:release-risk -- <candidate-dir>`。

最近 clean candidate：

```text
2026-06-04，提交 bb16708，发布风险扫描通过。
```

## 当前重点风险

| 优先级 | 风险 | 当前处理 |
| ------ | ---- | -------- |
| 范围外/条件阶段 | 真实支付、退款、分账、提现尚未接入 | 当前只使用 mock 支付，不考虑真实支付现金流；后续评价不得将其列为当前 P0 |
| 范围外/条件阶段 | 支付回调验签尚未真实接入 | `handlePayNotify` 默认拒绝无验签 notify；仅在真实支付阶段作为专项验收项 |
| P2 | 订单、资质、保证金列表真实云索引仍需部署后验证 | 阶段 24E 已将用户/师傅订单列表、管理员资质列表、管理员保证金列表改为仓库侧分页；真实云环境需按索引契约补齐并真机验证 |
| P1 | 商家收益、评价、打赏细权限仍是兼容债 | 已补充“不通过旧 worker 入口暴露商家兼容数据”的测试；专用商家入口后续独立设计 |
| P2 | 消息旧数据缺失 `role`、评价旧数据缺失 `rating_level` 时存在分页兼容边缘 | 本轮不做数据迁移；后续可补低风险数据修复或专项兼容索引方案 |
| P1 | 管理员端二级页面仍需真机复核或少量剩余运营页收口 | 阶段 24B-1、24B-2、24B-3 已分批收口主要管理员二级页；后续可进入会员、优惠券、营销配置页面收口或全量真机视觉抽查 |
| P1 | 商家端二级页面真机视觉细节尚未抽查 | 阶段 23C 已完成六个二级页基础收口；后续如需继续，应基于真机反馈局部微调 |
| P1 | 公开交付包可能混入本地配置 | 必须使用 clean candidate 并运行 release-risk 扫描 |
| P2 | 部分 handler 体积较大 | 后续可局部抽纯函数模块，不做大范围重构 |

## 当前推荐下一步

1. 建议进入阶段 26 试运营前真机与云端部署验证，重点检查真实云集合、索引、云函数部署和少访问量真机回归。
2. 管理员端 UI 下一步可进入阶段 24F：会员 / 优惠券 / 营销配置页面 UI 收口，或进入管理员端二级页面真机视觉抽查与全量验收。
3. 商家收益、评价回复/申诉、打赏收益如需开放，建议单独做商家体验增强阶段，不复用旧 worker 专用 action。
4. 若未来重新决定进入真实资金或认证阶段：必须另起高风险阶段，不得在普通 UI/维护任务中顺手接入；在当前 mock 支付策略下，真实支付未接入不作为 P0 阻塞。

## 文档入口

- 长期 Agent 规则：`AGENT.MD`
- 工程审查方法：`工程维护方案.md`
- 当前阶段边界：`docs/PHASE_CURRENT.md`
- 阶段 23A 记录：`docs/dev-records/23a-admin-primary-ui.md`
- 阶段 23B 记录：`docs/dev-records/23b-merchant-primary-ui.md`
- 阶段 23C 记录：`docs/dev-records/23c-merchant-secondary-ui.md`
- 阶段 24B-1 记录：`docs/dev-records/24b-admin-secondary-ui.md`
- 阶段 24B-2 记录：`docs/dev-records/24b2-admin-service-area-dispatch-ui.md`
- 阶段 24B-3 记录：`docs/dev-records/24b3-admin-finance-merchant-risk-ui.md`
- 阶段 24C 记录：`docs/dev-records/24c-engineering-closure.md`
- 阶段 24D 记录：`docs/dev-records/24d-high-growth-pagination.md`
- 阶段 24E 记录：`docs/dev-records/24e-order-qualification-pagination.md`
- mock 支付范围决策：`docs/DECISIONS/2026-06-10-mock-payment-scope.md`
- 发布检查：`docs/release-checklist.md`、`docs/release-package-checklist.md`
- UI 重构保护：`docs/ui-refactor-guardrails.md`
- 支付边界：`docs/wechat-pay-setup.md`
- 权限矩阵：`docs/contracts/permission-matrix.md`
