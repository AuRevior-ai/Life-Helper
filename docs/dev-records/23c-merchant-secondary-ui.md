# 阶段 23C：商家端二级页面 UI 收口

## 阶段名称

阶段 23C：商家端二级页面 UI 收口。

## 阶段目标

在阶段 23B 商家端一级页面 UI 统一之后，分批收口商家端二级页面。目标是在不改变商家入驻、服务创建、订单流转、资质、保证金、风控、支付、退款、财务和权限语义的前提下，统一页面壳、二级页头部、浅灰背景、白色圆角卡片、低密度表单和 mock/人工审核/内部模拟边界说明。

## 本轮处理范围

阶段 23C 已启动，第一批低风险页面、第二批订单详情页和第三批高风险边界页均已完成基础收口：

- `miniprogram/pages/merchant/apply/*`
- `miniprogram/pages/merchant/service-edit/*`
- `miniprogram/pages/merchant/order-detail/*`
- `miniprogram/pages/merchant/qualification/*`
- `miniprogram/pages/merchant/deposit/*`
- `miniprogram/pages/merchant/risk-status/*`

不纳入本轮：`store-list`、`store-detail`、`audit-status`、`profile`、`service-list`、`order-list`、`income` 和统一消息中心。

## 页面清单

| 页面 | 路径 | 批次 | 当前处理 |
| ---- | ---- | ---- | -------- |
| 商家入驻申请 | `pages/merchant/apply/apply` | 第一批 | 已完成基础收口 |
| 服务编辑 | `pages/merchant/service-edit/service-edit` | 第一批 | 已完成基础收口 |
| 订单详情 | `pages/merchant/order-detail/order-detail` | 第二批 | 已完成基础收口 |
| 资质认证 | `pages/merchant/qualification/qualification` | 第三批 | 已完成基础收口 |
| 保证金 | `pages/merchant/deposit/deposit` | 第三批 | 已完成基础收口 |
| 风控状态 | `pages/merchant/risk-status/risk-status` | 第三批 | 已完成基础收口 |

## 第一批完成页面

- 商家入驻申请页：统一页面壳、资料分组、提交区和人工审核说明。
- 服务编辑页：统一页面壳、服务信息表单、价格单位说明、保存区和服务调用边界说明。

两个页面均使用 `/styles/merchant-theme.wxss` 绝对路径引入商家端统一主题，保留原有 submit 事件、原有 `merchantService.applyMerchant(this.data.form)` 和 `merchantService.createMerchantService(this.data.form)` 调用。

## 第二批完成页面

- 商家订单详情页：统一二级页头部、订单状态卡、服务信息卡、客户与地址卡、金额信息卡和订单操作区。

订单详情页保留既有接单、开始服务和完成服务事件，继续调用 `merchantService.getMerchantOrderDetail`、`merchantService.merchantAcceptOrder`、`merchantService.merchantStartService` 和 `merchantService.merchantFinishService`。页面层只做展示字段归一化、loading/error 和按钮提交中状态，不改变订单状态机，不让前端直接决定订单完成、支付成功或收益结算。

## 第三批完成页面

- 资质认证页：统一资料留档表单、审核状态卡和人工审核边界说明。
- 保证金页：统一 mock 保证金状态卡、模拟缴纳/退还操作区和真实资金边界说明。
- 风控状态页：统一准入进度、经营权限、风险等级和内部模拟风控说明。

第三批资质认证、保证金、风控状态页面继续使用既有 `qualificationService` 调用。资质、保证金和风控仍是 mock、资料留档、人工审核或内部模拟能力，不接入真实身份证认证、营业执照认证、OCR、真实保证金支付/退款或真实合规风控。

## 未修改的业务逻辑

- 不修改云函数。
- 不修改 `miniprogram/services/*`。
- 不修改 schema。
- 不修改订单状态机。
- 不修改支付状态、退款状态、售后状态、财务状态。
- 不修改金额单位。
- 不修改数据库字段语义。
- 不修改云函数 action 名称或返回结构。
- 不修改权限判断。
- 不删除旧页面或已有测试。

## 数据库变化

无。本阶段不新增集合、不新增字段、不做数据迁移。

## 云函数变化

无。本阶段不修改 `cloudfunctions/**`，不新增 action，不改变返回结构。

## service 变化

无。本阶段不修改 `miniprogram/services/*`。页面继续使用既有 `merchantService` 和 `qualificationService`。

## mock / 真实能力边界

- 商家入驻申请仍是平台内资料提交和人工审核流程，不代表真实营业执照认证、真实身份证认证、真实 OCR 或保险核验已接入。
- 服务编辑仍使用既有商家服务创建接口，不新增自动审核、真实库存、智能定价或真实经营资质校验。
- 订单详情仍使用既有商家订单接口，接单、开始服务和完成服务均由后端校验状态流转；前端不直接决定订单完成、支付成功或收益结算。
- 资质认证仍是资料留档与人工审核展示，不接入真实身份证认证、真实营业执照认证或 OCR。
- 保证金仍是 mock 保证金流程，不产生真实扣款、退款或冻结。
- 风控仍是内部模拟与人工设置，不代表真实合规审核或自动风控。
- 本阶段不接入真实微信支付、真实退款、提现、分账、真实会员支付、真实打赏支付、真实保证金支付或退款。
- 本阶段不接入真实风控、自动派单、AI 派单、路径规划、实时轨迹或 ETA。

## 测试记录

新增并扩展结构保护测试：

```bash
node --test tests/phase23c_merchant_secondary_ui.test.js
```

RED 记录：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase23c_merchant_secondary_ui.test.js` 第一批 | 失败，6 个测试中 3 个通过、3 个预期失败 |
| `node --test tests/phase23c_merchant_secondary_ui.test.js` 第二批 | 失败，7 个测试中 6 个通过、1 个预期失败 |
| `node --test tests/phase23c_merchant_secondary_ui.test.js` 第三批 | 失败，8 个测试中 6 个通过、2 个预期失败 |

最终 GREEN 记录：

| 命令 | 结果 |
| ---- | ---- |
| `node --test tests/phase23c_merchant_secondary_ui.test.js` | 通过，8/8 |
| `node --test tests/phase23b_merchant_primary_ui.test.js` | 通过，8/8 |
| `npm test` | 通过，293/293 |
| `npm run check:shared-sync` | 通过 |
| `npm run check:cloudfunction-deps` | 通过 |
| `git diff --check` | 通过 |

本轮不涉及交付包、发布清单、敏感文件或 clean candidate，默认不运行 `npm run check:release-risk -- <candidate-dir>`。

## 遗留事项

- 本轮不做微信开发者工具或真机截图验收记录。
- 商家端二级页面已完成本阶段基础收口；后续如需继续优化，应以真机视觉抽查或具体交互问题为入口。

## 下一批建议

阶段 23C 不建议继续扩页。若继续 UI，建议转入管理员端二级页面或做商家端真机视觉微调；若进入真实支付、退款、认证、保证金或风控，必须另起独立高风险阶段。

## 阶段结论

阶段 23C 已启动，第一批低风险页面、第二批订单详情页和第三批高风险边界页均已完成基础收口；未修改云函数、services、schema 或订单状态机，未接入任何真实资金、认证或风控能力。
