# 阶段 20：保证金、资质认证与入驻风控 mock 基础版

## 阶段基本信息

- 阶段：20
- 类型：保证金、资质认证、保险信息、入驻风控与管理员复核 mock 基础版
- 状态：已完成基础版
- 完成时间：2026-06-02
- 范围：只做 mock 流程、状态机、页面入口、后台审核、权限控制、文档契约和测试。

## 阶段 20 总体结论

阶段 20 已新增独立 `qualification` 云函数，补齐商家/服务方资质认证 mock、保险信息 mock、保证金 mock、入驻风控 mock、管理员审核/复核和入驻状态计算基础闭环。当前没有真实支付、真实退款、真实分账、真实身份认证、真实营业执照认证、真实 OCR 或真实保险核验。

## 新增功能清单

1. 资质认证 mock：支持草稿、提交、重新提交、管理员通过/驳回/要求补充材料。
2. 保证金 mock：支持查看、模拟缴纳、申请退还、管理员冻结和退还审核。
3. 保险信息 mock：作为资质信息的一部分保存 masked/mock 字段。
4. 入驻风控 mock：管理员可设置 `RISK_LEVEL` 和风险标签，商家端只看到简化提示。
5. 管理员审核：新增资质审核、保证金审核和风控基础页面。
6. 商家端页面：新增资质认证、保证金、风险状态页面。
7. 权限与状态拦截：商家发布服务时会读取入驻状态，`BLOCKED`、`HIGH`、资质未通过或保证金未满足时不可进入经营发布。

## 新增文件清单

- `cloudfunctions/qualification/index.js`
- `cloudfunctions/qualification/handler.js`
- `cloudfunctions/qualification/repositories.js`
- `cloudfunctions/qualification/qualification.constants.js`
- `cloudfunctions/qualification/qualification.validator.js`
- `cloudfunctions/qualification/qualification.service.js`
- `cloudfunctions/qualification/deposit.service.js`
- `cloudfunctions/qualification/risk.service.js`
- `cloudfunctions/qualification/onboarding.service.js`
- `cloudfunctions/qualification/package.json`
- `miniprogram/services/qualification.service.js`
- `miniprogram/pages/merchant/qualification/*`
- `miniprogram/pages/merchant/deposit/*`
- `miniprogram/pages/merchant/risk-status/*`
- `miniprogram/pages/admin/qualification-review/*`
- `miniprogram/pages/admin/deposit-review/*`
- `miniprogram/pages/admin/risk-control/*`
- `schema/merchant-qualifications.schema.json`
- `schema/merchant-deposits.schema.json`
- `schema/merchant-risk-records.schema.json`
- `schema/merchant-onboarding-logs.schema.json`
- `tests/phase20.qualification.test.js`
- `tests/phase20.deposit.test.js`
- `tests/phase20.risk.test.js`
- `tests/phase20.onboarding.test.js`
- `tests/phase20.contracts.test.js`

## 修改文件清单

- `cloudfunctions/merchant/handler.js`
- `cloudfunctions/merchant/index.js`
- `miniprogram/app.json`
- `miniprogram/config/constants.js`
- `miniprogram/config/status.js`
- `docs/contracts/status-contract.md`
- `docs/contracts/database-schema.md`
- `docs/contracts/api-actions.md`
- `docs/contracts/api-actions.manifest.json`
- `docs/contracts/permission-matrix.md`
- `docs/contracts/pagination-and-indexes.md`
- `README.md`
- `docs/dev-records/index.md`

## 新增数据库集合

- `merchant_qualifications`：保存资质认证 mock 信息、保险信息 mock 和审核状态。
- `merchant_deposits`：保存保证金 mock 状态、mock 缴纳号、退还申请和审核结果。
- `merchant_risk_records`：保存管理员手动风控等级、标签和原因。
- `merchant_onboarding_logs`：保存资质、保证金、风控和入驻状态操作日志。

## 新增 action

新增云函数：`qualification`。

商家/服务方侧 action：`getMyQualification`、`saveQualificationDraft`、`submitQualification`、`resubmitQualification`、`getMyDeposit`、`mockPayDeposit`、`applyDepositRefund`、`getMyRiskStatus`、`getOnboardingStatus`。

管理员侧 action：`adminListQualifications`、`adminGetQualificationDetail`、`adminReviewQualification`、`adminListDeposits`、`adminFreezeDeposit`、`adminReviewDepositRefund`、`adminSetRiskLevel`、`adminAddRiskTag`、`adminListRiskRecords`、`adminGetOnboardingDetail`。

公共配置 action：`getQualificationRequirements`、`getDepositRules`。

## 新增状态

- `QUALIFICATION_STATUS`：`NOT_SUBMITTED`、`DRAFT`、`PENDING_REVIEW`、`APPROVED`、`REJECTED`、`NEED_SUPPLEMENT`、`EXPIRED`。
- `DEPOSIT_STATUS`：`NOT_REQUIRED`、`UNPAID`、`MOCK_PAYING`、`MOCK_PAID`、`FROZEN`、`REFUND_PENDING`、`MOCK_REFUNDED`、`REFUND_REJECTED`。
- `RISK_LEVEL`：`LOW`、`MEDIUM`、`HIGH`、`BLOCKED`。
- `ONBOARDING_STATUS`：`INCOMPLETE`、`QUALIFICATION_WAIT`、`DEPOSIT_WAIT`、`RISK_REVIEW`、`ACTIVE`、`LIMITED`、`BLOCKED`。

## 权限规则

商家/服务方只能查看和修改自己的资质草稿、提交自己的资质、查看自己的保证金、执行 mock 缴纳、申请自己的保证金 mock 退还、查看简化风险状态和入驻状态。商家/服务方不能查看其他商家的详细资质，不能修改审核结果，不能设置风险等级，不能绕过管理员审核进入 `APPROVED` 或 `ACTIVE`。

管理员可以查看全部资质申请、审核资质、查看保证金记录、冻结保证金、审核退还、设置风险等级、添加风险标签和查看入驻状态详情。管理员写操作会记录操作人、原因和日志。

普通用户禁止查看商家详细资质材料、证件信息、保证金记录和内部风控标签。

## mock 边界说明

本阶段没有真实支付、没有真实退款、没有真实分账、没有真实提现、没有真实身份认证、没有真实营业执照认证、没有真实 OCR、没有真实保险核验、没有真实外部风控评分、没有真实征信或黑名单查询。

## 测试结果

- `node --test tests/phase20.qualification.test.js tests/phase20.deposit.test.js tests/phase20.risk.test.js tests/phase20.onboarding.test.js`：7 pass，0 fail。
- `node --test tests/phase20*.test.js`：8 pass，0 fail。
- `npm test`：175 pass，0 fail。

2026-06-02 补充修复：

- 管理员首页补齐“资质审核”“保证金审核”“入驻风控”入口。
- 商家中心补齐“资质认证”“保证金”“入驻状态”入口。
- 新增 `tests/phase20_1.entry-navigation.test.js` 防止阶段 20 页面存在但入口不可见。
- 管理员首页重构为一级模块折叠工作台，将“商家管理、资质审核、保证金审核、入驻风控”归入“商家准入”模块，减少入口平铺噪音。
- 资质审核和保证金审核页遇到 `merchant_qualifications`、`merchant_deposits` 集合未创建时，改为页面内空状态提示，不再直接展示云数据库原始错误。
- 最新验证：`node --test tests/phase20_1.entry-navigation.test.js tests/phase20*.test.js`：11 pass，0 fail；`npm test`：190 pass，0 fail。

2026-06-02 体验修复：

- 商家服务配置页改为稳定表单布局，输入框增加明确标签、高度和行高约束，修复微信顶部导航压缩场景下的文字截断问题。
- 商家入驻状态页不再直接堆砌枚举值，改为“当前状态、经营权限、风险等级、下一步”的卡片化文案。
- 保证金页补充 mock 边界说明：模拟缴纳只验证状态机与权限拦截，不代表真实扣款；保证金状态达到 `MOCK_PAID` 才算当前 mock 流程通过。
- 模拟缴纳保证金成功后返回上一页；再次进入保证金页时，`MOCK_PAID` 状态不再显示“模拟缴纳保证金”按钮，只保留可申请模拟退还的后续入口。
- 新增 `tests/phase20_2.merchant-onboarding-ux.test.js` 覆盖商家服务配置输入框、入驻状态文案和保证金按钮状态门控。
- 最新验证：`node --test tests/phase20*.test.js`：14 pass，0 fail；`npm test`：193 pass，0 fail。

新增测试文件：`tests/phase20.qualification.test.js`、`tests/phase20.deposit.test.js`、`tests/phase20.risk.test.js`、`tests/phase20.onboarding.test.js`、`tests/phase20.contracts.test.js`。

失败项及修复说明：红灯阶段先确认 `qualification` 云函数和阶段文档缺失；实现后修复风控记录同时间排序，确保后写入风险记录生效；全量测试中更新阶段 1 页面路径白名单，保持新增页面契约严格匹配。

## 文档更新情况

已同步状态契约、数据库 schema 契约、API action 清单、API action manifest、权限矩阵、分页与索引治理、README 和阶段记录索引。

## 未完成内容

真实支付保证金、真实保证金退款、真实分账、真实提现、真实身份证认证、真实营业执照认证、真实 OCR、真实保险核验、生产级风控、数据库真实索引配置和正式运营级商家端 UI 均留到后续阶段。

## 下一阶段建议

阶段 21 建议进入 LBS 地图与服务区域增强 V2，或先做商家端体验增强与管理员审核工作台增强，重点把阶段 20 的 mock 准入状态更自然地接入商家工作台。

## 对下一阶段 Agent 的约束

1. 阶段 20 仍是 mock 能力，不得宣称真实认证或真实保证金完成。
2. 真实支付、退款、认证、OCR、保险核验和风控系统必须单独立项。
3. 新增状态、字段、action、集合和 list 接口必须继续同步契约文档和测试。
4. 不要把后续资质、保证金和风控逻辑堆回 `merchant/handler.js`。
