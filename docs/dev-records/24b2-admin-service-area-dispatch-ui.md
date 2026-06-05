# 阶段 24B-2：管理员端服务 / 分类 / 区域 / 派单页面 UI 收口

## 阶段名称

阶段 24B-2：管理员端服务 / 分类 / 区域 / 派单页面 UI 收口。

## 本轮目标

1. 使用既有 `miniprogram/styles/admin-theme.wxss` 作为管理员端视觉基线。
2. 收口管理员端分类、服务、区域和派单相关 8 个二级页面。
3. 统一页面壳、顶部标题区、浅灰背景、白色圆角卡片、状态标签、筛选条、列表卡片、详情信息分组和管理操作区。
4. 补齐 loading、empty、error、submitting 或 saving 状态。
5. 保留现有 service 调用、按钮行为、状态流转和页面跳转，不修改业务逻辑。
6. 新增阶段结构保护测试，防止后续破坏管理员端服务、区域、派单 UI 边界。

## 本轮页面清单

- `miniprogram/pages/admin/category-list/category-list`
- `miniprogram/pages/admin/category-edit/category-edit`
- `miniprogram/pages/admin/service-list/service-list`
- `miniprogram/pages/admin/service-edit/service-edit`
- `miniprogram/pages/admin/area-list/area-list`
- `miniprogram/pages/admin/area-edit/area-edit`
- `miniprogram/pages/admin/assign-worker/assign-worker`
- `miniprogram/pages/admin/dispatch-logs/dispatch-logs`

## 修改范围

- 修改本轮 8 个页面的 `.js`、`.wxml`、`.wxss`，以及必要页面组件声明。
- 新增 `tests/phase24b2_admin_service_area_dispatch_ui.test.js`。
- 新增本阶段文档并同步 `docs/PHASE_CURRENT.md`、`docs/PROJECT_STATUS.md`、`docs/dev-records/index.md` 和 `docs/ui-refactor-guardrails.md`。

## 未修改的业务逻辑

- 不修改云函数。
- 不修改 `cloudfunctions/**`。
- 不修改 `miniprogram/services/*`。
- 不修改 `schema/**`。
- 不修改订单状态机。
- 不修改支付状态、退款状态、售后状态、财务状态。
- 不修改管理员权限模型。
- 不修改数据库字段语义。
- 不修改云函数 action 名称或返回结构。
- 不让前端直接决定订单完成、退款成功、审核通过、收益结算或财务流水生成。

## mock / 真实能力边界

| 能力 | 当前边界 |
| ---- | -------- |
| 服务分类 | 手动配置和种子同步，分类启停以后端服务层为准 |
| 服务管理 | 手动维护上下架、价格展示和推荐位，不改变订单快照或资金逻辑 |
| 服务区域 | 手动配置城市、小区、中心点、行政编码，承接既有 LBS 基础能力 |
| 派单 | 管理员人工指派，候选来自后端筛选，非自动派单、非 AI 派单 |
| 日志 | 只读展示派单日志，非实时轨迹、非 ETA |
| 支付/退款/财务 | 未接入真实支付、真实退款、真实提现、真实分账或真实清算 |
| 认证/风控 | 未接入真实认证、OCR 或自动风控 |

## 测试 RED / GREEN 记录

RED：

- 新增 `tests/phase24b2_admin_service_area_dispatch_ui.test.js` 后，首次运行 9 个测试中 2 个通过、7 个失败。
- 失败点符合预期：阶段文档不存在、旧页面未导入管理员主题、旧结构仍使用 `page-shell/panel`、缺少筛选区/error 状态和能力边界说明。

阶段性 GREEN：

- 页面结构改造后再次运行，9 个测试中 8 个通过、1 个失败。
- 剩余失败点为本阶段文档尚未创建。

最终 GREEN：

- `node --test tests/phase24b2_admin_service_area_dispatch_ui.test.js`：通过，9/9。
- `node --test tests/phase24b_admin_secondary_ui.test.js`：通过，7/7。
- `node --test tests/phase23a_admin_primary_ui.test.js`：通过，13/13。
- `npm test`：通过，314/314。
- `npm run check:shared-sync`：通过。
- `npm run check:cloudfunction-deps`：通过。
- `git diff --check`：通过。
- 本轮不涉及交付包，未运行 `npm run check:release-risk -- <candidate-dir>`。

## 遗留问题

- 本轮未做微信开发者工具真机视觉验收。
- 区域与派单仍基于既有服务端能力展示，不新增自动派单、路径规划、实时轨迹、ETA、多边形围栏或距离自动加价。
- 服务价格展示仍沿用既有页面元、提交分的转换逻辑，未调整价格计算口径。

## 下一批建议

阶段 24B-3：管理员端财务 / 商家 / 资质 / 保证金 / 风控 / 用户治理二级页面 UI 收口。

建议仍只做 UI 结构和展示态收口；涉及真实支付、退款、提现、认证、保证金、风控或自动化派单时，必须另起独立高风险业务阶段。
