# PHASE_CURRENT.md

本文件记录当前正在执行或刚完成的工程阶段。它只描述当前阶段事实，不替代长期协作规则；长期规则见 `AGENT.MD`。

## 阶段名称

阶段 22D：师傅端次级页面 UI 收口

## 阶段状态

已完成本轮收口，等待复核与提交。

本阶段承接阶段 22C3 的师傅端一级页面 UI 重构结果，继续收口师傅端次级页面。阶段 22D 不是新功能阶段，也不是全量 UI 大改阶段。

## 本阶段目标

1. 在不改变业务逻辑、云函数接口、订单状态机、金额单位和数据库字段语义的前提下，统一师傅端次级页面体验。
2. 优先处理师傅订单详情、收益、评价、资料/审核/服务范围和消息入口相关体验。
3. 补齐或优化 loading、empty、error、disabled 等展示兜底。
4. 延续阶段 22A / 22B / 22C / 22C3 的浅灰背景、白色圆角卡片、社区绿色主色、暖橙金额、胶囊按钮和柔和阴影体系。
5. 用结构保护测试约束本阶段 UI 收口范围，避免把 mock 能力包装成真实上线能力。

## 本阶段允许

- 调整师傅端次级页面的 WXML / WXSS 布局与视觉层级。
- 少量修改页面 JS 中的展示字段归一化、状态映射、手机号脱敏、金额展示和空值兜底。
- 继续复用 `miniprogram/services/*`、`miniprogram/config/status.js`、`miniprogram/utils/format.js`、`miniprogram/utils/status-view.js`、`empty-state`、`loading-view` 和 `status-tag`。
- 为师傅订单详情、收益、评价、资料/审核/服务范围和消息入口补充结构保护测试。
- 更新 `docs/PROJECT_STATUS.md` 和新增阶段记录。

## 本阶段禁止

- 接入真实微信支付。
- 接入真实退款。
- 接入提现。
- 接入分账。
- 接入真实会员支付。
- 接入真实打赏支付。
- 接入真实保证金支付或退款。
- 接入真实身份证认证、营业执照认证、OCR、保险核验或真实风控。
- 新增自动派单。
- 新增 AI 派单。
- 新增路径规划、实时轨迹或 ETA。
- 修改订单状态机。
- 修改金额单位。
- 修改数据库字段语义。
- 修改云函数 action 名称或返回结构。
- 让前端直接决定支付成功、退款成功、订单完成、收益结算、财务流水生成、资质审核通过或风控解除。
- 为了 UI 效果硬编码假数据覆盖真实数据。
- 为了通过测试删除已有测试。
- 为了统一样式做全仓大面积格式化。

## mock/真实能力边界

当前支付、退款、打赏、会员、保证金、资质、保险、风控和财务流水仍然是 mock 或内部模拟阶段：

- 支付：只支持 mock 支付，真实微信支付未接入。
- 退款：只支持 mock 退款，真实微信退款未接入。
- 打赏：只支持 mock 打赏，真实打赏支付未接入。
- 会员：只支持 mock 会员开通，真实会员支付未接入。
- 保证金：只支持 mock 保证金，真实保证金支付和退款未接入。
- 财务流水：仅为内部模拟流水，无真实清算、分账或提现。
- 资质认证：仅为资料留档和人工审核展示，无真实身份证认证、营业执照认证或 OCR。
- 保险：仅为资料留档，无真实保险核验。
- 风控：仅为内部模拟/人工设置，无真实合规风控系统。
- 地图/LBS：仅为基础地图选点和服务范围配置，无路径规划、实时轨迹、ETA、自动派单或 AI 派单。

本阶段如展示收益、认证、审核、消息等内容，必须使用“模拟收益”“内部统计”“人工审核”“当前仅作展示”等不误导文案。

## 验收命令

```bash
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

阶段 22D 开始后新增结构保护测试：

```bash
node --test tests/phase22d_worker_secondary_ui.test.js
```

初始结果：预期失败，失败点集中在师傅端次级页面结构和阶段文档尚未完成。

最终验收结果：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase22d_worker_secondary_ui.test.js` | 通过，6/6 |
| `node --test tests/phase22d_worker_secondary_ui.test.js tests/phase23_worker_profile_navigation.test.js tests/role-ui-separation.test.js tests/phase16.finance-worker-earning.test.js tests/phase18.review-tip-appeal.test.js tests/phase6.review-order-close.test.js` | 通过，38/38 |
| `npm test` | 通过，262/262 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮未涉及交付包、发布清单、敏感文件或 clean candidate，未运行 `npm run check:release-risk -- <candidate-dir>`。

## 回滚与降级策略

- 本阶段仅修改展示层和文档，若页面出现问题，可优先回滚对应页面 WXML / WXSS / 展示字段归一化 JS。
- 不改云函数、不改 services、不改状态枚举、不改数据库结构，因此无需数据迁移回滚。
- 如收益或认证文案被误解为真实能力，应立即回退为 mock/内部模拟/人工审核表述。

## 下一阶段建议

1. 若继续 UI：可单独进入商家端或管理端 UI 收口阶段。
2. 若继续师傅端：可补充真机视觉验收和图片素材，不在 22D 中扩展真实业务能力。
3. 如进入真实支付、退款、提现、分账、认证或风控阶段，必须另起独立高风险阶段并补齐专项文档、验签、对账、回滚和人工验证方案。
