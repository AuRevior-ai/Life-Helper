# 阶段 22C 前置工程维护与公开配置收口

## 1. 阶段基本信息

- 阶段编号：22C 前置维护
- 阶段名称：工程维护与 UI 重构前收口
- 开始时间：2026-06-03
- 完成时间：2026-06-03
- 阶段状态：已完成

## 2. 本阶段目标

在进入阶段 22C 前，同步 README 与阶段索引中的当前阶段表述，移除公开仓库中真实 `project.config.json` 的跟踪风险，并补充后续 UI 重构 Agent 需要遵守的工程维护说明。

## 3. 本阶段完成内容

- [x] README 当前阶段同步为阶段 22B 已完成、下一阶段 22C。
- [x] README 补充本地运行配置说明：首次使用复制 `project.config.example.json` 为 `project.config.json`，填写自己的 AppID 和本地配置。
- [x] `project.config.json` 从 git 跟踪中移除，保留本地文件和 `project.config.example.json`。
- [x] 阶段索引补充 22C 前置维护记录。
- [x] 阶段索引补充 GitHub raw 抓取或网页渲染单行显示不得直接判定为源码格式问题的说明。
- [x] 阶段 22C 计划补充状态展示迁移规则：用户端页面状态文案和状态 tone 逐步迁移到 `getStatusView(type, status)`，并优先通过 `status-tag` 展示。

## 4. 新增文件

| 文件 | 说明 |
| ---- | ---- |
| `docs/dev-records/22c-pre-maintenance.md` | 22C 前置工程维护记录 |

## 5. 修改文件

| 文件 | 说明 |
| ---- | ---- |
| `README.md` | 同步当前阶段、下一阶段和本地 `project.config.json` 使用说明 |
| `docs/dev-records/index.md` | 更新阶段记录、后续原则、22C 计划和下一阶段建议 |

## 6. 删除或废弃文件

未删除本地文件。`project.config.json` 仅从 git 跟踪中移除，仍由开发者本地保留；公开仓库和交付包只保留 `project.config.example.json`。

## 7. 数据库变化

无数据库结构变化。

## 8. 云函数 / 接口变化

无云函数、接口或 services 调用层变化。

## 9. 核心逻辑说明

本轮只做工程维护与文档收口，不修改订单、支付、退款、财务、派单、商家、资质、保证金、LBS 等核心业务逻辑，不改变现有数据结构，不删除已有页面、云函数或服务调用。

## 10. 关键技术决策

- `project.config.json` 属于本地开发配置，不应公开跟踪；公开模板继续使用 `project.config.example.json`。
- GitHub raw 抓取或网页渲染显示源码为单行，不得直接作为工程问题；只有通过 zip、本地源码、微信开发者工具或可靠文件内容确认后，才能将格式异常列为问题。
- 阶段 22C 不强行全量迁移所有页面状态展示，但新增用户端 UI 改动时应优先使用 `getStatusView(type, status)` 与 `status-tag`。

## 11. 安全与权限说明

本轮未新增密钥、证书、token、真实支付参数、地图 key 或个人身份认证能力。公开交付目录仍不得包含真实 `project.config.json`、`project.private.config.json`、密钥、证书、token、`node_modules`、压缩包或日志文件。

## 12. 已知问题与遗留事项

- 真实微信支付、真实退款、真实提现、真实认证、真实保证金支付仍未接入。
- 阶段 22C 的用户端页面 UI 同步尚未开始。
- 状态展示迁移仍是渐进规则，尚未全量覆盖所有用户端页面。

## 13. 测试记录

本轮已运行：

```bash
npm run check:shared-sync
npm test
npm run check:release-risk -- <候选交付目录>
```

已完成结果：

| 命令 | 结果 |
| ---- | ---- |
| `npm run check:shared-sync` | 通过，共享工具一致性检查通过 |
| `npm test` | 通过，230/230 |
| `npm run check:release-risk -- <候选交付目录>` | 通过，候选交付目录不包含敏感或本地生成文件 |

## 14. 运行与验证方式

首次本地运行前，复制 `project.config.example.json` 为 `project.config.json`，填写自己的 AppID 和本地配置，再用微信开发者工具打开项目根目录。

## 15. 对下一阶段的影响

阶段 22C 可以直接进入用户端核心页面 UI 同步，建议优先顺序为：我的页 `profile`、服务列表 `service-list`、服务详情 `service-detail`、地址列表 `address-list`、消息中心 `message-list`、优惠券和会员等用户端辅助页面。

## 16. 下一阶段开发计划

阶段 22C 只做用户端核心页面 UI 同步与交互体验统一，延续阶段 22A/22B 的浅灰页面背景、白色大圆角卡片、社区绿色主色、暖橙价格、胶囊按钮、柔和阴影、统一空状态、统一加载状态和状态标签规范。

## 17. 下一阶段开始前必须确认的问题

1. 严格遵守 `docs/ui-refactor-guardrails.md`。
2. 状态标签优先走 `getStatusView(type, status)` 和 `status-tag`。
3. 不新增真实支付、真实退款、真实分账、真实提现、真实认证、自动派单、AI 派单、路径规划、实时轨迹、多门店、分佣或合伙人系统。

## 18. 本阶段复盘

本轮主要价值在于降低公开配置泄露风险，并把阶段 22C 的范围重新钉在“用户端 UI 同步”上，避免后续把派单、资金或合伙人等业务能力误塞入 UI 阶段。

## 19. 阶段结论

阶段 22C 前置工程维护已完成。完成自测且交付风险扫描通过后，可以进入阶段 22C。
