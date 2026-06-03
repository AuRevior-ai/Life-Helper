# 阶段 19：商家端与店铺主页基础版

## 1. 阶段基本信息

- 阶段编号：19
- 阶段名称：商家端与店铺主页基础版
- 开始时间：2026-06-01
- 完成时间：2026-06-01
- 阶段状态：已完成基础版
- 当前版本：商家基础闭环 mock 版
- 优先级：P1
- 依赖阶段：阶段 15 服务区域与派单规则增强 V1、阶段 16 财务流水基础版

## 2. 本阶段目标

本阶段从“个人师傅”扩展到“个人师傅 / 商家店铺”双服务方模型。目标是在保留现有师傅端接单与订单闭环的基础上，增加商家入驻、管理员审核、店铺主页、商家服务项目、用户指定商家下单、商家订单流转和商家操作日志。

## 3. 本阶段完成内容

- [x] 新增 `merchant` 云函数。
- [x] 新增商家入驻、审核通过、审核拒绝、启用和禁用基础接口。
- [x] 新增 `service_providers` 统一服务方索引。
- [x] 新增商家服务项目配置。
- [x] 新增用户店铺列表和店铺详情基础页。
- [x] 新增用户指定商家服务下单的订单字段。
- [x] 新增商家订单列表、详情、接单、开始服务、完成服务。
- [x] 商家订单不进入个人师傅接单大厅。
- [x] 师傅不能接商家指定订单。
- [x] 财务流水和收益记录兼容 `provider_type = merchant`。
- [x] 新增商家操作日志。
- [x] 新增阶段 19 自动化测试。

## 4. 新增文件

| 文件                                                    | 作用                                         |
| ------------------------------------------------------- | -------------------------------------------- |
| `cloudfunctions/merchant/*`                             | 商家入驻、审核、服务、店铺、订单和日志云函数 |
| `cloudfunctions/order/merchant-read-repository.js`      | 订单云函数读取商家服务、商家和服务方索引     |
| `miniprogram/services/merchant.service.js`              | 前端商家云函数 action 服务                   |
| `miniprogram/pages/merchant/store-list/*`               | 用户店铺列表                                 |
| `miniprogram/pages/merchant/store-detail/*`             | 用户店铺主页                                 |
| `miniprogram/pages/merchant/apply/*`                    | 商家入驻申请                                 |
| `miniprogram/pages/merchant/audit-status/*`             | 商家审核状态                                 |
| `miniprogram/pages/merchant/profile/*`                  | 商家中心                                     |
| `miniprogram/pages/merchant/service-list/*`             | 商家服务列表                                 |
| `miniprogram/pages/merchant/service-edit/*`             | 商家服务配置                                 |
| `miniprogram/pages/merchant/order-list/*`               | 商家订单列表                                 |
| `miniprogram/pages/merchant/order-detail/*`             | 商家订单详情                                 |
| `miniprogram/pages/merchant/income/*`                   | 商家收益占位页                               |
| `miniprogram/pages/admin/merchant-list/*`               | 管理员商家列表                               |
| `miniprogram/pages/admin/merchant-detail/*`             | 管理员商家详情和审核                         |
| `tests/phase19.merchant-store-service-provider.test.js` | 阶段 19 自动化测试                           |

## 5. 修改文件

| 文件                                               | 修改原因                                    |
| -------------------------------------------------- | ------------------------------------------- |
| `cloudfunctions/order/handler.js`                  | 支持 `merchantServiceId` 下单和商家订单字段 |
| `cloudfunctions/order/index.js`                    | 注入商家只读仓储                            |
| `cloudfunctions/worker/handler.js`                 | 师傅接单大厅排除商家订单                    |
| `cloudfunctions/finance/handler.js`                | 财务记录兼容商家服务方字段                  |
| `miniprogram/config/constants.js`                  | 新增商家云函数和集合常量                    |
| `miniprogram/config/status.js`                     | 新增服务方、商家、商家服务状态常量          |
| `miniprogram/app.json`                             | 注册阶段 19 页面                            |
| `miniprogram/pages/order-submit/order-submit.js`   | 支持店铺服务下单入口参数                    |
| `miniprogram/pages/order-detail/order-detail.wxml` | 展示订单商家快照                            |
| `miniprogram/pages/admin/dashboard/*`              | 增加商家管理入口                            |
| `README.md`                                        | 更新当前阶段、能力说明和测试数量            |
| `docs/dev-records/index.md`                        | 更新阶段状态、完成项和遗留问题              |

## 6. 数据库变化

新增集合：

- `merchants`
- `merchant_services`
- `service_providers`
- `merchant_action_logs`

`orders` 新增兼容字段：

- `provider_type`
- `provider_id`
- `merchant_id`
- `provider_snapshot`
- `merchant_service_snapshot`

`finance_logs` 和 `worker_earnings` 新增兼容字段：

- `provider_type`
- `provider_id`
- `merchant_id`

## 7. 云函数 / 接口变化

新增 `merchant` 云函数 action：

- `applyMerchant`
- `getMyMerchantInfo`
- `getMerchantAuditStatus`
- `createMerchantService`
- `getMerchantServiceList`
- `enableMerchantService`
- `disableMerchantService`
- `getStoreList`
- `getStoreDetail`
- `getStoreServices`
- `getMerchantOrderList`
- `getMerchantOrderDetail`
- `merchantAcceptOrder`
- `merchantStartService`
- `merchantFinishService`
- `adminGetMerchantList`
- `adminGetMerchantDetail`
- `adminApproveMerchant`
- `adminRejectMerchant`
- `adminEnableMerchant`
- `adminDisableMerchant`
- `adminGetMerchantOrders`
- `adminGetMerchantActionLogs`

## 8. 服务方模型设计说明

个人师傅继续保留在 `workers` 集合中，商家资料独立存储在 `merchants` 集合中。`service_providers` 作为统一服务方索引，记录 `provider_type = worker / merchant`，为后续附近服务商、统一派单、合伙人分佣和 PC 后台统一管理打基础。

订单保存 `provider_snapshot`，避免商家改名、换 Logo 或禁用后影响历史订单展示和财务口径。

## 9. 商家入驻与审核流程说明

用户提交商家入驻
↓
写入 `merchants`
↓
写入 `merchant_action_logs`
↓
管理员审核
↓
审核通过后同步 `service_providers`
↓
商家配置服务项目
↓
商家可接单

## 10. 店铺主页与商家服务流程说明

商家配置服务
↓
用户查看店铺主页
↓
用户选择店铺服务
↓
创建指定商家订单
↓
商家接单并完成服务

## 11. 商家订单流程说明

商家订单沿用现有订单状态机：待支付、待接单、已接单、服务中、待评价、已完成。用户仍可以评价和申请售后，财务完成后仍生成平台抽佣和服务方收益。本阶段只做兼容扩展，不重写订单、售后、财务和评价主流程。

## 12. 关键技术决策

- 不把商家塞入 `workers`，避免营业执照、店铺主页、服务项目、多门店等字段污染师傅模型。
- 使用 `service_providers` 统一索引，避免后续每个查询都分别查 `workers` 和 `merchants`。
- 订单保存 `provider_snapshot`，保证历史订单稳定。
- 一个用户只允许一个商家，避免第一版引入多门店复杂度。
- 本阶段不做连锁商家、多门店、员工排班和真实商家分账，控制风险。
- `worker_earnings` 暂保留历史命名，通过 `provider_type` 兼容商家收益。

## 13. 安全与权限说明

- 用户只能提交自己的商家申请。
- 非管理员不能审核、启用或禁用商家。
- 用户只能查看审核通过且状态正常的店铺。
- 商家只能管理自己的服务和订单。
- 个人师傅不能操作商家订单。
- 商家禁用后不能接新订单。
- 商家资料中的资质图片当前仅保存引用，不做公开展示。

## 14. 已知问题与遗留事项

- 当前不支持连锁商家。
- 当前不支持多门店。
- 当前不支持商家员工管理。
- 当前不支持商家排班。
- 当前不支持真实营业执照认证。
- 当前不支持商家保证金。
- 当前不支持真实商家分账。
- 当前不支持管理员指派给商家。
- 当前收益表命名仍保留 `worker_earnings` 历史兼容问题。
- 当前商家收益页为基础占位，完整收益筛选和提现后续阶段处理。

## 15. 测试记录

新增测试：

- `tests/phase19.merchant-store-service-provider.test.js`

测试命令：

```bash
npm test
```

测试结果：

- tests：133
- pass：133
- fail：0

## 16. 运行与验证方式

真机测试前新增集合：

- `merchants`
- `merchant_services`
- `service_providers`
- `merchant_action_logs`

重新上传云函数：

- `merchant`
- `order`
- `worker`
- `finance`

验证步骤：

1. 用户进入商家入驻页提交店铺资料。
2. 管理员进入商家管理审核通过。
3. 商家进入服务项目页配置平台服务。
4. 用户进入店铺列表和店铺主页。
5. 用户选择店铺服务下单并模拟支付。
6. 商家进入订单列表接单、开始服务、完成服务。
7. 用户评价商家订单。
8. 检查财务流水和收益记录是否带有 `provider_type = merchant`。

## 17. 对下一阶段的影响

本阶段为保证金、资质认证、小区合伙人、城市合伙人、分佣规则、结算提现、连锁商家和 PC 后台商家管理打基础。

## 18. 下一阶段开发计划

建议下一阶段进入：

- 阶段 20：保证金、资质认证与入驻风控基础版

原因：商家模型建立后，下一步最需要补的是资质、保证金和入驻风控，否则商家能力继续扩展会缺少准入边界。

## 19. 本阶段复盘

### 做得好的地方

- 商家模型与个人师傅模型分离，避免污染旧流程。
- 商家订单沿用旧订单状态机，降低回归风险。
- 财务兼容字段不要求立即迁移历史集合名。

### 不足的地方

- 页面仍是基础验证版。
- 商家收益页尚未细化。
- 管理员指派给商家暂未实现。

### 后续改进建议

- 增加商家资质和保证金审核。
- 增加商家评分聚合。
- 后续将 `worker_earnings` 迁移或抽象为 `provider_earnings`。

## 20. 阶段结论

阶段 19 已完成商家基础闭环，自动化测试全部通过。当前可以进入真机 mock 验证，但不能宣称支持真实商家分账、真实营业执照认证、商家保证金、连锁商家或多门店。
