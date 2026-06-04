# PROJECT_STATUS.md

最后更新：2026-06-04

本文件记录当前工程的真实状态。长期 Agent 行为规则见 `AGENT.MD`；当前阶段执行边界见 `docs/PHASE_CURRENT.md`。

## 当前阶段

阶段名称：阶段 23A：管理员端一级导航与五个一级页面 UI 复刻

阶段状态：本轮已完成，等待复核与提交。

最近提交：

- `f4cae80`：阶段 22D 开始前的当前工作树基准提交；阶段 22D 改动尚未提交

## 当前工程概况

这是“同城社区便民综合服务平台 MVP”，基于微信原生小程序 + 微信云开发。当前已覆盖普通用户、个人师傅、商家、管理员四类主要角色，核心 mock 闭环为：

```text
用户登录 -> 浏览服务 -> 地址/下单 -> mock 支付 -> 师傅/商家接单 -> 开始服务 -> 完成服务 -> 用户评价 -> 售后/退款 mock -> 管理员管理
```

阶段 22C3 已完成师傅端一级页面 UI 阶段性重构，阶段 22D 已完成师傅端次级页面 UI 收口。阶段 23A 已完成管理员端一级导航与五个一级页面 UI 复刻，把管理员端从旧的高密度入口页整理为工作台、订单、审核、运营、我的五个低密度一级聚合页，并保留旧二级页面作为实际业务入口。

## 当前真实能力边界

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

`PAY_MODE=wechat` 仍是占位入口。真实微信支付上线前必须完成 JSAPI 下单、请求签名、前端支付参数签名、支付回调验签、退款、退款回调和对账。

## 当前测试基线

阶段 23A 新增结构保护测试：

```bash
node --test tests/phase23a_admin_primary_ui.test.js
```

初始 RED 结果：10 个测试按预期失败，失败点为 23A 页面、组件和文档尚未完成。

阶段 22D 最近验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `npm test` | 262/262 通过 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

阶段 23A 本轮验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase23a_admin_primary_ui.test.js` | 通过，10/10 |
| `npm test` | 通过，272/272 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮未涉及交付包、发布清单、敏感文件或 clean candidate，未运行 `npm run check:release-risk -- <candidate-dir>`。

最近 clean candidate：

```text
2026-06-04，提交 bb16708，发布风险扫描通过。
```

## 当前重点风险

| 优先级 | 风险 | 当前处理 |
| ------ | ---- | -------- |
| P0 | 真实支付、退款、分账、提现尚未接入 | 保持 fail-fast 和 mock 明示，不得包装成真实能力 |
| P0 | 支付回调验签尚未真实接入 | `handlePayNotify` 默认拒绝无验签 notify |
| P1 | 管理员端二级页面仍是旧风格 | 阶段 23A 只重构一级聚合页，二级页面后续单独推进 |
| P1 | 商家端体验仍是基础验证版 | 后续可单独做商家端 UI / 权限细化阶段 |
| P1 | 公开交付包可能混入本地配置 | 必须使用 clean candidate 并运行 release-risk 扫描 |
| P2 | 部分 handler 体积较大 | 后续可局部抽纯函数模块，不做大范围重构 |

## 当前推荐下一步

1. 复核并提交阶段 23A 管理员端一级导航与五个一级页面 UI 复刻。
2. 若继续 UI：优先商家端或管理员端二级页面，避免回头扩大用户端 UI 改动。
3. 若进入真实资金或认证阶段：必须另起高风险阶段，不得在普通 UI/维护任务中顺手接入。

## 文档入口

- 长期 Agent 规则：`AGENT.MD`
- 工程审查方法：`工程维护方案.md`
- 当前阶段边界：`docs/PHASE_CURRENT.md`
- 阶段 23A 记录：`docs/dev-records/23a-admin-primary-ui.md`
- 发布检查：`docs/release-checklist.md`、`docs/release-package-checklist.md`
- UI 重构保护：`docs/ui-refactor-guardrails.md`
- 支付边界：`docs/wechat-pay-setup.md`
- 权限矩阵：`docs/contracts/permission-matrix.md`
