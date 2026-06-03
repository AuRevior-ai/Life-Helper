const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

test("phase 22C-0 creates user UI style guide, ui kit, and development record", () => {
  assert.equal(exists("docs/ui-style-guide.md"), true);
  assert.equal(exists("miniprogram/styles/ui-kit.wxss"), true);
  assert.equal(exists("docs/dev-records/22c-ui-style-extraction.md"), true);

  const styleGuide = read("docs/ui-style-guide.md");
  const uiKit = read("miniprogram/styles/ui-kit.wxss");
  const record = read("docs/dev-records/22c-ui-style-extraction.md");

  assert.match(styleGuide, /首页：`miniprogram\/pages\/index\/index`/);
  assert.match(styleGuide, /订单中心：`miniprogram\/pages\/order-list\/order-list`/);
  assert.match(styleGuide, /我的：`miniprogram\/pages\/profile\/profile`/);
  assert.match(uiKit, /\.ui-page/);
  assert.match(uiKit, /\.ui-card/);
  assert.match(uiKit, /\.ui-primary-button/);
  assert.match(record, /阶段 22C-0/);
});

test("ui style guide captures approved visual tokens and component rules", () => {
  const styleGuide = read("docs/ui-style-guide.md");
  const uiKit = read("miniprogram/styles/ui-kit.wxss");

  for (const token of [
    "#f7f8fa",
    "#111827",
    "#16a34a",
    "#19a64a",
    "#ff6a00",
    "999rpx",
    "28rpx",
  ]) {
    assert.match(styleGuide, new RegExp(token.replace("#", "\\#")));
    assert.match(uiKit, new RegExp(token.replace("#", "\\#")));
  }

  assert.match(styleGuide, /getStatusView\(type, status\)/);
  assert.match(styleGuide, /status-tag/);
  assert.match(styleGuide, /empty-state/);
  assert.match(styleGuide, /loading-view/);
  assert.match(styleGuide, /不引入随机网络图片/);
  assert.match(uiKit, /\.ui-media-placeholder/);
});

test("phase 22C-0 documents strict business and global-style boundaries", () => {
  const styleGuide = read("docs/ui-style-guide.md");
  const record = read("docs/dev-records/22c-ui-style-extraction.md");
  const appWxss = read("miniprogram/app.wxss");

  assert.match(record, /不修改任何业务页面/);
  assert.match(record, /不修改任何业务页面|不修改 cloudfunctions、services/);
  assert.match(record, /不在本阶段引入全局 `app\.wxss`/);
  assert.doesNotMatch(appWxss, /ui-kit\.wxss/);

  for (const forbidden of [
    "真实支付",
    "真实退款",
    "真实分账",
    "真实提现",
    "真实身份证认证",
    "真实营业执照认证",
    "自动派单",
    "AI 派单",
    "路径规划",
    "实时轨迹",
    "多门店",
    "分佣",
    "合伙人系统",
  ]) {
    assert.match(styleGuide, new RegExp(forbidden));
    assert.match(record, new RegExp(forbidden));
  }
});

test("dev-record index includes 22C-0 and points next work to 22C-1", () => {
  const index = read("docs/dev-records/index.md");

  assert.match(index, /22c-ui-style-extraction\.md/);
  assert.match(index, /阶段 22C-0：UI 风格提取与设计规范沉淀/);
  assert.match(index, /阶段 22C-1：用户端核心页面 UI 重构/);
  assert.match(index, /docs\/ui-style-guide\.md/);
  assert.match(index, /miniprogram\/styles\/ui-kit\.wxss/);
});
