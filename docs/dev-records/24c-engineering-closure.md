# 阶段 24C：低风险工程收口、权限保护与分页治理

日期：2026-06-10

## 本轮目标

- 修复管理员禁用用户缺少后端保护的问题。
- 将管理员用户/订单、财务流水、收益、风控记录等高增长列表从全量读取后内存分页改为仓库侧分页查询。
- 补充商家收益、评价、打赏兼容权限测试，但不迁移 `worker_earnings` 集合名。
- 同步分页与索引契约、权限矩阵、当前阶段状态。

## 已完成

- `admin.disableUser` 增加后端保护：管理员不能禁用自己，不能禁用最后一个正常管理员。
- `admin.getAllUsers`、`admin.getAllOrders` 改为调用仓库分页查询，继续保留 `users/orders` 返回别名。
- `finance.getWorkerEarningList`、`finance.adminGetFinanceLogs`、`finance.adminGetWorkerEarnings` 改为仓库侧分页查询，继续保留 `earnings/logs` 返回别名。
- `qualification.adminListRiskRecords` 改为仓库侧分页查询，继续保留 `riskRecords` 返回别名。
- 补充测试覆盖管理员禁用保护、分页查询调用、商家兼容收益不通过旧 worker 入口暴露、商家兼容评价/打赏不通过旧 worker action 暴露。

## 未处理

- 未接入真实支付、真实退款、提现、分账、真实认证、OCR、真实保证金支付或真实风控。
- 未迁移 `worker_earnings` 到新集合名；商家收益仍是历史命名兼容。
- 未新增商家评价回复/申诉或商家打赏收益专用入口。
- 未生成公开 clean candidate；如进入交付，需重新生成候选目录并运行 release-risk 扫描。
- `requireOpenid` / `requireAdmin` 仍存在跨云函数重复定义，本轮未做全仓共享抽取，避免扩大同步范围和改变错误语义。

## 验收

本轮最终验收结果：

```bash
node --test tests/phase7.admin.test.js                         # 9/9 通过
node --test tests/phase16.finance-worker-earning.test.js        # 10/10 通过
node --test tests/phase18.review-tip-appeal.test.js             # 9/9 通过
node --test tests/phase20.risk.test.js                          # 2/2 通过
npm test                                                        # 330/330 通过
npm run check:shared-sync                                       # 通过
npm run check:cloudfunction-deps                                # 通过
git diff --check                                                # 通过；仅有 AGENT.MD 换行转换 warning
```

如生成交付候选目录，需额外运行：

```bash
npm run check:release-risk -- <candidate-dir>
```

## 下一步建议

- 若继续治理高增长列表，优先处理派单日志、消息列表、售后列表、商家订单/操作日志、评价列表和打赏列表。
- 若进入商家体验增强阶段，单独设计商家收益、商家评价回复/申诉和商家打赏收益权限，不复用旧 worker 专用 action。
- 若进入真实资金或真实认证阶段，必须单独开高风险阶段，补齐验签、对账、回滚、密钥管理和专项测试。
