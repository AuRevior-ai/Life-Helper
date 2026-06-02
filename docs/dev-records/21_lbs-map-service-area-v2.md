# 阶段 21：LBS 地图与服务区域增强 V2

## 1. 阶段基本信息

- 阶段名称：LBS 地图与服务区域增强 V2
- 阶段状态：已完成基础版
- 完成日期：2026-06-02
- 依赖阶段：阶段 15 服务区域与派单规则增强 V1、阶段 19 商家端与服务方模型

## 2. 本阶段目标

从文本小区匹配升级到地图选点、经纬度快照、半径模式和行政区模式，统一用户地址、订单快照、接单大厅、管理员指派和店铺距离排序的 LBS 基础规则。

## 3. 本阶段完成内容

- 新增 LBS 共享工具，支持 Haversine 距离、半径命中、行政区命中、历史小区文本兼容和距离排序。
- 地址保存经纬度、POI、行政区编码和地图来源。
- 订单创建时保存下单地址快照与经纬度快照。
- 服务区域支持地图中心点字段和管理员地图列表。
- 师傅支持配置半径模式、行政区模式、常驻点和服务半径。
- 接单大厅按 LBS 服务范围过滤订单，并返回 `lbs_match`。
- 管理员指派候选人按 LBS 过滤，并预留统一服务方候选接口。
- 商家店铺列表在传入用户坐标时按距离排序。
- 新增地图选点页和服务方服务范围配置页。

## 4. 新增文件

- `cloudfunctions/_shared/lbs-utils.js`
- `miniprogram/utils/lbs.js`
- `miniprogram/pages/map/pick-location/*`
- `miniprogram/pages/provider/service-range/*`
- `tests/phase21.lbs-map-service-area-v2.test.js`
- `docs/map-lbs-setup.md`
- `docs/dev-records/21_lbs-map-service-area-v2.md`
- `docs/superpowers/specs/2026-06-02-phase21-lbs-map-service-area-v2-design.md`
- `docs/superpowers/plans/2026-06-02-phase21-lbs-map-service-area-v2.md`

## 5. 修改文件

- `miniprogram/app.json`
- `miniprogram/config/status.js`
- `miniprogram/services/area.service.js`
- `miniprogram/services/worker.service.js`
- `miniprogram/services/dispatch.service.js`
- `cloudfunctions/address/handler.js`
- `cloudfunctions/order/handler.js`
- `cloudfunctions/area/handler.js`
- `cloudfunctions/worker/handler.js`
- `cloudfunctions/dispatch/handler.js`
- `cloudfunctions/dispatch/index.js`
- `cloudfunctions/merchant/handler.js`
- `tests/phase1.scaffold.test.js`
- `README.md`
- `docs/release-package-checklist.md`
- `docs/dev-records/index.md`

## 6. 删除或废弃文件

无。

## 7. 数据库变化

新增或扩展字段：

- `addresses`：经纬度、地图地址、POI、行政区编码和位置更新时间。
- `orders`：经纬度平铺字段和 `address_snapshot`。
- `service_areas`：中心点、行政区编码和地图地址字段。
- `workers`、`service_providers`、`merchants`：服务范围模式、常驻点、半径、行政区范围和 LBS 开关。

本阶段不新增高频 `lbs_match_logs` 集合，避免在抢单大厅和候选列表产生过量写入；命中详情通过接口返回的 `lbs_match` 暴露，后续如需运营审计再升级为采样日志。

## 8. 云函数 / 接口变化

- `area.adminUpdateServiceAreaLocation`
- `area.adminGetServiceAreaMapList`
- `worker.updateWorkerServiceRange`
- `dispatch.getAssignableProviders`

既有 `worker.getOrderHallList`、`dispatch.getAssignableWorkers`、`merchant.getStoreList` 增加 LBS 过滤或距离排序能力。

## 9. 核心逻辑说明

服务方为半径模式且双方坐标完整时，优先使用直线距离与 `service_radius_km` 判断。缺少坐标时降级行政区模式，最后兼容历史 `community` 文本匹配。所有降级结果都通过 `lbs_match.reason` 标记。

## 10. 关键技术决策

- 默认采用“半径模式优先，缺坐标降级行政区/历史小区”的兼容策略。
- 距离计算集中在工具层，不写入页面。
- 订单必须保存下单时地址快照，避免用户后续修改地址影响历史订单。
- 地图 key 不进入仓库，只在真实环境人工配置。

## 11. 安全与权限说明

- 地址由当前用户维护。
- 服务区域地图字段仅管理员可维护。
- 服务方服务范围由已审核服务方维护。
- 管理员指派仍需要管理员权限。
- 不提交地图 key、真实定位密钥、真实地址导出或批量坐标数据。

## 12. 已知问题与遗留事项

- 当前不做实时轨迹。
- 当前不做路径规划。
- 当前不做 ETA。
- 当前不做自动派单或 AI 派单。
- 当前不做多边形围栏、多点半径或距离自动加价。
- 地图选点页是基础版，真实逆地址解析和 POI 搜索需后续接腾讯位置服务能力。

## 12.1 补充修复记录

2026-06-02 补充修复：

- 前端 `cloud.callFunction` 传输失败统一包装为云函数部署/当前云环境提示，避免误导为“服务不存在”或“地址不存在”。
- 服务详情页和提交订单页区分“加载失败”和“业务数据不存在”两个状态。
- 管理员区域管理页补齐地图中心点、经纬度、行政区编码、地图地址和 POI 编辑入口。

2026-06-02 云函数上传包修复：

- 将云函数内的共享工具引用从父级 `../_shared` 调整为函数包内 `./_shared`。
- 为每个云函数目录同步 `_shared` 工具副本，避免微信开发者工具单独上传云函数时漏打包共享模块。
- 新增云函数部署包契约测试，防止再次出现本地测试可过、云端运行时报 `Cannot find module ../_shared/...` 或表现为 `cloud.callFunction` 调用失败的问题。

2026-06-02 merchant/dispatch 上传包补充修复：

- `merchant` 云函数不再引用父级 `../qualification/*`，改为函数包内本地副本，避免单独上传 `merchant` 后云端找不到 `qualification` 模块。
- `dispatch` 云函数不再引用父级 `../merchant/repositories`，改为函数包内 `service-provider-repository`。
- 部署包契约测试升级为禁止云函数包内 JS 文件引用任意父级目录，防止再次出现跨云函数目录依赖。

## 13. 测试记录

- `node --test tests/phase21.lbs-map-service-area-v2.test.js`
- `npm test`

执行结果：

- `node --test tests/phase21.lbs-map-service-area-v2.test.js`：7 项通过，0 项失败。
- `node --test tests/phase21_1.cloud-error-area-map-ui.test.js`：3 项通过，0 项失败。
- `node --test tests/phase21_2.cloudfunction-shared-packaging.test.js`：2 项通过，0 项失败。
- `npm test`：187 项通过，0 项失败。

## 14. 运行与验证方式

本地执行：

```bash
npm test
```

真机验证按 `docs/map-lbs-setup.md` 的“真机测试”流程执行。

## 15. 对下一阶段的影响

阶段 22 的订单分配规则可以直接复用 `lbs_match`、距离排序和服务范围判断，但不得把本阶段的轻量 LBS 过滤包装成自动派单或 AI 派单。

## 16. 下一阶段开发计划

建议进入阶段 22：三种订单分配模式与派单规则 V2。

## 17. 下一阶段开始前必须确认的问题

1. 哪些品类默认走用户自选、平台派单或公共抢单大厅。
2. 智能派单是否只做规则解释和 mock 排序，还是接入真实自动派单任务。
3. 抢单超时回流和取消策略由后台配置还是先固定默认值。

## 18. 本阶段复盘

本阶段保持了存量文本小区匹配兼容，同时为后续真实地图、附近服务商、派单解释和服务范围配置打下字段与工具层基础。

## 19. 阶段结论

阶段 21 已完成基础版。当前版本可用于地图选点、经纬度快照、半径模式、行政区模式、接单大厅 LBS 过滤、管理员候选过滤和店铺距离排序的真机回归。
