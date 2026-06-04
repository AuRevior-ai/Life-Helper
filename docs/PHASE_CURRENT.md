# PHASE_CURRENT.md

本文件记录当前正在执行或刚完成的工程阶段。它只描述当前阶段事实，不替代长期协作规则；长期规则见 `AGENT.MD`。

## 阶段名称

阶段 23C：商家端二级页面 UI 收口已完成基础版

## 阶段状态

阶段 23B 商家端一级页面 UI 统一已完成、已提交并推送；23B 文档状态已通过 `fa2b4a5 docs: sync phase 23B handoff status` 单独收口。

23B checkpoint：阶段 23B：商家端一级页面 UI 统一；已验收、已提交并推送。阶段 23B 不修改云函数，不修改 services，不修改 schema，不修改订单状态机，并保留 mock/真实能力边界说明。

阶段 23C 已按三批完成商家端二级页面基础收口：第一批商家入驻申请和服务编辑；第二批商家订单详情；第三批资质认证、保证金和风控状态。范围限定为展示层、结构保护测试和阶段文档；页面 JS 仅新增展示字段归一化、loading、error、按钮提交中状态和返回辅助，不改变提交参数、服务调用、金额单位、订单状态机或数据库语义。

阶段 23C 不是新业务能力阶段，不接入真实支付、真实退款、提现、分账、真实认证、OCR、保险核验、真实保证金支付或真实风控。

## 本阶段目标

1. 新增阶段 23C 商家端二级页面 UI 收口结构保护测试。
2. 新增阶段 23C 阶段文档。
3. 第一批收口 `pages/merchant/apply/apply` 和 `pages/merchant/service-edit/service-edit`。
4. 第二批收口 `pages/merchant/order-detail/order-detail`。
5. 第三批收口 `pages/merchant/qualification/qualification`、`pages/merchant/deposit/deposit` 和 `pages/merchant/risk-status/risk-status`。
6. 保留既有 service 调用、订单状态机、mock/人工审核/内部模拟边界。

## 本阶段允许

- 调整本阶段六个商家端二级页面 WXML / WXSS 布局与视觉层级。
- 少量修改页面 JS 中的展示字段归一化、loading、error、提交中状态和跳转辅助。
- 使用 `/styles/merchant-theme.wxss` 绝对路径引入商家端统一主题。
- 新增 `tests/phase23c_merchant_secondary_ui.test.js`。
- 新增或更新 `docs/dev-records/23c-merchant-secondary-ui.md`。
- 更新 `README.md`、`docs/PROJECT_STATUS.md`、`docs/PHASE_CURRENT.md` 和 `docs/dev-records/index.md`。

## 本阶段禁止

- 修改云函数。
- 修改 `miniprogram/services/*`。
- 修改 schema。
- 修改订单状态机。
- 修改金额单位。
- 修改数据库字段语义。
- 修改云函数 action 名称或返回结构。
- 修改权限判断。
- 修改支付、退款、财务、派单、商家、资质、保证金、风控核心逻辑。
- 让前端直接决定支付成功、退款成功、订单完成、收益结算、财务流水生成、资质审核通过、保证金缴纳成功或风控解除。
- 接入真实微信支付、真实微信退款、提现、分账、真实会员支付、真实打赏支付、真实保证金支付或退款。
- 接入真实身份证认证、营业执照认证、OCR、保险核验或真实风控。
- 新增自动派单、AI 派单、路径规划、实时轨迹或 ETA。
- 将 mock、内部模拟或人工审核能力包装成真实上线能力。
- 删除旧页面、删除已有测试或做全仓无关格式化。

## 本轮页面清单

| 页面 | 路径 | 本轮状态 |
| ---- | ---- | -------- |
| 商家入驻申请 | `pages/merchant/apply/apply` | 第一批已完成基础收口 |
| 服务编辑 | `pages/merchant/service-edit/service-edit` | 第一批已完成基础收口 |
| 订单详情 | `pages/merchant/order-detail/order-detail` | 第二批已完成基础收口 |
| 资质认证 | `pages/merchant/qualification/qualification` | 第三批已完成基础收口 |
| 保证金 | `pages/merchant/deposit/deposit` | 第三批已完成基础收口 |
| 风控状态 | `pages/merchant/risk-status/risk-status` | 第三批已完成基础收口 |

## mock/真实能力边界

当前支付、退款、打赏、会员、保证金、资质、保险、风控和财务流水仍然是 mock、人工审核、资料留档或内部模拟阶段：

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

## 验收命令

```bash
node --test tests/phase23c_merchant_secondary_ui.test.js
node --test tests/phase23b_merchant_primary_ui.test.js
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
| `node --test tests/phase23c_merchant_secondary_ui.test.js` | 通过，8/8 |
| `node --test tests/phase23b_merchant_primary_ui.test.js` | 通过，8/8 |
| `npm test` | 通过，293/293 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不涉及交付包、发布清单、敏感文件或 clean candidate，未运行 `npm run check:release-risk -- <candidate-dir>`。

## 回滚与降级策略

- 本阶段仅修改商家端二级页面展示层、少量展示辅助 JS、测试和文档；若页面出现问题，可优先回滚对应页面 WXML / WXSS / JSON / 展示辅助 JS。
- 不改云函数、不改 services、不改状态枚举、不改数据库结构，因此无需数据迁移回滚。
- 如入驻、服务、订单、资质、保证金、风控或收益文案被误解为真实能力，应立即回退为 mock/内部模拟/人工审核表述。

## 下一阶段建议

1. 阶段 23C 已完成基础版，不建议继续扩大商家端二级页范围。
2. 如继续 UI，建议转入管理员端二级页面，或基于真机反馈做局部视觉微调。
3. 如进入真实支付、退款、提现、分账、认证或风控阶段，必须另起独立高风险阶段并补齐专项文档、验签、对账、回滚和人工验证方案。
