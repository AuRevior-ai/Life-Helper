# 阶段 24B-1 管理员端订单 / 审核 / 售后 / 评价治理二级页面 UI 收口

## 阶段名称

阶段 24B-1：管理员端订单 / 审核 / 售后 / 评价治理二级页面 UI 收口。

## 本轮目标

1. 使用 `miniprogram/styles/admin-theme.wxss` 作为管理员端视觉基线。
2. 收口管理员端订单、师傅审核、售后、评价治理和差评申诉相关二级页。
3. 统一页面壳、顶部标题区、浅灰背景、白色圆角卡片、状态标签、筛选条、列表卡片、详情信息分组和管理操作区。
4. 补齐 loading、empty、error、submitting 状态。
5. 保留既有服务调用、按钮行为、状态流转、权限判断和页面跳转。
6. 新增阶段结构保护测试，防止后续 Agent 破坏管理员端 UI 边界。

## 本轮页面清单

- `miniprogram/pages/admin/order-detail/order-detail`
- `miniprogram/pages/admin/worker-audit/worker-audit`
- `miniprogram/pages/admin/after-sale-list/after-sale-list`
- `miniprogram/pages/admin/after-sale-detail/after-sale-detail`
- `miniprogram/pages/admin/review-list/review-list`
- `miniprogram/pages/admin/review-detail/review-detail`
- `miniprogram/pages/admin/review-appeal-list/review-appeal-list`
- `miniprogram/pages/admin/review-appeal-detail/review-appeal-detail`

## 修改范围

- 8 个管理员端二级页面的 WXML/WXSS：迁移到管理员端页面壳、状态卡、筛选卡、列表卡、详情分组和管理操作卡。
- 8 个管理员端二级页面的 JS：仅补充展示字段、`loading`、`errorText`、`empty` 判断、`submitting` 反馈和少量状态展示归一化。
- 页面 JSON：为需要的详情页和售后页补齐 `loading-view`、`empty-state` 组件声明。
- `tests/phase24b_admin_secondary_ui.test.js`：新增结构保护测试。
- 阶段状态文档、项目状态文档、开发记录索引和 UI 保护清单同步阶段事实。

## 未修改的业务逻辑

- 不修改云函数。
- 不修改 `miniprogram/services/*`。
- 不修改 schema。
- 不修改订单状态机。
- 不修改支付状态、退款状态、售后状态、财务状态。
- 不修改管理员权限模型。
- 不修改数据库字段语义。
- 不修改云函数 action 名称或返回结构。
- 不让前端直接决定订单完成、退款成功、审核通过、收益结算或财务流水生成。

## mock / 真实能力边界

- 支付仍为 mock，真实微信支付未接入。
- 退款仍为 mock，售后审核通过仅触发既有模拟退款流程，不代表真实退款完成。
- 财务仍为内部模拟流水，无真实清算、分账或提现。
- 师傅审核仍为平台人工审核，不代表真实身份认证、OCR 或自动风控接入。
- 评价治理和差评申诉仍为人工处理，不代表自动风控、自动处罚或 AI 裁决上线。
- 本轮不接入真实支付、真实退款、提现、分账、真实认证、OCR、真实保证金支付或真实风控。

## 测试 RED / GREEN 记录

新增结构保护测试：

```bash
node --test tests/phase24b_admin_secondary_ui.test.js
```

RED 结果：7 个测试中 2 个通过、5 个按预期失败。失败点为阶段文档不存在、页面未引入管理员主题、列表页缺少筛选/错误态/列表卡、详情页缺少分组和错误态。

GREEN 结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase24b_admin_secondary_ui.test.js` | 通过，7/7 |
| `node --test tests/phase23a_admin_primary_ui.test.js` | 通过，13/13 |
| `npm test` | 通过，305/305 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

## 遗留问题

- 本轮未覆盖管理员端服务、分类、区域、派单、财务、资质、保证金、风控和用户管理等其他二级页。
- 本轮未做微信开发者工具真机截图验收，极窄屏视觉细节仍建议人工抽查。
- 管理员端二级页样式仍分散在页面 WXSS 中，后续如继续收口，可评估是否将二级页通用类沉淀到 `admin-theme.wxss`。

## 下一批建议

阶段 24B-2 服务 / 分类 / 区域 / 派单页面 UI 收口。

建议优先处理：

- `pages/admin/category-list/category-list`
- `pages/admin/category-edit/category-edit`
- `pages/admin/service-list/service-list`
- `pages/admin/service-edit/service-edit`
- `pages/admin/area-list/area-list`
- `pages/admin/area-edit/area-edit`
- `pages/admin/assign-worker/assign-worker`
- `pages/admin/dispatch-logs/dispatch-logs`

下一批仍应只做 UI 和展示态收口，不接入自动派单、AI 派单、路径规划、实时轨迹或 ETA。
