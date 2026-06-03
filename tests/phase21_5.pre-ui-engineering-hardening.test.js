const test = require("node:test");
const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

test("phase 21.5 engineering hardening documents and tools exist", () => {
  const requiredFiles = [
    "docs/dev-records/21_5_pre-ui-engineering-hardening.md",
    "docs/ui-refactor-guardrails.md",
    "miniprogram/utils/status-view.js",
    "scripts/sync-cloudfunction-shared.js",
    "scripts/check-cloudfunction-shared-sync.js",
  ];

  for (const file of requiredFiles) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test("status-view returns text and tone for core pre-UI status families", () => {
  const { getStatusView } = require("../miniprogram/utils/status-view");
  const {
    ORDER_STATUS,
    PAY_STATUS,
    AFTER_SALE_STATUS,
    REFUND_STATUS,
    WORKER_EARNING_STATUS,
    MEMBER_STATUS,
    USER_COUPON_STATUS,
    MERCHANT_AUDIT_STATUS,
    QUALIFICATION_STATUS,
    DEPOSIT_STATUS,
    ONBOARDING_STATUS,
    LBS_MATCH_RESULT,
  } = require("../miniprogram/config/status");

  const cases = [
    ["order", ORDER_STATUS.PENDING_ACCEPT, "待接单", "warning"],
    ["pay", PAY_STATUS.PAID, "已支付", "success"],
    ["afterSale", AFTER_SALE_STATUS.PENDING, "售后待审核", "warning"],
    ["refund", REFUND_STATUS.FAILED, "退款失败", "danger"],
    ["finance", WORKER_EARNING_STATUS.FROZEN, "冻结中", "warning"],
    ["member", MEMBER_STATUS.ACTIVE, "生效中", "success"],
    ["coupon", USER_COUPON_STATUS.UNUSED, "未使用", "success"],
    ["merchantAudit", MERCHANT_AUDIT_STATUS.PENDING, "待审核", "warning"],
    ["qualification", QUALIFICATION_STATUS.APPROVED, "已通过", "success"],
    ["deposit", DEPOSIT_STATUS.UNPAID, "未缴纳", "warning"],
    ["onboarding", ONBOARDING_STATUS.BLOCKED, "禁止经营", "danger"],
    ["lbsMatch", LBS_MATCH_RESULT.MATCHED_BY_RADIUS, "半径命中", "success"],
  ];

  for (const [type, status, expectedText, expectedTone] of cases) {
    assert.deepEqual(getStatusView(type, status), {
      text: expectedText,
      tone: expectedTone,
    });
  }

  assert.deepEqual(getStatusView("order", "unknown_status"), {
    text: "未知状态",
    tone: "default",
  });
});

test("shared display components remain available for UI refactor", () => {
  const componentDirs = [
    "miniprogram/components/status-tag",
    "miniprogram/components/empty-state",
    "miniprogram/components/loading-view",
  ];

  for (const dir of componentDirs) {
    for (const ext of ["js", "json", "wxml", "wxss"]) {
      assert.equal(
        exists(`${dir}/${path.basename(dir)}.${ext}`),
        true,
        `${dir} missing ${ext}`,
      );
    }
  }
});

test("key pages remain registered in app.json", () => {
  const appJson = JSON.parse(read("miniprogram/app.json"));
  const requiredPages = [
    "pages/index/index",
    "pages/service-detail/service-detail",
    "pages/order-submit/order-submit",
    "pages/order-detail/order-detail",
    "pages/worker/order-hall/order-hall",
    "pages/merchant/store-detail/store-detail",
    "pages/admin/dashboard/dashboard",
  ];

  for (const page of requiredPages) {
    assert.equal(
      appJson.pages.includes(page),
      true,
      `${page} should stay registered`,
    );
  }
});

test("key services and cloudfunction handlers remain present", () => {
  const serviceFiles = [
    "miniprogram/services/order.service.js",
    "miniprogram/services/worker.service.js",
    "miniprogram/services/merchant.service.js",
    "miniprogram/services/finance.service.js",
    "miniprogram/services/qualification.service.js",
    "miniprogram/services/dispatch.service.js",
  ];

  const handlerFiles = [
    "cloudfunctions/order/handler.js",
    "cloudfunctions/payment/handler.js",
    "cloudfunctions/refund/handler.js",
    "cloudfunctions/finance/handler.js",
    "cloudfunctions/dispatch/handler.js",
    "cloudfunctions/worker/handler.js",
    "cloudfunctions/merchant/handler.js",
    "cloudfunctions/qualification/handler.js",
  ];

  for (const file of serviceFiles.concat(handlerFiles)) {
    assert.equal(exists(file), true, `${file} should not be removed`);
  }
});

test("shared sync check script is wired into package scripts and passes on current tree", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["check:shared-sync"],
    "node scripts/check-cloudfunction-shared-sync.js",
  );

  const result = childProcess.spawnSync(
    process.execPath,
    [path.join(rootDir, "scripts/check-cloudfunction-shared-sync.js")],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /共享工具一致性检查通过/);
});

test("README and dev-record index document the current 22B/22C UI handoff", () => {
  const readme = read("README.md");
  const index = read("docs/dev-records/index.md");

  assert.match(readme, /当前最新阶段为阶段 22B/);
  assert.match(readme, /下一阶段为阶段 22C/);
  assert.match(readme, /project\.config\.example\.json/);

  assert.match(index, /21_5_pre-ui-engineering-hardening\.md/);
  assert.match(index, /UI 重构前工程结构体检与收口/);
  assert.match(index, /22b_order-center-ui\.md/);
  assert.match(index, /22c-pre-maintenance\.md/);
  assert.match(index, /阶段 22C：核心用户端页面 UI 同步与交互体验统一/);
  assert.match(index, /getStatusView\(type, status\)/);
});

test("mock money, qualification, deposit, insurance, and risk pages show explicit no-real-world-effect warnings", () => {
  const requiredWarnings = [
    [
      "miniprogram/pages/order-detail/order-detail.wxml",
      /模拟支付[^。]*不产生真实扣款/,
    ],
    [
      "miniprogram/pages/after-sale/apply/apply.wxml",
      /模拟退款[^。]*不产生真实退款/,
    ],
    [
      "miniprogram/pages/admin/after-sale-detail/after-sale-detail.wxml",
      /模拟退款[^。]*不产生真实退款/,
    ],
    [
      "miniprogram/pages/tip/create/create.wxml",
      /模拟打赏[^。]*不发起真实微信支付/,
    ],
    [
      "miniprogram/pages/member/center/center.wxml",
      /模拟开通会员[^。]*不产生真实扣款/,
    ],
    [
      "miniprogram/pages/merchant/deposit/deposit.wxml",
      /模拟保证金[^。]*不会产生真实扣款、退款或冻结/,
    ],
    [
      "miniprogram/pages/merchant/qualification/qualification.wxml",
      /模拟资质认证[^。]*不产生真实认证/,
    ],
    [
      "miniprogram/pages/merchant/risk-status/risk-status.wxml",
      /模拟风控[^。]*不代表真实合规审核/,
    ],
  ];

  for (const [relativePath, pattern] of requiredWarnings) {
    assert.match(
      read(relativePath),
      pattern,
      `${relativePath} should warn users about mock boundaries`,
    );
  }
});
