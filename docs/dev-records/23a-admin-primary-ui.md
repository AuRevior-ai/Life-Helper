# 阶段 23A 管理员端一级导航与五个一级页面 UI 复刻

## 阶段名称

阶段 23A：管理员端一级导航与五个一级页面 UI 复刻。

## 阶段目标

按照已确认的低信息密度管理员端概念图，新增管理员端独立 5 栏底部导航，并重构或新增工作台、订单、审核、运营、我的五个一级聚合页。

本阶段只做展示层、页面注册、结构保护测试和阶段文档，不新增业务能力。

## 设计依据

- 用户提供的管理员端参考图与阶段 23A 提示词。
- `AGENT.MD` 的 UI 重构与 mock/真实能力边界。
- `docs/ui-style-guide.md` 的浅灰背景、白色圆角卡片、社区绿色主色、柔和阴影体系。
- `docs/ui-refactor-guardrails.md` 的 UI 阶段保护清单。
- 阶段 22C3 / 22D 对师傅端独立导航和结构保护测试的实现方式。

## 完成页面

- `miniprogram/pages/admin/dashboard/dashboard`：工作台。
- `miniprogram/pages/admin/order-list/order-list`：订单。
- `miniprogram/pages/admin/review-center/review-center`：审核。
- `miniprogram/pages/admin/operation-center/operation-center`：运营。
- `miniprogram/pages/admin/profile/profile`：我的。

旧二级页面继续保留，一级页通过入口跳转到原有订单、指派、售后、审核、服务、区域、财务、资质、保证金、风控、评价、用户等页面。

## 新增组件

- `miniprogram/components/admin-tab-bar/`：管理员端独立五栏底部导航。

## 修改文件列表

- `miniprogram/styles/admin-theme.wxss`：新增管理员端共享视觉基线。
- `miniprogram/components/admin-tab-bar/*`：新增管理员端底部导航。
- `miniprogram/pages/admin/dashboard/*`：重构工作台为低密度概览与入口页。
- `miniprogram/pages/admin/order-list/*`：重构订单一级页为 KPI、状态 tab、筛选条、订单卡和快捷入口。
- `miniprogram/pages/admin/review-center/*`：新增审核一级聚合页。
- `miniprogram/pages/admin/operation-center/*`：新增运营一级聚合页。
- `miniprogram/pages/admin/profile/*`：新增管理员“我的”一级页。
- `miniprogram/app.json`：注册新增管理员一级页。
- `tests/phase23a_admin_primary_ui.test.js`：新增结构保护测试。
- `docs/PHASE_CURRENT.md`：切换当前阶段到 23A。
- `docs/PROJECT_STATUS.md`：同步当前阶段与风险说明。
- `docs/dev-records/23a-admin-primary-ui.md`：新增本阶段复盘。

## 未修改的业务逻辑

- 未修改订单状态机。
- 未修改支付状态流转。
- 未修改退款状态流转。
- 未修改财务流水生成逻辑。
- 未修改收益计算逻辑。
- 未修改管理员权限模型。
- 未修改用户、师傅、商家 active role 语义。
- 未修改首个管理员初始化逻辑。

## 数据库变化：无

本阶段不新增集合、不新增字段、不修改 schema，不做数据迁移。

## 云函数变化：无

本阶段不修改任何 `cloudfunctions/` 业务逻辑，不新增 action，不改变返回结构。

## service 变化：无

本阶段不修改 `miniprogram/services/*`。页面继续复用既有 `adminService`、身份工具和展示层格式化工具。

## mock/真实边界说明

- 支付：mock，真实微信支付未接入。
- 退款：mock，真实微信退款未接入。
- 财务：内部模拟流水，无真实清算、分账或提现。
- 保证金：mock，不代表真实缴纳或退还。
- 资质认证：资料留档与人工审核，不代表真实身份证认证、营业执照认证或 OCR。
- 风控：内部模拟/人工设置，无真实合规风控系统。
- 自动派单 / AI 派单：未上线。

管理员端一级页中的财务、资质、保证金、风控入口仅为聚合入口，不代表相关真实能力已经接入。

## 测试记录

新增结构保护测试：

```bash
node --test tests/phase23a_admin_primary_ui.test.js
```

初始 RED 结果：10 个测试按预期失败，失败点为 23A 页面、组件和文档尚未完成。

最终验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase23a_admin_primary_ui.test.js` | 通过，10/10 |
| `npm test` | 通过，272/272 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮未涉及交付包、发布清单、敏感文件或 clean candidate，未运行 `npm run check:release-risk -- <candidate-dir>`。

## 已知遗留事项

- 管理员端二级列表和详情页仍保留旧页面风格，后续可单独做二级页 UI 收口。
- 部分 KPI 受现有接口字段限制，只做展示兜底，不代表新增真实统计口径。
- 审核、运营页为一级聚合入口，不等于二级业务页面已经完成视觉重构。
- 本阶段不做微信开发者工具或真机截图验收记录。

## 下一阶段建议

1. 如继续 UI，建议进入商家端一级页面 UI 统一阶段。
2. 如继续管理端，建议分批重构管理员端订单详情、审核列表、财务列表等二级页面。
3. 如进入真实支付、退款、提现、分账、认证或风控，必须另起独立高风险阶段。
