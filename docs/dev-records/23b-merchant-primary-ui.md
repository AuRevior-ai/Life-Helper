# 阶段 23B 商家端一级页面 UI 统一

## 阶段名称

阶段 23B：商家端一级页面 UI 统一。

## 阶段目标

在阶段 23A 管理员端一级 UI 收口复核后，新增商家端独立一级导航，并统一商家“我的 / 订单 / 服务 / 收益 / 入驻”五个一级页面的低密度展示体验。

本阶段只做展示层、页面组件引入、结构保护测试和阶段文档，不新增业务能力。

## 完成页面

- `miniprogram/pages/merchant/profile/profile`：我的 / 经营概览。
- `miniprogram/pages/merchant/order-list/order-list`：订单一级列表。
- `miniprogram/pages/merchant/service-list/service-list`：服务一级列表。
- `miniprogram/pages/merchant/income/income`：收益边界说明。
- `miniprogram/pages/merchant/audit-status/audit-status`：入驻与准入状态。

旧二级页面继续保留，一级页通过入口跳转到原有服务编辑、订单详情、资质、保证金和风控等页面。

## 新增组件

- `miniprogram/components/merchant-tab-bar/`：商家端独立五栏底部导航。

## 新增共享样式

- `miniprogram/styles/merchant-theme.wxss`：商家端一级页面共享视觉基线。

## 修改文件列表

- `README.md`：同步当前阶段到 23B。
- `docs/PHASE_CURRENT.md`：切换当前阶段到 23B。
- `docs/PROJECT_STATUS.md`：同步当前阶段、最近提交和验收状态。
- `docs/dev-records/23b-merchant-primary-ui.md`：新增本阶段复盘。
- `tests/phase23a_admin_primary_ui.test.js`：增强 23A 收口保护，禁止伪真实趋势文案，扩展管理员边界说明保护。
- `tests/phase23b_merchant_primary_ui.test.js`：新增商家端一级 UI 结构保护测试。
- `miniprogram/components/merchant-tab-bar/*`：新增商家端底部导航。
- `miniprogram/styles/merchant-theme.wxss`：新增商家端共享样式。
- `miniprogram/pages/admin/dashboard/dashboard.wxml`：移除硬编码趋势，改为中性统计说明。
- `miniprogram/pages/admin/profile/profile.wxml`、`profile.wxss`：扩展系统边界说明。
- `miniprogram/pages/merchant/profile/*`：重构为商家经营概览和入口聚合页。
- `miniprogram/pages/merchant/order-list/*`：重构为商家订单一级列表展示。
- `miniprogram/pages/merchant/service-list/*`：重构为商家服务一级列表展示。
- `miniprogram/pages/merchant/income/*`：重构为收益边界说明页。
- `miniprogram/pages/merchant/audit-status/*`：重构为入驻状态一级页。

## 未修改的业务逻辑

- 未修改订单状态机。
- 未修改支付状态流转。
- 未修改退款状态流转。
- 未修改财务流水生成逻辑。
- 未修改收益计算逻辑。
- 未修改商家审核、资质审核、保证金审核或风控核心逻辑。
- 未修改用户、师傅、商家、管理员 active role 语义。

## 数据库变化：无

本阶段不新增集合、不新增字段、不修改 schema，不做数据迁移。

## 云函数变化：无

本阶段不修改任何 `cloudfunctions/` 业务逻辑，不新增 action，不改变返回结构。

## service 变化：无

本阶段不修改 `miniprogram/services/*`。商家端页面继续复用既有 `merchantService`。

## mock/真实边界说明

- 支付：mock，真实微信支付未接入。
- 退款：mock，真实微信退款未接入。
- 财务：内部模拟流水，无真实清算、分账或提现。
- 收益：内部模拟展示，不代表真实结算。
- 保证金：mock，不代表真实缴纳或退还。
- 资质认证：资料留档与人工审核，不代表真实身份证认证、营业执照认证或 OCR。
- 保险：资料留档，无真实保险核验。
- 风控：内部模拟/人工设置，无真实合规风控系统。
- 自动派单 / AI 派单：未上线。

商家端一级页中的收益、资质、保证金、风控入口仅为聚合入口，不代表相关真实能力已经接入。

## 测试记录

新增结构保护测试：

```bash
node --test tests/phase23b_merchant_primary_ui.test.js
```

初始 RED 结果：7 个测试按预期失败，失败点为商家端导航组件、共享样式、一级页结构和阶段文档尚未完成。

最终验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase23a_admin_primary_ui.test.js` | 通过，13/13 |
| `node --test tests/phase23b_merchant_primary_ui.test.js` | 通过，8/8 |
| `npm test` | 通过，285/285 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮未涉及交付包、发布清单、敏感文件或 clean candidate，未运行 `npm run check:release-risk -- <candidate-dir>`。

## 已知遗留事项

- 商家端二级列表、详情、服务编辑、资质、保证金和风控页面仍保留旧页面风格，后续可单独做二级页 UI 收口。
- 商家端一级页的经营统计受现有接口字段限制，只做展示兜底，不代表新增真实统计口径。
- 收益页仍为边界说明和入口占位，不代表真实提现、真实分账或真实结算已经接入。
- 本阶段不做微信开发者工具或真机截图验收记录。

## 下一阶段建议

1. 如继续 UI，建议进入商家端二级页面或管理员端二级页面分批收口。
2. 如继续商家端数据能力，应先明确后端统计字段、分页和权限口径，再进入独立业务阶段。
3. 如进入真实支付、退款、提现、分账、认证或风控，必须另起独立高风险阶段。
