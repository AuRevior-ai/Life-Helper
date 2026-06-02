# 阶段 21.5：UI 重构前工程结构体检与收口

## 1. 阶段基本信息

- 阶段编号：21.5
- 阶段名称：UI 重构前工程结构体检与收口
- 开始时间：2026-06-02
- 完成时间：2026-06-02
- 阶段状态：已完成基础版

## 2. 本阶段目标

阶段 21 已完成 LBS 地图与服务区域增强，项目即将进入阶段 22 UI视觉重构与交互体验统一 V1。UI 重构会触达大量页面和组件，如果没有工程边界，容易误改订单、支付、退款、财务、派单、商家、资质、保证金和 LBS 等核心业务逻辑。本阶段先补齐共享工具同步检查、状态展示统一出口、UI 改造保护清单、入口文档和自动化测试保护。

## 3. 本阶段完成内容

- [x] 检查 `cloudfunctions/_shared` 与各云函数 `_shared` 副本一致性。
- [x] 新增共享工具同步脚本。
- [x] 新增共享工具一致性检查脚本。
- [x] 在 `package.json` 增加 `check:shared-sync`。
- [x] 新增 `miniprogram/utils/status-view.js`，统一状态文案和 tone 输出。
- [x] 在订单列表状态筛选中接入 `status-view` 作为示例。
- [x] 新增 `docs/ui-refactor-guardrails.md`。
- [x] 新增阶段 21.5 保护测试。
- [x] 更新 `README.md` 与 `docs/dev-records/index.md`。

## 4. 新增文件

| 文件 | 说明 |
|---|---|
| `scripts/sync-cloudfunction-shared.js` | 将根共享工具同步到各云函数 `_shared` 副本 |
| `scripts/check-cloudfunction-shared-sync.js` | 检查根共享工具与各副本是否一致 |
| `miniprogram/utils/status-view.js` | 统一输出状态展示 `{ text, tone }` |
| `docs/ui-refactor-guardrails.md` | UI 阶段业务保护清单 |
| `docs/dev-records/21_5_pre-ui-engineering-hardening.md` | 本阶段开发记录 |
| `tests/phase21_5.pre-ui-engineering-hardening.test.js` | UI 重构前工程保护测试 |

## 5. 修改文件

| 文件 | 说明 |
|---|---|
| `package.json` | 新增 `check:shared-sync` |
| `README.md` | 明确当前最新阶段、21.5 前置收口和阶段 22 UI 重构方向 |
| `docs/dev-records/index.md` | 增加阶段 21.5 并更新下一阶段入口 |
| `miniprogram/pages/order-list/order-list.js` | 示例接入 `status-view` 输出订单状态文案 |

## 6. 共享工具同步检查

当前微信云函数单独上传时需要携带本函数目录内的 `_shared` 副本。根目录 `cloudfunctions/_shared` 仍是权威来源，各云函数目录下的 `_shared` 是部署包副本。

- `scripts/sync-cloudfunction-shared.js`：遍历包含 `package.json` 的云函数目录，将根 `_shared` 复制到本地副本。
- `scripts/check-cloudfunction-shared-sync.js`：比较文件列表和 SHA-256 内容哈希，如缺失、额外文件或内容不一致则失败。
- `npm run check:shared-sync`：用于本地提交前和 UI 阶段回归检查。

本阶段不改变共享工具业务逻辑。

## 7. 状态展示工具说明

`miniprogram/utils/status-view.js` 提供：

```js
getStatusView(type, status)
```

返回：

```js
{
  text: '待审核',
  tone: 'warning'
}
```

当前支持订单、支付、售后、退款、财务、结算、会员、优惠券、商家审核、商家状态、资质、保证金、风控、准入和 LBS 匹配状态。后续 UI 阶段可以逐页将散落的 `statusText` 和自定义状态样式迁移到该工具，`status-tag` 组件继续只负责展示。

## 8. UI 重构保护规则

已新增 `docs/ui-refactor-guardrails.md`，明确 UI 阶段允许修改页面展示、组件、样式和少量展示字段组装；禁止修改订单状态机、支付、退款、财务生成、派单匹配、商家入驻、资质保证金准入和真实资金能力。UI 阶段不得绕过 services 层，也不得删除现有服务调用。

## 9. 交付风险说明

开发目录包含 `.git`、`project.config.json`、可能存在的 `project.private.config.json` 和本地开发生成文件。交付目录必须与开发目录区分，公开交付时不得包含 `.git`、`project.private.config.json`、证书、私钥、真实支付配置、日志、压缩包和 `node_modules`。`project.config.example.json` 用于公开模板，真实 AppID 和私有配置由接收方在本地配置。

## 10. 测试记录

- `node --test tests/phase21_5.pre-ui-engineering-hardening.test.js`
- `npm run check:shared-sync`
- `npm test`

最终执行结果以本阶段实际命令输出为准。

## 11. 已知问题与遗留事项

- 本阶段只建立 `status-view` 和示例接入，未全量替换所有页面状态展示。
- UI 阶段仍需逐页迁移散落的自定义状态样式。
- 当前共享工具副本机制仍依赖同步脚本，未来可考虑构建期自动同步。

## 12. 对阶段 22 的影响

阶段 22 可以聚焦 UI视觉重构与交互体验统一，减少误改业务逻辑、共享工具副本失配、状态标签风格散落和交付包泄密风险。

## 13. 下一阶段计划

阶段 22：UI视觉重构与交互体验统一 V1

## 14. 本阶段复盘

### 做得好的地方

- 先用测试锁住 UI 重构前必须存在的工程保护项。
- 共享工具同步从人工约定升级为脚本和检查命令。
- 状态展示新增统一出口，避免 UI 阶段继续复制状态 tone。

### 不足的地方

- 尚未全量迁移页面状态展示。
- 共享工具仍保留多副本部署结构，长期看仍有维护成本。

### 后续改进建议

- 阶段 22 按页面逐步迁移 `status-view`。
- 每次云函数共享工具改动后运行 `npm run check:shared-sync`。
- UI 阶段每个页面改造都应保留服务调用和状态机边界。

## 15. 阶段结论

阶段 21.5 已完成基础工程收口。通过测试后，可以进入阶段 22 UI视觉重构与交互体验统一 V1。
