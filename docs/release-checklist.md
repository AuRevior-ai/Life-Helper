# 交付包检查清单

本清单用于比赛提交、客户交付、公开分享或演示包制作前的最后检查。当前仓库是开发仓库，允许存在 `.git`、`project.private.config.json` 等本地开发文件；正式交付包必须使用清洁目录重新打包，不能直接压缩开发目录。

## 必须排除

- `.git/`：不能进入交付包，避免暴露提交历史、已删除文件、旧 AppID、旧配置和调试信息。
- `node_modules/`、`cloudfunctions/*/node_modules/`、`miniprogram_npm/`：依赖和构建产物不进入源码交付包。
- `.env`、`.env.*`：可能包含环境变量、管理员初始化码、支付密钥或回调地址。
- `project.private.config.json`：微信开发者工具本地私有配置，不适合公开提交。
- `*.pem`、`*.key`、`*.crt`、`*.cer`、`*.p12`、`*.pfx`、`apiclient_*`：私钥文件、证书文件和微信支付商户证书必须排除。
- 真实支付配置文件：包含 `mchid`、APIv3 密钥、证书路径、回调密钥、商户号的文件不能进入交付包。
- `*.log`、`npm-debug.log*`、`yarn-debug.log*`、测试输出、覆盖率目录和 Playwright 报告。
- 临时压缩包：`*.zip`、`*.tar`、`*.tar.gz`、`*.rar`、`*.7z`。
- IDE 和本地缓存：`.vscode/`、`.idea/`、`.wechatide/`、`.cache/`、`tmp/`、`temp/`。

## AppID 与配置

当前 `project.config.json` 包含真实小程序 AppID：`wxe8b7172da9c09545`。这是内部开发配置，不能作为公开模板直接交付。公开交付或模板化交付时：

1. 使用 `project.config.example.json` 作为示例配置。
2. 将示例中的 `appid` 保持为 `touristappid`，或由接收方在微信开发者工具中替换为自己的 AppID。
3. 不删除开发者本地 `project.config.json`，但公开包中如需隐藏真实 AppID，应使用 example 配置替代。
4. `project.private.config.json` 必须排除。

## mock 支付边界

当前是 mock 支付、mock 退款、mock 打赏、mock 会员开通和内部模拟财务流水：

- 无真实扣款。
- 无真实退款。
- 无真实分账。
- 无真实提现或自动打款。
- 财务流水仅用于业务流程验证，不代表微信支付清算结果。

真实上线前必须完成微信支付商户号、JSAPI 支付权限、APIv3 密钥、商户 API 证书、回调验签、退款接口、退款回调、对账流程和小额真机测试。

## 打包建议

建议从一个干净目录复制白名单文件，而不是在开发目录上做黑名单删除。至少包含：

- `miniprogram/`
- `cloudfunctions/`，但排除 `cloudfunctions/*/node_modules/`
- `docs/`
- `tests/`
- `README.md`
- `package.json`
- `.gitignore`
- `project.config.example.json`

打包前运行：

```bash
npm test
npm run check:release-risk -- <候选交付目录>
```

如果未传入目录，脚本默认扫描当前工程；如果传入的待扫描目录不存在，脚本会以非 0 退出码提示“待扫描目录不存在”。如果脚本报告 `.git`、私钥、证书、日志、真实支付配置或本地私有配置，必须重新生成交付包。正常的 `docs/**/*.md`、`tests/**/*.test.js`、`*.example.*` 和明确 mock/example 占位文件不应被当作真实支付风险。
