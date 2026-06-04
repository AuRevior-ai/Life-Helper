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

const polishPages = [
  "miniprogram/pages/review/detail/detail",
  "miniprogram/pages/review/followup/followup",
  "miniprogram/pages/merchant/store-list/store-list",
  "miniprogram/pages/merchant/store-detail/store-detail",
];

test("phase 22C-2 development record exists and captures acceptance conclusion", () => {
  const recordPath = "docs/dev-records/22c2-user-ui-final-polish.md";
  assert.equal(exists(recordPath), true);

  const record = read(recordPath);
  assert.match(record, /阶段 22C-2/);
  assert.match(record, /人工真机验收已完成，视觉几乎没有问题/);
  assert.match(record, /用户端 UI 重构阶段完成/);
  assert.match(record, /用户端 UI 重构阶段可以收束/);
});

test("README and dev-record index keep phase 22C-2 while current phase advances", () => {
  const readme = read("README.md");
  const index = read("docs/dev-records/index.md");

  assert.match(readme, /阶段 22C-2：用户端 UI 收口维护/);
  assert.match(readme, /阶段 23B：商家端一级页面 UI 统一/);
  assert.match(index, /22c2-user-ui-final-polish\.md/);
  assert.match(index, /阶段 22C-2：用户端 UI 收口维护/);
  assert.match(index, /23b-merchant-primary-ui\.md/);
});

test("phase 22C-2 polish pages import ui kit and use shared UI classes", () => {
  for (const page of polishPages) {
    assert.equal(exists(`${page}.wxml`), true, `${page}.wxml should exist`);
    assert.equal(exists(`${page}.wxss`), true, `${page}.wxss should exist`);
    assert.match(
      read(`${page}.wxss`),
      /@import ["'][.\/]+styles\/ui-kit\.wxss["'];/,
      `${page}.wxss should import ui-kit`,
    );
    assert.match(
      read(`${page}.wxml`),
      /ui-page|ui-card|ui-primary-button|ui-price|ui-media-placeholder/,
      `${page}.wxml should use shared UI classes`,
    );
  }
});

test("phase 22C-2 keeps loading and empty states on supplemental user pages", () => {
  const pagesWithLoading = [
    "miniprogram/pages/review/detail/detail",
    "miniprogram/pages/merchant/store-list/store-list",
    "miniprogram/pages/merchant/store-detail/store-detail",
  ];
  const pagesWithEmpty = [
    "miniprogram/pages/review/detail/detail",
    "miniprogram/pages/merchant/store-list/store-list",
    "miniprogram/pages/merchant/store-detail/store-detail",
  ];

  for (const page of pagesWithLoading) {
    assert.match(read(`${page}.wxml`), /loading-view/);
    assert.match(read(`${page}.json`), /loading-view/);
  }
  for (const page of pagesWithEmpty) {
    assert.match(read(`${page}.wxml`), /empty-state/);
    assert.match(read(`${page}.json`), /empty-state/);
  }
});

test("phase 22C-2 documents forbidden business capabilities", () => {
  const record = read("docs/dev-records/22c2-user-ui-final-polish.md");

  for (const text of [
    "真实支付",
    "真实退款",
    "真实提现",
    "真实身份证认证",
    "真实营业执照认证",
    "真实保证金支付",
    "自动派单",
    "AI 派单",
    "路径规划",
    "实时轨迹",
    "多门店",
    "分佣",
    "合伙人系统",
    "新营销体系",
    "新会员规则",
  ]) {
    assert.match(record, new RegExp(text));
  }
});

test("phase 22C-2 record states cloudfunctions and services stayed out of scope", () => {
  const record = read("docs/dev-records/22c2-user-ui-final-polish.md");

  assert.match(record, /本阶段未修改：[\s\S]*`cloudfunctions\/\*\*`/);
  assert.match(record, /本阶段未修改：[\s\S]*`miniprogram\/services\/\*\*`/);
  assert.match(record, /## 7\. 云函数 \/ 接口变化[\s\S]*无。/);
  assert.match(record, /## 8\. Services 变化[\s\S]*无。/);
});
