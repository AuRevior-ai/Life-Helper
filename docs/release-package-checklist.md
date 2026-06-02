# 发布包提交检查清单

本文用于发布前检查提交内容，确保只提交小程序运行所需文件，不把本地配置、测试账号资料或临时文件带入仓库。

## 必须包含

- `miniprogram/` 小程序前端代码。
- `cloudfunctions/` 云函数代码与各函数 `package.json`。
- `docs/` 中的开发记录、验证清单和发布说明。
- 根目录 `package.json`、`package-lock.json`、`README.md`。
- 微信开发者工具需要的项目配置模板，但正式提交前需确认 AppID 是否符合当前发布目标。

## 不应提交

- `.git/` 目录内容。
- `project.private.config.json`。
- 本地临时截图、录屏、压缩包和调试日志。
- `background/` 中未确认要归档的原始 PRD 或私有资料。
- 真实手机号、真实 openid、真实地址、真实订单备注。
- 云开发控制台导出的密钥、权限截图、测试账号密码。
- 真实微信支付 APIv3 密钥、商户私钥、商户证书、真实支付订单导出和真实退款数据导出。
- 地图 key、腾讯位置服务 key、WebService key、位置服务签名密钥、真实地址批量导出和真实坐标数据导出。
- 管理员初始化码、测试管理员 openid 白名单和云函数环境变量截图。

## AppID 与云环境

- 发布前确认 `project.config.json` 中 AppID 为目标小程序 AppID，不再使用游客 AppID。
- 确认微信开发者工具选中的云环境 ID 与当前发布环境一致。
- 云函数部署前检查云环境、函数名和集合名一致。
- 如果存在体验版和生产环境，必须分别记录环境 ID，不混用测试数据。
- 首个管理员初始化默认应关闭；如确需初始化，`user` 云函数只在配置 `ADMIN_BOOTSTRAP_ENABLED=true` 且目标 openid 符合 `ADMIN_BOOTSTRAP_ALLOWED_OPENIDS` 时临时开放。
- 管理员初始化完成后，应移除或关闭 `ADMIN_BOOTSTRAP_ENABLED`。

## 测试数据检查

- 使用专门的用户、师傅、管理员测试账号。
- 三类账号 openid 应分开记录在本地私有文档，不提交到仓库。
- 测试订单、测试评价、测试消息应能在云数据库中定位和清理。
- 测试支付日志应写入 `payment_logs`，测试退款日志应写入 `refund_logs`，真实支付和退款数据不得导出提交。
- 测试服务区域应写入 `service_areas`，测试派单记录应写入 `dispatch_logs`。
- 测试 LBS 数据应只保留测试地址、测试经纬度和测试服务范围；发布前检查 `addresses`、`orders`、`service_areas`、`workers`、`service_providers`、`merchants` 中没有真实用户地址批量导出。
- 发布前不要提交包含真实用户信息的导出文件。

## 地图与 LBS 检查

- 确认 `docs/map-lbs-setup.md` 已记录地图 key 人工配置方式。
- 确认仓库中没有地图 key 或位置服务密钥。
- 真机测试允许定位、拒绝定位和手动选点三条路径。
- 真机测试半径模式、行政区模式、历史小区文本降级和管理员候选过滤。
- 确认当前版本没有把实时轨迹、路径规划、ETA、自动派单或 AI 派单标记为已上线。

## 发布前命令

```bash
npm test
```

本地测试通过后，再在微信开发者工具中完成编译、预览、真机回归和体验版验证。
