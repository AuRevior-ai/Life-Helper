# 地图与 LBS 配置说明

本文记录阶段 21 的地图选点、经纬度快照、半径模式和行政区模式配置方式。当前版本只做轻量 LBS 服务区域判断，不做实时轨迹、路径规划、ETA、自动派单或 AI 派单。

## 地图 key

- 代码仓库不内置任何地图 key、腾讯位置服务 key、WebService key 或私有签名密钥。
- 微信小程序 `map` 组件基础展示不需要把 key 写入前端代码；如后续接入腾讯位置服务 SDK、逆地址解析或路线能力，地图 key 必须在微信公众平台、腾讯位置服务控制台和云函数环境变量中人工配置。
- 发布包检查时必须确认 README、前端配置、云函数配置和测试导出文件中没有真实地图 key。

## 小程序权限

- 真机测试前在微信开发者工具中确认地理位置授权描述已配置到小程序后台或隐私接口配置中。
- 用户拒绝定位时，页面必须允许手动输入地址、行政区、小区和坐标，不能阻断下单主流程。
- 当前新增 `pages/map/pick-location/pick-location` 作为轻量选点入口，支持真机获取位置，也支持手动输入坐标用于调试。

## 数据字段

用户地址保存以下 LBS 字段：

- `latitude`
- `longitude`
- `map_address`
- `map_poi_name`
- `map_point_source`
- `adcode`
- `city_code`
- `district_code`
- `location_updated_at`

订单创建时保存地址快照：

- 订单平铺 `latitude`、`longitude`、`adcode`、`map_address`、`map_poi_name`、`map_point_source`
- `address_snapshot` 内保留下单时地址文本、经纬度、POI 和行政区编码

服务区域保存中心点字段：

- `latitude`
- `longitude`
- `center_latitude`
- `center_longitude`
- `adcode`
- `city_code`
- `district_code`
- `map_address`
- `map_poi_name`

服务方保存服务范围字段：

- `service_range_mode`
- `base_latitude`
- `base_longitude`
- `base_address`
- `base_poi_name`
- `service_radius_km`
- `service_districts`
- `service_streets`
- `service_adcodes`
- `service_communities`
- `lbs_enabled`

## 服务范围规则

### 半径模式

半径模式使用服务方常驻点和订单地址点计算直线距离，默认配置范围为 0-50 公里。阶段 21 采用半径模式优先：当服务方为 `radius` 且双方坐标完整时，按公里半径判断。

当订单或服务方缺少坐标时，系统会降级到行政区模式或历史小区文本匹配，并在 `lbs_match.reason` 中返回降级原因。

### 行政区模式

行政区模式优先匹配 `adcode`，其次匹配区县、街道、小区文本。该模式用于尚未完成地图选点、定位授权失败、存量订单兼容和运营后台人工配置。

## 接入范围

已接入：

- 地址新增/编辑保存经纬度和 POI 字段
- 下单保存地址经纬度快照
- 服务区域保存地图中心点
- 师傅端配置半径模式或行政区模式
- 接单大厅按 LBS 服务范围过滤订单
- 管理员指派候选人附带 LBS 命中信息
- 店铺列表在传入用户坐标时按距离排序

暂不支持：

- 实时轨迹
- 路径规划
- ETA
- 自动派单
- AI 派单
- 多边形围栏
- 多点半径
- 基于距离自动加价

## 真机测试

1. 上传并部署 `address`、`order`、`area`、`worker`、`dispatch`、`merchant` 云函数。
2. 确认云数据库存在 `addresses`、`orders`、`service_areas`、`workers`、`service_providers`、`merchants`、`dispatch_logs` 集合。
3. 管理员创建服务区域并填写中心点坐标，调用服务区域地图列表确认返回 `latitude`、`longitude`、`adcode`。
4. 用户新增地址，先允许定位并选点，再拒绝定位走手动输入，分别创建订单。
5. 检查订单记录是否保存平铺经纬度和 `address_snapshot`。
6. 师傅配置半径模式，分别创建近距离、远距离、无坐标但同小区订单，确认接单大厅只展示命中订单。
7. 管理员进入指派流程，确认候选人带有 `lbs_match.match_type`、`distance_km`、`reason`。
8. 商家或服务方填写常驻点，用户侧传入坐标访问店铺列表，确认近距离店铺排在前面。
9. 发布前扫描仓库，确认没有提交地图 key、真实地址导出、真实坐标批量数据或位置服务密钥。
