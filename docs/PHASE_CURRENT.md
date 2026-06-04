# PHASE_CURRENT.md

本文件记录当前正在执行或刚完成的工程阶段。它只描述当前阶段事实，不替代长期协作规则；长期规则见 `AGENT.MD`。

## 阶段名称

工程维护与发布治理收口阶段

## 阶段状态

已完成本轮收口，等待下一阶段规划。

本轮收口提交：

- `bb16708 fix: tighten merchant identity and payment notify boundaries`

## 本阶段目标

1. 修复当前工程基础风险。
2. 确保自动化测试基线稳定在 256/256。
3. 明确 mock 与真实能力边界。
4. 收紧商家身份、消息和跳转边界。
5. 加固 `payment.handlePayNotify`，避免被误认为生产真实支付回调入口。
6. 治理中文资源名编码和交付候选风险。

## 本阶段已完成

- 新增前端 `USER_ROLE.MERCHANT = "merchant"` 和“商家”身份文案。
- 选择商家端后 active role 设置为 `merchant`，不再挂在 `worker` 身份下。
- 普通“我的”页增加 `isMerchantIdentity`，商家入口从师傅身份区块拆出。
- 消息中心按当前 active role 拉取消息，并支持商家订单/审核消息跳转。
- `payment.handlePayNotify` 默认拒绝无验签 notify；测试模拟需显式注入 `env.notifyVerifier` 或 `env.allowMockNotify === true`。
- 新增 `.gitattributes`，治理行尾和图片/文档二进制文件识别。
- 更新 22C3 阶段记录和微信支付说明。
- 修复中文资源名在 Git 状态中显示为 `#Uxxxx` 的编码问题。

## 本阶段允许

- 修复文档测试基线。
- 修复发布包风险。
- 收紧商家身份边界。
- 加固支付 notify 防误用。
- 补充相关测试。
- 更新工程治理文档。

## 本阶段禁止

- 接入真实微信支付。
- 接入真实退款。
- 接入提现。
- 接入分账。
- 接入真实会员支付。
- 接入真实打赏支付。
- 接入真实保证金支付或退款。
- 接入真实身份证认证、营业执照认证、OCR、保险核验或真实风控。
- 修改订单状态机。
- 改变金额单位。
- 新增自动派单。
- 新增 AI 派单。
- 删除已有页面或云函数。

## 验收命令

```bash
npm test
npm run check:shared-sync
npm run check:cloudfunction-deps
git diff --check
npm run check:release-risk -- <candidate-dir>
```

## 最近一次验收结果

| 命令 | 结果 |
| ---- | ---- |
| `npm test` | 通过，256/256 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |
| `npm run check:release-risk -- <candidate-dir>` | 通过 |

最近一次 clean candidate：

```text
C:\Users\28276\AppData\Local\Temp\life-helper-clean-candidate-20260604094611
```

## 回滚与降级策略

- 商家身份拆分如出现问题，可优先回滚前端 active role 与消息跳转改动，不改 `users.role` 主字段。
- `payment.handlePayNotify` 护栏如影响测试，应显式使用 `env.notifyVerifier` 或 `env.allowMockNotify === true`，不得移除无验签保护。
- `.gitattributes` 只做新增规则，不做全仓行尾归一化；如后续需要归一化，应独立提交。

## 下一阶段建议

1. 继续师傅端次级页面 UI 收口，例如订单详情、收益、评价、资料页。
2. 或进入商家端 / 管理端 UI 统一阶段。
3. 如进入真实支付、退款、提现、认证或风控阶段，必须另起独立高风险阶段并补齐专项文档、验签、对账和回滚方案。
