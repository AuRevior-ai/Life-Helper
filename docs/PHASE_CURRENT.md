# PHASE_CURRENT.md

本文件记录当前正在执行或刚完成的工程阶段。它只描述当前阶段事实，不替代长期协作规则；长期规则见 `AGENT.MD`。

## 阶段名称

阶段 24B-1：管理员端订单 / 审核 / 售后 / 评价治理二级页面 UI 收口

## 阶段状态

阶段 24A：全端 UI 统一性体检与设计规范收口已完成，已沉淀 `docs/ui-style-guide.md`、`docs/ui-refactor-guardrails.md` 和 `tests/phase24a_ui_consistency_audit.test.js`。24A 不开发新业务，不接入真实支付、退款、提现、分账、真实认证、OCR、保证金支付或真实风控，并明确下一阶段适合进入管理员端二级页面 UI 收口。

阶段 23A checkpoint：阶段 23A：管理员端一级导航与五个一级页面 UI 复刻已完成，未修改云函数、services、schema、订单状态机或真实资金/认证/风控能力。

阶段 23B checkpoint：阶段 23B：商家端一级页面 UI 统一已完成、已验收、已提交并推送。

本轮进入阶段 24B-1，只收口管理员端订单、审核、售后、评价治理相关二级页。不一次性重构全部管理员二级页面。

## 本阶段目标

1. 使用既有 `miniprogram/styles/admin-theme.wxss` 作为管理员端视觉基线。
2. 收口 8 个管理员端二级页面：订单详情、师傅审核、售后列表、售后详情、评价列表、评价详情、评价申诉列表、评价申诉详情。
3. 统一页面壳、顶部标题区、浅灰背景、白色圆角卡片、状态标签、筛选条、列表卡片、详情信息分组和管理操作区。
4. 补齐 loading、empty、error、submitting 状态。
5. 保留所有现有服务调用、按钮行为、状态流转、权限判断和页面跳转。
6. 新增阶段结构保护测试，防止后续 Agent 破坏管理员端 UI 边界。
7. 新增阶段文档并同步当前状态文档。

## 本阶段页面清单

- `miniprogram/pages/admin/order-detail/order-detail`
- `miniprogram/pages/admin/worker-audit/worker-audit`
- `miniprogram/pages/admin/after-sale-list/after-sale-list`
- `miniprogram/pages/admin/after-sale-detail/after-sale-detail`
- `miniprogram/pages/admin/review-list/review-list`
- `miniprogram/pages/admin/review-detail/review-detail`
- `miniprogram/pages/admin/review-appeal-list/review-appeal-list`
- `miniprogram/pages/admin/review-appeal-detail/review-appeal-detail`

## 本阶段允许

- 修改本阶段 8 个页面的 `.js`、`.wxml`、`.wxss`、必要组件声明。
- 新增 `tests/phase24b_admin_secondary_ui.test.js`。
- 新增 `docs/dev-records/24b-admin-secondary-ui.md`。
- 更新 `docs/PHASE_CURRENT.md`、`docs/PROJECT_STATUS.md`、`docs/dev-records/index.md`。
- 必要时仅补充 `docs/ui-style-guide.md` 或 `docs/ui-refactor-guardrails.md` 中与管理员端二级页相关的规则。

## 本阶段禁止

- 不修改云函数。
- 不修改 `cloudfunctions/**`。
- 不修改 services。
- 不修改 `miniprogram/services/**`。
- 不修改 schema。
- 不修改 `schema/**`。
- 不修改订单状态机。
- 不修改支付状态、退款状态、售后状态、财务状态。
- 不修改管理员权限模型。
- 不修改数据库字段语义。
- 不修改云函数 action 名称或返回结构。
- 让前端直接决定订单完成、退款成功、审核通过、收益结算或财务流水生成。
- 接入真实微信支付、真实退款、提现、分账、真实认证、OCR、真实保证金支付或真实风控。
- 新增自动派单、AI 派单、路径规划、实时轨迹或 ETA。
- 删除已有页面、已有测试或做全仓无关格式化。

## 已完成内容

- 8 个页面已迁移到 `admin-page`、`admin-header`、`admin-section-card`、`admin-status-card` 和 `admin-action-card` 结构。
- 列表页已补齐筛选区、加载态、错误态、空状态和列表卡片。
- 详情页已按“基础信息 / 状态信息 / 用户或服务方信息 / 操作记录 / 管理操作”分组。
- 售后、审核、评价治理和申诉页面已补充人工处理、平台审核、mock 或内部模拟边界说明。
- 页面保留原 service 调用，未出现页面内 `wx.cloud.callFunction`。

## mock / 真实能力边界

本节延续既有 mock/真实能力边界 表述：所有资金、认证、风控相关能力不得包装成真实上线。

| 能力 | 当前状态 |
| ---- | -------- |
| 支付 | mock 支付，真实微信支付未接入 |
| 退款 | mock 退款，真实微信退款未接入 |
| 财务 | 内部模拟流水，无真实清算、分账或提现 |
| 师傅审核 | 平台人工审核，无真实身份认证或 OCR |
| 售后审核 | 人工审核并触发模拟退款，不代表真实退款完成 |
| 评价治理 | 人工隐藏、恢复、申诉处理，无自动风控或 AI 裁决 |
| 派单 | 仅保留既有手动指派入口，未接入自动派单、AI 派单、路径规划、实时轨迹或 ETA |

## 验收命令

```bash
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

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase24b_admin_secondary_ui.test.js` | 通过，7/7 |
| `node --test tests/phase23a_admin_primary_ui.test.js` | 通过，13/13 |
| `npm test` | 通过，305/305 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不涉及交付包、发布清单、敏感文件或 clean candidate，未运行 `npm run check:release-risk -- <candidate-dir>`。

## 回滚与降级策略

- 本阶段不改云函数、services、schema、状态枚举或数据库结构，因此无需数据迁移回滚。
- 如某个管理员二级页出现视觉或交互异常，可优先回滚对应页面的 WXML/WXSS/展示字段改动。
- 如页面文案被误解为真实支付、真实退款、真实认证或自动风控，应立即回退为 mock、内部模拟或人工审核表述。

## 下一阶段建议

阶段 24B-2：服务 / 分类 / 区域 / 派单页面 UI 收口。

建议优先处理 `category-list`、`category-edit`、`service-list`、`service-edit`、`area-list`、`area-edit`、`assign-worker` 和 `dispatch-logs`。下一批仍只做 UI 和展示态，不接入自动派单、AI 派单、路径规划、实时轨迹或 ETA。
