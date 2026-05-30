# 12 微信真实环境回归验证与发布前收口

## 阶段目标

在不新增大功能、不推倒现有 MVP 的前提下，补齐真实微信环境回归前最容易遗漏的入口、保护逻辑和发布材料。

## 本阶段完成

- 消息列表支持点击订单消息进入对应订单详情，并在点击时标记已读。
- 管理员师傅审核列表新增“查看详情”入口。
- `worker` 云函数新增 `adminGetWorkerDetail`，管理员可查看师傅详情和统计，普通用户不可调用。
- 服务分类删除前检查是否仍有关联服务。
- 服务删除前检查是否已有订单记录，避免破坏历史业务数据。
- 新增微信真实环境问题清单。
- 新增发布包提交检查清单。
- 更新 README 和开发记录索引。

## 新增文件

- `docs/wechat-real-env-issues.md`
- `docs/release-package-checklist.md`
- `docs/dev-records/12_wechat-real-env-regression.md`
- `tests/phase12.real-env-release.test.js`

## 修改文件

- `README.md`
- `docs/dev-records/index.md`
- `miniprogram/pages/message-list/message-list.js`
- `miniprogram/pages/message-list/message-list.wxml`
- `miniprogram/pages/admin/worker-audit/worker-audit.js`
- `miniprogram/pages/admin/worker-audit/worker-audit.wxml`
- `miniprogram/services/worker.service.js`
- `cloudfunctions/worker/handler.js`
- `cloudfunctions/service/handler.js`
- `cloudfunctions/service/index.js`
- `cloudfunctions/service/repositories.js`

## 关键决策

- 消息点击只对 `related_type = order` 的消息跳转订单详情，非订单消息保持标记已读和刷新列表。
- 师傅审核详情复用已有师傅详情页，使用 `mode=admin` 标记管理员入口，避免新增页面。
- 删除服务目录数据时优先保护历史业务记录，已有订单的服务建议下架而不是物理删除。

## 测试结果

- 本阶段新增阶段十二测试，覆盖消息跳转、管理员师傅详情权限、服务删除保护、发布文档。
- 本地验证已通过：

```bash
npm test
```

结果：80 个测试全部通过。

## 遗留问题

- 真实微信开发者工具和真机回归需要在实际 AppID、云环境 ID、测试账号 openid 下继续验证。
- 体验版发布前需按 `docs/release-package-checklist.md` 清理本地私有配置和测试资料。
- `docs/wechat-real-env-issues.md` 当前只保留初始待验证项，真实环境问题需持续补充。

## 下一阶段计划

- 在微信开发者工具中完成云函数上传、集合初始化和真机预览。
- 按用户、师傅、管理员三类账号完成完整闭环回归。
- 对真实环境发现的问题按问题清单逐条修复并回归。
