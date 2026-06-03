# 阶段 22C-2：用户端 UI 收口维护与验收记录

## 1. 本阶段目标

阶段 22C-2 只做用户端 UI 收口维护，不继续扩张为大规模重构。本阶段目标是同步 README 与开发记录索引，补齐少量用户可访问但 22C-1 未覆盖的页面，记录人工真机验收结论，并补充测试保护，确保不误改核心业务逻辑。

本阶段继续遵守：

- `docs/ui-style-guide.md`
- `miniprogram/styles/ui-kit.wxss`
- `docs/ui-refactor-guardrails.md`
- `docs/dev-records/22c-ui-style-extraction.md`
- `docs/dev-records/22c1-user-core-ui-refactor.md`

## 2. 当前用户端 UI 重构完成情况

当前已完成：

- 阶段 22A：首页 UI 重构。
- 阶段 22B：订单中心 UI 重构。
- 阶段 22C-0：UI 风格提取。
- 阶段 22C-1：用户端核心页面 UI 重构。
- 阶段 22C-2：用户端 UI 收口维护与验收记录。

阶段 22C-1 已覆盖服务浏览、交易链路、地址、消息、优惠券、会员、售后、评价、师傅详情、打赏和地图选点等用户端核心页面。本阶段仅补齐少量用户可访问补充页面。

## 3. 人工真机验收结论

人工真机验收已完成，视觉几乎没有问题。用户已在真机查看本次 UI 重构效果，并反馈本次重构实际视觉效果几乎没有问题。

## 4. 本阶段补齐页面

本阶段实际补齐页面：

| 页面 | 收口内容 |
| ---- | -------- |
| `miniprogram/pages/review/detail/detail` | 引入 `ui-kit.wxss`，切换为浅灰页面、统一标题、白色圆角卡片、暖橙评分和胶囊按钮 |
| `miniprogram/pages/review/followup/followup` | 引入 `ui-kit.wxss`，补齐统一标题、白色表单卡片、浅灰输入区和绿色胶囊提交按钮 |
| `miniprogram/pages/merchant/store-list/store-list` | 引入 `ui-kit.wxss`，补齐统一标题、白色商家卡片、渐变占位、加载状态和空状态 |
| `miniprogram/pages/merchant/store-detail/store-detail` | 引入 `ui-kit.wxss`，补齐店铺信息卡、服务卡片、暖橙价格、渐变占位、加载状态和空状态 |

检查到但不属于本阶段用户端收口范围的页面：

- 师傅端页面：`pages/worker/**`
- 商家后台页面：`pages/merchant/apply`、`pages/merchant/profile`、`pages/merchant/service-*`、`pages/merchant/order-*`、`pages/merchant/qualification`、`pages/merchant/deposit`、`pages/merchant/risk-status`
- 管理端页面：`pages/admin/**`
- 服务方配置页：`pages/provider/service-range/service-range`

这些页面建议进入后续“师傅端 / 商家端 / 管理端 UI 统一阶段”处理。

## 5. 本阶段未修改的核心业务文件

本阶段未修改：

- `cloudfunctions/**`
- `miniprogram/services/**`
- `schema/**`
- 订单状态机
- 支付逻辑
- 退款逻辑
- 财务流水逻辑
- 派单逻辑
- 商家审核逻辑
- 资质认证逻辑
- 保证金逻辑
- LBS 核心过滤逻辑
- 登录鉴权逻辑
- 数据库字段结构
- 接口参数结构

## 6. 数据库变化

无。

## 7. 云函数 / 接口变化

无。

## 8. Services 变化

无。

## 9. UI 收口修改清单

- `README.md`：同步当前阶段到 22C-2，并补充用户端 UI 可收束的下一阶段建议。
- `docs/dev-records/index.md`：同步当前阶段、阶段表、22C 详情和下一阶段建议。
- `docs/dev-records/22c2-user-ui-final-polish.md`：新增本阶段收口记录。
- `tests/phase22c2.user-ui-final-polish.test.js`：新增阶段保护测试。
- `review/detail`：轻量切换到 `ui-page`、`ui-card`、`ui-primary-button` 和暖橙评分视觉。
- `review/followup`：轻量切换到 `ui-page`、`ui-card`、统一输入区和胶囊提交按钮。
- `merchant/store-list`：轻量切换到 `ui-page`、商家卡片、加载状态和空状态。
- `merchant/store-detail`：轻量切换到 `ui-page`、店铺卡片、服务卡片、暖橙价格、加载状态和空状态。

## 10. 图片缺失占位处理

本阶段未引入随机网络图片。商家列表和店铺详情缺失图片均使用 `ui-media-placeholder` 渐变占位，保持固定尺寸，后续可替换为正式本地素材或云存储图片。

## 11. 状态展示、空状态、加载状态复用情况

- 状态展示：本阶段补齐页面未新增复杂状态机展示，不新增状态枚举。
- 空状态：商家列表、店铺详情继续使用 `empty-state`。
- 加载状态：评价详情、商家列表、店铺详情继续使用 `loading-view`。
- 标签与金额：评价标签使用胶囊样式，店铺服务价格使用 `ui-price` 暖橙强调。

## 12. 测试命令与结果

本阶段需运行：

```bash
npm run check:shared-sync
npm test
npm run check:release-risk -- <候选交付目录>
```

实际结果：

| 命令 | 结果 |
| ---- | ---- |
| `npm run check:shared-sync` | 通过，共享工具一致性检查通过 |
| `npm test` | 通过，246/246 |
| `npm run check:release-risk -- C:\Users\28276\AppData\Local\Temp\lcsmvp-22c2-candidate` | 通过，候选交付目录未发现敏感或本地生成文件 |

候选交付目录已排除 `.git`、`node_modules`、`miniprogram_npm`、`.vscode`、`参考`、真实 `project.config.json`、`project.private.config.json`、日志、压缩包、密钥和证书类文件。

## 13. 遗留问题

- 本阶段未继续对已通过真机验收的用户端核心页面做大规模视觉修改。
- 师傅端、商家后台端、管理端仍保留旧版 UI，建议后续独立进入 UI 统一阶段。
- 部分商家图片仍为渐变占位，后续可在素材策略明确后替换。

## 14. 下一阶段建议

下一阶段建议二选一：

1. 进入师傅端 / 商家端 / 管理端 UI 统一阶段，沿用 `docs/ui-style-guide.md` 与 `miniprogram/styles/ui-kit.wxss`。
2. 进入独立业务功能增强阶段，但不得与 UI 收口混在同一阶段。

继续禁止把真实支付、真实退款、真实提现、真实分账、真实身份证认证、真实营业执照认证、真实保险核验、真实保证金支付、自动派单、AI 派单、路径规划、实时轨迹、多门店、分佣、合伙人系统、新营销体系或新会员规则塞入 UI 收口阶段。

## 15. 阶段结论

用户端核心 UI 与用户可访问补充页面已完成基础收口，结合人工真机验收反馈，本阶段可视为用户端 UI 重构阶段完成。后续不建议继续在用户端进行大规模 UI 改动，只做小修小补；下一阶段可转入师傅端 / 商家端 / 管理端 UI 统一，或进入业务功能增强阶段。

结论确认：用户端 UI 重构阶段可以收束。
